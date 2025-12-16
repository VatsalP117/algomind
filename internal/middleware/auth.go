package middleware

import (
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2/jwt" // <--- The new package for verification
	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
)

type AuthMiddleware struct {
	// No client needed here anymore!
}

func New() *AuthMiddleware {
	return &AuthMiddleware{}
}

func (am *AuthMiddleware) RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// 1. Get the token
		authHeader := c.Request().Header.Get("Authorization")
		token := strings.TrimPrefix(authHeader, "Bearer ")

		if token == "" {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Missing Authorization header"})
		}

		// 2. Verify the token using the 'jwt' package
		// We pass the Request Context because that's where the request lifecycle lives
		claims, err := jwt.Verify(c.Request().Context(), &jwt.VerifyParams{
			Token: token,
		})
		
		if err != nil {
			log.Warn().Err(err).Msg("Invalid token received")
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid Session"})
		}

		// 3. Success! claims.Subject is the User ID
		c.Set("user_id", claims.Subject)

		return next(c)
	}
}