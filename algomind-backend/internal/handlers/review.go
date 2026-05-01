package handlers

import (
	"database/sql"
	"errors"
	"log"
	"net/http"

	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/VatsalP117/algomind/algomind-backend/internal/reviews"
	"github.com/labstack/echo/v4"
)

type LogReviewRequest struct {
	Rating string `json:"rating" validate:"required,oneof=AGAIN GOOD EASY HARD"`
}

type ReviewHandler struct {
	reviewService *reviews.Service
}

func NewReviewHandler(reviewService *reviews.Service) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService}
}

func (h *ReviewHandler) GetQueue(c echo.Context) error {
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	queue, err := h.reviewService.GetQueue(ctx, userID)
	if err != nil {
		return observability.HTTPError(
			http.StatusInternalServerError,
			"failed to fetch review queue",
			err,
		)
	}

	return c.JSON(http.StatusOK, queue)
}

func (h *ReviewHandler) LogReview(c echo.Context) error {
	entityType := c.Param("entity_type")
	entityID := c.Param("entity_id")
	userID := c.Get("user_id").(string)

	log.Printf("Received request to log review for User ID: %s, Entity Type: %s, Entity ID: %s", userID, entityType, entityID)

	var req LogReviewRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Error binding LogReview request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		log.Printf("Error validating LogReview request (Rating: '%s'): %v", req.Rating, err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.reviewService.LogReview(c.Request().Context(), userID, entityType, entityID, req.Rating)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "review state not found")
		}
		log.Printf("Error logging review for User %s, %s %s: %v", userID, entityType, entityID, err)
		return observability.HTTPError(http.StatusInternalServerError, "failed to log review", err)
	}

	log.Printf("Successfully logged review for User %s, %s %s (Rating: %s)", userID, entityType, entityID, req.Rating)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":     "review logged",
		"next_review": result.NextReviewAt,
	})
}
