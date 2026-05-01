package server

import (
	"net/http"
	"strings"

	"github.com/VatsalP117/algomind/algomind-backend/internal/config"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type Server struct {
	Echo   *echo.Echo
	Config *config.Config
}

func NewServer(cfg *config.Config) *Server {

	clerk.SetKey(cfg.ClerkSecretKey)
	e := echo.New()

	e.HideBanner = true
	e.HidePort = true

	e.HTTPErrorHandler = httpErrorHandler

	e.Use(middleware.RequestID())

	e.Use(middleware.RecoverWithConfig(middleware.RecoverConfig{
		DisablePrintStack: true,
		LogErrorFunc: func(c echo.Context, err error, stack []byte) error {
			log.Error().
				Str("component", "panic_recover").
				Str("request_id", c.Response().Header().Get(echo.HeaderXRequestID)).
				Str("method", c.Request().Method).
				Str("uri", c.Request().URL.RequestURI()).
				Str("route", c.Path()).
				Bytes("stack", stack).
				Err(err).
				Msg("Recovered panic")
			return echo.NewHTTPError(http.StatusInternalServerError, "internal server error").SetInternal(err)
		},
	}))

	e.Use(middleware.Gzip())

	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		HandleError:      true,
		LogLatency:       true,
		LogRemoteIP:      true,
		LogHost:          true,
		LogMethod:        true,
		LogURI:           true,
		LogRoutePath:     true,
		LogRequestID:     true,
		LogUserAgent:     true,
		LogStatus:        true,
		LogError:         true,
		LogContentLength: true,
		LogResponseSize:  true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			logger := log.With().
				Str("component", "http_request").
				Str("request_id", v.RequestID).
				Str("method", v.Method).
				Str("uri", v.URI).
				Str("route", v.RoutePath).
				Str("remote_ip", v.RemoteIP).
				Str("host", v.Host).
				Str("user_agent", v.UserAgent).
				Str("bytes_in", v.ContentLength).
				Int64("bytes_out", v.ResponseSize).
				Int("status_code", v.Status).
				Int64("duration_ms", v.Latency.Milliseconds()).
				Logger()

			if userID, ok := c.Get("user_id").(string); ok && userID != "" {
				logger = logger.With().Str("user_id", userID).Logger()
			}

			event := logger.WithLevel(levelForRequest(v.Status, v.Error))
			if v.Error != nil {
				event = event.Err(v.Error)
			}
			event.Msg("Handled HTTP request")

			return nil
		},
	}))

	allowedOrigins := map[string]struct{}{
		"http://localhost:3000": {},
		"https://algomind.pro":  {},
	}
	e.Use(middleware.CORSWithConfig(
		middleware.CORSConfig{
			AllowOriginFunc: func(origin string) (bool, error) {
				if _, ok := allowedOrigins[origin]; ok {
					return true, nil
				}
				return strings.HasPrefix(origin, "chrome-extension://"), nil
			},
			AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		}))

	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "OK"})
	})

	e.Validator = NewValidator()

	return &Server{
		Echo:   e,
		Config: cfg,
	}
}

func levelForRequest(status int, err error) zerolog.Level {
	switch {
	case err != nil || status >= http.StatusInternalServerError:
		return zerolog.ErrorLevel
	case status >= http.StatusBadRequest:
		return zerolog.WarnLevel
	default:
		return zerolog.InfoLevel
	}
}

func (s *Server) Start() error {
	log.Info().Msgf("Starting server on port %s", s.Config.Port)
	return s.Echo.Start(":" + s.Config.Port)
}
