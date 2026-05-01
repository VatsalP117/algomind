package extensions

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/config"
	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/security"
	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidPairingCode = errors.New("invalid pairing code")
	ErrExpiredPairingCode = errors.New("pairing code expired")
	ErrUsedPairingCode    = errors.New("pairing code already used")
	ErrInvalidRefresh     = errors.New("invalid refresh token")
	ErrExpiredRefresh     = errors.New("refresh token expired")
	ErrRevokedSession     = errors.New("extension session has been revoked")
	ErrRefreshReplay      = errors.New("refresh token replay detected")
	ErrInvalidAccessToken = errors.New("invalid extension access token")
)

type Service struct {
	db              *database.Service
	signingKey      []byte
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
	pairingCodeTTL  time.Duration
}

type PairingCode struct {
	Code      string    `json:"code"`
	ExpiresAt time.Time `json:"expires_at"`
}

type Installation struct {
	ID               string     `db:"id" json:"id"`
	UserID           string     `db:"user_id" json:"user_id,omitempty"`
	Name             string     `db:"name" json:"name"`
	Browser          string     `db:"browser" json:"browser"`
	ExtensionVersion *string    `db:"extension_version" json:"extension_version,omitempty"`
	CreatedAt        time.Time  `db:"created_at" json:"created_at"`
	LastSeenAt       *time.Time `db:"last_seen_at" json:"last_seen_at,omitempty"`
	RevokedAt        *time.Time `db:"revoked_at" json:"revoked_at,omitempty"`
}

type SessionTokens struct {
	AccessToken           string    `json:"access_token"`
	AccessTokenExpiresAt  time.Time `json:"access_token_expires_at"`
	RefreshToken          string    `json:"refresh_token"`
	RefreshTokenExpiresAt time.Time `json:"refresh_token_expires_at"`
}

type Session struct {
	Installation Installation  `json:"installation"`
	Tokens       SessionTokens `json:"tokens"`
}

type AccessClaims struct {
	InstallationID string `json:"installation_id"`
	jwt.RegisteredClaims
}

func NewService(db *database.Service, cfg *config.Config) *Service {
	secret := cfg.ExtensionTokenSecret
	if secret == "" {
		sum := sha256.Sum256([]byte("algomind-extension:" + cfg.ClerkSecretKey))
		secret = hex.EncodeToString(sum[:])
	}

	return &Service{
		db:              db,
		signingKey:      []byte(secret),
		accessTokenTTL:  time.Duration(cfg.ExtensionAccessTokenTTLSeconds) * time.Second,
		refreshTokenTTL: time.Duration(cfg.ExtensionRefreshTokenTTLSeconds) * time.Second,
		pairingCodeTTL:  time.Duration(cfg.ExtensionPairingCodeTTLSeconds) * time.Second,
	}
}

func (s *Service) CreatePairingCode(ctx context.Context, userID string) (*PairingCode, error) {
	code, err := security.RandomPairingCode()
	if err != nil {
		return nil, err
	}

	codeID, err := security.RandomID("pair")
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(s.pairingCodeTTL)
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

	if _, err := tx.ExecContext(
		ctx,
		`UPDATE extension_pairing_codes
		 SET used_at = NOW()
		 WHERE user_id = $1
		   AND used_at IS NULL
		   AND expires_at > NOW()`,
		userID,
	); err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(
		ctx,
		`INSERT INTO extension_pairing_codes (id, user_id, code_hash, expires_at)
		 VALUES ($1, $2, $3, $4)`,
		codeID,
		userID,
		hashPairingCode(code),
		expiresAt,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	committed = true

	return &PairingCode{
		Code:      code,
		ExpiresAt: expiresAt,
	}, nil
}

func (s *Service) ExchangePairingCode(
	ctx context.Context,
	code string,
	installationName string,
	browser string,
	extensionVersion *string,
) (*Session, error) {
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

	var pairing struct {
		ID        string       `db:"id"`
		UserID    string       `db:"user_id"`
		ExpiresAt time.Time    `db:"expires_at"`
		UsedAt    sql.NullTime `db:"used_at"`
	}

	if err := tx.GetContext(
		ctx,
		&pairing,
		`SELECT id, user_id, expires_at, used_at
		 FROM extension_pairing_codes
		 WHERE code_hash = $1
		 FOR UPDATE`,
		hashPairingCode(code),
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInvalidPairingCode
		}
		return nil, err
	}

	switch {
	case pairing.UsedAt.Valid:
		return nil, ErrUsedPairingCode
	case time.Now().After(pairing.ExpiresAt):
		return nil, ErrExpiredPairingCode
	}

	installationID, err := security.RandomID("install")
	if err != nil {
		return nil, err
	}

	installation := Installation{
		ID:               installationID,
		UserID:           pairing.UserID,
		Name:             defaultInstallationName(installationName, browser),
		Browser:          defaultBrowser(browser),
		ExtensionVersion: extensionVersion,
		CreatedAt:        time.Now(),
		LastSeenAt:       timePtr(time.Now()),
	}

	if _, err := tx.ExecContext(
		ctx,
		`INSERT INTO extension_installations (
			id, user_id, name, browser, extension_version, created_at, last_seen_at
		) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
		installation.ID,
		installation.UserID,
		installation.Name,
		installation.Browser,
		installation.ExtensionVersion,
	); err != nil {
		return nil, err
	}

	refreshToken, refreshExpiresAt, err := s.insertRefreshToken(ctx, tx, installation.ID)
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(
		ctx,
		`UPDATE extension_pairing_codes SET used_at = NOW() WHERE id = $1`,
		pairing.ID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	committed = true

	accessToken, accessExpiresAt, err := s.issueAccessToken(pairing.UserID, installation.ID)
	if err != nil {
		return nil, err
	}

	return &Session{
		Installation: installation,
		Tokens: SessionTokens{
			AccessToken:           accessToken,
			AccessTokenExpiresAt:  accessExpiresAt,
			RefreshToken:          refreshToken,
			RefreshTokenExpiresAt: refreshExpiresAt,
		},
	}, nil
}

func (s *Service) RefreshSession(ctx context.Context, refreshToken string) (*Session, error) {
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

	var record struct {
		TokenID               string         `db:"token_id"`
		InstallationID        string         `db:"installation_id"`
		ExpiresAt             time.Time      `db:"expires_at"`
		RevokedAt             sql.NullTime   `db:"revoked_at"`
		ReplacedByTokenID     sql.NullString `db:"replaced_by_token_id"`
		UserID                string         `db:"user_id"`
		Name                  string         `db:"name"`
		Browser               string         `db:"browser"`
		ExtensionVersion      *string        `db:"extension_version"`
		CreatedAt             time.Time      `db:"created_at"`
		LastSeenAt            *time.Time     `db:"last_seen_at"`
		InstallationRevokedAt sql.NullTime   `db:"installation_revoked_at"`
	}

	if err := tx.GetContext(
		ctx,
		&record,
		`SELECT
			rt.id AS token_id,
			rt.installation_id,
			rt.expires_at,
			rt.revoked_at,
			rt.replaced_by_token_id,
			i.user_id,
			i.name,
			i.browser,
			i.extension_version,
			i.created_at,
			i.last_seen_at,
			i.revoked_at AS installation_revoked_at
		FROM extension_refresh_tokens rt
		JOIN extension_installations i ON i.id = rt.installation_id
		WHERE rt.token_hash = $1
		FOR UPDATE`,
		security.HashToken(strings.TrimSpace(refreshToken)),
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInvalidRefresh
		}
		return nil, err
	}

	if record.InstallationRevokedAt.Valid {
		return nil, ErrRevokedSession
	}

	if record.ReplacedByTokenID.Valid || record.RevokedAt.Valid {
		if err := s.revokeInstallationTx(ctx, tx, record.InstallationID); err != nil {
			return nil, err
		}
		if err := tx.Commit(); err != nil {
			return nil, err
		}
		committed = true
		return nil, ErrRefreshReplay
	}

	if time.Now().After(record.ExpiresAt) {
		if _, err := tx.ExecContext(
			ctx,
			`UPDATE extension_refresh_tokens
			 SET revoked_at = NOW()
			 WHERE id = $1`,
			record.TokenID,
		); err != nil {
			return nil, err
		}
		if err := tx.Commit(); err != nil {
			return nil, err
		}
		committed = true
		return nil, ErrExpiredRefresh
	}

	newTokenID, err := security.RandomID("rtok")
	if err != nil {
		return nil, err
	}

	nextRefreshToken, err := security.RandomToken(32)
	if err != nil {
		return nil, err
	}
	refreshExpiresAt := time.Now().Add(s.refreshTokenTTL)

	if _, err := tx.ExecContext(
		ctx,
		`INSERT INTO extension_refresh_tokens (
			id, installation_id, token_hash, expires_at, created_at
		) VALUES ($1, $2, $3, $4, NOW())`,
		newTokenID,
		record.InstallationID,
		security.HashToken(nextRefreshToken),
		refreshExpiresAt,
	); err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(
		ctx,
		`UPDATE extension_refresh_tokens
		 SET revoked_at = NOW(),
		     last_used_at = NOW(),
		     replaced_by_token_id = $2
		 WHERE id = $1`,
		record.TokenID,
		newTokenID,
	); err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(
		ctx,
		`UPDATE extension_installations SET last_seen_at = NOW() WHERE id = $1`,
		record.InstallationID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	committed = true

	accessToken, accessExpiresAt, err := s.issueAccessToken(record.UserID, record.InstallationID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	return &Session{
		Installation: Installation{
			ID:               record.InstallationID,
			UserID:           record.UserID,
			Name:             record.Name,
			Browser:          record.Browser,
			ExtensionVersion: record.ExtensionVersion,
			CreatedAt:        record.CreatedAt,
			LastSeenAt:       &now,
		},
		Tokens: SessionTokens{
			AccessToken:           accessToken,
			AccessTokenExpiresAt:  accessExpiresAt,
			RefreshToken:          nextRefreshToken,
			RefreshTokenExpiresAt: refreshExpiresAt,
		},
	}, nil
}

func (s *Service) ListInstallations(ctx context.Context, userID string) ([]Installation, error) {
	var installations []Installation
	if err := s.db.Db.SelectContext(
		ctx,
		&installations,
		`SELECT id, user_id, name, browser, extension_version, created_at, last_seen_at, revoked_at
		 FROM extension_installations
		 WHERE user_id = $1
		 ORDER BY revoked_at NULLS FIRST, created_at DESC`,
		userID,
	); err != nil {
		return nil, err
	}

	if installations == nil {
		installations = []Installation{}
	}

	return installations, nil
}

func (s *Service) RevokeInstallation(ctx context.Context, userID string, installationID string) error {
	tx, err := s.db.Db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	result, err := tx.ExecContext(
		ctx,
		`UPDATE extension_installations
		 SET revoked_at = COALESCE(revoked_at, NOW())
		 WHERE id = $1 AND user_id = $2`,
		installationID,
		userID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	if _, err := tx.ExecContext(
		ctx,
		`UPDATE extension_refresh_tokens
		 SET revoked_at = COALESCE(revoked_at, NOW())
		 WHERE installation_id = $1`,
		installationID,
	); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return nil
}

func (s *Service) Logout(ctx context.Context, userID string, installationID string) error {
	return s.RevokeInstallation(ctx, userID, installationID)
}

func (s *Service) ParseAccessToken(token string) (*AccessClaims, error) {
	if strings.TrimSpace(token) == "" {
		return nil, ErrInvalidAccessToken
	}

	claims := &AccessClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(_ *jwt.Token) (interface{}, error) {
		return s.signingKey, nil
	})
	if err != nil || !parsed.Valid {
		return nil, ErrInvalidAccessToken
	}

	if !containsAudience(claims.Audience, "algomind-extension") || claims.Subject == "" || claims.InstallationID == "" {
		return nil, ErrInvalidAccessToken
	}

	return claims, nil
}

func (s *Service) TouchInstallation(ctx context.Context, installationID string) error {
	_, err := s.db.Db.ExecContext(
		ctx,
		`UPDATE extension_installations
		 SET last_seen_at = NOW()
		 WHERE id = $1 AND revoked_at IS NULL`,
		installationID,
	)
	return err
}

func (s *Service) IsInstallationActive(ctx context.Context, installationID string) (bool, error) {
	var installationIDValue string
	err := s.db.Db.GetContext(
		ctx,
		&installationIDValue,
		`SELECT id
		 FROM extension_installations
		 WHERE id = $1 AND revoked_at IS NULL`,
		installationID,
	)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	return false, err
}

func (s *Service) issueAccessToken(userID string, installationID string) (string, time.Time, error) {
	expiresAt := time.Now().Add(s.accessTokenTTL)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, AccessClaims{
		InstallationID: installationID,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "algomind-backend",
			Subject:   userID,
			Audience:  jwt.ClaimStrings{"algomind-extension"},
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now().Add(-5 * time.Second)),
		},
	})

	signed, err := token.SignedString(s.signingKey)
	if err != nil {
		return "", time.Time{}, err
	}

	return signed, expiresAt, nil
}

func (s *Service) insertRefreshToken(ctx context.Context, tx sqlExecutor, installationID string) (string, time.Time, error) {
	tokenID, err := security.RandomID("rtok")
	if err != nil {
		return "", time.Time{}, err
	}

	refreshToken, err := security.RandomToken(32)
	if err != nil {
		return "", time.Time{}, err
	}

	expiresAt := time.Now().Add(s.refreshTokenTTL)
	if _, err := tx.ExecContext(
		ctx,
		`INSERT INTO extension_refresh_tokens (
			id, installation_id, token_hash, expires_at, created_at
		) VALUES ($1, $2, $3, $4, NOW())`,
		tokenID,
		installationID,
		security.HashToken(refreshToken),
		expiresAt,
	); err != nil {
		return "", time.Time{}, err
	}

	return refreshToken, expiresAt, nil
}

func (s *Service) revokeInstallationTx(ctx context.Context, tx sqlExecutor, installationID string) error {
	if _, err := tx.ExecContext(
		ctx,
		`UPDATE extension_installations
		 SET revoked_at = COALESCE(revoked_at, NOW())
		 WHERE id = $1`,
		installationID,
	); err != nil {
		return err
	}

	if _, err := tx.ExecContext(
		ctx,
		`UPDATE extension_refresh_tokens
		 SET revoked_at = COALESCE(revoked_at, NOW())
		 WHERE installation_id = $1`,
		installationID,
	); err != nil {
		return err
	}

	return nil
}

type sqlExecutor interface {
	ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
}

func hashPairingCode(code string) string {
	canonical := strings.ToUpper(strings.TrimSpace(code))
	canonical = strings.ReplaceAll(canonical, "-", "")
	canonical = strings.ReplaceAll(canonical, " ", "")
	return security.HashToken(canonical)
}

func defaultInstallationName(name string, browser string) string {
	if trimmed := strings.TrimSpace(name); trimmed != "" {
		return trimmed
	}

	value := defaultBrowser(browser)
	return strings.ToUpper(value[:1]) + value[1:]
}

func defaultBrowser(browser string) string {
	if trimmed := strings.TrimSpace(strings.ToLower(browser)); trimmed != "" {
		return trimmed
	}
	return "chrome"
}

func timePtr(value time.Time) *time.Time {
	return &value
}

func containsAudience(audience []string, expected string) bool {
	for _, value := range audience {
		if value == expected {
			return true
		}
	}
	return false
}
