package server

import (
	"github.com/labstack/echo/v4"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/handlers"
	"github.com/VatsalP117/algomind/algomind-backend/internal/middleware"
)

func RegisterRoutes(e *echo.Echo, db *database.Service) {
	authMiddleware := middleware.New(db)

	userHandler := handlers.NewUserHandler(db)
	problemHandler := handlers.NewProblemHandler(db)
	reviewHandler := handlers.NewReviewHandler(db)
	conceptHandler := handlers.NewConceptHandler(db)
	metricsHandler := handlers.NewMetricsHandler(db)
	leetcodeHandler := handlers.NewLeetCodeHandler()

	internalConceptHandler := handlers.NewInternalConceptHandler(db)
	internal := e.Group("/internal")
	internal.Use(authMiddleware.RequireAuth)
	internal.POST("/concepts", internalConceptHandler.CreateConcept)
	api := e.Group("/api/v1")
	api.Use(authMiddleware.RequireAuth)
	api.GET("/profile", userHandler.GetProfile)
	api.GET("/concepts", conceptHandler.ListConcepts)

	api.POST("/problems", problemHandler.CreateProblem)
	api.GET("/problems", problemHandler.GetAllUserProblems)
	api.GET("/problems/:problem_id", problemHandler.GetIndividualUserProblem)
	api.DELETE("/problems/:problem_id", problemHandler.DeleteProblem)
	api.POST("/problems/add-to-review-queue/:problem_id", problemHandler.AddProblemToReviewQueue)

	api.GET("/reviews/queue", reviewHandler.GetQueue)
	api.POST("/reviews/:entity_type/:entity_id/log", reviewHandler.LogReview)

	api.GET("/leetcode/fetch", leetcodeHandler.FetchProblem)
	api.GET("/leetcode/fetch/direct", leetcodeHandler.FetchProblemDirectLeetCode)

	api.GET("/metrics/dashboard", metricsHandler.GetDashboard)
	api.GET("/metrics/recall", metricsHandler.GetRecallQuality)
	api.GET("/metrics/mastery", metricsHandler.GetTopicMastery)
}
