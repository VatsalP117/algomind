package reviews

import (
	"context"
	"database/sql"
	"strings"
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

// ReviewEvidence carries optional pattern-recognition data recorded with
// a review. Only accepted for problem reviews.
type ReviewEvidence struct {
	PatternGuess       *string
	PatternRecognition *string
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
// Optional pattern-recognition evidence is only persisted for problem
// reviews; it is ignored for concept reviews.
func (s *Service) LogReview(ctx context.Context, userID, entityType, entityID, rating string, evidence *ReviewEvidence) (*LogResult, error) {
	// 0. Normalize optional pattern-recognition evidence.
	patternGuess, patternRecognition := normalizeEvidence(entityType, evidence)

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
	if err := s.reviewLogRepo.Create(ctx, tx, userID, entityType, entityID, rating, patternGuess, patternRecognition); err != nil {
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

// normalizeEvidence trims and validates optional pattern-recognition
// evidence. Evidence is only accepted for problem reviews; empty
// evidence is dropped entirely.
func normalizeEvidence(entityType string, evidence *ReviewEvidence) (*string, *string) {
	if evidence == nil || entityType != "problem" {
		return nil, nil
	}

	guess := strings.TrimSpace(derefString(evidence.PatternGuess))
	recognition := strings.TrimSpace(derefString(evidence.PatternRecognition))
	if guess == "" && recognition == "" {
		return nil, nil
	}

	var patternGuess, patternRecognition *string
	if guess != "" {
		patternGuess = &guess
	}
	if recognition != "" {
		patternRecognition = &recognition
	}
	return patternGuess, patternRecognition
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
