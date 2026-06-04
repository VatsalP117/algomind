package observability

import (
	"errors"
	"net/http"
	"testing"

	"github.com/rs/zerolog"
)

func TestLevelForStatus(t *testing.T) {
	tests := []struct {
		status int
		want   zerolog.Level
	}{
		{http.StatusOK, zerolog.InfoLevel},
		{http.StatusCreated, zerolog.InfoLevel},
		{http.StatusMovedPermanently, zerolog.InfoLevel},
		{http.StatusBadRequest, zerolog.WarnLevel},
		{http.StatusUnauthorized, zerolog.WarnLevel},
		{http.StatusNotFound, zerolog.WarnLevel},
		{http.StatusInternalServerError, zerolog.ErrorLevel},
		{http.StatusBadGateway, zerolog.ErrorLevel},
		{http.StatusServiceUnavailable, zerolog.ErrorLevel},
	}

	for _, tt := range tests {
		t.Run(http.StatusText(tt.status), func(t *testing.T) {
			got := LevelForStatus(tt.status)
			if got != tt.want {
				t.Fatalf("LevelForStatus(%d) = %v, want %v", tt.status, got, tt.want)
			}
		})
	}
}

func TestHTTPError(t *testing.T) {
	t.Run("without internal error", func(t *testing.T) {
		err := HTTPError(http.StatusBadRequest, "bad request", nil)
		if err.Code != http.StatusBadRequest {
			t.Fatalf("expected code %d, got %d", http.StatusBadRequest, err.Code)
		}
		if err.Message != "bad request" {
			t.Fatalf("expected message %q, got %v", "bad request", err.Message)
		}
		if err.Internal != nil {
			t.Fatal("expected no internal error")
		}
	})

	t.Run("with internal error", func(t *testing.T) {
		internalErr := errors.New("something went wrong")
		err := HTTPError(http.StatusInternalServerError, "server error", internalErr)
		if err.Code != http.StatusInternalServerError {
			t.Fatalf("expected code %d, got %d", http.StatusInternalServerError, err.Code)
		}
		if !errors.Is(err.Internal, internalErr) {
			t.Fatalf("expected internal error %v, got %v", internalErr, err.Internal)
		}
	})
}
