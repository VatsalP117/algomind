package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/llm"
	"github.com/labstack/echo/v4"
	zlog "github.com/rs/zerolog/log"
)

type ProblemHandler struct {
	DB        *database.Service
	LLMClient *llm.Client
}

func NewProblemHandler(db *database.Service, llmClient *llm.Client) *ProblemHandler {
	return &ProblemHandler{
		DB:        db,
		LLMClient: llmClient,
	}
}

func (h *ProblemHandler) CreateProblem(c echo.Context) error {
	var req dto.CreateProblemRequest

	log.Printf("Received request to create problem")

	if err := c.Bind(&req); err != nil {
		log.Printf("Error binding CreateProblem request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}

	if err := c.Validate(&req); err != nil {
		log.Printf("Error validating CreateProblem request for title '%s': %v", req.Title, err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	userID := c.Get("user_id").(string)

	ctx := c.Request().Context()

	var concept struct {
		UserID *string `db:"user_id"`
		Title  string  `db:"title"`
	}
	err := h.DB.Db.GetContext(ctx, &concept, "SELECT user_id, title FROM concepts WHERE id = $1", req.ConceptID)
	if err != nil {
		log.Printf("Error validating concept ownership: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid concept")
	}
	if concept.UserID != nil && *concept.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "concept not accessible")
	}

	storedHints := strings.TrimSpace(req.Hints)
	if req.GenerateHints {
		storedHints = ""
	}

	tx, err := h.DB.Db.BeginTxx(ctx, nil)
	if err != nil {
		log.Printf("Database error starting transaction for user %s: %v", userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create problem",
		)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	insertProblemQuery := `
		INSERT INTO problems (
			user_id,
			concept_id,
			title,
			link,
			difficulty,
			summary,
			description,
			answer,
			answer_language,
			hints,
			created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
		)
			RETURNING id
		`

	var problemID int64
	if err := tx.QueryRowContext(
		ctx,
		insertProblemQuery,
		userID,
		req.ConceptID,
		req.Title,
		req.Link,
		req.Difficulty,
		req.Summary,
		req.Description,
		req.Answer,
		req.AnswerLanguage,
		storedHints,
	).Scan(&problemID); err != nil {
		log.Printf("Database error creating problem for user %s, title '%s': %v", userID, req.Title, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create problem",
		)
	}

	log.Printf("Successfully inserted problem ID %d for user %s", problemID, userID)

	insertReviewStateQuery := `
		INSERT INTO review_states (
			user_id,
			entity_type,
			entity_id,
			next_review_at,
			interval_days,
			ease_factor,
			streak,
			created_at
		) VALUES (
			$1, 'problem', $2, $3, 0, 2.5, 0, NOW()
		)
	`

	if _, err := tx.ExecContext(
		ctx,
		insertReviewStateQuery,
		userID,
		problemID,
		time.Now(),
	); err != nil {
		log.Printf("Database error creating review state for problem ID %d, user %s: %v", problemID, userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create review state",
		)
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Database error committing transaction for new problem ID %d, user %s: %v", problemID, userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create problem",
		)
	}
	committed = true

	log.Printf("Successfully created review state for problem ID %d", problemID)

	hintGenerationQueued := false
	if req.GenerateHints {
		hintGenerationQueued = h.enqueueHintGeneration(userID, problemID, llm.HintRequest{
			Title:          req.Title,
			Difficulty:     req.Difficulty,
			Summary:        req.Summary,
			Description:    req.Description,
			Answer:         req.Answer,
			ConceptTitle:   concept.Title,
			AnswerLanguage: derefString(req.AnswerLanguage),
		})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":                     problemID,
		"hint_generation_queued": hintGenerationQueued,
	})
}

func (h *ProblemHandler) GetAllUserProblems(c echo.Context) error {
	log.Printf("Received request to get all user problems")
	userId := c.Get("user_id").(string)
	ctx := c.Request().Context()

	fetchUserProblemsQuery := `
		SELECT 
			p.id,
			p.title,
			p.difficulty,
			c.title AS tag,
			p.created_at::text AS created_at
		FROM problems p
		LEFT JOIN concepts c ON p.concept_id = c.id
		WHERE p.user_id = $1
	`
	var problems []dto.UserProblemsResponse
	if err := h.DB.Db.SelectContext(ctx, &problems, fetchUserProblemsQuery, userId); err != nil {
		log.Printf("Database error fetching user problems for user %s: %v", userId, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch user problems",
		)
	}
	return c.JSON(http.StatusOK, problems)
}

func (h *ProblemHandler) GetIndividualUserProblem(c echo.Context) error {
	log.Printf("Received request to get individual user problem")
	problemId := c.Param("problem_id")
	if problemId == "" {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			"problem ID is required",
		)
	}
	userId := c.Get("user_id").(string)
	ctx := c.Request().Context()

	fetchUserProblemQuery := `
		SELECT 
			p.id,
			p.title,
			p.difficulty,
			c.title AS tag,
			p.created_at::text AS created_at,
			p.description,
			p.answer,
			p.answer_language,
			p.hints
		FROM problems p
		LEFT JOIN concepts c ON p.concept_id = c.id
		WHERE p.user_id = $1 AND p.id = $2
	`
	var problem dto.UserIndividualProblemResponse
	if err := h.DB.Db.GetContext(ctx, &problem, fetchUserProblemQuery, userId, problemId); err != nil {
		log.Printf("Database error fetching user problem for user %s, problem ID %s: %v", userId, problemId, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch user problem",
		)
	}
	return c.JSON(http.StatusOK, problem)
}

func (h *ProblemHandler) DeleteProblem(c echo.Context) error {
	log.Printf("Received request to delete problem")
	problemId := c.Param("problem_id")
	if problemId == "" {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			"problem ID is required",
		)
	}
	userId := c.Get("user_id").(string)
	ctx := c.Request().Context()

	deleteProblemQuery := `
		DELETE FROM problems
		WHERE user_id = $1 AND id = $2
	`
	if _, err := h.DB.Db.ExecContext(ctx, deleteProblemQuery, userId, problemId); err != nil {
		log.Printf("Database error deleting problem for user %s, problem ID %s: %v", userId, problemId, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to delete problem",
		)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"id": problemId,
	})
}

func (h *ProblemHandler) AddProblemToReviewQueue(c echo.Context) error {
	log.Printf("Received request to add problem to review queue")

	problemId := c.Param("problem_id")
	if problemId == "" {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			"problem ID is required",
		)
	}

	userId := c.Get("user_id").(string)
	ctx := c.Request().Context()

	query := `
		INSERT INTO review_states (
			user_id,
			entity_type,
			entity_id,
			next_review_at,
			interval_days,
			ease_factor,
			streak,
			created_at
		)
		VALUES (
			$1,
			'problem',
			$2,
			$3,
			0,
			2.5,
			0,
			NOW()
		)
		ON CONFLICT (user_id, entity_type, entity_id)
		DO UPDATE SET
			next_review_at = EXCLUDED.next_review_at,
			interval_days = 0,
			ease_factor = 2.5
	`

	if _, err := h.DB.Db.ExecContext(ctx, query, userId, problemId, time.Now()); err != nil {

		log.Printf("Database error upserting review state for user %s, problem ID %s: %v", userId, problemId, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to add problem to review queue",
		)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id": problemId,
	})
}

func (h *ProblemHandler) enqueueHintGeneration(userID string, problemID int64, req llm.HintRequest) bool {
	jobID := newHintGenerationJobID(problemID)
	logger := zlog.With().
		Str("component", "llm_hint_generation").
		Str("job_id", jobID).
		Str("user_id", userID).
		Int64("problem_id", problemID).
		Logger()

	if h.LLMClient == nil || !h.LLMClient.Enabled() {
		logger.Warn().
			Msg("Hint generation requested but LLM client is not configured")
		return false
	}

	logger.Info().
		Str("difficulty", req.Difficulty).
		Int("summary_chars", len(req.Summary)).
		Int("description_chars", len(req.Description)).
		Int("answer_chars", len(req.Answer)).
		Bool("has_answer_language", req.AnswerLanguage != "").
		Msg("Queued background hint generation")

	go func() {
		jobStartedAt := time.Now()
		logger.Info().Msg("Background hint generation started")

		llmCtx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
		defer cancel()

		hints, err := h.LLMClient.GenerateHints(llmCtx, llm.RequestMetadata{
			JobID:     jobID,
			UserID:    userID,
			ProblemID: problemID,
		}, req)
		if err != nil {
			logger.Error().
				Err(err).
				Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
				Msg("Background hint generation failed")
			return
		}

		dbCtx, dbCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer dbCancel()

		result, err := h.DB.Db.ExecContext(
			dbCtx,
			`
				UPDATE problems
				SET hints = $1
				WHERE id = $2
				  AND user_id = $3
				  AND COALESCE(NULLIF(btrim(hints), ''), '') = ''
			`,
			hints,
			problemID,
			userID,
		)
		if err != nil {
			logger.Error().
				Err(err).
				Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
				Msg("Failed to persist generated hints")
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err == nil && rowsAffected > 0 {
			logger.Info().
				Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
				Int("hint_chars", len(hints)).
				Int64("rows_affected", rowsAffected).
				Msg("Stored generated hints")
			return
		}

		logger.Info().
			Int64("duration_ms", time.Since(jobStartedAt).Milliseconds()).
			Int("hint_chars", len(hints)).
			Msg("Skipped storing generated hints because hints were already present")
	}()

	return true
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func newHintGenerationJobID(problemID int64) string {
	return fmt.Sprintf("hint-%d-%d", problemID, time.Now().UnixNano())
}
