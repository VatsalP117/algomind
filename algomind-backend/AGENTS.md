# Backend AGENTS.md

## Commands
```bash
go run ./cmd/...           # Run server
go vet ./...               # Lint
go fmt ./...               # Format
go test ./...              # Run all tests
go test -run <name>        # Run specific test
go test -v ./...           # Verbose output

# Migrations
make migration_up          # Run pending migrations
make migration_down        # Rollback last migration
make new_migration name=<name>   # Create new migration
```

## Code Style

### Formatting
- Standard Go formatting (run `go fmt ./...`)
- Tab indentation following Go conventions

### Imports
Standard Go import ordering:
1. Standard library (`net/http`, `context`)
2. Third-party packages (`github.com/...`, `github.com/jackc/pgx/v5`)
3. Internal packages (`github.com/VatsalP117/algomind/...`)

### Naming Conventions
- Handlers: PascalCase (`ProblemHandler`)
- Exported functions: PascalCase
- Unexported functions: camelCase
- Variables: camelCase
- Constants: PascalCase or SCREAMING_SNAKE_CASE
- Files: snake_case (`problem_handler.go`)

### Error Handling
- Return errors early
- Use `echo.NewHTTPError(http.StatusXxx, "message")` for HTTP errors
- Log errors with context: `log.Printf("Error doing X: %v", err)`
- Always handle deferred rollbacks in transactions

## Tech Stack
- Echo v4 (HTTP framework)
- PostgreSQL with pgx/v5 and sqlx
- Clerk SDK for authentication
- go-playground/validator for validation
- zerolog for structured logging

## Project Structure
```
internal/
├── cmd/               # Entry points
├── handlers/          # HTTP handlers (one file per resource)
├── models/           # Database models
├── dto/              # Request/response DTOs
├── database/         # Database service
├── server/           # Server setup, routes, middleware
├── middleware/       # Auth middleware
├── config/           # Configuration
├── llm/              # LLM client
├── srs/              # Spaced repetition algorithm
└── observability/    # Logging, metrics
```

## Handler Pattern
```go
func (h *Handler) HandlerName(c echo.Context) error {
    var req dto.RequestType
    if err := c.Bind(&req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "invalid JSON body")
    }
    if err := c.Validate(&req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, err.Error())
    }
    userID := c.Get("user_id").(string)
    ctx := c.Request().Context()
    // ... business logic
    return c.JSON(http.StatusOK, result)
}
```

## Transaction Pattern
```go
tx, err := h.DB.BeginTxx(ctx, nil)
if err != nil {
    return echo.NewHTTPError(http.StatusInternalServerError, "msg")
}
committed := false
defer func() {
    if !committed {
        _ = tx.Rollback()
    }
}()
// ... operations
if err := tx.Commit(); err != nil {
    return echo.NewHTTPError(http.StatusInternalServerError, "msg")
}
committed = true
```

## Middleware
- Auth middleware extracts `user_id` into context
- Request logging middleware with zerolog
- CORS configured for allowed origins
- Panic recovery with stack logging

## Database
- Migrations in `migrations/` folder (SQL-based)
- Use `sqlx` for queries with named parameters (`$1`, `$2`)
- Use `*sqlx.Tx` for transactions
- Connection pool configured via `DATABASE_URL`
