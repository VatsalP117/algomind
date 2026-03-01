package handlers

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/models"
	"github.com/labstack/echo/v4"
)

type ConceptHandler struct {
	DB *database.Service
}

func NewConceptHandler(db *database.Service) *ConceptHandler {
	return &ConceptHandler{DB: db}
}

type ConceptRequest struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	Content     string `json:"content" validate:"required"`
}

func (h *ConceptHandler) ListConcepts(c echo.Context) error {
	var concepts []models.Concept
	userID := c.Get("user_id").(string)

	query := `
		SELECT id, title, description, content, user_id, base_concept_id, created_at
		FROM concepts
		WHERE user_id IS NULL
		  AND id NOT IN (
			  SELECT base_concept_id FROM concepts 
			  WHERE user_id = $1 AND base_concept_id IS NOT NULL
		  )
		UNION ALL
		SELECT id, title, description, content, user_id, base_concept_id, created_at
		FROM concepts
		WHERE user_id = $1
		ORDER BY title ASC
	`

	if err := h.DB.Db.SelectContext(
		c.Request().Context(),
		&concepts,
		query,
		userID,
	); err != nil {
		log.Printf("Error fetching concepts: %v", err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch concepts",
		)
	}

	if concepts == nil {
		concepts = []models.Concept{}
	}

	return c.JSON(http.StatusOK, concepts)
}

func (h *ConceptHandler) CreateConcept(c echo.Context) error {
	var req ConceptRequest
	userID := c.Get("user_id").(string)

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	query := `
		INSERT INTO concepts (user_id, base_concept_id, title, description, content)
		VALUES ($1, NULL, $2, $3, $4)
		RETURNING id, title, description, content, user_id, base_concept_id, created_at
	`

	var concept models.Concept
	if err := h.DB.Db.GetContext(
		c.Request().Context(),
		&concept,
		query,
		userID,
		req.Title,
		req.Description,
		req.Content,
	); err != nil {
		log.Printf("Error creating concept: %v", err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create concept",
		)
	}

	return c.JSON(http.StatusCreated, concept)
}

func (h *ConceptHandler) UpdateConcept(c echo.Context) error {
	var req ConceptRequest
	userID := c.Get("user_id").(string)
	conceptID := c.Param("id")

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// First, check if the concept is a system concept or a user concept
	var current models.Concept
	err := h.DB.Db.GetContext(c.Request().Context(), &current, "SELECT * FROM concepts WHERE id = $1", conceptID)
	if err == sql.ErrNoRows {
		return echo.NewHTTPError(http.StatusNotFound, "concept not found")
	} else if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "database error")
	}

	var updatedConcept models.Concept

	if current.UserID == nil {
		// It's a system concept. Check if user already has an override.
		var existingOverrideID int64
		overrideErr := h.DB.Db.GetContext(c.Request().Context(), &existingOverrideID,
			"SELECT id FROM concepts WHERE user_id = $1 AND base_concept_id = $2", userID, current.ID)

		if overrideErr == sql.ErrNoRows {
			// No override yet — insert one
			query := `
				INSERT INTO concepts (user_id, base_concept_id, title, description, content)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING id, title, description, content, user_id, base_concept_id, created_at
			`
			if err := h.DB.Db.GetContext(c.Request().Context(), &updatedConcept, query, userID, current.ID, req.Title, req.Description, req.Content); err != nil {
				log.Printf("Error creating concept override: %v", err)
				return echo.NewHTTPError(http.StatusInternalServerError, "failed to update concept")
			}
		} else if overrideErr == nil {
			// Override exists — update it
			query := `
				UPDATE concepts SET title = $1, description = $2, content = $3
				WHERE id = $4
				RETURNING id, title, description, content, user_id, base_concept_id, created_at
			`
			if err := h.DB.Db.GetContext(c.Request().Context(), &updatedConcept, query, req.Title, req.Description, req.Content, existingOverrideID); err != nil {
				log.Printf("Error updating concept override: %v", err)
				return echo.NewHTTPError(http.StatusInternalServerError, "failed to update concept")
			}
		} else {
			log.Printf("Error checking for override: %v", overrideErr)
			return echo.NewHTTPError(http.StatusInternalServerError, "database error")
		}
	} else if *current.UserID == userID {
		// It's the user's concept. Update in place.
		query := `
			UPDATE concepts
			SET title = $1, description = $2, content = $3
			WHERE id = $4 AND user_id = $5
			RETURNING id, title, description, content, user_id, base_concept_id, created_at
		`
		if err := h.DB.Db.GetContext(c.Request().Context(), &updatedConcept, query, req.Title, req.Description, req.Content, current.ID, userID); err != nil {
			log.Printf("Error updating concept: %v", err)
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to update concept")
		}
	} else {
		return echo.NewHTTPError(http.StatusForbidden, "not authorized to update this concept")
	}

	return c.JSON(http.StatusOK, updatedConcept)
}

func (h *ConceptHandler) DeleteConcept(c echo.Context) error {
	userID := c.Get("user_id").(string)
	conceptID := c.Param("id")

	query := `DELETE FROM concepts WHERE id = $1 AND user_id = $2`
	res, err := h.DB.Db.ExecContext(c.Request().Context(), query, conceptID, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete concept")
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "concept not found or not authorized")
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "concept deleted"})
}

func (h *ConceptHandler) ResetConcept(c echo.Context) error {
	userID := c.Get("user_id").(string)
	systemConceptID := c.Param("id")

	// Delete the user's override for this base_concept_id
	query := `DELETE FROM concepts WHERE base_concept_id = $1 AND user_id = $2`
	res, err := h.DB.Db.ExecContext(c.Request().Context(), query, systemConceptID, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to reset concept")
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "no override found to reset")
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "concept reset to system default"})
}
