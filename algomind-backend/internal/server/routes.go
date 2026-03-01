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

	folderHandler := handlers.NewConceptFolderHandler(db)

	api := e.Group("/api/v1")
	api.Use(authMiddleware.RequireAuth)

	api.GET("/profile", userHandler.GetProfile)

	// Concepts CRUD
	api.GET("/concepts", conceptHandler.ListConcepts)
	api.POST("/concepts", conceptHandler.CreateConcept)
	api.PUT("/concepts/:id", conceptHandler.UpdateConcept)
	api.DELETE("/concepts/:id", conceptHandler.DeleteConcept)
	api.POST("/concepts/:id/reset", conceptHandler.ResetConcept)

	// Concept Folders
	api.GET("/concept-folders", folderHandler.ListFolders)
	api.POST("/concept-folders", folderHandler.CreateFolder)
	api.PUT("/concept-folders/:id", folderHandler.UpdateFolder)
	api.DELETE("/concept-folders/:id", folderHandler.DeleteFolder)
	api.PUT("/concept-folder-items", folderHandler.AssignToFolder)
	api.DELETE("/concept-folder-items/:concept_id", folderHandler.RemoveFromFolder)

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
