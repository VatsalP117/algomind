package main

import (
	"log"

	"github.com/VatsalP117/algomind-backend/internal/config"
	"github.com/VatsalP117/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind-backend/internal/server"
)

func main() {
	cfg := config.Load()
	db := mustInitDb(cfg.DatabaseURL)
	defer db.Close()

	srv := server.NewServer(cfg)
	server.RegisterRoutes(srv.Echo, db)
	if err := srv.Start(); err != nil {
		log.Fatal("Server failed to start:", err)
	}
	
}

func mustInitDb(dsn string) *database.Service{
	db, err := database.New(dsn)
	if err != nil {
		log.Fatal("Could not connect to database:", err)
	}
	log.Println("Connected to database")
	return db
}