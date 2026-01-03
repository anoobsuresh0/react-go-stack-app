.PHONY: dev build deploy-staging deploy-production logs-staging logs-production restart-staging restart-production

# Development
dev:
	docker compose -f local.yml up

dev-build:
	docker compose -f local.yml up -d --build

dev-down:
	docker compose -f local.yml down

# Frontend build
build-frontend:
	./build_frontend.sh

# Staging deployment
deploy-staging: build-frontend
	docker compose -f production.yml build staging_backend
	docker compose -f production.yml up -d staging_backend staging_db

# Production deployment
deploy-production:
	docker compose -f production.yml up -d backend db

# Promote staging to production
promote:
	docker tag {{PROJECT_NAME_SNAKE}}:staging {{PROJECT_NAME_SNAKE}}:production

# Logs
logs-staging:
	docker compose -f production.yml logs -f staging_backend

logs-production:
	docker compose -f production.yml logs -f backend

logs-traefik:
	docker compose -f production.yml logs -f traefik

# Restart services
restart-staging:
	docker compose -f production.yml restart staging_backend

restart-production:
	docker compose -f production.yml restart backend

restart-all:
	docker compose -f production.yml restart

# Stop services
stop-staging:
	docker compose -f production.yml stop staging_backend staging_db

stop-production:
	docker compose -f production.yml stop backend db

stop-all:
	docker compose -f production.yml down

# Database
db-shell-staging:
	docker compose -f production.yml exec staging_db psql -U $${STAGING_POSTGRES_USER} -d $${STAGING_POSTGRES_DB}

db-shell-production:
	docker compose -f production.yml exec db psql -U $${PROD_POSTGRES_USER} -d $${PROD_POSTGRES_DB}

backup-staging:
	docker compose -f production.yml exec staging_db pg_dump -U $${STAGING_POSTGRES_USER} $${STAGING_POSTGRES_DB} > backup_staging_$$(date +%Y%m%d_%H%M%S).sql

backup-production:
	docker compose -f production.yml exec db pg_dump -U $${PROD_POSTGRES_USER} $${PROD_POSTGRES_DB} > backup_production_$$(date +%Y%m%d_%H%M%S).sql

# Status
status:
	docker compose -f production.yml ps

# Initial setup
init:
	docker compose -f production.yml up -d traefik db staging_db
	@echo "Waiting for databases to be ready..."
	sleep 10
	docker compose -f production.yml up -d backend staging_backend

# Clean up
clean:
	docker compose -f local.yml down -v
	docker compose -f production.yml down -v
