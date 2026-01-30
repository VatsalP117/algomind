package models

import "time"

type Concept struct {
    ID          int64     `db:"id" json:"id"`
    Title       string    `db:"title" json:"title"`
    Description *string   `db:"description" json:"description"`
    Content     string    `db:"content" json:"content"`
    CreatedAt   time.Time `db:"created_at" json:"created_at"`
}