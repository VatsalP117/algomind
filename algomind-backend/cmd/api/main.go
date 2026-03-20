package main

import (
	"github.com/VatsalP117/algomind/algomind-backend/internal/config"
	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/server"
	"github.com/rs/zerolog/log"
)

func main() {
	cfg := config.Load()
	db := mustInitDb(cfg.DatabaseURL)
	defer db.Close()

	srv := server.NewServer(cfg)
	server.RegisterRoutes(srv.Echo, db, cfg)
	if err := srv.Start(); err != nil {
		log.Fatal().Err(err).Msg("Server failed to start")
	}

}

func mustInitDb(dsn string) *database.Service {
	db, err := database.New(dsn)
	if err != nil {
		log.Fatal().Err(err).Msg("Could not connect to database")
	}
	log.Info().Msg("Connected to database")
	return db
}
