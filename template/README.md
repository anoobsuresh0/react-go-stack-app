# {{APP_TITLE}}

{{DESCRIPTION}}

## Tech Stack

- **Backend:** Go 1.25 with PostgreSQL (pgx/v5)
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL 18
- **Containerization:** Docker with multi-stage builds

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) 22+
- [Go](https://golang.org/) 1.25+

### Development

1. **Start the database and backend:**

```bash
cp .env.example .env
docker compose up
```

2. **Start the frontend (in a new terminal):**

```bash
cd web
npm install
npm run dev
```

3. **Initialize Go modules:**

```bash
go mod tidy
```

4. **Open your app:** [http://localhost:5173](http://localhost:5173)

## Project Structure

```
{{PROJECT_NAME}}/
├── cmd/api/              # Go application entry point
├── internal/
│   ├── config/           # Environment configuration
│   ├── database/         # Database connection & migrations
│   ├── handlers/         # HTTP request handlers
│   ├── middleware/        # CORS, auth middleware
│   ├── models/           # Data structures
│   └── repository/       # Database queries
├── migrations/           # SQL migration files
├── web/                  # React frontend
│   ├── src/
│   │   ├── components/   # UI components (shadcn/ui)
│   │   ├── features/     # Feature modules
│   │   └── lib/          # Utilities
│   └── package.json
├── Dockerfile            # Multi-stage production build
├── docker-compose.yml    # Local development
├── go.mod
└── Makefile
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/counter | Get counter value |
| POST | /api/counter/increment | Increment counter |
| POST | /api/counter/decrement | Decrement counter |

## Available Commands

```bash
make dev          # Start with Docker Compose
make dev-build    # Rebuild and start
make dev-down     # Stop containers
make run          # Run Go server locally
make tidy         # Run go mod tidy
make build-frontend  # Build frontend for production
```

## Adding shadcn/ui Components

```bash
cd web
npx shadcn@latest add <component-name>
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8080 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| DB_NAME | Database name | {{DB_NAME}} |
| CORS_ORIGINS | Allowed CORS origins | http://localhost:5173 |

## License

MIT
