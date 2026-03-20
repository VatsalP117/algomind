package observability

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog"
	zlog "github.com/rs/zerolog/log"
)

func RequestID(c echo.Context) string {
	if c == nil {
		return ""
	}

	if value := c.Response().Header().Get(echo.HeaderXRequestID); value != "" {
		return value
	}

	return c.Request().Header.Get(echo.HeaderXRequestID)
}

func LoggerFromContext(c echo.Context) zerolog.Logger {
	builder := zlog.With()

	if c == nil {
		return builder.Logger()
	}

	builder = builder.
		Str("request_id", RequestID(c)).
		Str("method", c.Request().Method).
		Str("uri", c.Request().URL.RequestURI()).
		Str("route", routePath(c))

	if userID, ok := c.Get("user_id").(string); ok && userID != "" {
		builder = builder.Str("user_id", userID)
	}

	return builder.Logger()
}

func HTTPError(status int, message interface{}, internal error) *echo.HTTPError {
	httpErr := echo.NewHTTPError(status, message)
	if internal != nil {
		httpErr.SetInternal(internal)
	}
	return httpErr
}

func LevelForStatus(status int) zerolog.Level {
	switch {
	case status >= http.StatusInternalServerError:
		return zerolog.ErrorLevel
	case status >= http.StatusBadRequest:
		return zerolog.WarnLevel
	default:
		return zerolog.InfoLevel
	}
}

func routePath(c echo.Context) string {
	if route := c.Path(); route != "" {
		return route
	}

	if c.Request() != nil && c.Request().URL != nil {
		return c.Request().URL.Path
	}

	return ""
}
