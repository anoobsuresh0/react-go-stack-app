# {{APP_TITLE}}

{{DESCRIPTION}}

## Tech Stack

- **Backend**: Go 1.23 with Gin
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL 16
- **Deployment**: Docker, Traefik reverse proxy with SSL

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+

### Development Setup

1. **Configure environment**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Start the database and backend**:
   ```bash
   cd backend
   docker compose -f local.yml up
   ```

   > Database tables are created automatically on first startup.

3. **Start the frontend** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open** http://localhost:5173

## Project Structure

```
{{PROJECT_NAME}}/
├── backend/
│   ├── cmd/api/main.go         # Entry point
│   ├── internal/
│   │   ├── config/             # Environment config
│   │   ├── database/           # DB connection
│   │   ├── handlers/           # HTTP handlers
│   │   ├── models/             # Data models
│   │   ├── repository/         # Data access layer
│   │   └── routes/             # Route definitions
│   ├── scripts/init.sql        # Database initialization
│   ├── local.yml               # Local Docker Compose
│   ├── production.yml          # Production Docker Compose
│   └── Makefile                # Build/deploy commands
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── features/           # Feature modules
│   │   ├── lib/                # Utilities
│   │   └── types/              # TypeScript types
│   └── package.json
│
├── README.md
└── CLAUDE.md                   # AI assistant instructions
```

## Development Commands

### Backend

```bash
cd backend

# Start services
docker compose -f local.yml up

# Rebuild after code changes
docker compose -f local.yml up -d --build

# View logs
docker compose -f local.yml logs -f backend

# Stop services
docker compose -f local.yml down

# Reset database (removes all data)
docker compose -f local.yml down -v
```

### Frontend

```bash
cd frontend

npm run dev      # Dev server (port 5173)
npm run build    # Production build
npm run lint     # ESLint
```

## Production Deployment

### Build and Deploy to Staging

```bash
cd backend
make deploy-staging
```

### Promote to Production

```bash
cd backend
make promote
make deploy-production
```

See `backend/Makefile` for all available commands.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/counter` - Get current counter value
- `POST /api/counter/increment` - Increment counter
- `POST /api/counter/decrement` - Decrement counter
