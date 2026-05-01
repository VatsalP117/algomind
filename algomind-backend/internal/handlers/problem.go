package handlers

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/leetcode"
	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/VatsalP117/algomind/algomind-backend/internal/problems"
	"github.com/labstack/echo/v4"
)

type ProblemHandler struct {
	DB             *database.Service
	ProblemService *problems.Service
}

func NewProblemHandler(db *database.Service, problemService *problems.Service) *ProblemHandler {
	return &ProblemHandler{
		DB:             db,
		ProblemService: problemService,
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
	logger := observability.LoggerFromContext(c).With().Str("handler", "problem_create").Logger()

	link := req.Link
	var externalSource *string
	var externalProblemKey *string
	if strings.TrimSpace(req.Link) != "" {
		if canonicalURL, slug, err := leetcode.NormalizeProblemURL(req.Link); err == nil {
			link = canonicalURL
			externalSource = stringPtr("leetcode")
			externalProblemKey = stringPtr(slug)
		}
	}

	result, err := h.ProblemService.CreateReviewableProblem(c.Request().Context(), problems.CreateInput{
		UserID:             userID,
		ConceptID:          req.ConceptID,
		Title:              req.Title,
		Link:               link,
		Difficulty:         req.Difficulty,
		Summary:            req.Summary,
		Description:        req.Description,
		Answer:             req.Answer,
		AnswerLanguage:     req.AnswerLanguage,
		Hints:              req.Hints,
		GenerateHints:      req.GenerateHints,
		ExternalSource:     externalSource,
		ExternalProblemKey: externalProblemKey,
	})
	if err != nil {
		switch typedErr := err.(type) {
		case *problems.DuplicateProblemError:
			return echo.NewHTTPError(http.StatusConflict, map[string]interface{}{
				"message":    "problem already exists",
				"problem_id": typedErr.ProblemID,
			})
		default:
			switch {
			case err == problems.ErrInvalidConcept:
				return echo.NewHTTPError(http.StatusBadRequest, "invalid concept")
			case err == problems.ErrConceptNotAccessible:
				return echo.NewHTTPError(http.StatusForbidden, "concept not accessible")
			default:
				logger.Error().Err(err).Msg("Failed to create problem")
				return observability.HTTPError(http.StatusInternalServerError, "failed to create problem", err)
			}
		}
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":                     result.ID,
		"hint_generation_queued": result.HintGenerationQueued,
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
