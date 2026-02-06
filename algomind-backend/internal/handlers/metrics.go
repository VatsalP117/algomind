package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/labstack/echo/v4"
)

type MetricsHandler struct {
	DB *database.Service
}

func NewMetricsHandler(db *database.Service) *MetricsHandler {
	return &MetricsHandler{DB: db}
}

func (h *MetricsHandler) GetDashboard(c echo.Context) error {
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	var summary dto.DashboardSummary

	query := `
		SELECT 
			(SELECT COUNT(*) FROM review_states 
			 WHERE user_id = $1 AND next_review_at <= NOW()) as due_count,
			
			COALESCE((SELECT current_streak FROM users 
			 WHERE id = $1), 0) as current_streak,
			
			COALESCE((SELECT longest_streak FROM users 
			 WHERE id = $1), 0) as longest_streak,
			
			(SELECT COUNT(*) FROM review_logs 
			 WHERE user_id = $1 AND DATE(reviewed_at) = CURRENT_DATE) as reviews_today,
			
			(SELECT COUNT(*) FROM problems 
			 WHERE user_id = $1) as total_problems
	`

	if err := h.DB.Db.GetContext(ctx, &summary, query, userID); err != nil {
		fmt.Println("Dashboard metrics error:", err)
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch dashboard metrics",
		)
	}

	return c.JSON(http.StatusOK, summary)
}

func (h *MetricsHandler) GetRecallQuality(c echo.Context) error {
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	daysStr := c.QueryParam("days")
	days := 7
	if daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 && d <= 90 {
			days = d
		}
	}

	query := `
		SELECT 
			DATE(reviewed_at) as date,
			COUNT(*) as total_reviews,
			COUNT(*) FILTER (WHERE rating IN ('GOOD', 'EASY')) as successful_reviews,
			CASE 
				WHEN COUNT(*) > 0 
				THEN ROUND(COUNT(*) FILTER (WHERE rating IN ('GOOD', 'EASY')) * 100.0 / COUNT(*), 1)
				ELSE 0 
			END as recall_rate
		FROM review_logs
		WHERE user_id = $1 
		  AND reviewed_at >= CURRENT_DATE - $2::int
		GROUP BY DATE(reviewed_at)
		ORDER BY date ASC
	`

	var dataPoints []dto.RecallDataPoint
	if err := h.DB.Db.SelectContext(ctx, &dataPoints, query, userID, days); err != nil {
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch recall quality data",
		)
	}

	if dataPoints == nil {
		dataPoints = []dto.RecallDataPoint{}
	}

	return c.JSON(http.StatusOK, dataPoints)
}

func (h *MetricsHandler) GetTopicMastery(c echo.Context) error {
	userID := c.Get("user_id").(string)
	ctx := c.Request().Context()

	query := `
		WITH problem_stats AS (
			SELECT 
				p.concept_id,
				rs.ease_factor,
				rs.interval_days
			FROM problems p
			JOIN review_states rs ON rs.entity_id = p.id 
			  AND rs.entity_type = 'problem' 
			  AND rs.user_id = $1
			WHERE p.user_id = $1
		),
		retention_stats AS (
			SELECT 
				p.concept_id,
				COUNT(*) as total_reviews,
				COUNT(*) FILTER (WHERE rl.rating IN ('GOOD', 'EASY')) as successful_reviews
			FROM problems p
			JOIN review_logs rl ON rl.entity_id = p.id 
			  AND rl.entity_type = 'problem' 
			  AND rl.user_id = $1
			WHERE p.user_id = $1
			GROUP BY p.concept_id
		)
		SELECT 
			c.id as concept_id,
			c.title as concept_title,
			COUNT(DISTINCT ps.concept_id) as problem_count,
			COALESCE(ROUND(AVG(ps.ease_factor)::numeric, 2), 0) as avg_ease,
			COALESCE(ROUND(AVG(ps.interval_days)::numeric, 1), 0) as avg_interval,
			COALESCE(
				CASE 
					WHEN rs.total_reviews > 0 
					THEN ROUND(rs.successful_reviews * 100.0 / rs.total_reviews, 1)
					ELSE 0 
				END, 0
			) as retention_rate,
			-- Mastery score: (retention * 0.5) + (normalized_ease * 0.3) + (normalized_interval * 0.2)
			COALESCE(
				LEAST(100, GREATEST(0,
					(CASE WHEN rs.total_reviews > 0 THEN rs.successful_reviews * 100.0 / rs.total_reviews ELSE 0 END) * 0.5 +
					(LEAST(AVG(ps.ease_factor), 3.0) / 3.0 * 100) * 0.3 +
					(LEAST(AVG(ps.interval_days), 30) / 30.0 * 100) * 0.2
				))::int, 0
			) as mastery_score
		FROM concepts c
		LEFT JOIN problem_stats ps ON ps.concept_id = c.id
		LEFT JOIN retention_stats rs ON rs.concept_id = c.id
		WHERE EXISTS (
			SELECT 1 FROM problems p 
			WHERE p.concept_id = c.id AND p.user_id = $1
		)
		GROUP BY c.id, c.title, rs.total_reviews, rs.successful_reviews
		ORDER BY mastery_score DESC
	`

	var mastery []dto.TopicMastery
	if err := h.DB.Db.SelectContext(ctx, &mastery, query, userID); err != nil {
		return echo.NewHTTPError(
			http.StatusInternalServerError,
			"failed to fetch topic mastery data: "+err.Error(),
		)
	}

	if mastery == nil {
		mastery = []dto.TopicMastery{}
	}

	return c.JSON(http.StatusOK, mastery)
}
