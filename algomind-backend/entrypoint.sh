#!/bin/sh
set -e

echo "Running database migrations..."
migrate -path /app/migrations -database "$DATABASE_URL" up
echo "Migrations complete."

exec ./server
