# react-go-stack-app

Create a full-stack Go + React + PostgreSQL application with Docker.

## Usage

```bash
npx react-go-stack-app my-app
```

Or install globally:

```bash
npm install -g react-go-stack-app
react-go-stack-app my-app
```

## What's Included

Generated projects include:

- **Go Backend** with Gin framework
  - PostgreSQL database
  - Counter example API
  - Health check endpoint

- **React Frontend** with TypeScript
  - Vite build tool
  - Tailwind CSS
  - shadcn/ui components
  - Axios for API calls

- **Docker Configuration**
  - Local development setup
  - Production setup with Traefik reverse proxy
  - SSL/TLS with Let's Encrypt
  - Staging environment

- **Developer Experience**
  - Makefile for common tasks
  - CLAUDE.md for AI assistance
  - Clean project structure

## Interactive Prompts

The CLI will ask you about:

- Project name and description
- Application title and abbreviation
- Production and staging domains
- Database name

## After Generation

```bash
cd my-app

# Set up the database
# CREATE TABLE counters (id SERIAL PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0);
# INSERT INTO counters (value) VALUES (0);

# Configure backend
cd backend
cp .env.example .env
# Edit .env with your database connection

# Start services
docker compose -f local.yml up

# In another terminal, start frontend
cd frontend
npm install
npm run dev

# Open http://localhost:5173
```

## Requirements

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL database

## License

MIT
