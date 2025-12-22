package models

import "time"

type Concept struct {
	ID          int64     `db:"id"`
	Title       string    `db:"title"`
	Description string    `db:"description"`
	Content     string    `db:"content"`
	CreatedAt   time.Time `db:"created_at"`
}
