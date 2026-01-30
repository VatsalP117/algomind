package database

import (
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
)

type Service struct {
	Db *sqlx.DB
}

func New(connectionString string) (*Service, error) {
	db, err := sqlx.Connect("pgx", connectionString)
	if err != nil {
		return nil, err
	}

	return &Service{
		Db: db,
	}, nil
}

func (s *Service) Close() error {
	return s.Db.Close()
}
