# CLAUDE.md - {{APP_TITLE}}

## Project Overview

{{DESCRIPTION}}

Full-stack application with Go backend and React frontend.

## Architecture

- **Backend:** Go with clean architecture (handlers → repository → database)
- **Frontend:** React 19 + TypeScript + Vite in `web/` directory
- **Database:** PostgreSQL with golang-migrate for migrations

## Key Directories

- `cmd/api/` - Application entry point
- `internal/` - Backend business logic
- `internal/handlers/` - HTTP handlers
- `internal/repository/` - Database queries (pgx/v5)
- `internal/models/` - Data structures
- `migrations/` - SQL migration files (up/down pairs)
- `web/src/` - React frontend source
- `web/src/features/` - Feature modules
- `web/src/components/ui/` - shadcn/ui components

## Commands

```bash
# Development
docker compose up          # Start DB + backend
cd web && npm run dev      # Start frontend

# Database
make db-shell              # Connect to PostgreSQL

# Build
make build-frontend        # Build React for production
go build ./cmd/api         # Build Go binary
```

## Conventions

- Go handlers return JSON responses
- Frontend uses Axios client at `web/src/lib/api/client.ts`
- All API routes prefixed with `/api/`
- Database migrations in `migrations/` directory (numbered sequentially)
- React components use shadcn/ui from `web/src/components/ui/`
- Feature code organized by domain in `web/src/features/`
