# {{DOCKER_DB_BLOCK_START}}
.PHONY: dev build build-web build-api start tidy clean db-up db-down db-shell db-reset

# Start the database (Docker), then run the backend with live output.
dev: db-up
	go run ./cmd/api

# Database
db-up:
	docker compose up -d --wait db

db-down:
	docker compose down

db-shell:
	docker compose exec db psql -U postgres -d {{DB_NAME}}

# Drop everything (including data) and start fresh
db-reset:
	docker compose down -v
	docker compose up -d --wait db
# {{DOCKER_DB_BLOCK_END}}
# {{LOCAL_DB_BLOCK_START}}
.PHONY: dev build build-web build-api start tidy clean db-create db-drop db-shell

# Run the backend (expects PostgreSQL to be running locally).
dev:
	go run ./cmd/api

# Database
db-create:
	createdb {{DB_NAME}} 2>/dev/null || echo "database {{DB_NAME}} already exists"

db-drop:
	dropdb --if-exists {{DB_NAME}}

db-shell:
	psql {{DB_NAME}}
# {{LOCAL_DB_BLOCK_END}}

# Production build: frontend assets + a single static Go binary that serves them.
build: build-web build-api

build-web:
	cd web && npm install && npm run build

build-api:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/api ./cmd/api

# Run the production build (serves the frontend from web/dist)
start:
	ENV=production ./bin/api

tidy:
	go mod tidy

clean:
	rm -rf bin web/dist
