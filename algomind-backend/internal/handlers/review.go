package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/srs"
	"github.com/labstack/echo/v4"
)

type LogReviewRequest struct {
	Rating string `json:"rating" validate:"required,oneof=AGAIN GOOD EASY HARD"`
}

type ReviewHandler struct {
	DB *database.Service
}

func NewReviewHandler(db *database.Service) *ReviewHandler {
	return &ReviewHandler{DB: db}
}

func (h *ReviewHandler) GetQueue(c echo.Context) error {
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	query := `
		SELECT
	rs.entity_type,
	rs.entity_id,
	rs.next_review_at,

	-- Problem fields
	p.title       AS problem_title,
	p.difficulty  AS difficulty,
	p.summary     AS summary,
	p.description AS description,
	p.answer      AS answer,
	p.hints       AS hints,

	-- Concept fields
	con.title    AS concept_title,
	con.content  AS content
	FROM review_states rs
	LEFT JOIN problems p
	ON rs.entity_type = 'problem'
   	AND rs.entity_id = p.id
	LEFT JOIN concepts con
	ON rs.entity_type = 'concept'
   	AND rs.entity_id = con.id
	WHERE rs.user_id = $1
  	AND rs.next_review_at <= NOW()
	ORDER BY rs.next_review_at ASC
	LIMIT 50
	`

	var queue []dto.ReviewQueueItem

	if err := h.DB.Db.SelectContext(ctx, &queue, query, userID); err != nil {
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			err.Error(),
		)
	}

	if queue == nil {
		queue = []dto.ReviewQueueItem{}
	}

	return c.JSON(http.StatusOK, queue)
}

func (h *ReviewHandler) LogReview(c echo.Context) error {
	entityType := c.Param("entity_type") // "problem" | "concept"
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

	ctx := c.Request().Context()

	// 1️⃣ Fetch current SRS state
	var current struct {
		IntervalDays int     `db:"interval_days"`
		EaseFactor   float64 `db:"ease_factor"`
		Streak       int     `db:"streak"`
	}

	stateQuery := `
		SELECT interval_days, ease_factor, streak
		FROM review_states
		WHERE user_id = $1
		  AND entity_type = $2
		  AND entity_id = $3
	`

	if err := h.DB.Db.GetContext(
		ctx,
		&current,
		stateQuery,
		userID,
		entityType,
		entityID,
	); err != nil {
		log.Printf("Review state not found for User ID: %s, Type: %s, ID: %s. Error: %v", userID, entityType, entityID, err)
		return echo.NewHTTPError(http.StatusNotFound, "review state not found")
	}

	// 2️⃣ Calculate new schedule using existing SRS algorithm
	result := srs.CalculateReview(
		req.Rating,
		current.IntervalDays,
		current.EaseFactor,
		current.Streak,
	)

	// 3️⃣ Start transaction
	tx, err := h.DB.Db.Beginx()
	if err != nil {
		log.Printf("Database error: failed to start transaction for logging review: %v", err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to start transaction",
		)
	}
	defer tx.Rollback()

	// 4️⃣ Update review state
	updateStateQuery := `
		UPDATE review_states
		SET next_review_at = $1,
		    interval_days = $2,
		    ease_factor = $3,
		    streak = $4
		WHERE user_id = $5
		  AND entity_type = $6
		  AND entity_id = $7
	`

	if _, err := tx.ExecContext(
		ctx,
		updateStateQuery,
		result.NextReviewAt,
		result.IntervalDays,
		result.EaseFactor,
		result.Streak,
		userID,
		entityType,
		entityID,
	); err != nil {
		log.Printf("Database error: failed to update review state for User %s, %s %s: %v", userID, entityType, entityID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to update review state",
		)
	}

	// 5️⃣ Insert review log
	logQuery := `
		INSERT INTO review_logs (
			user_id,
			entity_type,
			entity_id,
			rating,
			reviewed_at
		) VALUES ($1, $2, $3, $4, NOW())
	`

	if _, err := tx.ExecContext(
		ctx,
		logQuery,
		userID,
		entityType,
		entityID,
		req.Rating,
	); err != nil {
		log.Printf("Database error: failed to log review entry for User %s, %s %s: %v", userID, entityType, entityID, err)
		fmt.Println(err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to log review",
		)
	}

	// 6️⃣ Cascading reset: fail PROBLEM → reset parent CONCEPT
	if entityType == "problem" && req.Rating == "AGAIN" {
		log.Printf("Problem %s rated 'AGAIN', cascading reset to parent concept...", entityID)
		resetConceptQuery := `
			UPDATE review_states
			SET next_review_at = NOW(),
			    interval_days = 0,
			    streak = 0
			WHERE user_id = $1
			  AND entity_type = 'concept'
			  AND entity_id = (
				  SELECT concept_id FROM problems WHERE id = $2
			  )
		`
		if _, err := tx.ExecContext(ctx, resetConceptQuery, userID, entityID); err != nil {
			log.Printf("Warning: failed cascading reset for concept related to problem %s: %v", entityID, err)
		}
	}

	// 7️⃣ Update user streak
	updateStreakQuery := `
		UPDATE users SET
			current_streak = CASE 
				WHEN last_review_date = CURRENT_DATE THEN current_streak
				WHEN last_review_date = CURRENT_DATE - 1 THEN current_streak + 1
				ELSE 1
			END,
			longest_streak = GREATEST(longest_streak, 
				CASE 
					WHEN last_review_date = CURRENT_DATE THEN current_streak
					WHEN last_review_date = CURRENT_DATE - 1 THEN current_streak + 1
					ELSE 1
				END),
			last_review_date = CURRENT_DATE
		WHERE id = $1
	`
	if _, err := tx.ExecContext(ctx, updateStreakQuery, userID); err != nil {
		log.Printf("Database error: failed to update streak for User %s: %v", userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to update user streak",
		)
	}

	// 8️⃣ Commit
	if err := tx.Commit(); err != nil {
		log.Printf("Database error: failed to commit review logging transaction for User %s: %v", userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to commit transaction",
		)
	}

	log.Printf("Successfully logged review for User %s, %s %s (Rating: %s)", userID, entityType, entityID, req.Rating)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":     "review logged",
		"next_review": result.NextReviewAt,
	})
}
