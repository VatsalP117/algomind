package server

import (
	"net/http"

	"github.com/VatsalP117/algomind/algomind-backend/internal/config"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
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

	e.Use(middleware.Recover())

	e.Use(middleware.Logger())

	e.Use(middleware.CORSWithConfig(
		middleware.CORSConfig{
			AllowOrigins: []string{
				"http://localhost:3000",
				"https://algomind.pro",
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

func (s *Server) Start() error {
	log.Info().Msgf("Starting server on port %s", s.Config.Port)
	return s.Echo.Start(":" + s.Config.Port)
}
