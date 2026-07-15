# {{APP_TITLE}}

Full-stack application: Go (net/http) backend, React (Vite + TypeScript + Tailwind) frontend, PostgreSQL 18.

## Quick start

<!-- {{DOCKER_DB_BLOCK_START}} -->
```bash
# Terminal 1 — start PostgreSQL (Docker) + the backend
make dev

# Terminal 2 — start the frontend
cd web
npm install
npm run dev
```
<!-- {{DOCKER_DB_BLOCK_END}} -->
<!-- {{LOCAL_DB_BLOCK_START}} -->
```bash
# One-time: create the database (PostgreSQL 18 must be running locally)
make db-create

# Terminal 1 — start the backend
make dev

# Terminal 2 — start the frontend
cd web
npm install
npm run dev
```
<!-- {{LOCAL_DB_BLOCK_END}} -->

Open http://localhost:5173. Database migrations run automatically when the backend starts.

Configuration lives in `.env` (optional — sensible defaults are built in). Copy `.env.example` to `.env` to customize.

## Project structure

```
├── Makefile                # dev / build / db targets
├── cmd/api/                # application entry point
├── internal/
│   ├── config/             # environment configuration
│   ├── database/           # connection pool + migration runner
│   ├── handlers/           # HTTP handlers
│   ├── middleware/         # CORS
│   ├── models/             # data structures
│   └── repository/         # database queries (pgx/v5)
├── migrations/             # SQL migrations (embedded into the binary)
└── web/                    # React frontend (Vite + TypeScript + Tailwind)
    └── src/
        ├── components/     # shared components
        └── features/       # feature modules (counter demo)
```

## API

| Method | Path                     | Description                  |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/api/health`            | Health check (pings the DB)  |
| GET    | `/api/counter`           | Current counter value        |
| POST   | `/api/counter/increment` | Increment and return counter |
| POST   | `/api/counter/decrement` | Decrement and return counter |

## Make targets

| Target | Description |
| ------ | ----------- |
| `make dev` | Run the backend in development mode |
<!-- {{DOCKER_DB_BLOCK_START}} -->
| `make db-up` / `make db-down` | Start / stop the PostgreSQL container |
| `make db-shell` | psql shell into the database |
| `make db-reset` | Recreate the database from scratch (deletes data) |
<!-- {{DOCKER_DB_BLOCK_END}} -->
<!-- {{LOCAL_DB_BLOCK_START}} -->
| `make db-create` / `make db-drop` | Create / drop the local database |
| `make db-shell` | psql shell into the database |
<!-- {{LOCAL_DB_BLOCK_END}} -->
| `make build` | Production build: frontend assets + static Go binary (`bin/api`) |
| `make start` | Run the production binary (serves the frontend from `web/dist`) |
| `make tidy` | `go mod tidy` |
| `make clean` | Remove build artifacts |

## Production build

```bash
make build   # builds web/dist and bin/api
make start   # single binary serves API + frontend on :8080
```

The binary is fully self-contained: migrations are embedded, and the frontend is served from `web/dist`. Deploy `bin/api` + `web/dist` together, set `DATABASE_URL` (and optionally `PORT`, `CORS_ORIGINS`), and you're done.

## Adding a migration

Create `migrations/000002_<name>.up.sql` (and a matching `.down.sql`). Migrations are applied in order on startup, tracked in the `schema_migrations` table, and each runs inside a transaction.

<!-- {{SHADCN_BLOCK_START}} -->
## Adding shadcn/ui components

```bash
cd web
npx shadcn@latest add <component>
```
<!-- {{SHADCN_BLOCK_END}} -->
