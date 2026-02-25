package handlers

import (
	"log"
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

	log.Printf("Received request to create internal concept")

	if err := c.Bind(&req); err != nil {
		log.Printf("Error binding CreateConcept request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		log.Printf("Error validating CreateConcept request for title '%s': %v", req.Title, err)
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
		log.Printf("Database error creating internal concept with title '%s': %v", req.Title, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create concept",
		)
	}

	log.Printf("Successfully created internal concept ID %d", conceptID)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":      conceptID,
		"message": "concept created",
	})
}
