package server

import (
	"net/http"

	"github.com/VatsalP117/algomind-backend/internal/config"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog/log"
)

type Server struct {
	Echo *echo.Echo
	Config *config.Config
}

func NewServer(cfg *config.Config) *Server {

	clerk.SetKey(cfg.ClerkSecretKey)
	e := echo.New()

	e.HideBanner = true
	e.HidePort = true

	
	// Recover: If your app crashes (panics), this catches it and keeps the server running
	e.Use(middleware.Recover())

	// Logger: Logs every request
	e.Use(middleware.Logger())

	// CORS: Allows requests from any origin (useful for development)
	e.Use(middleware.CORSWithConfig(
		middleware.CORSConfig{
			AllowOrigins: []string{"http://localhost:3000"},
			AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// 3. Define a simple health check route so we can test our server
	e.GET("/health",func(c echo.Context) error {
		return c.JSON(http.StatusOK,map[string]string{"status":"OK"})
	})


	e.Validator = NewValidator()

	return &Server{
		Echo: e,
		Config: cfg,
	}
}

func (s *Server) Start() error{
	log.Info().Msgf("Starting server on port %s", s.Config.Port)
	return s.Echo.Start(":" + s.Config.Port)
}