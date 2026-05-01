package server

import (
	"github.com/VatsalP117/algomind/algomind-backend/internal/extensions"
	"github.com/VatsalP117/algomind/algomind-backend/internal/handlers"
	"github.com/VatsalP117/algomind/algomind-backend/internal/leetcode"
	"github.com/VatsalP117/algomind/algomind-backend/internal/middleware"
	"github.com/VatsalP117/algomind/algomind-backend/internal/problems"
	"github.com/VatsalP117/algomind/algomind-backend/internal/repositories"
	"github.com/VatsalP117/algomind/algomind-backend/internal/reviews"
	"github.com/labstack/echo/v4"

	"github.com/VatsalP117/algomind/algomind-backend/internal/config"
	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/llm"
)

func RegisterRoutes(e *echo.Echo, db *database.Service, cfg *config.Config) {
	authMiddleware := middleware.New(db)
	llmClient := llm.NewClient(cfg)
	leetcodeClient := leetcode.NewClient()

	problemRepo := repositories.NewPostgresProblemRepository(db.Db)
	reviewStateRepo := repositories.NewPostgresReviewStateRepository(db.Db)
	conceptRepo := repositories.NewPostgresConceptRepository(db.Db)

	problemService := problems.NewService(db, problemRepo, reviewStateRepo, conceptRepo, llmClient)
	extensionService := extensions.NewService(db, cfg)
	extensionAuthMiddleware := middleware.NewExtensionAuth(extensionService)

	reviewRepo := repositories.NewPostgresReviewRepository(db.Db)
	reviewLogRepo := repositories.NewPostgresReviewLogRepository(db.Db)
	userRepo := repositories.NewPostgresUserRepository(db.Db)
	reviewService := reviews.NewService(db, reviewRepo, reviewLogRepo, userRepo)

	userHandler := handlers.NewUserHandler(db)
	problemHandler := handlers.NewProblemHandler(problemRepo, reviewStateRepo, problemService)
	reviewHandler := handlers.NewReviewHandler(reviewService)
	conceptHandler := handlers.NewConceptHandler(db)
	metricsHandler := handlers.NewMetricsHandler(db)
	leetcodeHandler := handlers.NewLeetCodeHandler()
	folderHandler := handlers.NewConceptFolderHandler(db)
	extensionHandler := handlers.NewExtensionHandler(extensionService)
	problemCaptureHandler := handlers.NewProblemCaptureHandler(db, leetcodeClient, problemService)

	api := e.Group("/api/v1")

	api.POST("/extension/auth/pair", extensionHandler.Pair)
	api.POST("/extension/auth/refresh", extensionHandler.Refresh)

	extensionAPI := api.Group("/extension")
	extensionAPI.Use(extensionAuthMiddleware.RequireAuth)
	extensionAPI.POST("/auth/logout", extensionHandler.Logout)
	extensionAPI.POST("/captures", problemCaptureHandler.CreateCaptureFromExtension)
	extensionAPI.GET("/captures/by-external-key/:source/:key", problemCaptureHandler.GetCaptureStatusByExternalKey)

	appAPI := api.Group("")
	appAPI.Use(authMiddleware.RequireAuth)

	appAPI.GET("/profile", userHandler.GetProfile)

	// Concepts CRUD
	appAPI.GET("/concepts", conceptHandler.ListConcepts)
	appAPI.POST("/concepts", conceptHandler.CreateConcept)
	appAPI.PUT("/concepts/:id", conceptHandler.UpdateConcept)
	appAPI.DELETE("/concepts/:id", conceptHandler.DeleteConcept)
	appAPI.POST("/concepts/:id/reset", conceptHandler.ResetConcept)

	// Concept Folders
	appAPI.GET("/concept-folders", folderHandler.ListFolders)
	appAPI.POST("/concept-folders", folderHandler.CreateFolder)
	appAPI.PUT("/concept-folders/:id", folderHandler.UpdateFolder)
	appAPI.DELETE("/concept-folders/:id", folderHandler.DeleteFolder)
	appAPI.PUT("/concept-folder-items", folderHandler.AssignToFolder)
	appAPI.DELETE("/concept-folder-items/:concept_id", folderHandler.RemoveFromFolder)

	appAPI.POST("/problems", problemHandler.CreateProblem)
	appAPI.GET("/problems", problemHandler.GetAllUserProblems)
	appAPI.GET("/problems/:problem_id", problemHandler.GetIndividualUserProblem)
	appAPI.DELETE("/problems/:problem_id", problemHandler.DeleteProblem)
	appAPI.POST("/problems/add-to-review-queue/:problem_id", problemHandler.AddProblemToReviewQueue)

	appAPI.GET("/problem-captures", problemCaptureHandler.ListCaptures)
	appAPI.GET("/problem-captures/:capture_id", problemCaptureHandler.GetCapture)
	appAPI.POST("/problem-captures/:capture_id/retry-enrichment", problemCaptureHandler.RetryEnrichment)
	appAPI.POST("/problem-captures/:capture_id/archive", problemCaptureHandler.ArchiveCapture)
	appAPI.POST("/problem-captures/:capture_id/convert", problemCaptureHandler.ConvertCapture)

	appAPI.POST("/extension/pairing-codes", extensionHandler.CreatePairingCode)
	appAPI.GET("/extension/installations", extensionHandler.ListInstallations)
	appAPI.DELETE("/extension/installations/:installation_id", extensionHandler.RevokeInstallation)

	appAPI.GET("/reviews/queue", reviewHandler.GetQueue)
	appAPI.POST("/reviews/:entity_type/:entity_id/log", reviewHandler.LogReview)

	appAPI.GET("/leetcode/fetch", leetcodeHandler.FetchProblem)
	appAPI.GET("/leetcode/fetch/direct", leetcodeHandler.FetchProblemDirectLeetCode)

	appAPI.GET("/metrics/dashboard", metricsHandler.GetDashboard)
	appAPI.GET("/metrics/recall", metricsHandler.GetRecallQuality)
	appAPI.GET("/metrics/mastery", metricsHandler.GetTopicMastery)
	appAPI.GET("/metrics/most-used-language", metricsHandler.GetMostUsedLanguage)
}
