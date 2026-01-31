package server

import (
	"github.com/labstack/echo/v4"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/handlers"
	"github.com/VatsalP117/algomind/algomind-backend/internal/middleware"
)

func RegisterRoutes(e *echo.Echo, db *database.Service) {
	authMiddleware := middleware.New()

	// initialize handlers
	userHandler := handlers.NewUserHandler(db)
	problemHandler := handlers.NewProblemHandler(db)
	reviewHandler := handlers.NewReviewHandler(db)
	conceptHandler := handlers.NewConceptHandler(db)
	metricsHandler := handlers.NewMetricsHandler(db)

	internalConceptHandler := handlers.NewInternalConceptHandler(db)
	internalProblemHandler := handlers.NewInternalProblemHandler(db)
	internal := e.Group("/internal")
	internal.Use(authMiddleware.RequireAuth)
	internal.POST("/concepts", internalConceptHandler.CreateConcept)
	internal.GET("/problems", internalProblemHandler.GetAllProblems)

	// register the routes
	api := e.Group("/api/v1")
	api.Use(authMiddleware.RequireAuth)
	api.GET("/profile", userHandler.GetProfile)
	api.GET("/concepts", conceptHandler.ListConcepts)

	api.POST("/problems", problemHandler.CreateProblem)
	api.GET("/reviews/queue", reviewHandler.GetQueue)
	api.POST("/reviews/:entity_type/:entity_id/log", reviewHandler.LogReview)

	// Metrics endpoints
	api.GET("/metrics/dashboard", metricsHandler.GetDashboard)
	api.GET("/metrics/recall", metricsHandler.GetRecallQuality)
	api.GET("/metrics/mastery", metricsHandler.GetTopicMastery)
}
