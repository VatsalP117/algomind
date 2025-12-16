package database

import (
	"context"
	"database/sql"
	"time"

	// Register the pgx driver
	_ "github.com/jackc/pgx/v5/stdlib"
)

// Service holds our database connection pool
type Service struct {
	Db *sql.DB
}

// New initializes the database connection
func New(connectionString string) (*Service, error) {
	db, err := sql.Open("pgx", connectionString)
	if err != nil {
		return nil, err
	}

	// Verify the connection actually works (Ping)
	// We give it a 5-second timeout so we don't hang forever if DB is down
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, err
	}

	return &Service{
		Db: db,
	}, nil
}

// Close gracefully shuts down the database connection
func (s *Service) Close() error {
	return s.Db.Close()
}