package models

import "time"

type ConceptFolder struct {
	ID             int64     `db:"id" json:"id"`
	UserID         string    `db:"user_id" json:"user_id"`
	Name           string    `db:"name" json:"name"`
	ParentFolderID *int64    `db:"parent_folder_id" json:"parent_folder_id"`
	SortOrder      int       `db:"sort_order" json:"sort_order"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
}

type ConceptFolderItem struct {
	ID        int64  `db:"id" json:"id"`
	UserID    string `db:"user_id" json:"user_id"`
	FolderID  int64  `db:"folder_id" json:"folder_id"`
	ConceptID int64  `db:"concept_id" json:"concept_id"`
	SortOrder int    `db:"sort_order" json:"sort_order"`
}
