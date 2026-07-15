# react-go-stack-app

Scaffold a production-ready full-stack application in seconds:

- **Backend:** Go (Gin, Go 1.25) + pgx/v5, graceful shutdown, embedded SQL migrations
- **Frontend:** React 19 + Vite 8 + TypeScript + Tailwind CSS 4, optional shadcn/ui
- **Database:** PostgreSQL 18 — in Docker (managed for you) or your local install

## Usage

```bash
npx @anoobsuresh0/react-go-stack-app my-app
```

The CLI asks two questions:

1. **Where should PostgreSQL 18 run?** — Docker (a `docker-compose.yml` with just the database) or a local PostgreSQL installation
2. **Include shadcn/ui components?** — yes, or plain Tailwind

Then:

```bash
cd my-app
make docker-up    # start PostgreSQL 18 in Docker (Docker mode; local mode: make db-create)
make dev          # run the Go backend — applies pending migrations, then serves

# in a second terminal
cd my-app/web
npm install
npm run dev       # Vite dev server on http://localhost:5173, /api proxied to :8080
```

Open http://localhost:5173 — the demo is a counter persisted in PostgreSQL. Migrations run automatically when the backend starts.

### Non-interactive

```bash
npx @anoobsuresh0/react-go-stack-app my-app --db docker --shadcn      # or --db local / --no-shadcn
npx @anoobsuresh0/react-go-stack-app my-app -y                        # defaults: Docker + shadcn/ui
```

`--skip-git` skips git initialization.

## Generated project

```
my-app/
├── Makefile                 # dev / build / start / db targets
├── docker-compose.yml       # PostgreSQL 18 (Docker mode only)
├── cmd/api/                 # entry point: routing, server, graceful shutdown
├── internal/
│   ├── config/              # env configuration (DATABASE_URL, PORT, ...)
│   ├── database/            # pgx pool + transactional migration runner
│   ├── handlers/            # HTTP handlers (Gin, JSON)
│   ├── models/
│   └── repository/          # database queries
├── migrations/              # SQL migrations, embedded into the binary
└── web/                     # React + Vite + TS + Tailwind (+ shadcn/ui)
```

### Production

```bash
make build   # web/dist + a single static Go binary (bin/api)
make start   # binary serves the API and the frontend on :8080
```

Migrations are embedded via `go:embed`, so the binary + `web/dist` + `DATABASE_URL` is all a deploy needs.

## Requirements

- Node.js 18+
- Go 1.25+
- Docker (only for the Docker database mode) or PostgreSQL 18 installed locally

## License

MIT
