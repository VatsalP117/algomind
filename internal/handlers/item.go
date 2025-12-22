package handlers

import (
	"net/http"

	"github.com/VatsalP117/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind-backend/internal/models"
	"github.com/labstack/echo/v4"
)

type ItemHandler struct {
	DB *database.Service
}

func NewItemHandler(db *database.Service) *ItemHandler {
	return &ItemHandler{DB: db}
}

func (h *ItemHandler) CreateItem(c echo.Context) error {
	// 1. Bind & Validate
	var req models.CreateItemRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON"})
	}
	// if err := c.Validate(&req); err != nil {
	// 	return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	// }

	// 2. Get User ID from Auth Context
	clerkID := c.Get("user_id").(string)
	var userID int
	// Helper query to get internal ID from Clerk ID
	err := h.DB.Db.GetContext(c.Request().Context(), &userID, "SELECT id FROM users WHERE clerk_id=$1", clerkID)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "User not found"})
	}

	// 3. Insert into Database
	// We default the SRS fields (Interval=0, Ease=2.5) for a new card
	query := `
		INSERT INTO user_items (
			user_id, item_type, concept_id, 
			problem_title, problem_link, 
			difficulty, summary, description, answer, hints,
			next_review_at, interval_days, ease_factor, streak, created_at
		) VALUES (
			$1, $2, $3, 
			$4, $5, 
			$6, $7, $8, $9, $10,
			NOW(), 0, 2.5, 0, NOW()
		) RETURNING id`

	var newID int
	err = h.DB.Db.QueryRowContext(c.Request().Context(), query,
		userID,
		req.ItemType,
		req.ConceptID,
		req.ProblemTitle,
		req.ProblemLink,
		req.Difficulty,
		req.Summary,
		req.Description,
		req.Answer,
		req.Hints,
	).Scan(&newID)

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to save item"})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{"id": newID})
}

// Helper: Resolves Clerk String ID -> DB Int64 ID
func (h *ItemHandler) getInternalUserID(c echo.Context, clerkID string) (int64, error) {
	var id int64
	query := `SELECT id FROM users WHERE clerk_id = $1`
	err := h.DB.Db.GetContext(c.Request().Context(), &id, query, clerkID)
	return id, err
}