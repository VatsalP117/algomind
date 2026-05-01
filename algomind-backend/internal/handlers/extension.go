package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/extensions"
	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/VatsalP117/algomind/algomind-backend/internal/ratelimit"
	"github.com/labstack/echo/v4"
	"golang.org/x/time/rate"
)

type ExtensionHandler struct {
	service            *extensions.Service
	pairingCodeLimiter *ratelimit.Store
	pairLimiter        *ratelimit.Store
	refreshLimiter     *ratelimit.Store
}

type pairExtensionRequest struct {
	Code             string  `json:"code" validate:"required"`
	InstallationName string  `json:"installation_name"`
	Browser          string  `json:"browser"`
	ExtensionVersion *string `json:"extension_version"`
}

type refreshExtensionRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

func NewExtensionHandler(service *extensions.Service) *ExtensionHandler {
	return &ExtensionHandler{
		service:            service,
		pairingCodeLimiter: ratelimit.NewStore(rate.Every(time.Minute/3), 1),
		pairLimiter:        ratelimit.NewStore(rate.Every(time.Minute/10), 3),
		refreshLimiter:     ratelimit.NewStore(rate.Every(time.Minute/30), 5),
	}
}

func (h *ExtensionHandler) CreatePairingCode(c echo.Context) error {
	userID := c.Get("user_id").(string)
	logger := observability.LoggerFromContext(c).With().Str("handler", "extension_create_pairing_code").Logger()

	if !h.pairingCodeLimiter.Allow("pairing-code:" + userID) {
		return echo.NewHTTPError(http.StatusTooManyRequests, "Too many pairing code requests. Please wait a moment.")
	}

	pairingCode, err := h.service.CreatePairingCode(c.Request().Context(), userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to create pairing code")
		return observability.HTTPError(http.StatusInternalServerError, "failed to create pairing code", err)
	}

	return c.JSON(http.StatusCreated, pairingCode)
}

func (h *ExtensionHandler) Pair(c echo.Context) error {
	logger := observability.LoggerFromContext(c).With().Str("handler", "extension_pair").Logger()

	if !h.pairLimiter.Allow("pair:" + c.RealIP()) {
		return echo.NewHTTPError(http.StatusTooManyRequests, "Too many pairing attempts. Please wait a moment.")
	}

	var req pairExtensionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	session, err := h.service.ExchangePairingCode(
		c.Request().Context(),
		req.Code,
		req.InstallationName,
		req.Browser,
		req.ExtensionVersion,
	)
	if err != nil {
		switch {
		case errors.Is(err, extensions.ErrInvalidPairingCode):
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid pairing code")
		case errors.Is(err, extensions.ErrExpiredPairingCode):
			return echo.NewHTTPError(http.StatusBadRequest, "Pairing code expired")
		case errors.Is(err, extensions.ErrUsedPairingCode):
			return echo.NewHTTPError(http.StatusBadRequest, "Pairing code already used")
		default:
			logger.Error().Err(err).Msg("Failed to exchange pairing code")
			return observability.HTTPError(http.StatusInternalServerError, "failed to pair extension", err)
		}
	}

	return c.JSON(http.StatusOK, session)
}

func (h *ExtensionHandler) Refresh(c echo.Context) error {
	logger := observability.LoggerFromContext(c).With().Str("handler", "extension_refresh").Logger()

	if !h.refreshLimiter.Allow("refresh:" + c.RealIP()) {
		return echo.NewHTTPError(http.StatusTooManyRequests, "Too many refresh attempts. Please wait a moment.")
	}

	var req refreshExtensionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	session, err := h.service.RefreshSession(c.Request().Context(), req.RefreshToken)
	if err != nil {
		switch {
		case errors.Is(err, extensions.ErrInvalidRefresh),
			errors.Is(err, extensions.ErrExpiredRefresh),
			errors.Is(err, extensions.ErrRevokedSession),
			errors.Is(err, extensions.ErrRefreshReplay):
			return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
		default:
			logger.Error().Err(err).Msg("Failed to refresh extension session")
			return observability.HTTPError(http.StatusInternalServerError, "failed to refresh extension session", err)
		}
	}

	return c.JSON(http.StatusOK, session)
}

func (h *ExtensionHandler) Logout(c echo.Context) error {
	userID := c.Get("user_id").(string)
	installationID := c.Get("extension_installation_id").(string)
	logger := observability.LoggerFromContext(c).With().Str("handler", "extension_logout").Logger()

	if err := h.service.Logout(c.Request().Context(), userID, installationID); err != nil {
		logger.Error().Err(err).Str("installation_id", installationID).Msg("Failed to revoke extension session")
		return observability.HTTPError(http.StatusInternalServerError, "failed to revoke extension session", err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *ExtensionHandler) ListInstallations(c echo.Context) error {
	userID := c.Get("user_id").(string)
	logger := observability.LoggerFromContext(c).With().Str("handler", "extension_list_installations").Logger()

	installations, err := h.service.ListInstallations(c.Request().Context(), userID)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to list extension installations")
		return observability.HTTPError(http.StatusInternalServerError, "failed to list extension installations", err)
	}

	return c.JSON(http.StatusOK, installations)
}

func (h *ExtensionHandler) RevokeInstallation(c echo.Context) error {
	userID := c.Get("user_id").(string)
	installationID := c.Param("installation_id")
	logger := observability.LoggerFromContext(c).With().
		Str("handler", "extension_revoke_installation").
		Str("installation_id", installationID).
		Logger()

	if installationID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "installation ID is required")
	}

	if err := h.service.RevokeInstallation(c.Request().Context(), userID, installationID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "extension installation not found")
		}

		logger.Error().Err(err).Msg("Failed to revoke extension installation")
		return observability.HTTPError(http.StatusInternalServerError, "failed to revoke extension installation", err)
	}

	return c.NoContent(http.StatusNoContent)
}
