package handlers

import (
	"context"
	"net/http"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/labstack/echo/v4"
)

// patternInsightsService is the seam used by PatternInsightsHandler.
type patternInsightsService interface {
	GetInsights(ctx context.Context, userID string) (*dto.PatternInsightsResponse, error)
}

type PatternInsightsHandler struct {
	service patternInsightsService
}

func NewPatternInsightsHandler(service patternInsightsService) *PatternInsightsHandler {
	return &PatternInsightsHandler{service: service}
}

// GetInsights handles GET /patterns/insights.
func (h *PatternInsightsHandler) GetInsights(c echo.Context) error {
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	response, err := h.service.GetInsights(ctx, userID)
	if err != nil {
		return observability.HTTPError(
			http.StatusInternalServerError,
			"failed to fetch pattern insights",
			err,
		)
	}
	return c.JSON(http.StatusOK, response)
}
