package handlers

import (
	"log"
	"net/http"

	"github.com/VatsalP117/algomind/algomind-backend/internal/database"
	"github.com/VatsalP117/algomind/algomind-backend/internal/models"
	"github.com/labstack/echo/v4"
)

type ConceptFolderHandler struct {
	DB *database.Service
}

func NewConceptFolderHandler(db *database.Service) *ConceptFolderHandler {
	return &ConceptFolderHandler{DB: db}
}

type ConceptFolderRequest struct {
	Name           string `json:"name" validate:"required"`
	ParentFolderID *int64 `json:"parent_folder_id"`
}

type AssignConceptFolderRequest struct {
	ConceptID int64 `json:"concept_id" validate:"required"`
	FolderID  int64 `json:"folder_id" validate:"required"`
}

func (h *ConceptFolderHandler) ListFolders(c echo.Context) error {
	userID := c.Get("user_id").(string)

	var folders []models.ConceptFolder
	var items []models.ConceptFolderItem

	err := h.DB.Db.SelectContext(c.Request().Context(), &folders, "SELECT * FROM concept_folders WHERE user_id = $1 ORDER BY sort_order ASC, name ASC", userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch folders")
	}

	err = h.DB.Db.SelectContext(c.Request().Context(), &items, "SELECT * FROM concept_folder_items WHERE user_id = $1 ORDER BY sort_order ASC", userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch folder items")
	}

	if folders == nil {
		folders = []models.ConceptFolder{}
	}
	if items == nil {
		items = []models.ConceptFolderItem{}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"folders": folders,
		"items":   items,
	})
}

func (h *ConceptFolderHandler) CreateFolder(c echo.Context) error {
	var req ConceptFolderRequest
	userID := c.Get("user_id").(string)

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	query := `
		INSERT INTO concept_folders (user_id, name, parent_folder_id)
		VALUES ($1, $2, $3)
		RETURNING *
	`

	var folder models.ConceptFolder
	if err := h.DB.Db.GetContext(c.Request().Context(), &folder, query, userID, req.Name, req.ParentFolderID); err != nil {
		log.Printf("Error creating folder: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create folder")
	}

	return c.JSON(http.StatusCreated, folder)
}

func (h *ConceptFolderHandler) UpdateFolder(c echo.Context) error {
	var req ConceptFolderRequest
	userID := c.Get("user_id").(string)
	folderID := c.Param("id")

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	query := `
		UPDATE concept_folders
		SET name = $1, parent_folder_id = $2
		WHERE id = $3 AND user_id = $4
		RETURNING *
	`

	var folder models.ConceptFolder
	if err := h.DB.Db.GetContext(c.Request().Context(), &folder, query, req.Name, req.ParentFolderID, folderID, userID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update folder")
	}

	return c.JSON(http.StatusOK, folder)
}

func (h *ConceptFolderHandler) DeleteFolder(c echo.Context) error {
	userID := c.Get("user_id").(string)
	folderID := c.Param("id")

	query := `DELETE FROM concept_folders WHERE id = $1 AND user_id = $2`
	res, err := h.DB.Db.ExecContext(c.Request().Context(), query, folderID, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete folder")
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "folder not found")
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "folder deleted"})
}

func (h *ConceptFolderHandler) AssignToFolder(c echo.Context) error {
	var req AssignConceptFolderRequest
	userID := c.Get("user_id").(string)

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	query := `
		INSERT INTO concept_folder_items (user_id, folder_id, concept_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, concept_id)
		DO UPDATE SET folder_id = EXCLUDED.folder_id
	`
	if _, err := h.DB.Db.ExecContext(c.Request().Context(), query, userID, req.FolderID, req.ConceptID); err != nil {
		log.Printf("Error assigning concept to folder: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to assign concept to folder")
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "concept assigned to folder"})
}

func (h *ConceptFolderHandler) RemoveFromFolder(c echo.Context) error {
	userID := c.Get("user_id").(string)
	conceptID := c.Param("concept_id")

	query := `DELETE FROM concept_folder_items WHERE concept_id = $1 AND user_id = $2`
	if _, err := h.DB.Db.ExecContext(c.Request().Context(), query, conceptID, userID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to remove concept from folder")
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "concept removed from folder"})
}
