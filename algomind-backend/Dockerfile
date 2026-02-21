# ---- Build Stage ----
FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata curl

WORKDIR /app

# Download golang-migrate binary
RUN curl -L https://github.com/golang-migrate/migrate/releases/download/v4.18.1/migrate.linux-amd64.tar.gz \
    | tar xvz && mv migrate /usr/local/bin/migrate

# Cache dependencies separately from source
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/api/main.go

# ---- Runtime Stage ----
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy Go binary
COPY --from=builder /app/server .

# Copy migrate binary
COPY --from=builder /usr/local/bin/migrate /usr/local/bin/migrate

# Copy migration files
COPY migrations ./migrations

# Copy entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
