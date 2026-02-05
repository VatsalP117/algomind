package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"github.com/labstack/echo/v4"
)

type LeetCodeHandler struct{}

func NewLeetCodeHandler() *LeetCodeHandler {
	return &LeetCodeHandler{}
}

// TopicTag represents a topic tag from alfa-leetcode-api
type TopicTag struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// LeetCodeProblem represents the response from alfa-leetcode-api
type LeetCodeProblem struct {
	Title      string     `json:"questionTitle"`
	Difficulty string     `json:"difficulty"`
	Content    string     `json:"question"`
	TopicTags  []TopicTag `json:"topicTags"`
}

// FetchLeetCodeResponse is the response we send to the frontend
type FetchLeetCodeResponse struct {
	Title       string   `json:"title"`
	Difficulty  string   `json:"difficulty"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

// extractTitleSlug extracts the problem slug from a LeetCode URL
// e.g., "https://leetcode.com/problems/two-sum/" -> "two-sum"
func extractTitleSlug(leetcodeURL string) (string, error) {
	// Parse the URL
	parsedURL, err := url.Parse(leetcodeURL)
	if err != nil {
		return "", fmt.Errorf("invalid URL format")
	}

	// Check if it's a leetcode.com domain
	if !strings.Contains(parsedURL.Host, "leetcode.com") {
		return "", fmt.Errorf("not a LeetCode URL")
	}

	// Match the problem slug from the path
	// Pattern: /problems/{slug}/ or /problems/{slug}
	re := regexp.MustCompile(`/problems/([a-z0-9-]+)/?`)
	matches := re.FindStringSubmatch(parsedURL.Path)
	if len(matches) < 2 {
		return "", fmt.Errorf("could not extract problem slug from URL")
	}

	return matches[1], nil
}

// FetchProblem fetches problem details from LeetCode via alfa-leetcode-api
func (h *LeetCodeHandler) FetchProblem(c echo.Context) error {
	leetcodeURL := c.QueryParam("url")
	if leetcodeURL == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "url parameter is required")
	}

	// Extract the title slug from the URL
	titleSlug, err := extractTitleSlug(leetcodeURL)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Call alfa-leetcode-api
	apiURL := fmt.Sprintf("https://alfa-leetcode-api.onrender.com/select?titleSlug=%s", titleSlug)
	resp, err := http.Get(apiURL)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch from LeetCode API")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return echo.NewHTTPError(http.StatusNotFound, "problem not found on LeetCode")
	}

	var problem LeetCodeProblem
	if err := json.NewDecoder(resp.Body).Decode(&problem); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to parse LeetCode response")
	}

	// Check if we got valid data
	if problem.Title == "" {
		return echo.NewHTTPError(http.StatusNotFound, "problem not found on LeetCode")
	}

	// Extract tag names from TopicTag structs
	tags := make([]string, len(problem.TopicTags))
	for i, tag := range problem.TopicTags {
		tags[i] = tag.Name
	}

	// Return the formatted response
	return c.JSON(http.StatusOK, FetchLeetCodeResponse{
		Title:       problem.Title,
		Difficulty:  problem.Difficulty,
		Description: problem.Content,
		Tags:        tags,
	})
}
