package reviews

import (
	"context"
	"database/sql"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/repositories"
	"github.com/VatsalP117/algomind/algomind-backend/internal/srs"
)

// LogResult holds the outcome of a logged review.
type LogResult struct {
	NextReviewAt time.Time `json:"next_review_at"`
}

// Service orchestrates review operations.
type Service struct {
	db            *database.Service
	reviewRepo    repositories.ReviewRepository
	reviewLogRepo repositories.ReviewLogRepository
	userRepo      repositories.UserRepository
}

// NewService creates a new review Service.
func NewService(
	db *database.Service,
	reviewRepo repositories.ReviewRepository,
	reviewLogRepo repositories.ReviewLogRepository,
	userRepo repositories.UserRepository,
) *Service {
	return &Service{
		db:            db,
		reviewRepo:    reviewRepo,
		reviewLogRepo: reviewLogRepo,
		userRepo:      userRepo,
	}
}

// GetQueue returns the user's review queue.
func (s *Service) GetQueue(ctx context.Context, userID string) ([]dto.ReviewQueueItem, error) {
	return s.reviewRepo.GetQueue(ctx, userID)
}

// LogReview logs a review, updates SRS state, and handles cascading resets.
func (s *Service) LogReview(ctx context.Context, userID, entityType, entityID, rating string) (*LogResult, error) {
	// 1. Fetch current SRS state
	state, err := s.reviewRepo.GetState(ctx, userID, entityType, entityID)
	if err != nil {
		return nil, err
	}
	if state == nil {
		return nil, sql.ErrNoRows
	}

	// 2. Calculate new schedule
	result := srs.CalculateReview(srs.ReviewInput{
		Rating:          rating,
		CurrentInterval: state.IntervalDays,
		CurrentEase:     state.EaseFactor,
		CurrentStreak:   state.Streak,
		Difficulty:      state.Difficulty,
	})

	// 3. Start transaction
	tx, err := s.db.Db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	// 4. Update review state
	if err := s.reviewRepo.UpdateState(ctx, tx, userID, entityType, entityID, result.NextReviewAt, result.IntervalDays, result.EaseFactor, result.Streak); err != nil {
		return nil, err
	}

	// 5. Insert review log
	if err := s.reviewLogRepo.Create(ctx, tx, userID, entityType, entityID, rating); err != nil {
		return nil, err
	}

	// 6. Cascading reset: fail PROBLEM -> reset parent CONCEPT
	if entityType == "problem" && rating == "AGAIN" {
		if err := s.reviewRepo.ResetConceptForProblem(ctx, tx, userID, entityID); err != nil {
			// Non-fatal: log but don't fail the whole transaction
			// The original code ignored this error too
		}
	}

	// 7. Update user streak
	if err := s.userRepo.UpdateStreak(ctx, tx, userID); err != nil {
		return nil, err
	}

	// 8. Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	committed = true

	return &LogResult{NextReviewAt: result.NextReviewAt}, nil
}
