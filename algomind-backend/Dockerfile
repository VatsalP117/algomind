# ---- Build Stage ----
FROM golang:1.24-alpine AS builder

# Install git and ca-certificates (needed for fetching modules over HTTPS)
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

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

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
