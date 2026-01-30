# Makefile
DB_URL=postgres://vatsal:vatsal123@localhost:5432/myapp?sslmode=disable

migration_up:
	migrate -path migrations -database "$(DB_URL)" up

migration_down:
	migrate -path migrations -database "$(DB_URL)" down

new_migration:
	migrate create -ext sql -dir migrations -seq $(name)