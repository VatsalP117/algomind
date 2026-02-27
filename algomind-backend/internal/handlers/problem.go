package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/labstack/echo/v4"
)

type ProblemHandler struct {
	DB *database.Service
}

func NewProblemHandler(db *database.Service) *ProblemHandler {
	return &ProblemHandler{DB: db}
}

func (h *ProblemHandler) CreateProblem(c echo.Context) error {
	var req dto.CreateProblemRequest

	log.Printf("Received request to create problem")

	if err := c.Bind(&req); err != nil {
		log.Printf("Error binding CreateProblem request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}

	if err := c.Validate(&req); err != nil {
		log.Printf("Error validating CreateProblem request for title '%s': %v", req.Title, err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	userID := c.Get("user_id").(string)

	ctx := c.Request().Context()

	var problemID int64

	insertProblemQuery := `
		INSERT INTO problems (
			user_id,
			concept_id,
			title,
			link,
			difficulty,
			summary,
			description,
			answer,
			answer_language,
			hints,
			created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
		)
		RETURNING id
	`

	if err := h.DB.Db.QueryRowContext(
		ctx,
		insertProblemQuery,
		userID,
		req.ConceptID,
		req.Title,
		req.Link,
		req.Difficulty,
		req.Summary,
		req.Description,
		req.Answer,
		req.AnswerLanguage,
		req.Hints,
	).Scan(&problemID); err != nil {
		log.Printf("Database error creating problem for user %s, title '%s': %v", userID, req.Title, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create problem",
		)
	}

	log.Printf("Successfully inserted problem ID %d for user %s", problemID, userID)

	insertReviewStateQuery := `
		INSERT INTO review_states (
			user_id,
			entity_type,
			entity_id,
			next_review_at,
			interval_days,
			ease_factor,
			streak,
			created_at
		) VALUES (
			$1, 'problem', $2, $3, 0, 2.5, 0, NOW()
		)
	`

	if _, err := h.DB.Db.ExecContext(
		ctx,
		insertReviewStateQuery,
		userID,
		problemID,
		time.Now(),
	); err != nil {
		log.Printf("Database error creating review state for problem ID %d, user %s: %v", problemID, userID, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to create review state",
		)
	}

	log.Printf("Successfully created review state for problem ID %d", problemID)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id": problemID,
	})
}

func (h *ProblemHandler) GetAllUserProblems(c echo.Context) error {
	log.Printf("Received request to get all user problems")
	userId := c.Get("user_id").(string)
	ctx := c.Request().Context()

	fetchUserProblemsQuery := `
		SELECT 
			p.id,
			p.title,
			p.difficulty,
			c.title AS tag,
			p.created_at
		FROM problems p
		LEFT JOIN concepts c ON p.concept_id = c.id
		WHERE p.user_id = $1
	`
	var problems []dto.UserProblemsResponse
	if err := h.DB.Db.SelectContext(ctx, &problems, fetchUserProblemsQuery, userId); err != nil {
		log.Printf("Database error fetching user problems for user %s: %v", userId, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch user problems",
		)
	}
	return c.JSON(http.StatusOK, problems)
}

func (h *ProblemHandler) GetIndividualUserProblem(c echo.Context) error {
	log.Printf("Received request to get individual user problem")
	problemId := c.Param("problem_id")
	if problemId == "" {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			"problem ID is required",
		)
	}
	userId := c.Get("user_id").(string)
	ctx := c.Request().Context()

	fetchUserProblemQuery := `
		SELECT 
			p.id,
			p.title,
			p.difficulty,
			c.title AS tag,
			p.created_at,
			p.description,
			p.answer,
			p.answer_language,
			p.hints
		FROM problems p
		LEFT JOIN concepts c ON p.concept_id = c.id
		WHERE p.user_id = $1 AND p.id = $2
	`
	var problem dto.UserIndividualProblemResponse
	if err := h.DB.Db.GetContext(ctx, &problem, fetchUserProblemQuery, userId, problemId); err != nil {
		log.Printf("Database error fetching user problem for user %s, problem ID %s: %v", userId, problemId, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch user problem",
		)
	}
	return c.JSON(http.StatusOK, problem)
}

func (h *ProblemHandler) DeleteProblem(c echo.Context) error {
	log.Printf("Received request to delete problem")
	problemId := c.Param("problem_id")
	if problemId == "" {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			"problem ID is required",
		)
	}
	userId := c.Get("user_id").(string)
	ctx := c.Request().Context()

	deleteProblemQuery := `
		DELETE FROM problems
		WHERE user_id = $1 AND id = $2
	`
	if _, err := h.DB.Db.ExecContext(ctx, deleteProblemQuery, userId, problemId); err != nil {
		log.Printf("Database error deleting problem for user %s, problem ID %s: %v", userId, problemId, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to delete problem",
		)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"id": problemId,
	})
}

func (h *ProblemHandler) AddProblemToReviewQueue(c echo.Context) error {
	log.Printf("Received request to add problem to review queue")

	problemId := c.Param("problem_id")
	if problemId == "" {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			"problem ID is required",
		)
	}

	userId := c.Get("user_id").(string)
	ctx := c.Request().Context()

	query := `
		INSERT INTO review_states (
			user_id,
			entity_type,
			entity_id,
			next_review_at,
			interval_days,
			ease_factor,
			streak,
			created_at
		)
		VALUES (
			$1,
			'problem',
			$2,
			$3,
			0,
			2.5,
			0,
			NOW()
		)
		ON CONFLICT (user_id, entity_type, entity_id)
		DO UPDATE SET
			next_review_at = EXCLUDED.next_review_at,
			interval_days = 0,
			ease_factor = 2.5
	`

	if _, err := h.DB.Db.ExecContext(ctx, query, userId, problemId, time.Now()); err != nil {

		log.Printf("Database error upserting review state for user %s, problem ID %s: %v", userId, problemId, err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to add problem to review queue",
		)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id": problemId,
	})
}
