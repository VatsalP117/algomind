package handlers

import (
	"net/http"
	"time"

	"github.com/VatsalP117/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind-backend/internal/dto"
	"github.com/labstack/echo/v4"
)

type ProblemHandler struct {
	DB *database.Service
}

func NewProblemHandler(db *database.Service) *ProblemHandler {
	return &ProblemHandler{DB: db}
}

func (h *ProblemHandler) CreateProblem(c echo.Context) error {
	// 1. Bind + validate request
	var req dto.CreateProblemRequest

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// 2. Get authenticated user (Clerk ID)
	userID := c.Get("user_id").(string)

	ctx := c.Request().Context()

	// 3. Insert problem
	var problemID int64

	insertProblemQuery := `
		INSERT INTO problems (
			user_id,
			concept_id,
			title,
			link,
			difficulty,
			summary,
			description,
			answer,
			hints,
			created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
		)
		RETURNING id
	`

	if err := h.DB.Db.QueryRowContext(
		ctx,
		insertProblemQuery,
		userID,
		req.ConceptID,
		req.Title,
		req.Link,
		req.Difficulty,
		req.Summary,
		req.Description,
		req.Answer,
		req.Hints,
	).Scan(&problemID); err != nil {
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create problem",
		)
	}

	// 4. Create initial review state
	insertReviewStateQuery := `
		INSERT INTO review_states (
			user_id,
			entity_type,
			entity_id,
			next_review_at,
			interval_days,
			ease_factor,
			streak,
			created_at
		) VALUES (
			$1, 'problem', $2, $3, 0, 2.5, 0, NOW()
		)
	`

	if _, err := h.DB.Db.ExecContext(
		ctx,
		insertReviewStateQuery,
		userID,
		problemID,
		time.Now(),
	); err != nil {
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create review state",
		)
	}

	// 5. Return success
	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id": problemID,
	})
}
