.PHONY: dev dev-build dev-down build-frontend

# Development
dev:
	docker compose up

dev-build:
	docker compose up --build

dev-down:
	docker compose down

# Frontend
build-frontend:
	cd web && npm install && npm run build

# Go
run:
	go run ./cmd/api

tidy:
	go mod tidy

# {{FULL_DOCKER_BLOCK_START}}
# Staging
deploy-staging:
	docker compose -f docker-compose.staging.yml up -d --build

staging-down:
	docker compose -f docker-compose.staging.yml down

staging-logs:
	docker compose -f docker-compose.staging.yml logs -f

# Production
promote:
	docker tag {{PROJECT_NAME_SNAKE}}:staging {{PROJECT_NAME_SNAKE}}:production

deploy-production:
	docker compose -f docker-compose.prod.yml up -d

production-down:
	docker compose -f docker-compose.prod.yml down

production-logs:
	docker compose -f docker-compose.prod.yml logs -f

# Traefik
traefik-up:
	docker compose -f docker-compose.traefik.yml up -d

traefik-down:
	docker compose -f docker-compose.traefik.yml down

# Database
db-shell:
	docker compose exec db psql -U postgres -d {{DB_NAME}}

backup-staging:
	docker compose -f docker-compose.staging.yml exec db-staging pg_dump -U $${STAGING_POSTGRES_USER} $${STAGING_POSTGRES_DB} > backup-staging-$$(date +%Y%m%d).sql

backup-production:
	docker compose -f docker-compose.prod.yml exec db-prod pg_dump -U $${PROD_POSTGRES_USER} $${PROD_POSTGRES_DB} > backup-production-$$(date +%Y%m%d).sql

# Clean
clean:
	docker compose down -v
	docker compose -f docker-compose.staging.yml down -v 2>/dev/null || true
	docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
# {{FULL_DOCKER_BLOCK_END}}
