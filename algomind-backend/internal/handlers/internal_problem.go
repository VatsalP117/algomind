package handlers

import (
	"fmt"
	"net/http"

	"github.com/VatsalP117/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind-backend/internal/models"
	"github.com/labstack/echo/v4"
)


type InternalProblemHandler struct {
	DB *database.Service
}

func NewInternalProblemHandler(db *database.Service) *InternalProblemHandler {
	return &InternalProblemHandler{DB: db}
}


func (h *InternalProblemHandler) GetAllProblems(c echo.Context) error {
	var problems []models.Problem
	userId := c.Get("user_id").(string)
	ctx := c.Request().Context()

	query := `SELECT * from problems WHERE user_id = $1`

	if err := h.DB.Db.SelectContext(
		ctx,
		&problems,
		query,
		userId,
	); err != nil {
		fmt.Println("Database Error:", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch problems")
	}
	return c.JSON(http.StatusOK, problems)
}