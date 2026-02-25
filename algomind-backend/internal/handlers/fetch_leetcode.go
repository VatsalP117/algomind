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
	if leetcodeURL == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "url parameter is required")
	}

	titleSlug, err := extractTitleSlug(leetcodeURL)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

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

	if problem.Title == "" {
		return echo.NewHTTPError(http.StatusNotFound, "problem not found on LeetCode")
	}

	tags := make([]string, len(problem.TopicTags))
	for i, tag := range problem.TopicTags {
		tags[i] = tag.Name
	}

	return c.JSON(http.StatusOK, FetchLeetCodeResponse{
		Title:       problem.Title,
		Difficulty:  problem.Difficulty,
		Description: problem.Content,
		Tags:        tags,
	})
}
