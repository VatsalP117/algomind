package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"github.com/VatsalP117/algomind/algomind-backend/internal/dto"
	"github.com/VatsalP117/algomind/algomind-backend/internal/models"
	"github.com/jmoiron/sqlx"
)

// ProblemWithConcept is a problem row joined with its concept title.
type ProblemWithConcept struct {
	models.Problem
	ConceptTitle string `db:"concept_title"`
}

// UpsertCardInput holds the writable fields of a problem pattern card.
type UpsertCardInput struct {
	Status             string
	RecognitionCues    []string
	Invariant          string
	FirstMove          string
	CommonMistake      string
	ContrastingPattern string
	Explanation        string
	Model              *string
}

// PatternDraft is a normalized pattern entry to persist.
type PatternDraft struct {
	CardID    int64
	PatternID int64
	Position  int
	Name      string
	Role      string
	Rationale string
}

// PatternRepository defines the seam between pattern-card business logic
// and persistence.
type PatternRepository interface {
	GetProblemWithConcept(ctx context.Context, userID string, problemID int64) (*ProblemWithConcept, error)
	GetCardByProblem(ctx context.Context, userID string, problemID int64) (*models.ProblemPatternCard, error)
	GetPatternsForCard(ctx context.Context, cardID int64) ([]models.ProblemPattern, error)
	GetRelatedProblems(ctx context.Context, userID string, sourceCardID, problemID int64) ([]dto.RelatedProblem, error)
	GetInsights(ctx context.Context, userID string) ([]dto.PatternInsightRow, []dto.PatternEdge, error)
	UpsertCardWithinTx(ctx context.Context, tx *sqlx.Tx, userID string, problemID int64, input UpsertCardInput) (int64, error)
	ReplacePatternsWithinTx(ctx context.Context, tx *sqlx.Tx, userID string, cardID int64, drafts []PatternDraft) error
}

// PostgresPatternRepository is the concrete adapter for PatternRepository.
type PostgresPatternRepository struct {
	db *sqlx.DB
}

// NewPostgresPatternRepository creates a new PostgresPatternRepository.
func NewPostgresPatternRepository(db *sqlx.DB) *PostgresPatternRepository {
	return &PostgresPatternRepository{db: db}
}

func (r *PostgresPatternRepository) GetProblemWithConcept(ctx context.Context, userID string, problemID int64) (*ProblemWithConcept, error) {
	query := `
		SELECT
			p.id,
			p.user_id,
			p.concept_id,
			p.title,
			p.link,
			p.difficulty,
			p.summary,
			p.description,
			p.answer,
			p.answer_language,
			p.hints,
			p.external_source,
			p.external_problem_key,
			p.created_at,
			COALESCE(c.title, '') AS concept_title
		FROM problems p
		LEFT JOIN concepts c ON c.id = p.concept_id
		WHERE p.id = $1
		  AND p.user_id = $2
	`
	var problem ProblemWithConcept
	if err := r.db.GetContext(ctx, &problem, query, problemID, userID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &problem, nil
}

func (r *PostgresPatternRepository) GetCardByProblem(ctx context.Context, userID string, problemID int64) (*models.ProblemPatternCard, error) {
	query := `
		SELECT
			id,
			problem_id,
			user_id,
			status,
			recognition_cues,
			invariant,
			first_move,
			common_mistake,
			contrasting_pattern,
			explanation,
			model,
			created_at,
			updated_at
		FROM problem_pattern_cards
		WHERE problem_id = $1
		  AND user_id = $2
	`
	var card models.ProblemPatternCard
	if err := r.db.GetContext(ctx, &card, query, problemID, userID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &card, nil
}

func (r *PostgresPatternRepository) GetPatternsForCard(ctx context.Context, cardID int64) ([]models.ProblemPattern, error) {
	query := `
		SELECT
			pp.id,
			pp.card_id,
			pp.pattern_id,
			pat.name,
			pp.role,
			pp.rationale,
			pp.position
		FROM problem_patterns pp
		JOIN patterns pat ON pat.id = pp.pattern_id
		WHERE pp.card_id = $1
		ORDER BY pp.position ASC
	`
	var patterns []models.ProblemPattern
	if err := r.db.SelectContext(ctx, &patterns, query, cardID); err != nil {
		return nil, err
	}
	return patterns, nil
}

func (r *PostgresPatternRepository) GetRelatedProblems(ctx context.Context, userID string, sourceCardID, problemID int64) ([]dto.RelatedProblem, error) {
	query := `
		SELECT
			p.id,
			p.title,
			p.difficulty,
			COALESCE(json_agg(DISTINCT pat.name ORDER BY pat.name), '[]'::json) AS shared_patterns
		FROM problem_pattern_cards shared_card
		JOIN problems p ON p.id = shared_card.problem_id
		JOIN problem_patterns pp ON pp.card_id = shared_card.id
		JOIN patterns pat
		  ON pat.id = pp.pattern_id
		 AND pat.user_id = $1
		WHERE shared_card.user_id = $1
		  AND shared_card.status = 'confirmed'
		  AND shared_card.problem_id <> $2
		  AND EXISTS (
			  SELECT 1
			  FROM problem_pattern_cards source_card
			  JOIN problem_patterns src_pp ON src_pp.card_id = source_card.id
			  JOIN patterns source_pattern
			    ON source_pattern.id = src_pp.pattern_id
			   AND source_pattern.user_id = $1
			  WHERE source_card.id = $3
			    AND source_card.user_id = $1
			    AND source_card.status = 'confirmed'
			    AND src_pp.pattern_id = pp.pattern_id
		  )
		GROUP BY p.id, p.title, p.difficulty
		ORDER BY p.id ASC
		LIMIT 20
	`
	var problems []dto.RelatedProblem
	if err := r.db.SelectContext(ctx, &problems, query, userID, problemID, sourceCardID); err != nil {
		return nil, err
	}
	if problems == nil {
		problems = []dto.RelatedProblem{}
	}
	return problems, nil
}

// GetInsights returns the per-pattern aggregates and co-occurrence edges
// for the user's confirmed pattern cards. Every join is scoped to the
// authenticated user and to confirmed cards, so draft/foreign data never
// leaks into mastery. Each problem review is attributed to every pattern
// currently confirmed on that problem.
func (r *PostgresPatternRepository) GetInsights(ctx context.Context, userID string) ([]dto.PatternInsightRow, []dto.PatternEdge, error) {
	rowsQuery := `
		SELECT
			pat.id                          AS pattern_id,
			pat.name                        AS name,
			COUNT(DISTINCT pc.problem_id)   AS confirmed_count,
			COUNT(DISTINCT pc.problem_id) FILTER (
				WHERE rs.next_review_at IS NOT NULL
				  AND rs.next_review_at <= NOW()
			)                               AS due_count,
			COUNT(rl.id) FILTER (WHERE rl.pattern_recognition = 'recognized') AS recognized_count,
			COUNT(rl.id) FILTER (WHERE rl.pattern_recognition = 'partial')    AS partial_count,
			COUNT(rl.id) FILTER (WHERE rl.pattern_recognition = 'missed')     AS missed_count,
			COUNT(rl.id) FILTER (WHERE rl.pattern_recognition IS NOT NULL)    AS attempts
		FROM patterns pat
		JOIN problem_patterns pp ON pp.pattern_id = pat.id
		JOIN problem_pattern_cards pc
			ON pc.id = pp.card_id
		   AND pc.user_id = $1
		   AND pc.status = 'confirmed'
		LEFT JOIN review_states rs
			ON rs.user_id = $1
		   AND rs.entity_type = 'problem'
		   AND rs.entity_id = pc.problem_id
		LEFT JOIN review_logs rl
			ON rl.user_id = $1
		   AND rl.entity_type = 'problem'
		   AND rl.entity_id = pc.problem_id
		WHERE pat.user_id = $1
		GROUP BY pat.id, pat.name
		ORDER BY confirmed_count DESC, pat.name ASC
	`
	var rows []dto.PatternInsightRow
	if err := r.db.SelectContext(ctx, &rows, rowsQuery, userID); err != nil {
		return nil, nil, err
	}

	edgesQuery := `
		SELECT
			a.pattern_id                  AS source_pattern_id,
			b.pattern_id                  AS target_pattern_id,
			COUNT(DISTINCT pc.problem_id) AS shared_problem_count
		FROM problem_patterns a
		JOIN problem_pattern_cards pc
			ON pc.id = a.card_id
		   AND pc.user_id = $1
		   AND pc.status = 'confirmed'
		JOIN patterns source_pattern
			ON source_pattern.id = a.pattern_id
		   AND source_pattern.user_id = $1
		JOIN problem_patterns b
			ON b.card_id = pc.id
		   AND b.pattern_id > a.pattern_id
		JOIN patterns target_pattern
			ON target_pattern.id = b.pattern_id
		   AND target_pattern.user_id = $1
		GROUP BY a.pattern_id, b.pattern_id
		HAVING COUNT(DISTINCT pc.problem_id) > 0
		ORDER BY a.pattern_id ASC, b.pattern_id ASC
	`
	var edges []dto.PatternEdge
	if err := r.db.SelectContext(ctx, &edges, edgesQuery, userID); err != nil {
		return nil, nil, err
	}

	// Guarantee list shape: empty results must serialize as [], not null.
	if rows == nil {
		rows = []dto.PatternInsightRow{}
	}
	if edges == nil {
		edges = []dto.PatternEdge{}
	}
	return rows, edges, nil
}

func (r *PostgresPatternRepository) UpsertCardWithinTx(ctx context.Context, tx *sqlx.Tx, userID string, problemID int64, input UpsertCardInput) (int64, error) {
	cues := input.RecognitionCues
	if cues == nil {
		cues = []string{}
	}
	cuesJSON, err := json.Marshal(cues)
	if err != nil {
		return 0, err
	}

	query := `
		INSERT INTO problem_pattern_cards (
			problem_id,
			user_id,
			status,
			recognition_cues,
			invariant,
			first_move,
			common_mistake,
			contrasting_pattern,
			explanation,
			model,
			created_at,
			updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
		)
		ON CONFLICT (problem_id) DO UPDATE SET
			status = EXCLUDED.status,
			recognition_cues = EXCLUDED.recognition_cues,
			invariant = EXCLUDED.invariant,
			first_move = EXCLUDED.first_move,
			common_mistake = EXCLUDED.common_mistake,
			contrasting_pattern = EXCLUDED.contrasting_pattern,
			explanation = EXCLUDED.explanation,
			model = COALESCE(EXCLUDED.model, problem_pattern_cards.model),
			updated_at = NOW()
		RETURNING id
	`

	var cardID int64
	err = tx.QueryRowContext(
		ctx,
		query,
		problemID,
		userID,
		input.Status,
		cuesJSON,
		input.Invariant,
		input.FirstMove,
		input.CommonMistake,
		input.ContrastingPattern,
		input.Explanation,
		input.Model,
	).Scan(&cardID)
	return cardID, err
}

func (r *PostgresPatternRepository) ReplacePatternsWithinTx(ctx context.Context, tx *sqlx.Tx, userID string, cardID int64, drafts []PatternDraft) error {
	// Resolve (or create) the normalized per-user pattern for each draft.
	for i := range drafts {
		var patternID int64
		err := tx.QueryRowContext(ctx, `
			INSERT INTO patterns (user_id, name)
			VALUES ($1, $2)
			ON CONFLICT (user_id, lower(name)) DO UPDATE SET name = EXCLUDED.name
			RETURNING id
		`, userID, drafts[i].Name).Scan(&patternID)
		if err != nil {
			return err
		}
		drafts[i].Position = i
		drafts[i].PatternID = patternID
		drafts[i].CardID = cardID
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM problem_patterns WHERE card_id = $1`, cardID); err != nil {
		return err
	}

	for _, draft := range drafts {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO problem_patterns (card_id, pattern_id, role, rationale, position)
			VALUES ($1, $2, $3, $4, $5)
		`, draft.CardID, draft.PatternID, draft.Role, draft.Rationale, draft.Position); err != nil {
			return err
		}
	}
	return nil
}
