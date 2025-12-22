package handlers

import (
	"net/http"

	"github.com/VatsalP117/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind-backend/internal/models"
	"github.com/labstack/echo/v4"
)

type ConceptHandler struct {
	DB *database.Service
}

func NewConceptHandler(db *database.Service) *ConceptHandler {
	return &ConceptHandler{DB: db}
}

// ListConcepts returns all global concepts
func (h *ConceptHandler) ListConcepts(c echo.Context) error {
	var concepts []models.Concept

	query := `
		SELECT id, title, description, content, created_at
		FROM concepts
		ORDER BY title ASC
	`

	if err := h.DB.Db.SelectContext(
		c.Request().Context(),
		&concepts,
		query,
	); err != nil {
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch concepts",
		)
	}

	return c.JSON(http.StatusOK, concepts)
}
