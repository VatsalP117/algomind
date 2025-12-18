package handlers

import (
	"net/http"

	"github.com/VatsalP117/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind-backend/internal/models"
	"github.com/VatsalP117/algomind-backend/internal/srs"
	"github.com/labstack/echo/v4"
)

type ReviewHandler struct {
	DB *database.Service
}

func NewReviewHandler(db *database.Service) *ReviewHandler {
	return &ReviewHandler{DB: db}
}

// GetQueue returns all items due for review (NextReviewAt <= NOW)
func (h *ReviewHandler) GetQueue(c echo.Context) error {
	clerkID := c.Get("user_id").(string)

	// We need the internal ID for the query
	var userID int64
	err := h.DB.Db.GetContext(c.Request().Context(), &userID, "SELECT id FROM users WHERE clerk_id=$1", clerkID)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "User not found"})
	}

	// The Query:
	// 1. Selects everything from user_items
	// 2. Joins 'concepts' to get the Title/Content (Aliased as concept_*)
	// 3. Filters by User AND Due Date
	query := `
		SELECT 
			ui.*,
			c.title AS concept_title,
			c.content AS concept_content
		FROM user_items ui
		LEFT JOIN concepts c ON ui.concept_id = c.id
		WHERE ui.user_id = $1 
		  AND ui.next_review_at <= NOW()
		ORDER BY ui.next_review_at ASC
		LIMIT 50
	`

	var queue []models.ReviewQueueItem
	err = h.DB.Db.SelectContext(c.Request().Context(), &queue, query, userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch queue: " + err.Error()})
	}

	// Handle empty result
	if queue == nil {
		queue = []models.ReviewQueueItem{}
	}

	return c.JSON(http.StatusOK, queue)
}

type LogReviewRequest struct {
	Rating string `json:"rating" validate:"required,oneof=AGAIN HARD GOOD EASY"`
}

func (h *ReviewHandler) LogReview(c echo.Context) error {
	// 1. Parse Request
	itemID := c.Param("id")
	var req LogReviewRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON"})
	}

	ctx := c.Request().Context()

	// 2. Fetch the Current Item State
	var item models.UserItem
	// We need Interval, Ease, Streak, ConceptID, and Type to make decisions
	query := `SELECT * FROM user_items WHERE id = $1`
	err := h.DB.Db.GetContext(ctx, &item, query, itemID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Item not found"})
	}

	// 3. Calculate New Schedule (Using SRS Package)
	result := srs.CalculateReview(
		req.Rating,
		item.IntervalDays,
		item.EaseFactor,
		item.Streak,
	)

	// 4. Start Database Transaction
	// We use a transaction because we might update multiple tables (Item + Logs + Concept Reset)
	tx, err := h.DB.Db.Beginx()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to start transaction"})
	}
	// Safety: Rollback if function panics or returns error before Commit
	defer tx.Rollback()

	// 5. Update the Reviewed Item
	updateQuery := `
		UPDATE user_items 
		SET next_review_at = $1, interval_days = $2, ease_factor = $3, streak = $4 
		WHERE id = $5
	`
	_, err = tx.ExecContext(ctx, updateQuery, 
		result.NextReviewAt, 
		result.IntervalDays, 
		result.EaseFactor, 
		result.Streak, 
		itemID,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update item"})
	}

	// 6. Insert Review Log (For History/Heatmap)
	logQuery := `INSERT INTO review_logs (user_item_id, rating, reviewed_at) VALUES ($1, $2, NOW())`
	_, err = tx.ExecContext(ctx, logQuery, itemID, req.Rating)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to save log"})
	}

	// 7. THE LOGIC: Cascading Reset
	// If User FAILED ("AGAIN") a PROBLEM, reset the parent CONCEPT too.
	if item.ItemType == "PROBLEM" && req.Rating == "AGAIN" && item.ConceptID != nil {
		
		// Logic: Find the 'CONCEPT' item for this user with the same concept_id
		resetQuery := `
			UPDATE user_items 
			SET next_review_at = NOW(), interval_days = 0 
			WHERE user_id = $1 
			  AND concept_id = $2 
			  AND item_type = 'CONCEPT'
		`
		
		_, err = tx.ExecContext(ctx, resetQuery, item.UserID, *item.ConceptID)
		if err != nil {
			// Optional: Log this error, but don't fail the whole request
			// fmt.Printf("Failed to reset concept: %v\n", err)
		}
	}

	// 8. Commit Transaction
	if err := tx.Commit(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to commit transaction"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Review logged",
		"next_review": result.NextReviewAt, // Return this so frontend can animate/update UI
	})
}