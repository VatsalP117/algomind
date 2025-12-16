package handlers

import (
	"net/http"

	"github.com/VatsalP117/algomind-backend/internal/database"
	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	// In the future, you will add your Database Service here.
	DB *database.Service
}

// NewUserHandler initializes the handler
func NewUserHandler(db *database.Service) *UserHandler {
	return &UserHandler{
		DB: db,
	}
}

func (h *UserHandler) GetProfile(c echo.Context) error {
	userID := c.Get("user_id").(string)

	// --- DATABASE CHECK (The new part) ---
	// Let's pretend we have a 'users' table. 
	// We check if the database is alive by running a simple query.
	
	var currentTime string
	// QueryRow executes a query that is expected to return at most one row.
	err := h.DB.Db.QueryRow("SELECT NOW()").Scan(&currentTime)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database query failed"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":        userID,
		"db_time":   currentTime, // Proof that DB is working!
		"message":   "Connected to Postgres successfully",
	})
}