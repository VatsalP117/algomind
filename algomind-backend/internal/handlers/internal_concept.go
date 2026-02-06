package handlers

import (
	"net/http"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/labstack/echo/v4"
)

type InternalConceptHandler struct {
	DB *database.Service
}

func NewInternalConceptHandler(db *database.Service) *InternalConceptHandler {
	return &InternalConceptHandler{DB: db}
}

type CreateConceptRequest struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	Content     string `json:"content" validate:"required"`
}

func (h *InternalConceptHandler) CreateConcept(c echo.Context) error {
	var req CreateConceptRequest

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	ctx := c.Request().Context()

	query := `
		INSERT INTO concepts (title, description, content)
		VALUES ($1, $2, $3)
		RETURNING id
	`

	var conceptID int64
	if err := h.DB.Db.QueryRowContext(
		ctx,
		query,
		req.Title,
		req.Description,
		req.Content,
	).Scan(&conceptID); err != nil {
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create concept",
		)
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":      conceptID,
		"message": "concept created",
	})
}
