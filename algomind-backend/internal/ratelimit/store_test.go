package ratelimit

import (
	"testing"
	"time"

	"golang.org/x/time/rate"
)

func TestNewStore(t *testing.T) {
	s := NewStore(rate.Every(time.Second), 3)
	if s == nil {
		t.Fatal("expected non-nil store")
	}
	if s.limit != rate.Every(time.Second) {
		t.Fatal("limit mismatch")
	}
	if s.burst != 3 {
		t.Fatal("burst mismatch")
	}
	if s.limiters == nil {
		t.Fatal("expected limiters map to be initialized")
	}
}

func TestAllow(t *testing.T) {
	t.Run("allows requests within burst", func(t *testing.T) {
		s := NewStore(rate.Every(time.Hour), 2)
		if !s.Allow("ip1") {
			t.Fatal("expected first request to be allowed")
		}
		if !s.Allow("ip1") {
			t.Fatal("expected second request to be allowed")
		}
	})

	t.Run("blocks requests exceeding burst", func(t *testing.T) {
		s := NewStore(rate.Every(time.Hour), 1)
		if !s.Allow("ip2") {
			t.Fatal("expected first request to be allowed")
		}
		if s.Allow("ip2") {
			t.Fatal("expected second request to be blocked")
		}
	})

	t.Run("tracks different keys independently", func(t *testing.T) {
		s := NewStore(rate.Every(time.Hour), 1)
		if !s.Allow("keyA") {
			t.Fatal("expected keyA first request to be allowed")
		}
		if !s.Allow("keyB") {
			t.Fatal("expected keyB first request to be allowed")
		}
	})

	t.Run("reuses existing limiter for same key", func(t *testing.T) {
		s := NewStore(rate.Every(time.Hour), 2)
		s.Allow("keyC")
		s.Allow("keyC")
		// should still be blocked because burst is 2 and we used both
		if s.Allow("keyC") {
			t.Fatal("expected third request to be blocked")
		}
	})
}
