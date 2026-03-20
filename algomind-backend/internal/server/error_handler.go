package server

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/labstack/echo/v4"
)

func httpErrorHandler(err error, c echo.Context) {
	if c.Response().Committed {
		return
	}

	status := http.StatusInternalServerError
	message := http.StatusText(http.StatusInternalServerError)
	internal := err

	var httpErr *echo.HTTPError
	if errors.As(err, &httpErr) {
		status = httpErr.Code
		message = httpErrorMessage(httpErr.Message)
		if httpErr.Internal != nil {
			internal = httpErr.Internal
		}
	}

	logger := observability.LoggerFromContext(c).With().
		Str("component", "http_error_handler").
		Int("status_code", status).
		Logger()

	event := logger.WithLevel(observability.LevelForStatus(status))
	if internal != nil {
		event = event.Err(internal)
	}
	if httpErr != nil && httpErr.Internal != nil {
		event = event.Str("public_error", message)
	}
	event.Msg("Request failed")

	_ = c.JSON(status, map[string]interface{}{
		"message":    message,
		"request_id": observability.RequestID(c),
	})
}

func httpErrorMessage(message interface{}) string {
	switch value := message.(type) {
	case nil:
		return http.StatusText(http.StatusInternalServerError)
	case string:
		return value
	case error:
		return value.Error()
	default:
		return fmt.Sprint(value)
	}
}
