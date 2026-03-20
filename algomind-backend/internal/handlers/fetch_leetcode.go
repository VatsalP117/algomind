package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/graphql"
	"github.com/VatsalP117/algomind/algomind-backend/internal/observability"
	"github.com/labstack/echo/v4"
)

type LeetCodeHandler struct{}

func NewLeetCodeHandler() *LeetCodeHandler {
	return &LeetCodeHandler{}
}

type TopicTag struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type LeetCodeProblem struct {
	Title      string     `json:"questionTitle"`
	Difficulty string     `json:"difficulty"`
	Content    string     `json:"question"`
	TopicTags  []TopicTag `json:"topicTags"`
}

type FetchLeetCodeResponse struct {
	Title       string   `json:"title"`
	Difficulty  string   `json:"difficulty"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

type graphQLFetchProblemRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

type graphQLFetchProblemResponse struct {
	Data struct {
		Question struct {
			Title      string     `json:"title"`
			Difficulty string     `json:"difficulty"`
			Content    string     `json:"content"`
			TopicTags  []TopicTag `json:"topicTags"`
		} `json:"question"`
	} `json:"data"`
}

func extractTitleSlug(leetcodeURL string) (string, error) {
	parsedURL, err := url.Parse(leetcodeURL)
	if err != nil {
		return "", fmt.Errorf("invalid URL format")
	}

	if !strings.Contains(parsedURL.Host, "leetcode.com") {
		return "", fmt.Errorf("not a LeetCode URL")
	}
	re := regexp.MustCompile(`/problems/([a-z0-9-]+)/?`)
	matches := re.FindStringSubmatch(parsedURL.Path)
	if len(matches) < 2 {
		return "", fmt.Errorf("could not extract problem slug from URL")
	}

	return matches[1], nil
}

func (h *LeetCodeHandler) FetchProblem(c echo.Context) error {
	leetcodeURL := c.QueryParam("url")
	logger := observability.LoggerFromContext(c).With().Str("handler", "leetcode_fetch").Logger()
	if leetcodeURL == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "url parameter is required")
	}

	titleSlug, err := extractTitleSlug(leetcodeURL)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	apiURL := fmt.Sprintf("https://alfa-leetcode-api.onrender.com/select?titleSlug=%s", titleSlug)
	startedAt := time.Now()
	resp, err := http.Get(apiURL)
	if err != nil {
		logger.Error().
			Err(err).
			Str("provider", "alfa_leetcode_api").
			Str("title_slug", titleSlug).
			Str("provider_url", apiURL).
			Int64("duration_ms", time.Since(startedAt).Milliseconds()).
			Msg("Failed calling LeetCode proxy API")
		return observability.HTTPError(http.StatusInternalServerError, "failed to fetch from LeetCode API", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Warn().
			Str("provider", "alfa_leetcode_api").
			Str("title_slug", titleSlug).
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(startedAt).Milliseconds()).
			Msg("LeetCode proxy API returned non-success status")
		return echo.NewHTTPError(http.StatusNotFound, "problem not found on LeetCode")
	}

	var problem LeetCodeProblem
	if err := json.NewDecoder(resp.Body).Decode(&problem); err != nil {
		logger.Error().
			Err(err).
			Str("provider", "alfa_leetcode_api").
			Str("title_slug", titleSlug).
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(startedAt).Milliseconds()).
			Msg("Failed decoding LeetCode proxy API response")
		return observability.HTTPError(http.StatusInternalServerError, "failed to parse LeetCode response", err)
	}

	if problem.Title == "" {
		logger.Warn().
			Str("provider", "alfa_leetcode_api").
			Str("title_slug", titleSlug).
			Int64("duration_ms", time.Since(startedAt).Milliseconds()).
			Msg("LeetCode proxy API returned empty problem payload")
		return echo.NewHTTPError(http.StatusNotFound, "problem not found on LeetCode")
	}

	tags := make([]string, len(problem.TopicTags))
	for i, tag := range problem.TopicTags {
		tags[i] = tag.Name
	}

	logger.Info().
		Str("provider", "alfa_leetcode_api").
		Str("title_slug", titleSlug).
		Int64("duration_ms", time.Since(startedAt).Milliseconds()).
		Int("tag_count", len(tags)).
		Msg("Fetched LeetCode problem from proxy API")

	return c.JSON(http.StatusOK, FetchLeetCodeResponse{
		Title:       problem.Title,
		Difficulty:  problem.Difficulty,
		Description: problem.Content,
		Tags:        tags,
	})
}

func (h *LeetCodeHandler) FetchProblemDirectLeetCode(c echo.Context) error {
	urlParam := c.QueryParam("url")
	logger := observability.LoggerFromContext(c).With().Str("handler", "leetcode_fetch_direct").Logger()
	if urlParam == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "url parameter is required")
	}

	titleSlug, err := extractTitleSlug(urlParam)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Prepare GraphQL request body
	reqBody := graphQLFetchProblemRequest{
		Query:     graphql.LeetCodeGraphQLQuery,
		Variables: map[string]interface{}{"titleSlug": titleSlug},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		logger.Error().Err(err).Str("title_slug", titleSlug).Msg("Failed to marshal direct LeetCode GraphQL request")
		return observability.HTTPError(http.StatusInternalServerError, "failed to prepare request", err)
	}

	req, err := http.NewRequest("POST", "https://leetcode.com/graphql", strings.NewReader(string(bodyBytes)))
	if err != nil {
		logger.Error().Err(err).Str("title_slug", titleSlug).Msg("Failed to create direct LeetCode GraphQL request")
		return observability.HTTPError(http.StatusInternalServerError, "failed to create request", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Referer", "https://leetcode.com")
	req.Header.Set("User-Agent", "Mozilla/5.0")

	client := &http.Client{Timeout: 10 * time.Second}
	req = req.WithContext(c.Request().Context())
	startedAt := time.Now()
	resp, err := client.Do(req)
	if err != nil {
		logger.Error().
			Err(err).
			Str("provider", "leetcode_graphql").
			Str("title_slug", titleSlug).
			Int64("duration_ms", time.Since(startedAt).Milliseconds()).
			Msg("Failed calling direct LeetCode GraphQL API")
		return observability.HTTPError(http.StatusInternalServerError, "failed to fetch from LeetCode", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Warn().
			Str("provider", "leetcode_graphql").
			Str("title_slug", titleSlug).
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(startedAt).Milliseconds()).
			Msg("Direct LeetCode GraphQL API returned non-success status")
		return echo.NewHTTPError(http.StatusInternalServerError, "LeetCode API returned error")
	}

	var gqlResp graphQLFetchProblemResponse
	if err := json.NewDecoder(resp.Body).Decode(&gqlResp); err != nil {
		logger.Error().
			Err(err).
			Str("provider", "leetcode_graphql").
			Str("title_slug", titleSlug).
			Int("status_code", resp.StatusCode).
			Int64("duration_ms", time.Since(startedAt).Milliseconds()).
			Msg("Failed decoding direct LeetCode GraphQL response")
		return observability.HTTPError(http.StatusInternalServerError, "failed to parse LeetCode response", err)
	}

	if gqlResp.Data.Question.Title == "" {
		logger.Warn().
			Str("provider", "leetcode_graphql").
			Str("title_slug", titleSlug).
			Int64("duration_ms", time.Since(startedAt).Milliseconds()).
			Msg("Direct LeetCode GraphQL returned empty problem payload")
		return echo.NewHTTPError(http.StatusNotFound, "problem not found")
	}

	// Convert topic tags
	tags := make([]string, len(gqlResp.Data.Question.TopicTags))
	for i, tag := range gqlResp.Data.Question.TopicTags {
		tags[i] = tag.Name
	}

	logger.Info().
		Str("provider", "leetcode_graphql").
		Str("title_slug", titleSlug).
		Int64("duration_ms", time.Since(startedAt).Milliseconds()).
		Int("tag_count", len(tags)).
		Msg("Fetched LeetCode problem from direct GraphQL API")

	return c.JSON(http.StatusOK, FetchLeetCodeResponse{
		Title:       gqlResp.Data.Question.Title,
		Difficulty:  gqlResp.Data.Question.Difficulty,
		Description: gqlResp.Data.Question.Content,
		Tags:        tags,
	})
}
