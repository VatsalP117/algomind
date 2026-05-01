package leetcode

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/VatsalP117/algomind/algomind-backend/internal/graphql"
)

var (
	ErrInvalidProblemURL = errors.New("invalid LeetCode problem URL")
	ErrProblemNotFound   = errors.New("problem not found on LeetCode")
)

type TopicTag struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type Problem struct {
	Title        string     `json:"title"`
	Difficulty   string     `json:"difficulty"`
	Description  string     `json:"description"`
	Tags         []string   `json:"tags"`
	TopicTags    []TopicTag `json:"topic_tags"`
	CanonicalURL string     `json:"canonical_url"`
	Slug         string     `json:"slug"`
	Provider     string     `json:"provider"`
}

type Client struct {
	httpClient *http.Client
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func NormalizeProblemURL(rawURL string) (canonicalURL string, slug string, err error) {
	parsedURL, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil {
		return "", "", ErrInvalidProblemURL
	}

	host := strings.ToLower(parsedURL.Host)
	if !strings.Contains(host, "leetcode.com") {
		return "", "", ErrInvalidProblemURL
	}

	re := regexp.MustCompile(`/problems/([a-z0-9-]+)/?`)
	matches := re.FindStringSubmatch(strings.ToLower(parsedURL.Path))
	if len(matches) < 2 {
		return "", "", ErrInvalidProblemURL
	}

	slug = matches[1]
	return fmt.Sprintf("https://leetcode.com/problems/%s/", slug), slug, nil
}

func (c *Client) FetchProblem(ctx context.Context, rawURL string) (*Problem, error) {
	canonicalURL, slug, err := NormalizeProblemURL(rawURL)
	if err != nil {
		return nil, err
	}

	problem, err := c.fetchDirect(ctx, slug)
	if err == nil {
		problem.CanonicalURL = canonicalURL
		problem.Slug = slug
		return problem, nil
	}

	problem, proxyErr := c.fetchProxy(ctx, slug)
	if proxyErr != nil {
		if errors.Is(err, ErrProblemNotFound) || errors.Is(proxyErr, ErrProblemNotFound) {
			return nil, ErrProblemNotFound
		}
		return nil, proxyErr
	}

	problem.CanonicalURL = canonicalURL
	problem.Slug = slug
	return problem, nil
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

func (c *Client) fetchDirect(ctx context.Context, slug string) (*Problem, error) {
	bodyBytes, err := json.Marshal(graphQLFetchProblemRequest{
		Query:     graphql.LeetCodeGraphQLQuery,
		Variables: map[string]interface{}{"titleSlug": slug},
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://leetcode.com/graphql",
		strings.NewReader(string(bodyBytes)),
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Referer", "https://leetcode.com")
	req.Header.Set("User-Agent", "Mozilla/5.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrProblemNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("leetcode GraphQL returned status %d", resp.StatusCode)
	}

	var gqlResp graphQLFetchProblemResponse
	if err := json.NewDecoder(resp.Body).Decode(&gqlResp); err != nil {
		return nil, err
	}
	if gqlResp.Data.Question.Title == "" {
		return nil, ErrProblemNotFound
	}

	tags := make([]string, len(gqlResp.Data.Question.TopicTags))
	for i, tag := range gqlResp.Data.Question.TopicTags {
		tags[i] = tag.Name
	}

	return &Problem{
		Title:       gqlResp.Data.Question.Title,
		Difficulty:  strings.ToUpper(gqlResp.Data.Question.Difficulty),
		Description: gqlResp.Data.Question.Content,
		Tags:        tags,
		TopicTags:   gqlResp.Data.Question.TopicTags,
		Provider:    "leetcode_graphql",
	}, nil
}

type proxyProblemResponse struct {
	Title      string     `json:"questionTitle"`
	Difficulty string     `json:"difficulty"`
	Content    string     `json:"question"`
	TopicTags  []TopicTag `json:"topicTags"`
}

func (c *Client) fetchProxy(ctx context.Context, slug string) (*Problem, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		fmt.Sprintf("https://alfa-leetcode-api.onrender.com/select?titleSlug=%s", slug),
		nil,
	)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrProblemNotFound
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("leetcode proxy returned status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var problem proxyProblemResponse
	if err := json.NewDecoder(resp.Body).Decode(&problem); err != nil {
		return nil, err
	}
	if problem.Title == "" {
		return nil, ErrProblemNotFound
	}

	tags := make([]string, len(problem.TopicTags))
	for i, tag := range problem.TopicTags {
		tags[i] = tag.Name
	}

	return &Problem{
		Title:       problem.Title,
		Difficulty:  strings.ToUpper(problem.Difficulty),
		Description: problem.Content,
		Tags:        tags,
		TopicTags:   problem.TopicTags,
		Provider:    "alfa_leetcode_api",
	}, nil
}
