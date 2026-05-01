package ratelimit

import (
	"sync"

	"golang.org/x/time/rate"
)

type Store struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	limit    rate.Limit
	burst    int
}

func NewStore(limit rate.Limit, burst int) *Store {
	return &Store{
		limiters: make(map[string]*rate.Limiter),
		limit:    limit,
		burst:    burst,
	}
}

func (s *Store) Allow(key string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	limiter, ok := s.limiters[key]
	if !ok {
		limiter = rate.NewLimiter(s.limit, s.burst)
		s.limiters[key] = limiter
	}

	return limiter.Allow()
}
