package server

import (
	"github.com/labstack/echo/v4"

	"github.com/VatsalP117/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind-backend/internal/handlers"
	"github.com/VatsalP117/algomind-backend/internal/middleware"
)
func RegisterRoutes (e *echo.Echo, db *database.Service) {
	authMiddleware := middleware.New()
	
	// initialize handlers
	userHandler := handlers.NewUserHandler(db)
	problemHandler := handlers.NewProblemHandler(db)
	reviewHandler := handlers.NewReviewHandler(db)
	conceptHandler := handlers.NewConceptHandler(db)

	// register the routes
	api := e.Group("/api/v1")
	api.Use(authMiddleware.RequireAuth)
	api.GET("/profile", userHandler.GetProfile)
	api.GET("/concepts", conceptHandler.ListConcepts)

	api.POST("/problems", problemHandler.CreateProblem)
	api.GET("/reviews/queue", reviewHandler.GetQueue)
	api.POST("/reviews/:entity_type/:entity_id/log", reviewHandler.LogReview)
} 