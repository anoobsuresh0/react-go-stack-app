# Template Rewrite Design

## Overview

Rewrite `@anoobsuresh0/react-go-stack-app` CLI to scaffold a unified monorepo (Go at root, React in `web/`) with conditional template variants based on user choices.

## Key Changes from Current Version

- Unified monorepo instead of separate `backend/` + `frontend/`
- 4 new CLI prompts: Go framework, state management, auth, docker environments
- Conditional template system (variant files renamed/removed based on choices)
- `pgx/v5` replaces `lib/pq`, `golang-migrate` replaces `init.sql`
- All packages updated to latest versions (matching recruito reference app)
- shadcn/ui with pre-included components and `components.json`
- Multi-stage Dockerfile with non-root user
- `postgres:18-alpine`, oklch color system, Vite proxy for dev

## CLI Prompt Flow

1. Project name (validated npm package name)
2. Description
3. App title (auto-generated from project name)
4. App abbreviation (3-5 chars)
5. Go framework: Gin / Standard Library
6. State management: Redux Toolkit / Simple useState
7. Google OAuth: yes / no
8. Docker environments: Local only / Local + Staging + Production
9. Production domain (conditional: docker=full)
10. Staging domain (conditional: docker=full)
11. Database name (auto-generated from project name)

## Template Structure

```
template/
├── cmd/api/
│   ├── main-gin.go                # Gin variant
│   └── main-stdlib.go             # Stdlib variant
├── internal/
│   ├── config/config.go
│   ├── database/
│   │   ├── database.go            # pgx/v5 connection pool
│   │   └── migrations.go          # golang-migrate runner
│   ├── handlers/
│   │   ├── counter-gin.go         # Gin variant
│   │   ├── counter-stdlib.go      # Stdlib variant
│   │   ├── health-gin.go
│   │   ├── health-stdlib.go
│   │   └── auth.go                # Conditional: auth=yes
│   ├── middleware/
│   │   ├── cors-gin.go
│   │   ├── cors-stdlib.go
│   │   └── auth.go                # Conditional: auth=yes
│   ├── models/counter.go
│   ├── repository/counter.go
│   └── routes/
│       ├── routes-gin.go
│       └── routes-stdlib.go
├── migrations/
│   ├── 000001_create_counters.up.sql
│   ├── 000001_create_counters.down.sql
│   ├── 000002_create_users_sessions.up.sql    # Conditional: auth=yes
│   └── 000002_create_users_sessions.down.sql  # Conditional: auth=yes
├── web/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css              # Tailwind + oklch theme
│   │   ├── components/
│   │   │   ├── layout/ (Layout.tsx, AppSidebar.tsx)
│   │   │   └── ui/ (shadcn components)
│   │   ├── features/
│   │   │   ├── counter/
│   │   │   │   ├── Counter-redux.tsx    # Redux variant
│   │   │   │   ├── Counter-simple.tsx   # Simple variant
│   │   │   │   ├── api.ts
│   │   │   │   ├── counterSlice.ts      # Conditional: redux
│   │   │   │   └── counterSelectors.ts  # Conditional: redux
│   │   │   └── auth/                    # Conditional: auth=yes
│   │   ├── app/store.ts                 # Conditional: redux
│   │   └── lib/ (api/client.ts, config.ts, utils.ts)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json, tsconfig.app.json
│   ├── components.json
│   └── index.html
├── Dockerfile
├── docker-compose.yml             # Local dev
├── docker-compose.staging.yml     # Conditional: docker=full
├── docker-compose.prod.yml        # Conditional: docker=full
├── docker-compose.traefik.yml     # Conditional: docker=full
├── Makefile
├── go.mod
├── .env.example
├── _gitignore
├── CLAUDE.md
└── README.md
```

## Conditional File Handling

| Choice | Include | Exclude |
|--------|---------|---------|
| Gin | `*-gin.*` files (renamed to final name) | `*-stdlib.*` variants |
| Stdlib | `*-stdlib.*` files (renamed to final name) | `*-gin.*` variants |
| Redux | store.ts, counterSlice.ts, Counter-redux.tsx, redux deps in package.json | Counter-simple.tsx |
| Simple | Counter-simple.tsx (renamed to Counter.tsx) | store.ts, slice, selectors, redux deps |
| Auth=yes | auth handlers, middleware, login page, OAuth env vars, migration 000002 | -- |
| Auth=no | -- | auth files, OAuth env vars, migration 000002 |
| Docker=full | staging.yml, prod.yml, traefik.yml, full Makefile | -- |
| Docker=local | -- | staging/prod/traefik files, deployment Makefile targets |

## Tech Stack & Versions

### Backend
- Go 1.25
- pgx/v5 5.8.0
- golang-migrate/v4 4.19.1
- golang-jwt/jwt/v5 5.2.1 (conditional: auth)
- google/uuid 1.6.0
- joho/godotenv 1.5.1
- golang.org/x/oauth2 0.30.0 (conditional: auth)
- gin-gonic/gin latest (conditional: gin)

### Frontend
- React 19.2.0, React DOM 19.2.0
- React Router DOM 7.13.0
- TypeScript 5.9.3, Vite 7.2.4
- Tailwind CSS 4.1.18, @tailwindcss/vite 4.1.18
- Axios 1.13.4
- Lucide React 0.563.0, Sonner 2.0.7
- class-variance-authority 0.7.1, clsx 2.1.1, tailwind-merge 3.4.0
- @reduxjs/toolkit 2.11.2, react-redux 9.2.0 (conditional: redux)

### shadcn/ui Components
button, card, sidebar, separator, tooltip, skeleton, sonner, sheet, input, label, dropdown-menu, avatar

### Docker
- postgres:18-alpine
- node:22-alpine (build)
- golang:1.25-alpine (build)
- alpine:3.21 (runtime)
- traefik:v3.0 (conditional: docker=full)

## API Endpoints

```
GET    /api/health              Health check (DB ping)
GET    /api/counter             Get counter value
POST   /api/counter/increment   Increment counter
POST   /api/counter/decrement   Decrement counter

# Conditional (auth=yes):
GET    /api/auth/google         Initiate Google OAuth
GET    /api/auth/callback       OAuth callback, returns JWT
GET    /api/auth/me             Get current user
POST   /api/auth/logout         Clear session

# Static:
GET    /assets/*                Vite built assets
GET    /*                       SPA fallback (index.html)
```

## Database Schema

### Migration 000001 (always)
```sql
CREATE TABLE counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO counters (value) VALUES (0);
```

### Migration 000002 (conditional: auth=yes)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Approach

Conditional Template with Variants (Approach 1). Single template directory with variant files. CLI copies template, renames selected variants to final names, removes unselected variants and conditional files.
