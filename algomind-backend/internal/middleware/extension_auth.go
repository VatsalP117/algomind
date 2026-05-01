package middleware

import (
	"net/http"
	"strings"

	"github.com/VatsalP117/algomind/algomind-backend/internal/extensions"
	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/labstack/echo/v4"
)

type ExtensionAuthMiddleware struct {
	service *extensions.Service
}

func NewExtensionAuth(service *extensions.Service) *ExtensionAuthMiddleware {
	return &ExtensionAuthMiddleware{service: service}
}

func (am *ExtensionAuthMiddleware) RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger := observability.LoggerFromContext(c).With().
			Str("component", "extension_auth_middleware").
			Logger()

		authHeader := c.Request().Header.Get("Authorization")
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if strings.TrimSpace(token) == "" {
			logger.Warn().Msg("Missing Authorization header")
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Missing Authorization header"})
		}

		claims, err := am.service.ParseAccessToken(token)
		if err != nil {
			logger.Warn().Err(err).Msg("Invalid extension access token")
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid extension session"})
		}

		active, err := am.service.IsInstallationActive(c.Request().Context(), claims.InstallationID)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to verify installation state")
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to verify extension session"})
		}
		if !active {
			logger.Warn().Str("installation_id", claims.InstallationID).Msg("Revoked extension installation")
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Extension session has been revoked"})
		}

		if err := am.service.TouchInstallation(c.Request().Context(), claims.InstallationID); err != nil {
			logger.Error().Err(err).Str("installation_id", claims.InstallationID).Msg("Failed to update installation heartbeat")
			return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to verify extension session"})
		}

		c.Set("user_id", claims.Subject)
		c.Set("extension_installation_id", claims.InstallationID)
		return next(c)
	}
}
