package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/labstack/echo/v4"
)

type ProblemHandler struct {
	DB *database.Service
}

func NewProblemHandler(db *database.Service) *ProblemHandler {
	return &ProblemHandler{DB: db}
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

	ctx := c.Request().Context()

	tx, err := h.DB.Db.BeginTxx(ctx, nil)
	if err != nil {
		log.Printf("Database error starting transaction for user %s: %v", userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create problem",
		)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

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
			answer_language,
			hints,
			created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
		)
			RETURNING id
		`

	var problemID int64
	if err := tx.QueryRowContext(
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
		req.AnswerLanguage,
		req.Hints,
	).Scan(&problemID); err != nil {
		log.Printf("Database error creating problem for user %s, title '%s': %v", userID, req.Title, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create problem",
		)
	}

	log.Printf("Successfully inserted problem ID %d for user %s", problemID, userID)

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

	if _, err := tx.ExecContext(
		ctx,
		insertReviewStateQuery,
		userID,
		problemID,
		time.Now(),
	); err != nil {
		log.Printf("Database error creating review state for problem ID %d, user %s: %v", problemID, userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create review state",
		)
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Database error committing transaction for new problem ID %d, user %s: %v", problemID, userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create problem",
		)
	}
	committed = true

	log.Printf("Successfully created review state for problem ID %d", problemID)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id": problemID,
	})
}
