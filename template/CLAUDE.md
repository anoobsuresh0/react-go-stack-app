# CLAUDE.md - {{APP_TITLE}}

## Project Overview

Full-stack application: Go (Gin) backend, React (Vite + TypeScript + Tailwind) frontend, PostgreSQL 18.

## Architecture

- **Backend:** Go with Gin and clean layering (handlers → repository → database), pgx/v5 pool
- **Frontend:** React + TypeScript + Vite in `web/`, Tailwind CSS v4
- **Database:** PostgreSQL 18; SQL migrations embedded via `go:embed` and applied on startup

## Key Directories

- `cmd/api/` - Application entry point (routing, server, graceful shutdown)
- `internal/config/` - Environment configuration
- `internal/handlers/` - HTTP handlers (Gin, JSON responses)
- `internal/repository/` - Database queries (pgx/v5)
- `internal/models/` - Data structures
- `migrations/` - SQL migration files (numbered `NNNNNN_name.up.sql` / `.down.sql`)
- `web/src/features/` - Frontend feature modules
<!-- {{SHADCN_BLOCK_START}} -->
- `web/src/components/ui/` - shadcn/ui components (`cd web && npx shadcn@latest add <component>`)
<!-- {{SHADCN_BLOCK_END}} -->

## Commands

```bash
make dev                   # Run backend: applies pending migrations, then serves
cd web && npm run dev      # Run frontend (Vite dev server, proxies /api to :8080)
make db-shell              # psql shell
make build                 # Production build (web/dist + bin/api)
go vet ./...               # Static checks
```

## Conventions

- All API routes are prefixed with `/api/` and return JSON
- Frontend calls the API through `web/src/features/<feature>/api.ts` using `fetch` (Vite proxies `/api` in dev)
- New migrations: next sequential number, always with a matching `.down.sql`
- Configuration comes from environment variables (`.env` is loaded in dev); see `internal/config/config.go`
