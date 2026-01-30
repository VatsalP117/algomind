package handlers

import (
	"database/sql"
	"net/http"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	DB *database.Service
}

func NewUserHandler(db *database.Service) *UserHandler {
	return &UserHandler{DB: db}
}

// GetProfile ensures the authenticated user exists in our DB.
// If they don't exist, it creates them.
func (h *UserHandler) GetProfile(c echo.Context) error {
	// 1️⃣ Get Clerk user ID from auth middleware
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	// 2️⃣ Try to find the user
	var existingID string
	query := `SELECT id FROM users WHERE id = $1`

	err := h.DB.Db.GetContext(ctx, &existingID, query, userID)

	switch {
	case err == sql.ErrNoRows:
		// 3️⃣ First login → create user
		insertQuery := `
			INSERT INTO users (id, created_at)
			VALUES ($1, NOW())
		`

		if _, err := h.DB.Db.ExecContext(ctx, insertQuery, userID); err != nil {
			return echo.NewHTTPError(
				http.StatusInternalServerError,
				"failed to create user",
			)
		}

	case err != nil:
		// 4️⃣ Real DB error
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch user",
		)
	}

	// 5️⃣ Return minimal profile
	return c.JSON(http.StatusOK, map[string]interface{}{
		"user_id": userID,
	})
}
