# CLAUDE.md

This file provides guidance to Claude Code when working with this codebase.

## Project Overview

{{APP_TITLE}} ({{APP_ABBREVIATION}}) - {{DESCRIPTION}}

Built with Go (Gin) backend, React frontend, PostgreSQL database, all containerized with Docker.

## Development Commands

### Running the Application

```bash
# Terminal 1: Start database + backend (from backend/ directory)
cd backend
docker compose -f local.yml up

# Terminal 2: Start frontend (from frontend/ directory)
cd frontend
npm install
npm run dev
```

### Frontend Commands (run in frontend/ directory)

```bash
npm run dev       # Dev server (port 5173)
npm run build     # TypeScript check + build
npm run lint      # ESLint
```

### Backend Commands (run in backend/ directory)

```bash
docker compose -f local.yml up -d --build backend    # Rebuild backend
docker compose -f local.yml logs -f backend          # View logs
```

## Architecture

### Backend Structure

```
backend/
├── cmd/api/main.go           # Entry point
└── internal/
    ├── config/               # Environment config
    ├── database/             # DB connection
    ├── handlers/             # HTTP handlers (health, counter)
    ├── models/               # Data models
    ├── repository/           # Data access layer
    └── routes/               # Route definitions
```

### Frontend Structure

```
frontend/src/
├── components/
│   ├── layout/               # App layout, sidebar
│   ├── ui/                   # shadcn/ui components
│   └── ErrorBoundary.tsx     # Error handling
├── features/
│   └── counter/              # Counter feature
├── lib/api/client.ts         # API client
└── types/                    # TypeScript types
```

## Key Patterns

### API Routes (backend/internal/routes/routes.go)

Routes use Gin framework:

```go
api := router.Group("/api")
api.GET("/health", healthHandler.Check)
api.GET("/counter", counterHandler.Get)
api.POST("/counter/increment", counterHandler.Increment)
api.POST("/counter/decrement", counterHandler.Decrement)
```

### Frontend API Pattern

Each feature has `api.ts` (API calls) and component files:

```typescript
// features/counter/api.ts
export async function getCounter(): Promise<Counter> {
  const response = await apiClient.get<Counter>('/counter')
  return response.data
}
```

### Database

Counter table schema:

```sql
CREATE TABLE counters (
    id SERIAL PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
);
INSERT INTO counters (value) VALUES (0);
```

## Ports

- Frontend: 5173
- Backend: 8080
- PostgreSQL: 5432
