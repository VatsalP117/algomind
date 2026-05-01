package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/VatsalP117/algomind/algomind-backend/internal/leetcode"
	"github.com/VatsalP117/algomind/algomind-backend/internal/models"
	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/VatsalP117/algomind/algomind-backend/internal/problems"
	"github.com/VatsalP117/algomind/algomind-backend/internal/repositories"
	"github.com/labstack/echo/v4"
)

type ProblemCaptureHandler struct {
	CaptureRepo    repositories.CaptureRepository
	LeetCodeClient *leetcode.Client
	ProblemService *problems.Service
}

func NewProblemCaptureHandler(
	captureRepo repositories.CaptureRepository,
	leetcodeClient *leetcode.Client,
	problemService *problems.Service,
) *ProblemCaptureHandler {
	return &ProblemCaptureHandler{
		CaptureRepo:    captureRepo,
		LeetCodeClient: leetcodeClient,
		ProblemService: problemService,
	}
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

func (h *ProblemCaptureHandler) ListCaptures(c echo.Context) error {
	userID := c.Get("user_id").(string)
	logger := observability.LoggerFromContext(c).With().Str("handler", "problem_captures_list").Logger()

	captures, err := h.CaptureRepo.List(c.Request().Context(), userID)
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

	capture, err := h.CaptureRepo.GetByID(c.Request().Context(), userID, captureID)
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

	found, err := h.CaptureRepo.Archive(c.Request().Context(), userID, captureID)
	if err != nil {
		return observability.HTTPError(http.StatusInternalServerError, "failed to archive problem capture", err)
	}
	if !found {
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

	capture, err := h.CaptureRepo.GetByID(c.Request().Context(), userID, captureID)
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

	capture, err := h.CaptureRepo.GetByID(c.Request().Context(), userID, captureID)
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
			if updateErr := h.CaptureRepo.MarkImported(c.Request().Context(), capture.ID, typedErr.ProblemID); updateErr != nil {
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

	if err := h.CaptureRepo.MarkImported(c.Request().Context(), capture.ID, createResult.ID); err != nil {
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

	if existingProblemID, err := h.CaptureRepo.FindImportedProblem(c.Request().Context(), userID, "leetcode", slug); err != nil {
		return observability.HTTPError(http.StatusInternalServerError, "failed to save problem capture", err)
	} else if existingProblemID != nil {
		return c.JSON(http.StatusOK, captureSaveResponse{
			Status:       "already_imported",
			ProblemID:    existingProblemID,
			CaptureState: "imported",
			Title:        repositories.StringPtr(strings.TrimSpace(req.FallbackTitle)),
			CanonicalURL: canonicalURL,
			NextAction:   "open_existing_problem",
		})
	}

	if existingCapture, err := h.CaptureRepo.FindBySourceKey(c.Request().Context(), userID, "leetcode", slug); err != nil && !errors.Is(err, sql.ErrNoRows) {
		return observability.HTTPError(http.StatusInternalServerError, "failed to save problem capture", err)
	} else if err == nil {
		if existingCapture.ProblemID != nil {
			return c.JSON(http.StatusOK, captureSaveResponse{
				Status:       "already_imported",
				CaptureID:    &existingCapture.ID,
				ProblemID:    existingCapture.ProblemID,
				CaptureState: "imported",
				Title:        repositories.CaptureDisplayTitle(existingCapture),
				CanonicalURL: existingCapture.CanonicalURL,
				NextAction:   "open_existing_problem",
			})
		}

		if err := h.CaptureRepo.Reactivate(c.Request().Context(), existingCapture.ID); err != nil {
			return observability.HTTPError(http.StatusInternalServerError, "failed to save problem capture", err)
		}

		refreshedCapture, refreshErr := h.CaptureRepo.GetByID(c.Request().Context(), userID, repositories.Int64ToString(existingCapture.ID))
		if refreshErr != nil {
			return observability.HTTPError(http.StatusInternalServerError, "failed to save problem capture", refreshErr)
		}

		return c.JSON(http.StatusOK, captureSaveResponse{
			Status:       "already_captured",
			CaptureID:    &refreshedCapture.ID,
			CaptureState: refreshedCapture.CaptureState,
			Title:        repositories.CaptureDisplayTitle(refreshedCapture),
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
		title = repositories.StringPtr(problem.Title)
		difficulty = repositories.StringPtr(problem.Difficulty)
		description = repositories.StringPtr(problem.Description)
		topicTags = models.JSONStringArray(problem.Tags)
		payloadBytes, err := json.Marshal(problem)
		if err == nil {
			sourcePayload = payloadBytes
		}
	} else {
		captureState = "failed"
		errorCode = repositories.StringPtr("leetcode_fetch_failed")
		errorMessage = repositories.StringPtr(fetchErr.Error())
	}

	capture, inserted, err := h.CaptureRepo.Insert(c.Request().Context(), repositories.CaptureInsertInput{
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
		FallbackTitle:      repositories.StringPtr(strings.TrimSpace(req.FallbackTitle)),
		FallbackDifficulty: repositories.StringPtr(repositories.NormalizeDifficulty(req.FallbackDifficulty)),
		FallbackNotes:      repositories.StringPtr(strings.TrimSpace(req.FallbackNotes)),
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
		Title:        repositories.CaptureDisplayTitle(capture),
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

	if existingProblemID, err := h.CaptureRepo.FindImportedProblem(c.Request().Context(), userID, source, key); err != nil {
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

	capture, err := h.CaptureRepo.FindBySourceKey(c.Request().Context(), userID, source, key)
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
		Title:        repositories.CaptureDisplayTitle(capture),
		CanonicalURL: capture.CanonicalURL,
		NextAction:   "finish_in_algomind",
	})
}

func (h *ProblemCaptureHandler) refreshCapture(ctx context.Context, capture *models.ProblemCapture) (*models.ProblemCapture, error) {
	if capture.Source != "leetcode" {
		return nil, errors.New("unsupported capture source")
	}

	problem, err := h.LeetCodeClient.FetchProblem(ctx, capture.CanonicalURL)
	if err != nil {
		if updateErr := h.CaptureRepo.UpdateFailedState(ctx, capture.ID, "leetcode_fetch_failed", err.Error()); updateErr != nil {
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

	return h.CaptureRepo.RefreshFromFetch(ctx, capture.ID, problem.Title, problem.Difficulty, problem.Description, models.JSONStringArray(problem.Tags), payloadBytes, nextState)
}
