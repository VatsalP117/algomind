package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/leetcode"
	"github.com/VatsalP117/algomind/algomind-backend/internal/models"
	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/VatsalP117/algomind/algomind-backend/internal/problems"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/labstack/echo/v4"
)

type ProblemCaptureHandler struct {
	DB             *database.Service
	LeetCodeClient *leetcode.Client
	ProblemService *problems.Service
}

type createCaptureRequest struct {
	URL                string `json:"url" validate:"required"`
	FallbackTitle      string `json:"fallback_title"`
	FallbackDifficulty string `json:"fallback_difficulty"`
	FallbackNotes      string `json:"fallback_notes"`
}

type convertCaptureRequest struct {
	ConceptID      int64   `json:"concept_id" validate:"required"`
	Title          string  `json:"title" validate:"required"`
	Difficulty     string  `json:"difficulty" validate:"required,oneof=EASY MEDIUM HARD"`
	Summary        string  `json:"summary" validate:"required"`
	Description    string  `json:"description"`
	Answer         string  `json:"answer" validate:"required"`
	AnswerLanguage *string `json:"answer_language"`
	Hints          string  `json:"hints"`
	GenerateHints  bool    `json:"generate_hints"`
}

type captureSaveResponse struct {
	Status       string  `json:"status"`
	CaptureID    *int64  `json:"capture_id"`
	ProblemID    *int64  `json:"problem_id"`
	CaptureState string  `json:"capture_state"`
	Title        *string `json:"title"`
	CanonicalURL string  `json:"canonical_url"`
	NextAction   string  `json:"next_action"`
}

func NewProblemCaptureHandler(db *database.Service, leetcodeClient *leetcode.Client, problemService *problems.Service) *ProblemCaptureHandler {
	return &ProblemCaptureHandler{
		DB:             db,
		LeetCodeClient: leetcodeClient,
		ProblemService: problemService,
	}
}

func (h *ProblemCaptureHandler) ListCaptures(c echo.Context) error {
	userID := c.Get("user_id").(string)
	logger := observability.LoggerFromContext(c).With().Str("handler", "problem_captures_list").Logger()

	captures, err := h.listCaptures(c.Request().Context(), userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to list problem captures")
		return observability.HTTPError(http.StatusInternalServerError, "failed to fetch problem captures", err)
	}

	return c.JSON(http.StatusOK, captures)
}

func (h *ProblemCaptureHandler) GetCapture(c echo.Context) error {
	userID := c.Get("user_id").(string)
	captureID := c.Param("capture_id")
	if captureID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "capture ID is required")
	}

	capture, err := h.getCaptureByID(c.Request().Context(), userID, captureID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "problem capture not found")
		}
		return observability.HTTPError(http.StatusInternalServerError, "failed to fetch problem capture", err)
	}

	return c.JSON(http.StatusOK, capture)
}

func (h *ProblemCaptureHandler) ArchiveCapture(c echo.Context) error {
	userID := c.Get("user_id").(string)
	captureID := c.Param("capture_id")
	if captureID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "capture ID is required")
	}

	result, err := h.DB.Db.ExecContext(
		c.Request().Context(),
		`UPDATE problem_captures
		 SET capture_state = 'archived',
		     updated_at = NOW()
		 WHERE id = $1 AND user_id = $2`,
		captureID,
		userID,
	)
	if err != nil {
		return observability.HTTPError(http.StatusInternalServerError, "failed to archive problem capture", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return observability.HTTPError(http.StatusInternalServerError, "failed to archive problem capture", err)
	}
	if rowsAffected == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "problem capture not found")
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *ProblemCaptureHandler) RetryEnrichment(c echo.Context) error {
	userID := c.Get("user_id").(string)
	captureID := c.Param("capture_id")
	if captureID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "capture ID is required")
	}

	capture, err := h.getCaptureByID(c.Request().Context(), userID, captureID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "problem capture not found")
		}
		return observability.HTTPError(http.StatusInternalServerError, "failed to fetch problem capture", err)
	}

	updatedCapture, err := h.refreshCapture(c.Request().Context(), capture)
	if err != nil {
		if errors.Is(err, leetcode.ErrProblemNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "problem not found on LeetCode")
		}
		return observability.HTTPError(http.StatusInternalServerError, "failed to refresh problem capture", err)
	}

	return c.JSON(http.StatusOK, updatedCapture)
}

func (h *ProblemCaptureHandler) ConvertCapture(c echo.Context) error {
	userID := c.Get("user_id").(string)
	captureID := c.Param("capture_id")
	if captureID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "capture ID is required")
	}

	var req convertCaptureRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	capture, err := h.getCaptureByID(c.Request().Context(), userID, captureID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "problem capture not found")
		}
		return observability.HTTPError(http.StatusInternalServerError, "failed to fetch problem capture", err)
	}
	if capture.ProblemID != nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"id":                     *capture.ProblemID,
			"hint_generation_queued": false,
			"capture_id":             capture.ID,
			"already_imported":       true,
		})
	}

	externalSource := capture.Source
	externalProblemKey := capture.ExternalProblemKey
	createResult, err := h.ProblemService.CreateReviewableProblem(c.Request().Context(), problems.CreateInput{
		UserID:             userID,
		ConceptID:          req.ConceptID,
		Title:              req.Title,
		Link:               capture.CanonicalURL,
		Difficulty:         req.Difficulty,
		Summary:            req.Summary,
		Description:        req.Description,
		Answer:             req.Answer,
		AnswerLanguage:     req.AnswerLanguage,
		Hints:              req.Hints,
		GenerateHints:      req.GenerateHints,
		ExternalSource:     &externalSource,
		ExternalProblemKey: &externalProblemKey,
	})
	if err != nil {
		switch typedErr := err.(type) {
		case *problems.DuplicateProblemError:
			if updateErr := h.markCaptureImported(c.Request().Context(), capture.ID, typedErr.ProblemID); updateErr != nil {
				return observability.HTTPError(http.StatusInternalServerError, "failed to convert problem capture", updateErr)
			}

			return c.JSON(http.StatusOK, map[string]interface{}{
				"id":                     typedErr.ProblemID,
				"hint_generation_queued": false,
				"capture_id":             capture.ID,
				"already_imported":       true,
			})
		default:
			switch {
			case errors.Is(err, problems.ErrInvalidConcept):
				return echo.NewHTTPError(http.StatusBadRequest, "invalid concept")
			case errors.Is(err, problems.ErrConceptNotAccessible):
				return echo.NewHTTPError(http.StatusForbidden, "concept not accessible")
			default:
				return observability.HTTPError(http.StatusInternalServerError, "failed to convert problem capture", err)
			}
		}
	}

	if err := h.markCaptureImported(c.Request().Context(), capture.ID, createResult.ID); err != nil {
		return observability.HTTPError(http.StatusInternalServerError, "failed to convert problem capture", err)
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":                     createResult.ID,
		"hint_generation_queued": createResult.HintGenerationQueued,
		"capture_id":             capture.ID,
		"already_imported":       false,
	})
}

func (h *ProblemCaptureHandler) CreateCaptureFromExtension(c echo.Context) error {
	userID := c.Get("user_id").(string)

	var req createCaptureRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	canonicalURL, slug, err := leetcode.NormalizeProblemURL(req.URL)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid LeetCode problem URL")
	}

	if existingProblemID, err := h.findImportedProblem(c.Request().Context(), userID, "leetcode", slug); err != nil {
		return observability.HTTPError(http.StatusInternalServerError, "failed to save problem capture", err)
	} else if existingProblemID != nil {
		return c.JSON(http.StatusOK, captureSaveResponse{
			Status:       "already_imported",
			ProblemID:    existingProblemID,
			CaptureState: "imported",
			Title:        stringPtr(strings.TrimSpace(req.FallbackTitle)),
			CanonicalURL: canonicalURL,
			NextAction:   "open_existing_problem",
		})
	}

	if existingCapture, err := h.findCaptureBySourceKey(c.Request().Context(), userID, "leetcode", slug); err != nil && !errors.Is(err, sql.ErrNoRows) {
		return observability.HTTPError(http.StatusInternalServerError, "failed to save problem capture", err)
	} else if err == nil {
		if existingCapture.ProblemID != nil {
			return c.JSON(http.StatusOK, captureSaveResponse{
				Status:       "already_imported",
				CaptureID:    &existingCapture.ID,
				ProblemID:    existingCapture.ProblemID,
				CaptureState: "imported",
				Title:        existingCapture.Title,
				CanonicalURL: existingCapture.CanonicalURL,
				NextAction:   "open_existing_problem",
			})
		}

		if err := h.reactivateCapture(c.Request().Context(), existingCapture.ID); err != nil {
			return observability.HTTPError(http.StatusInternalServerError, "failed to save problem capture", err)
		}

		refreshedCapture, refreshErr := h.getCaptureByID(c.Request().Context(), userID, int64ToString(existingCapture.ID))
		if refreshErr != nil {
			return observability.HTTPError(http.StatusInternalServerError, "failed to save problem capture", refreshErr)
		}

		return c.JSON(http.StatusOK, captureSaveResponse{
			Status:       "already_captured",
			CaptureID:    &refreshedCapture.ID,
			CaptureState: refreshedCapture.CaptureState,
			Title:        captureDisplayTitle(refreshedCapture),
			CanonicalURL: refreshedCapture.CanonicalURL,
			NextAction:   "finish_in_algomind",
		})
	}

	problem, fetchErr := h.LeetCodeClient.FetchProblem(c.Request().Context(), canonicalURL)
	if fetchErr != nil && !errors.Is(fetchErr, leetcode.ErrProblemNotFound) {
		fetchErr = errors.New("failed to fetch from LeetCode")
	}

	var topicTags models.JSONStringArray
	var title *string
	var difficulty *string
	var description *string
	var sourcePayload interface{}
	captureState := "ready"
	var errorCode *string
	var errorMessage *string

	if fetchErr == nil && problem != nil {
		title = stringPtr(problem.Title)
		difficulty = stringPtr(problem.Difficulty)
		description = stringPtr(problem.Description)
		topicTags = models.JSONStringArray(problem.Tags)
		payloadBytes, err := json.Marshal(problem)
		if err == nil {
			sourcePayload = payloadBytes
		}
	} else {
		captureState = "failed"
		errorCode = stringPtr("leetcode_fetch_failed")
		errorMessage = stringPtr(fetchErr.Error())
	}

	capture, inserted, err := h.insertCapture(c.Request().Context(), insertCaptureInput{
		UserID:             userID,
		Source:             "leetcode",
		ExternalProblemKey: slug,
		CanonicalURL:       canonicalURL,
		Title:              title,
		Difficulty:         difficulty,
		DescriptionHTML:    description,
		TopicTags:          topicTags,
		CaptureState:       captureState,
		SourcePayload:      sourcePayload,
		FallbackTitle:      stringPtr(strings.TrimSpace(req.FallbackTitle)),
		FallbackDifficulty: stringPtr(normalizeDifficulty(req.FallbackDifficulty)),
		FallbackNotes:      stringPtr(strings.TrimSpace(req.FallbackNotes)),
		LastErrorCode:      errorCode,
		LastErrorMessage:   errorMessage,
	})
	if err != nil {
		return observability.HTTPError(http.StatusInternalServerError, "failed to save problem capture", err)
	}

	status := "captured"
	if !inserted {
		status = "already_captured"
	}

	return c.JSON(http.StatusOK, captureSaveResponse{
		Status:       status,
		CaptureID:    &capture.ID,
		CaptureState: capture.CaptureState,
		Title:        captureDisplayTitle(capture),
		CanonicalURL: capture.CanonicalURL,
		NextAction:   "finish_in_algomind",
	})
}

func (h *ProblemCaptureHandler) GetCaptureStatusByExternalKey(c echo.Context) error {
	userID := c.Get("user_id").(string)
	source := c.Param("source")
	key := c.Param("key")
	if source == "" || key == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "source and key are required")
	}

	if existingProblemID, err := h.findImportedProblem(c.Request().Context(), userID, source, key); err != nil {
		return observability.HTTPError(http.StatusInternalServerError, "failed to fetch problem capture status", err)
	} else if existingProblemID != nil {
		return c.JSON(http.StatusOK, captureSaveResponse{
			Status:       "already_imported",
			ProblemID:    existingProblemID,
			CaptureState: "imported",
			CanonicalURL: "",
			NextAction:   "open_existing_problem",
		})
	}

	capture, err := h.findCaptureBySourceKey(c.Request().Context(), userID, source, key)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusOK, captureSaveResponse{
				Status:       "not_found",
				CaptureState: "",
				NextAction:   "capture",
			})
		}
		return observability.HTTPError(http.StatusInternalServerError, "failed to fetch problem capture status", err)
	}

	return c.JSON(http.StatusOK, captureSaveResponse{
		Status:       "already_captured",
		CaptureID:    &capture.ID,
		ProblemID:    capture.ProblemID,
		CaptureState: capture.CaptureState,
		Title:        captureDisplayTitle(capture),
		CanonicalURL: capture.CanonicalURL,
		NextAction:   "finish_in_algomind",
	})
}

type insertCaptureInput struct {
	UserID             string
	Source             string
	ExternalProblemKey string
	CanonicalURL       string
	Title              *string
	Difficulty         *string
	DescriptionHTML    *string
	TopicTags          models.JSONStringArray
	CaptureState       string
	SourcePayload      interface{}
	FallbackTitle      *string
	FallbackDifficulty *string
	FallbackNotes      *string
	LastErrorCode      *string
	LastErrorMessage   *string
}

func (h *ProblemCaptureHandler) insertCapture(ctx context.Context, input insertCaptureInput) (*models.ProblemCapture, bool, error) {
	query := `
		INSERT INTO problem_captures (
			user_id,
			source,
			external_problem_key,
			canonical_url,
			title,
			difficulty,
			description_html,
			topic_tags,
			capture_state,
			source_payload,
			fallback_title,
			fallback_difficulty,
			fallback_notes,
			last_error_code,
			last_error_message
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15
		)
		RETURNING id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		          topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		          last_error_message, captured_at, updated_at, imported_at
	`

	var capture models.ProblemCapture
	err := h.DB.Db.GetContext(
		ctx,
		&capture,
		query,
		input.UserID,
		input.Source,
		input.ExternalProblemKey,
		input.CanonicalURL,
		input.Title,
		input.Difficulty,
		input.DescriptionHTML,
		input.TopicTags,
		input.CaptureState,
		input.SourcePayload,
		input.FallbackTitle,
		input.FallbackDifficulty,
		input.FallbackNotes,
		input.LastErrorCode,
		input.LastErrorMessage,
	)
	if err == nil {
		return &capture, true, nil
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		existingCapture, selectErr := h.findCaptureBySourceKey(ctx, input.UserID, input.Source, input.ExternalProblemKey)
		if selectErr != nil {
			return nil, false, selectErr
		}
		if reactivateErr := h.reactivateCapture(ctx, existingCapture.ID); reactivateErr != nil {
			return nil, false, reactivateErr
		}
		updatedCapture, fetchErr := h.getCaptureByID(ctx, input.UserID, int64ToString(existingCapture.ID))
		return updatedCapture, false, fetchErr
	}

	return nil, false, err
}

func (h *ProblemCaptureHandler) reactivateCapture(ctx context.Context, captureID int64) error {
	_, err := h.DB.Db.ExecContext(
		ctx,
		`UPDATE problem_captures
		 SET capture_state = CASE
		 		WHEN problem_id IS NOT NULL THEN 'imported'
		 		WHEN capture_state = 'archived' THEN 'ready'
		 		ELSE capture_state
		     END,
		     updated_at = NOW(),
		     captured_at = CASE WHEN capture_state = 'archived' THEN NOW() ELSE captured_at END
		 WHERE id = $1`,
		captureID,
	)
	return err
}

func (h *ProblemCaptureHandler) listCaptures(ctx context.Context, userID string) ([]models.ProblemCapture, error) {
	var captures []models.ProblemCapture
	if err := h.DB.Db.SelectContext(
		ctx,
		&captures,
		`SELECT id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		        topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		        last_error_message, captured_at, updated_at, imported_at
		 FROM problem_captures
		 WHERE user_id = $1 AND capture_state != 'archived'
		 ORDER BY captured_at DESC`,
		userID,
	); err != nil {
		return nil, err
	}

	if captures == nil {
		captures = []models.ProblemCapture{}
	}

	return captures, nil
}

func (h *ProblemCaptureHandler) getCaptureByID(ctx context.Context, userID string, captureID string) (*models.ProblemCapture, error) {
	var capture models.ProblemCapture
	if err := h.DB.Db.GetContext(
		ctx,
		&capture,
		`SELECT id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		        topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		        last_error_message, captured_at, updated_at, imported_at
		 FROM problem_captures
		 WHERE id = $1 AND user_id = $2`,
		captureID,
		userID,
	); err != nil {
		return nil, err
	}

	return &capture, nil
}

func (h *ProblemCaptureHandler) findCaptureBySourceKey(ctx context.Context, userID string, source string, externalProblemKey string) (*models.ProblemCapture, error) {
	var capture models.ProblemCapture
	if err := h.DB.Db.GetContext(
		ctx,
		&capture,
		`SELECT id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		        topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		        last_error_message, captured_at, updated_at, imported_at
		 FROM problem_captures
		 WHERE user_id = $1 AND source = $2 AND external_problem_key = $3`,
		userID,
		source,
		externalProblemKey,
	); err != nil {
		return nil, err
	}

	return &capture, nil
}

func (h *ProblemCaptureHandler) findImportedProblem(ctx context.Context, userID string, source string, externalProblemKey string) (*int64, error) {
	var problemID int64
	err := h.DB.Db.GetContext(
		ctx,
		&problemID,
		`SELECT id
		 FROM problems
		 WHERE user_id = $1 AND external_source = $2 AND external_problem_key = $3`,
		userID,
		source,
		externalProblemKey,
	)
	if err == nil {
		return &problemID, nil
	}
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return nil, err
}

func (h *ProblemCaptureHandler) markCaptureImported(ctx context.Context, captureID int64, problemID int64) error {
	_, err := h.DB.Db.ExecContext(
		ctx,
		`UPDATE problem_captures
		 SET problem_id = $2,
		     capture_state = 'imported',
		     imported_at = COALESCE(imported_at, NOW()),
		     updated_at = NOW()
		 WHERE id = $1`,
		captureID,
		problemID,
	)
	return err
}

func (h *ProblemCaptureHandler) refreshCapture(ctx context.Context, capture *models.ProblemCapture) (*models.ProblemCapture, error) {
	if capture.Source != "leetcode" {
		return nil, errors.New("unsupported capture source")
	}

	problem, err := h.LeetCodeClient.FetchProblem(ctx, capture.CanonicalURL)
	if err != nil {
		_, updateErr := h.DB.Db.ExecContext(
			ctx,
			`UPDATE problem_captures
			 SET capture_state = 'failed',
			     last_error_code = 'leetcode_fetch_failed',
			     last_error_message = $2,
			     updated_at = NOW()
			 WHERE id = $1`,
			capture.ID,
			err.Error(),
		)
		if updateErr != nil {
			return nil, updateErr
		}
		return nil, err
	}

	payloadBytes, err := json.Marshal(problem)
	if err != nil {
		return nil, err
	}

	nextState := "ready"
	if capture.ProblemID != nil {
		nextState = "imported"
	}

	var refreshed models.ProblemCapture
	if err := h.DB.Db.GetContext(
		ctx,
		&refreshed,
		`UPDATE problem_captures
		 SET title = $2,
		     difficulty = $3,
		     description_html = $4,
		     topic_tags = $5,
		     capture_state = $6,
		     source_payload = $7::jsonb,
		     last_error_code = NULL,
		     last_error_message = NULL,
		     updated_at = NOW()
		 WHERE id = $1
		 RETURNING id, user_id, source, external_problem_key, canonical_url, title, difficulty, description_html,
		           topic_tags, capture_state, fallback_title, fallback_difficulty, problem_id, last_error_code,
		           last_error_message, captured_at, updated_at, imported_at`,
		capture.ID,
		problem.Title,
		problem.Difficulty,
		problem.Description,
		models.JSONStringArray(problem.Tags),
		nextState,
		payloadBytes,
	); err != nil {
		return nil, err
	}

	return &refreshed, nil
}

func captureDisplayTitle(capture *models.ProblemCapture) *string {
	if capture == nil {
		return nil
	}
	if capture.Title != nil && strings.TrimSpace(*capture.Title) != "" {
		return capture.Title
	}
	if capture.FallbackTitle != nil && strings.TrimSpace(*capture.FallbackTitle) != "" {
		return capture.FallbackTitle
	}
	return nil
}

func normalizeDifficulty(value string) string {
	normalized := strings.ToUpper(strings.TrimSpace(value))
	switch normalized {
	case "EASY", "MEDIUM", "HARD":
		return normalized
	default:
		return ""
	}
}

func stringPtr(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return &value
}

func int64ToString(value int64) string {
	return strconv.FormatInt(value, 10)
}
