package handlers

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/llm"
	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/VatsalP117/algomind/algomind-backend/internal/patterns"
	"github.com/labstack/echo/v4"
)

// patternCardService is the seam used by PatternCardHandler.
type patternCardService interface {
	GetPatternCard(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error)
	GeneratePatternCard(ctx context.Context, userID string, problemID int64) (*dto.PatternCardResponse, error)
	UpdatePatternCard(ctx context.Context, userID string, problemID int64, req dto.PatternCardUpdateRequest) (*dto.PatternCardResponse, error)
}

type PatternCardHandler struct {
	service patternCardService
}

func NewPatternCardHandler(service patternCardService) *PatternCardHandler {
	return &PatternCardHandler{service: service}
}

// GetPatternCard handles GET /problems/:problem_id/pattern-card.
func (h *PatternCardHandler) GetPatternCard(c echo.Context) error {
	problemID, err := parseProblemID(c)
	if err != nil {
		return err
	}
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	card, err := h.service.GetPatternCard(ctx, userID, problemID)
	if err != nil {
		return h.mapServiceError(err)
	}
	return c.JSON(http.StatusOK, card)
}

// GeneratePatternCard handles POST /problems/:problem_id/pattern-card/generate.
func (h *PatternCardHandler) GeneratePatternCard(c echo.Context) error {
	problemID, err := parseProblemID(c)
	if err != nil {
		return err
	}
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	card, err := h.service.GeneratePatternCard(ctx, userID, problemID)
	if err != nil {
		if errors.Is(err, patterns.ErrLLMNotConfigured) {
			return echo.NewHTTPError(http.StatusServiceUnavailable, "LLM is not configured")
		}
		if errors.Is(err, llm.ErrInvalidOutput) {
			return observability.HTTPError(
				http.StatusBadGateway,
				"failed to generate pattern card",
				err,
			)
		}
		if errors.Is(err, patterns.ErrProblemNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "problem not found")
		}
		return observability.HTTPError(
			http.StatusBadGateway,
			"failed to generate pattern card",
			err,
		)
	}
	return c.JSON(http.StatusOK, card)
}

// UpdatePatternCard handles PUT /problems/:problem_id/pattern-card.
func (h *PatternCardHandler) UpdatePatternCard(c echo.Context) error {
	problemID, err := parseProblemID(c)
	if err != nil {
		return err
	}

	var req dto.PatternCardUpdateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	card, err := h.service.UpdatePatternCard(ctx, userID, problemID, req)
	if err != nil {
		return h.mapServiceError(err)
	}
	return c.JSON(http.StatusOK, card)
}

func (h *PatternCardHandler) mapServiceError(err error) error {
	switch {
	case errors.Is(err, patterns.ErrProblemNotFound),
		errors.Is(err, patterns.ErrCardNotFound):
		return echo.NewHTTPError(http.StatusNotFound, "problem not found")
	case errors.Is(err, patterns.ErrInvalidPatterns):
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	default:
		return observability.HTTPError(http.StatusInternalServerError, "failed to fetch pattern card", err)
	}
}

func parseProblemID(c echo.Context) (int64, error) {
	raw := c.Param("problem_id")
	if raw == "" {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "problem ID is required")
	}
	problemID, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "invalid problem ID")
	}
	return problemID, nil
}
