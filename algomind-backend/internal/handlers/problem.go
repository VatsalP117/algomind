package handlers

import (
	"log"
	"net/http"
	"strings"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/leetcode"
	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/VatsalP117/algomind/algomind-backend/internal/problems"
	"github.com/VatsalP117/algomind/algomind-backend/internal/repositories"
	"github.com/labstack/echo/v4"
)

type ProblemHandler struct {
	ProblemRepo     repositories.ProblemRepository
	ReviewStateRepo repositories.ReviewStateRepository
	ProblemService  *problems.Service
}

func NewProblemHandler(
	problemRepo repositories.ProblemRepository,
	reviewStateRepo repositories.ReviewStateRepository,
	problemService *problems.Service,
) *ProblemHandler {
	return &ProblemHandler{
		ProblemRepo:     problemRepo,
		ReviewStateRepo: reviewStateRepo,
		ProblemService:  problemService,
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
			externalSource = repositories.StringPtr("leetcode")
			externalProblemKey = repositories.StringPtr(slug)
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
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	problems, err := h.ProblemRepo.GetAllByUser(ctx, userID)
	if err != nil {
		log.Printf("Database error fetching user problems for user %s: %v", userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch user problems",
		)
	}
	return c.JSON(http.StatusOK, problems)
}

func (h *ProblemHandler) GetIndividualUserProblem(c echo.Context) error {
	log.Printf("Received request to get individual user problem")
	problemID := c.Param("problem_id")
	if problemID == "" {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			"problem ID is required",
		)
	}
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	problem, err := h.ProblemRepo.GetByIDAndUser(ctx, userID, problemID)
	if err != nil {
		log.Printf("Database error fetching user problem for user %s, problem ID %s: %v", userID, problemID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch user problem",
		)
	}
	if problem == nil {
		return echo.NewHTTPError(http.StatusNotFound, "problem not found")
	}
	return c.JSON(http.StatusOK, problem)
}

func (h *ProblemHandler) DeleteProblem(c echo.Context) error {
	log.Printf("Received request to delete problem")
	problemID := c.Param("problem_id")
	if problemID == "" {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			"problem ID is required",
		)
	}
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	if err := h.ProblemRepo.Delete(ctx, userID, problemID); err != nil {
		log.Printf("Database error deleting problem for user %s, problem ID %s: %v", userID, problemID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to delete problem",
		)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"id": problemID,
	})
}

func (h *ProblemHandler) AddProblemToReviewQueue(c echo.Context) error {
	log.Printf("Received request to add problem to review queue")

	problemID := c.Param("problem_id")
	if problemID == "" {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			"problem ID is required",
		)
	}

	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	if err := h.ReviewStateRepo.UpsertForProblem(ctx, userID, problemID); err != nil {
		log.Printf("Database error upserting review state for user %s, problem ID %s: %v", userID, problemID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to add problem to review queue",
		)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id": problemID,
	})
}
