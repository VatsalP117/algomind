package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/config"
	zlog "github.com/rs/zerolog/log"
)

type Client struct {
	baseURL    string
	apiKey     string
	model      string
	httpClient *http.Client
}

type HintRequest struct {
	Title          string
	Difficulty     string
	Summary        string
	Description    string
	Answer         string
	AnswerLanguage string
	ConceptTitle   string
}

type RequestMetadata struct {
	JobID     string
	UserID    string
	ProblemID int64
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatCompletionRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatCompletionResponse struct {
	Choices []struct {
		Message chatMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func NewClient(cfg *config.Config) *Client {
	return &Client{
		baseURL: strings.TrimRight(cfg.LLMBaseURL, "/"),
		apiKey:  strings.TrimSpace(cfg.LLMAPIKey),
		model:   strings.TrimSpace(cfg.LLMModel),
		httpClient: &http.Client{
			Timeout: time.Duration(cfg.LLMTimeoutSecs) * time.Second,
		},
	}
}

func (c *Client) Enabled() bool {
	return c != nil && c.baseURL != "" && c.model != ""
}

func (c *Client) GenerateHints(ctx context.Context, meta RequestMetadata, req HintRequest) (string, error) {
	if !c.Enabled() {
		return "", fmt.Errorf("llm client is not configured")
	}

	endpoint := c.baseURL + "/v1/chat/completions"
	logger := zlog.With().
		Str("component", "llm_hint_generation").
		Str("job_id", meta.JobID).
		Str("user_id", meta.UserID).
		Int64("problem_id", meta.ProblemID).
		Str("model", c.model).
		Str("endpoint", endpoint).
		Logger()
	requestStartedAt := time.Now()

	payload := chatCompletionRequest{
		Model: c.model,
		Messages: []chatMessage{
			{
				Role: "system",
				Content: "You create coding interview hints for spaced repetition. Return exactly three concise hints. " +
					"Each hint must be on its own line starting with 'Hint 1:', 'Hint 2:', or 'Hint 3:'. " +
					"Start broad and get slightly more specific each time. Do not reveal full code or the full solution.",
			},
			{
				Role:    "user",
				Content: buildHintPrompt(req),
			},
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal llm request: %w", err)
	}

	logger.Info().
		Int("prompt_chars", len(payload.Messages[1].Content)).
		Msg("Sending LLM hint generation request")

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("create llm request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		logger.Error().
			Err(err).
			Int64("duration_ms", time.Since(requestStartedAt).Milliseconds()).
			Msg("LLM hint generation request failed before response")
		return "", fmt.Errorf("send llm request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 32*1024))
	if err != nil {
		logger.Error().
			Err(err).
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(requestStartedAt).Milliseconds()).
			Msg("Failed reading LLM hint generation response body")
		return "", fmt.Errorf("read llm response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		logger.Error().
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(requestStartedAt).Milliseconds()).
			Str("response_preview", truncateForLog(string(body), 240)).
			Msg("LLM hint generation request returned non-success status")
		return "", fmt.Errorf("llm request failed with status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var completion chatCompletionResponse
	if err := json.Unmarshal(body, &completion); err != nil {
		logger.Error().
			Err(err).
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(requestStartedAt).Milliseconds()).
			Str("response_preview", truncateForLog(string(body), 240)).
			Msg("Failed decoding LLM hint generation response")
		return "", fmt.Errorf("decode llm response: %w", err)
	}

	if completion.Error != nil && completion.Error.Message != "" {
		logger.Error().
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(requestStartedAt).Milliseconds()).
			Str("provider_error", completion.Error.Message).
			Msg("LLM provider returned an application error")
		return "", fmt.Errorf("llm error: %s", completion.Error.Message)
	}

	if len(completion.Choices) == 0 {
		logger.Error().
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(requestStartedAt).Milliseconds()).
			Msg("LLM response did not include any choices")
		return "", fmt.Errorf("llm response did not include any choices")
	}

	content := normalizeHints(completion.Choices[0].Message.Content)
	if content == "" {
		logger.Error().
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(requestStartedAt).Milliseconds()).
			Msg("LLM response returned empty hint content")
		return "", fmt.Errorf("llm returned empty hints")
	}

	logger.Info().
		Int("status_code", resp.StatusCode).
		Int64("duration_ms", time.Since(requestStartedAt).Milliseconds()).
		Int("response_bytes", len(body)).
		Int("output_chars", len(content)).
		Msg("LLM hint generation request completed")

	return content, nil
}

func buildHintPrompt(req HintRequest) string {
	var builder strings.Builder

	builder.WriteString("Generate three short progressive hints for this coding problem.\n\n")
	builder.WriteString("Problem title: " + req.Title + "\n")
	builder.WriteString("Difficulty: " + req.Difficulty + "\n")

	if req.ConceptTitle != "" {
		builder.WriteString("Concept: " + req.ConceptTitle + "\n")
	}
	if req.Summary != "" {
		builder.WriteString("Summary: " + req.Summary + "\n")
	}
	if req.Description != "" {
		builder.WriteString("Description:\n" + req.Description + "\n")
	}
	if req.AnswerLanguage != "" {
		builder.WriteString("Answer language: " + req.AnswerLanguage + "\n")
	}
	if req.Answer != "" {
		builder.WriteString("User answer / solution notes:\n" + req.Answer + "\n")
	}

	builder.WriteString("\nConstraints:\n")
	builder.WriteString("- The hints should help the user recall the approach without giving away the full answer.\n")
	builder.WriteString("- Mention a key data structure, invariant, or traversal idea if useful.\n")
	builder.WriteString("- Keep the full output under 120 words.\n")

	return builder.String()
}

func normalizeHints(raw string) string {
	content := strings.TrimSpace(raw)
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	return strings.TrimSpace(content)
}

func truncateForLog(value string, max int) string {
	trimmed := strings.TrimSpace(value)
	if len(trimmed) <= max {
		return trimmed
	}
	return trimmed[:max] + "..."
}
