# v3.0.0 — Simplified, production-ready scaffold

Date: 2026-07-15

## Goal

`npx @anoobsuresh0/react-go-stack-app my-app` should ask only the essential
questions, then generate a clean, production-ready Go + React + PostgreSQL 18
project where `make dev` runs the backend (starting the database first when it
lives in Docker) and `npm run dev` in `web/` runs the frontend. The demo app is
a counter persisted in PostgreSQL.

## What changes vs v2

### CLI prompts (was 11 questions, now 3)

1. Project name (argument or prompt)
2. PostgreSQL: run in **Docker** (compose file with `postgres:18-alpine`) or
   use a **local** PostgreSQL installation
3. Include **shadcn/ui**? (yes/no — no means plain Tailwind)

Everything else is derived: DB name = snake_case of the project name, app
title = Title Case of the project name. Non-interactive flags for CI/scripting:
`--db <docker|local>`, `--shadcn` / `--no-shadcn`, `--yes`, `--skip-git`.

### Removed from the template

- Dockerfile and app containerization, `docker-compose.staging.yml`,
  `docker-compose.prod.yml`, `docker-compose.traefik.yml`, deploy targets
- Google OAuth (handlers, middleware, user/session models + migration)
- Gin variant — backend is Go stdlib (`net/http` with Go 1.22+ method routing)
- Redux variant — counter uses plain `useState`
- axios, react-router-dom, sonner, sidebar/sheet/avatar/… components

### Backend (production-ready hardening)

- `http.Server` with timeouts and graceful shutdown (SIGINT/SIGTERM)
- Migrations embedded with `go:embed` — the built binary is self-contained
- Counter is a single-row table (`id = 1` with CHECK) updated atomically via
  `UPDATE … RETURNING` (no `LIMIT 1` subqueries)
- Config via `DATABASE_URL` (godotenv for local dev), CORS middleware, health
  endpoint that pings the DB, SPA static serving from `web/dist`

### Frontend (latest stable, matching create-vite)

- Vite ^8, React ^19.2, TypeScript ~6.0, Tailwind CSS ^4.3 via
  `@tailwindcss/vite`
- shadcn/ui variant: button + card components, `components.json` for
  `npx shadcn add …`; plain variant: same UI in plain Tailwind
- `fetch`-based API client, Vite dev proxy `/api` → `:8080`

### Makefile

- Docker DB mode: `make dev` = `docker compose up -d --wait db` + `go run`;
  `db-up`, `db-down`, `db-shell`, `db-reset`
- Local DB mode: `make dev` = `go run`; `db-create`, `db-shell`
- Both: `build` (frontend + static binary), `start`, `tidy`, `clean`

### CLI internals / performance

- `inquirer` (heavy) → `@inquirer/prompts`
- Copy-then-delete replaced by filter-during-copy; placeholder + marker
  processing done in one walk with parallel file I/O
- Marker system reduced to a data-driven condition map
  (`SHADCN`/`NOSHADCN`/`DOCKER_DB`/`LOCAL_DB` blocks + `_ONLY` line markers)

## Generated project layout

```
my-app/
├── Makefile
├── README.md / CLAUDE.md / .env.example / .gitignore
├── docker-compose.yml          # only when DB in Docker (db service only)
├── go.mod / go.sum
├── cmd/api/main.go
├── internal/
│   ├── config/  database/  handlers/  middleware/  models/  repository/
├── migrations/                 # embedded via migrations/embed.go
└── web/                        # Vite + React + TS + Tailwind (+ shadcn)
```

## Verification plan

Scaffold all four combinations (docker/local × shadcn/plain) in a scratch
directory; `go vet` + `go build` each; `npm install && npm run build` for both
web variants; end-to-end: start Docker DB, run API, exercise
`/api/health` and counter increment/decrement/persistence via curl.
