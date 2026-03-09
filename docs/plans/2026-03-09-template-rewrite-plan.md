# Template Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite `@anoobsuresh0/react-go-stack-app` CLI to scaffold a unified monorepo with conditional template variants (Go framework, state management, auth, docker environments).

**Architecture:** Single template directory with variant files (suffixed `-gin`/`-stdlib`, `-redux`/`-simple`). CLI copies template, renames selected variants, removes unselected ones and conditional files. Unified monorepo: Go at root, React in `web/`.

**Tech Stack:** TypeScript CLI (Commander + Inquirer), Go 1.25 (pgx/v5, golang-migrate), React 19 (Vite 7, Tailwind 4, shadcn/ui), PostgreSQL 18, Docker multi-stage builds.

---

### Task 1: Clean up old template and update CLI dependencies

**Files:**
- Delete: `template/` (entire directory)
- Modify: `package.json`

**Step 1: Delete the old template directory**

```bash
rm -rf template/
```

**Step 2: Update package.json version and description**

Update `package.json`:
```json
{
  "name": "@anoobsuresh0/react-go-stack-app",
  "version": "2.0.2",
  "description": "CLI to scaffold production-ready full-stack apps with Go (Gin or stdlib), React 19 (Vite + TypeScript + Tailwind + shadcn/ui), PostgreSQL, and Docker with optional Google OAuth"
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove old template, bump to v2.0.2"
```

---

### Task 2: Rewrite CLI prompts with new options

**Files:**
- Modify: `src/prompts.ts`

**Step 1: Rewrite prompts.ts**

Add new fields to `ProjectAnswers`:
```typescript
export interface ProjectAnswers {
  projectName: string;
  projectPath: string;
  description: string;
  appTitle: string;
  appAbbreviation: string;
  goFramework: 'gin' | 'stdlib';
  stateManagement: 'redux' | 'simple';
  useAuth: boolean;
  dockerEnv: 'local' | 'full';
  productionDomain: string;
  stagingDomain: string;
  dbName: string;
}
```

Add 4 new prompts after appAbbreviation:
1. `goFramework` — list choice: `Gin` / `Standard Library (net/http)`
2. `stateManagement` — list choice: `Redux Toolkit` / `Simple (useState + API calls)`
3. `useAuth` — confirm: `Include Google OAuth authentication?`
4. `dockerEnv` — list choice: `Local development only` / `Local + Staging + Production (with Traefik)`

Make `productionDomain` and `stagingDomain` conditional on `dockerEnv === 'full'` using inquirer's `when` property. Default them to `'app.example.com'` and auto-generated staging variant when shown, or empty strings when not shown.

Keep all existing helper functions (toTitleCase, getAbbreviation, toSnakeCase).

**Step 2: Commit**

```bash
git add src/prompts.ts && git commit -m "feat: add Go framework, state management, auth, and docker environment prompts"
```

---

### Task 3: Rewrite template processing logic

**Files:**
- Modify: `src/template.ts`

**Step 1: Rewrite template.ts**

The new `createProject` function must:

1. Copy entire `template/` directory to project path (same as before)
2. Build placeholders (same as before, but `productionDomain`/`stagingDomain` may be empty)
3. Process all files for placeholder replacement (same as before)
4. Handle variant files based on choices:

```typescript
// Variant handling logic:
async function handleVariants(projectPath: string, answers: ProjectAnswers): Promise<void> {
  const framework = answers.goFramework; // 'gin' or 'stdlib'
  const otherFramework = framework === 'gin' ? 'stdlib' : 'gin';
  const stateManagement = answers.stateManagement; // 'redux' or 'simple'
  const otherState = stateManagement === 'redux' ? 'simple' : 'redux';

  // 1. Rename selected Go variants (e.g., main-gin.go -> main.go)
  // 2. Delete unselected Go variants (e.g., main-stdlib.go)
  // 3. Rename selected frontend variants (e.g., Counter-redux.tsx -> Counter.tsx)
  // 4. Delete unselected frontend variants

  // Walk project and find all files with variant suffixes
  // For files matching *-{framework}.* -> rename to remove suffix
  // For files matching *-{otherFramework}.* -> delete
  // Same for state management variants
}
```

5. Handle conditional files:

```typescript
async function handleConditionals(projectPath: string, answers: ProjectAnswers): Promise<void> {
  // If no auth: remove auth-related files
  if (!answers.useAuth) {
    await removeIfExists(path.join(projectPath, 'internal/handlers/auth.go'));
    await removeIfExists(path.join(projectPath, 'internal/middleware/auth.go'));
    await removeIfExists(path.join(projectPath, 'internal/models/user.go'));
    await removeIfExists(path.join(projectPath, 'internal/repository/auth.go'));
    await removeIfExists(path.join(projectPath, 'migrations/000002_create_users_sessions.up.sql'));
    await removeIfExists(path.join(projectPath, 'migrations/000002_create_users_sessions.down.sql'));
    await removeIfExists(path.join(projectPath, 'web/src/features/auth'));
  }

  // If not redux: remove redux files
  if (answers.stateManagement !== 'redux') {
    await removeIfExists(path.join(projectPath, 'web/src/app'));
    // counterSlice.ts and counterSelectors.ts already handled by variant rename
  }

  // If local-only docker: remove staging/prod/traefik files
  if (answers.dockerEnv !== 'full') {
    await removeIfExists(path.join(projectPath, 'docker-compose.staging.yml'));
    await removeIfExists(path.join(projectPath, 'docker-compose.prod.yml'));
    await removeIfExists(path.join(projectPath, 'docker-compose.traefik.yml'));
    await removeIfExists(path.join(projectPath, 'traefik'));
  }
}
```

6. Handle go.mod conditional dependencies:
   - If `gin`: include `github.com/gin-gonic/gin` and `github.com/gin-contrib/cors`
   - If `stdlib`: exclude gin dependencies
   - If `auth`: include `golang.org/x/oauth2`, `github.com/golang-jwt/jwt/v5`
   - If no auth: exclude auth dependencies
   - Implementation: use separate go.mod variant files (`go-gin.mod`, `go-stdlib.mod`, `go-gin-auth.mod`, `go-stdlib-auth.mod`) OR use marker comments in go.mod and strip lines.

   Recommended: Use marker comments approach:
   ```
   github.com/gin-gonic/gin v1.10.0 // {{GIN_ONLY}}
   github.com/gin-contrib/cors v1.7.3 // {{GIN_ONLY}}
   golang.org/x/oauth2 v0.30.0 // {{AUTH_ONLY}}
   github.com/golang-jwt/jwt/v5 v5.2.1 // {{AUTH_ONLY}}
   ```
   Then strip lines with unmatched markers after placeholder replacement.

7. Handle package.json conditional dependencies:
   - Same marker approach for redux dependencies in `web/package.json`

8. Handle main.go conditional imports:
   - Auth routes registration is conditional
   - This is already handled by variant files (main-gin.go vs main-stdlib.go)
   - But auth imports within those files need marker comments too

9. Handle vite.config.ts conditional chunks:
   - Redux vendor chunk only if redux selected
   - Use marker comments

10. Rename `_gitignore` files to `.gitignore` (keep from current implementation)

**Step 2: Commit**

```bash
git add src/template.ts && git commit -m "feat: rewrite template processing with variant and conditional file handling"
```

---

### Task 4: Update success message and utils

**Files:**
- Modify: `src/utils.ts`

**Step 1: Update printSuccess**

Change the success message to reflect the new unified monorepo structure:

```typescript
export function printSuccess(answers: ProjectAnswers): void {
  // Show selected options
  console.log(chalk.dim(`  Go Framework: ${answers.goFramework === 'gin' ? 'Gin' : 'Standard Library'}`));
  console.log(chalk.dim(`  State Management: ${answers.stateManagement === 'redux' ? 'Redux Toolkit' : 'Simple (useState)'}`));
  console.log(chalk.dim(`  Auth: ${answers.useAuth ? 'Google OAuth' : 'None'}`));
  console.log(chalk.dim(`  Docker: ${answers.dockerEnv === 'full' ? 'Local + Staging + Production' : 'Local only'}\n`));

  // Next steps (unified monorepo)
  console.log(chalk.cyan(`  1. Start the development servers:`));
  console.log(chalk.dim('     # Terminal 1: Start database + backend'));
  console.log(`     cd ${answers.projectName}`);
  console.log('     cp .env.example .env');
  console.log('     docker compose up\n');

  console.log(chalk.dim('     # Terminal 2: Start frontend'));
  console.log(`     cd ${answers.projectName}/web`);
  console.log('     npm install');
  console.log('     npm run dev\n');

  console.log(chalk.cyan(`  2. Open your app:`));
  console.log('     http://localhost:5173\n');

  console.log(chalk.dim('  Add shadcn components: npx shadcn@latest add <component>'));
}
```

**Step 2: Commit**

```bash
git add src/utils.ts && git commit -m "feat: update success message for unified monorepo structure"
```

---

### Task 5: Create Go backend template — shared files (config, database, models, repository)

These files are the same regardless of Gin vs stdlib choice.

**Files:**
- Create: `template/internal/config/config.go`
- Create: `template/internal/database/database.go`
- Create: `template/internal/database/migrations.go`
- Create: `template/internal/models/counter.go`
- Create: `template/internal/models/user.go` (conditional: auth)
- Create: `template/internal/repository/counter.go`
- Create: `template/internal/repository/auth.go` (conditional: auth)
- Create: `template/migrations/000001_create_counters.up.sql`
- Create: `template/migrations/000001_create_counters.down.sql`
- Create: `template/migrations/000002_create_users_sessions.up.sql` (conditional: auth)
- Create: `template/migrations/000002_create_users_sessions.down.sql` (conditional: auth)

**Step 1: Create config.go**

```go
package config

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	Environment string
	CORSOrigins string
	FrontendURL string
	StaticPath  string
	// Auth fields (only used if auth is enabled)
	GoogleClientID     string // {{AUTH_ONLY}}
	GoogleClientSecret string // {{AUTH_ONLY}}
	JWTSecret          string // {{AUTH_ONLY}}
	AllowedEmailDomain string // {{AUTH_ONLY}}
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: buildDatabaseURL(),
		Environment: getEnv("ENV", "development"),
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		StaticPath:  getEnv("STATIC_PATH", "./web/dist"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),     // {{AUTH_ONLY}}
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"), // {{AUTH_ONLY}}
		JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production"), // {{AUTH_ONLY}}
		AllowedEmailDomain: os.Getenv("ALLOWED_EMAIL_DOMAIN"), // {{AUTH_ONLY}}
	}
}

func buildDatabaseURL() string {
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "{{DB_NAME}}")
	sslmode := getEnv("DB_SSLMODE", "disable")
	return "postgres://" + user + ":" + password + "@" + host + ":" + port + "/" + dbname + "?sslmode=" + sslmode
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
```

**Step 2: Create database.go (pgx/v5)**

```go
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	return pool, nil
}
```

**Step 3: Create migrations.go (golang-migrate)**

```go
package database

import (
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(databaseURL string) error {
	m, err := migrate.New("file://migrations", databaseURL)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Migrations completed successfully")
	return nil
}
```

**Step 4: Create models/counter.go**

```go
package models

import "time"

type Counter struct {
	ID        string    `json:"id"`
	Value     int       `json:"value"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
```

**Step 5: Create models/user.go (conditional: auth)**

```go
package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	AvatarURL string    `json:"avatar_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
```

**Step 6: Create repository/counter.go (pgx/v5)**

```go
package repository

import (
	"context"
	"fmt"

	"{{PROJECT_NAME}}/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CounterRepository struct {
	db *pgxpool.Pool
}

func NewCounterRepository(db *pgxpool.Pool) *CounterRepository {
	return &CounterRepository{db: db}
}

func (r *CounterRepository) Get(ctx context.Context) (*models.Counter, error) {
	var c models.Counter
	err := r.db.QueryRow(ctx,
		"SELECT id, value, created_at, updated_at FROM counters LIMIT 1",
	).Scan(&c.ID, &c.Value, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get counter: %w", err)
	}
	return &c, nil
}

func (r *CounterRepository) Increment(ctx context.Context) (*models.Counter, error) {
	var c models.Counter
	err := r.db.QueryRow(ctx,
		"UPDATE counters SET value = value + 1, updated_at = NOW() WHERE id = (SELECT id FROM counters LIMIT 1) RETURNING id, value, created_at, updated_at",
	).Scan(&c.ID, &c.Value, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to increment counter: %w", err)
	}
	return &c, nil
}

func (r *CounterRepository) Decrement(ctx context.Context) (*models.Counter, error) {
	var c models.Counter
	err := r.db.QueryRow(ctx,
		"UPDATE counters SET value = value - 1, updated_at = NOW() WHERE id = (SELECT id FROM counters LIMIT 1) RETURNING id, value, created_at, updated_at",
	).Scan(&c.ID, &c.Value, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to decrement counter: %w", err)
	}
	return &c, nil
}
```

**Step 7: Create repository/auth.go (conditional: auth)**

```go
package repository

import (
	"context"
	"fmt"

	"{{PROJECT_NAME}}/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthRepository struct {
	db *pgxpool.Pool
}

func NewAuthRepository(db *pgxpool.Pool) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) FindOrCreateUser(ctx context.Context, email, name, avatarURL string) (*models.User, error) {
	var user models.User
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (email, name, avatar_url) VALUES ($1, $2, $3)
		ON CONFLICT (email) DO UPDATE SET name = $2, avatar_url = $3
		RETURNING id, email, name, avatar_url, created_at`,
		email, name, avatarURL,
	).Scan(&user.ID, &user.Email, &user.Name, &user.AvatarURL, &user.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to find or create user: %w", err)
	}
	return &user, nil
}

func (r *AuthRepository) CreateSession(ctx context.Context, userID, token string, expiresAt interface{}) (*models.Session, error) {
	var session models.Session
	err := r.db.QueryRow(ctx,
		`INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)
		RETURNING id, user_id, token, expires_at, created_at`,
		userID, token, expiresAt,
	).Scan(&session.ID, &session.UserID, &session.Token, &session.ExpiresAt, &session.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}
	return &session, nil
}

func (r *AuthRepository) GetSessionByToken(ctx context.Context, token string) (*models.Session, error) {
	var session models.Session
	err := r.db.QueryRow(ctx,
		"SELECT id, user_id, token, expires_at, created_at FROM sessions WHERE token = $1",
		token,
	).Scan(&session.ID, &session.UserID, &session.Token, &session.ExpiresAt, &session.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}
	return &session, nil
}

func (r *AuthRepository) DeleteSession(ctx context.Context, token string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM sessions WHERE token = $1", token)
	return err
}

func (r *AuthRepository) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	err := r.db.QueryRow(ctx,
		"SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Email, &user.Name, &user.AvatarURL, &user.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return &user, nil
}
```

**Step 8: Create migration files**

`migrations/000001_create_counters.up.sql`:
```sql
CREATE TABLE counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO counters (value) VALUES (0);
```

`migrations/000001_create_counters.down.sql`:
```sql
DROP TABLE IF EXISTS counters;
```

`migrations/000002_create_users_sessions.up.sql` (conditional: auth):
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

`migrations/000002_create_users_sessions.down.sql` (conditional: auth):
```sql
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
```

**Step 9: Commit**

```bash
git add template/ && git commit -m "feat: add Go backend shared template files (config, database, models, repository, migrations)"
```

---

### Task 6: Create Go backend template — Gin variant files

**Files:**
- Create: `template/cmd/api/main-gin.go`
- Create: `template/internal/handlers/counter-gin.go`
- Create: `template/internal/handlers/health-gin.go`
- Create: `template/internal/handlers/auth-gin.go` (conditional: auth)
- Create: `template/internal/middleware/cors-gin.go`
- Create: `template/internal/middleware/auth-gin.go` (conditional: auth)
- Create: `template/internal/routes/routes-gin.go`

**Step 1: Create main-gin.go**

```go
package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"{{PROJECT_NAME}}/internal/config"
	"{{PROJECT_NAME}}/internal/database"
	"{{PROJECT_NAME}}/internal/handlers"
	"{{PROJECT_NAME}}/internal/middleware"
	"{{PROJECT_NAME}}/internal/repository"
	"{{PROJECT_NAME}}/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	// Run migrations
	if err := database.RunMigrations(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Connect to database
	pool, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Set up repositories and handlers
	counterRepo := repository.NewCounterRepository(pool)
	counterHandler := handlers.NewCounterHandler(counterRepo)
	healthHandler := handlers.NewHealthHandler(pool)

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS middleware
	r.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	// Register routes
	routes.RegisterRoutes(r, counterHandler, healthHandler)

	// Serve static frontend files
	staticPath := cfg.StaticPath
	if _, err := os.Stat(staticPath); err == nil {
		r.Static("/assets", filepath.Join(staticPath, "assets"))
		r.StaticFile("/favicon.ico", filepath.Join(staticPath, "favicon.ico"))
		r.NoRoute(func(c *gin.Context) {
			c.File(filepath.Join(staticPath, "index.html"))
		})
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
```

Note: Auth variant will need additional imports and handler setup. Use `// {{AUTH_BLOCK_START}}` and `// {{AUTH_BLOCK_END}}` markers for auth-specific code blocks in main-gin.go, then the CLI strips them if auth is not selected.

**Step 2: Create handlers/counter-gin.go**

```go
package handlers

import (
	"net/http"

	"{{PROJECT_NAME}}/internal/repository"
	"github.com/gin-gonic/gin"
)

type CounterHandler struct {
	repo *repository.CounterRepository
}

func NewCounterHandler(repo *repository.CounterRepository) *CounterHandler {
	return &CounterHandler{repo: repo}
}

func (h *CounterHandler) GetCounter(c *gin.Context) {
	counter, err := h.repo.Get(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get counter"})
		return
	}
	c.JSON(http.StatusOK, counter)
}

func (h *CounterHandler) IncrementCounter(c *gin.Context) {
	counter, err := h.repo.Increment(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to increment counter"})
		return
	}
	c.JSON(http.StatusOK, counter)
}

func (h *CounterHandler) DecrementCounter(c *gin.Context) {
	counter, err := h.repo.Decrement(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decrement counter"})
		return
	}
	c.JSON(http.StatusOK, counter)
}
```

**Step 3: Create handlers/health-gin.go**

```go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthHandler struct {
	db *pgxpool.Pool
}

func NewHealthHandler(db *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) HealthCheck(c *gin.Context) {
	if err := h.db.Ping(c.Request.Context()); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "healthy"})
}
```

**Step 4: Create middleware/cors-gin.go**

```go
package middleware

import (
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORSMiddleware(origins string) gin.HandlerFunc {
	allowedOrigins := strings.Split(origins, ",")
	return cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}
```

**Step 5: Create routes/routes-gin.go**

```go
package routes

import (
	"{{PROJECT_NAME}}/internal/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, counterHandler *handlers.CounterHandler, healthHandler *handlers.HealthHandler) {
	api := r.Group("/api")
	{
		api.GET("/health", healthHandler.HealthCheck)
		api.GET("/counter", counterHandler.GetCounter)
		api.POST("/counter/increment", counterHandler.IncrementCounter)
		api.POST("/counter/decrement", counterHandler.DecrementCounter)
	}
}
```

Note: When auth is enabled, routes-gin.go will also include auth routes and middleware. Use `// {{AUTH_BLOCK_START/END}}` markers.

**Step 6: Create handlers/auth-gin.go (conditional: auth)**

Implement Google OAuth login, callback, me, logout handlers using Gin context. Reference the recruito auth handler pattern but simplified.

**Step 7: Create middleware/auth-gin.go (conditional: auth)**

JWT validation middleware for Gin that checks Authorization header, validates JWT token, and sets user context.

**Step 8: Commit**

```bash
git add template/ && git commit -m "feat: add Gin variant template files (handlers, middleware, routes)"
```

---

### Task 7: Create Go backend template — stdlib variant files

**Files:**
- Create: `template/cmd/api/main-stdlib.go`
- Create: `template/internal/handlers/counter-stdlib.go`
- Create: `template/internal/handlers/health-stdlib.go`
- Create: `template/internal/handlers/auth-stdlib.go` (conditional: auth)
- Create: `template/internal/middleware/cors-stdlib.go`
- Create: `template/internal/middleware/auth-stdlib.go` (conditional: auth)
- Create: `template/internal/routes/routes-stdlib.go`

**Step 1: Create main-stdlib.go**

Same as main-gin.go but using `net/http` and `http.ServeMux` instead of gin. Pattern:
```go
mux := http.NewServeMux()
routes.RegisterRoutes(mux, counterHandler, healthHandler)
// Wrap with CORS middleware
handler := middleware.CORSMiddleware(cfg.CORSOrigins)(mux)
http.ListenAndServe(":"+cfg.Port, handler)
```

**Step 2: Create handlers using http.HandlerFunc pattern**

```go
func (h *CounterHandler) GetCounter(w http.ResponseWriter, r *http.Request) {
	counter, err := h.repo.Get(r.Context())
	if err != nil {
		http.Error(w, `{"error":"Failed to get counter"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(counter)
}
```

**Step 3: Create routes-stdlib.go using Go 1.22+ routing**

```go
func RegisterRoutes(mux *http.ServeMux, counterHandler *handlers.CounterHandler, healthHandler *handlers.HealthHandler) {
	mux.HandleFunc("GET /api/health", healthHandler.HealthCheck)
	mux.HandleFunc("GET /api/counter", counterHandler.GetCounter)
	mux.HandleFunc("POST /api/counter/increment", counterHandler.IncrementCounter)
	mux.HandleFunc("POST /api/counter/decrement", counterHandler.DecrementCounter)
}
```

**Step 4: Create middleware/cors-stdlib.go**

Manual CORS middleware wrapping http.Handler.

**Step 5: Auth handlers/middleware in stdlib pattern (conditional: auth)**

Same logic as Gin variants but using `http.HandlerFunc` and `http.Handler` wrapper.

**Step 6: Commit**

```bash
git add template/ && git commit -m "feat: add stdlib variant template files (handlers, middleware, routes)"
```

---

### Task 8: Create go.mod template with conditional markers

**Files:**
- Create: `template/go.mod`

**Step 1: Create go.mod with markers**

```
module {{PROJECT_NAME}}

go 1.25

require (
	github.com/jackc/pgx/v5 v5.8.0
	github.com/golang-migrate/migrate/v4 v4.19.1
	github.com/google/uuid v1.6.0
	github.com/joho/godotenv v1.5.1
	github.com/gin-gonic/gin v1.10.0 // {{GIN_ONLY}}
	github.com/gin-contrib/cors v1.7.3 // {{GIN_ONLY}}
	github.com/golang-jwt/jwt/v5 v5.2.1 // {{AUTH_ONLY}}
	golang.org/x/oauth2 v0.30.0 // {{AUTH_ONLY}}
)
```

The CLI template processor will strip lines with `// {{GIN_ONLY}}` when stdlib is chosen, and `// {{AUTH_ONLY}}` when auth is not chosen. Also strip the marker comments themselves from kept lines.

Note: go.sum needs to be generated. Add a post-scaffold step or instruction to run `go mod tidy`. Include this in the success message.

**Step 2: Commit**

```bash
git add template/go.mod && git commit -m "feat: add go.mod template with conditional dependency markers"
```

---

### Task 9: Create React frontend template — core files

**Files:**
- Create: `template/web/index.html`
- Create: `template/web/package.json` (with conditional markers for redux)
- Create: `template/web/vite.config.ts`
- Create: `template/web/tsconfig.json`
- Create: `template/web/tsconfig.app.json`
- Create: `template/web/tsconfig.node.json`
- Create: `template/web/eslint.config.js`
- Create: `template/web/components.json`
- Create: `template/web/src/main.tsx`
- Create: `template/web/src/index.css`
- Create: `template/web/src/lib/utils.ts`
- Create: `template/web/src/lib/config.ts`
- Create: `template/web/src/lib/api/client.ts`
- Create: `template/web/_gitignore`

Use recruito's exact patterns for:
- `index.css` — full oklch theme with light/dark mode, `@theme inline`, font setup
- `vite.config.ts` — proxy, alias, chunking (conditional redux-vendor chunk)
- `tsconfig.app.json` — strict mode, path aliases, bundler resolution
- `components.json` — shadcn config pointing to `@/components/ui`, `@/lib/utils`
- `client.ts` — Axios instance with `/api` baseURL

**Step 1: Create all core frontend files**

Match recruito versions exactly in package.json. Use `// {{REDUX_ONLY}}` markers for redux dependencies.

**Step 2: Commit**

```bash
git add template/web/ && git commit -m "feat: add React frontend core template files"
```

---

### Task 10: Create React frontend template — shadcn/ui components

**Files:**
- Create: `template/web/src/components/ui/button.tsx`
- Create: `template/web/src/components/ui/card.tsx`
- Create: `template/web/src/components/ui/sidebar.tsx`
- Create: `template/web/src/components/ui/separator.tsx`
- Create: `template/web/src/components/ui/tooltip.tsx`
- Create: `template/web/src/components/ui/skeleton.tsx`
- Create: `template/web/src/components/ui/sonner.tsx`
- Create: `template/web/src/components/ui/sheet.tsx`
- Create: `template/web/src/components/ui/input.tsx`
- Create: `template/web/src/components/ui/label.tsx`
- Create: `template/web/src/components/ui/dropdown-menu.tsx`
- Create: `template/web/src/components/ui/avatar.tsx`

**Step 1: Copy shadcn/ui component files from recruito**

These are standard shadcn/ui components. Copy them from the recruito reference app at `/Users/anoobsuresh/Desktop/PERLEYBROOK/FLAGMAN/Hack7March/recruito/web/src/components/ui/`. They use `@/lib/utils` for the `cn()` utility which we already include.

**Step 2: Commit**

```bash
git add template/web/src/components/ui/ && git commit -m "feat: add shadcn/ui component templates"
```

---

### Task 11: Create React frontend template — layout components

**Files:**
- Create: `template/web/src/components/layout/Layout.tsx`
- Create: `template/web/src/components/layout/AppSidebar.tsx`
- Create: `template/web/src/components/ErrorBoundary.tsx`

**Step 1: Create Layout.tsx**

Use recruito pattern: `SidebarProvider` + `AppSidebar` + `SidebarInset` + `Outlet`. Simplified for the counter app.

**Step 2: Create AppSidebar.tsx**

Sidebar with app title, abbreviation, and a single nav item for Counter. Uses `{{APP_TITLE}}` and `{{APP_ABBREVIATION}}` placeholders. Uses shadcn sidebar components.

**Step 3: Create ErrorBoundary.tsx**

Simple React error boundary component.

**Step 4: Commit**

```bash
git add template/web/src/components/ && git commit -m "feat: add layout and error boundary template components"
```

---

### Task 12: Create React frontend template — Counter feature variants

**Files:**
- Create: `template/web/src/features/counter/api.ts`
- Create: `template/web/src/features/counter/Counter-redux.tsx`
- Create: `template/web/src/features/counter/Counter-simple.tsx`
- Create: `template/web/src/features/counter/counterSlice.ts` (conditional: redux)
- Create: `template/web/src/features/counter/counterSelectors.ts` (conditional: redux)
- Create: `template/web/src/app/store.ts` (conditional: redux)

**Step 1: Create api.ts (shared)**

```typescript
import { apiClient } from '@/lib/api/client';

export interface Counter {
  id: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export async function getCounter(): Promise<Counter> {
  const response = await apiClient.get<Counter>('/counter');
  return response.data;
}

export async function incrementCounter(): Promise<Counter> {
  const response = await apiClient.post<Counter>('/counter/increment');
  return response.data;
}

export async function decrementCounter(): Promise<Counter> {
  const response = await apiClient.post<Counter>('/counter/decrement');
  return response.data;
}
```

**Step 2: Create Counter-simple.tsx (useState variant)**

Uses `useState` + `useEffect` + direct API calls. Simple loading/error states. Uses shadcn Card and Button components.

**Step 3: Create Counter-redux.tsx (Redux variant)**

Uses `useSelector` + `useDispatch` with async thunks from counterSlice. Same UI as simple but with Redux state management.

**Step 4: Create counterSlice.ts and counterSelectors.ts**

Redux Toolkit slice with async thunks for get/increment/decrement. Selectors for counter value, loading, error states.

**Step 5: Create app/store.ts**

Redux store configuration with counter reducer.

**Step 6: Commit**

```bash
git add template/web/src/features/ template/web/src/app/ && git commit -m "feat: add counter feature with Redux and simple state variants"
```

---

### Task 13: Create React frontend template — Auth feature (conditional)

**Files:**
- Create: `template/web/src/features/auth/LoginPage.tsx`
- Create: `template/web/src/features/auth/AuthCallbackPage.tsx`
- Create: `template/web/src/features/auth/AuthProvider.tsx`
- Create: `template/web/src/features/auth/ProtectedRoute.tsx`

**Step 1: Create auth components**

Simplified versions of recruito's auth flow:
- `LoginPage.tsx` — Google OAuth login button, redirects to `/api/auth/google`
- `AuthCallbackPage.tsx` — Handles OAuth callback, stores JWT
- `AuthProvider.tsx` — React context for auth state, checks `/api/auth/me` on mount
- `ProtectedRoute.tsx` — Wrapper that redirects to login if not authenticated

**Step 2: Commit**

```bash
git add template/web/src/features/auth/ && git commit -m "feat: add auth feature template (conditional)"
```

---

### Task 14: Create App.tsx with conditional auth/redux wrapping

**Files:**
- Create: `template/web/src/App.tsx`

**Step 1: Create App.tsx**

This file needs conditional wrapping:
- If redux: wrap with `<Provider store={store}>`
- If auth: wrap with `<AuthProvider>` and use `<ProtectedRoute>`
- Routes: `/` → Counter, `/login` (conditional: auth), `/auth/callback` (conditional: auth)

Use `// {{AUTH_BLOCK_START/END}}` and `// {{REDUX_BLOCK_START/END}}` markers. The CLI strips unmatched blocks.

**Step 2: Commit**

```bash
git add template/web/src/App.tsx && git commit -m "feat: add App.tsx template with conditional auth/redux blocks"
```

---

### Task 15: Create Docker and deployment files

**Files:**
- Create: `template/Dockerfile`
- Create: `template/docker-compose.yml`
- Create: `template/docker-compose.staging.yml` (conditional: docker=full)
- Create: `template/docker-compose.prod.yml` (conditional: docker=full)
- Create: `template/docker-compose.traefik.yml` (conditional: docker=full)
- Create: `template/traefik/traefik.yml` (conditional: docker=full)
- Create: `template/Makefile`
- Create: `template/.env.example`
- Create: `template/_gitignore`
- Create: `template/web/_gitignore`
- Create: `template/scripts/build_frontend.sh`

**Step 1: Create Dockerfile (multi-stage, matching recruito)**

Copy recruito's Dockerfile pattern exactly:
- Frontend build: `node:22-alpine`, `npm ci`, `npm run build:docker`
- Backend build: `golang:1.25-alpine`, `go mod download`, optimized build
- Final: `alpine:3.21`, non-root user, healthcheck, migrations copy

**Step 2: Create docker-compose.yml (local dev)**

Match recruito pattern: api + db services, postgres:18-alpine, healthcheck, bridge network. Use `{{DB_NAME}}` and `{{PROJECT_NAME_SNAKE}}` placeholders.

**Step 3: Create staging/prod/traefik compose files (conditional)**

Match current template patterns with Traefik v3, SSL, domain labels. Use placeholders for domains.

**Step 4: Create Makefile**

Development targets (always), deployment targets (conditional: docker=full with `// {{FULL_DOCKER_BLOCK_START/END}}` markers).

**Step 5: Create .env.example**

All environment variables with auth-conditional sections.

**Step 6: Create _gitignore files**

Root: `.env`, `node_modules/`, `dist/`, `web/dist/`, Go binaries, etc.
Web: `node_modules/`, `dist/`, `.env`

**Step 7: Commit**

```bash
git add template/ && git commit -m "feat: add Docker, Makefile, and deployment template files"
```

---

### Task 16: Create README.md and CLAUDE.md templates

**Files:**
- Create: `template/README.md`
- Create: `template/CLAUDE.md`

**Step 1: Create README.md**

Project documentation with placeholders. Sections: Overview, Quick Start, Project Structure, API Endpoints, Development, Deployment (conditional). Uses `{{APP_TITLE}}`, `{{DESCRIPTION}}`, etc.

**Step 2: Create CLAUDE.md**

AI assistant instructions for the generated project.

**Step 3: Commit**

```bash
git add template/ && git commit -m "feat: add README.md and CLAUDE.md templates"
```

---

### Task 17: Update template.ts to handle conditional markers and block markers

**Files:**
- Modify: `src/template.ts`

**Step 1: Add marker stripping logic**

After placeholder replacement, process files for:
1. **Line markers** (`// {{GIN_ONLY}}`, `// {{AUTH_ONLY}}`, `// {{REDUX_ONLY}}`):
   - Strip entire line if marker condition not met
   - Remove marker comment from line if condition is met

2. **Block markers** (`// {{AUTH_BLOCK_START}}` ... `// {{AUTH_BLOCK_END}}`):
   - Remove entire block (including markers) if condition not met
   - Remove just the marker lines if condition is met

```typescript
function processMarkers(content: string, answers: ProjectAnswers): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let skipBlock = false;

  for (const line of lines) {
    // Block markers
    if (line.includes('{{AUTH_BLOCK_START}}')) {
      if (!answers.useAuth) skipBlock = true;
      continue;
    }
    if (line.includes('{{AUTH_BLOCK_END}}')) {
      skipBlock = false;
      continue;
    }
    if (line.includes('{{REDUX_BLOCK_START}}')) {
      if (answers.stateManagement !== 'redux') skipBlock = true;
      continue;
    }
    if (line.includes('{{REDUX_BLOCK_END}}')) {
      skipBlock = false;
      continue;
    }
    if (line.includes('{{FULL_DOCKER_BLOCK_START}}')) {
      if (answers.dockerEnv !== 'full') skipBlock = true;
      continue;
    }
    if (line.includes('{{FULL_DOCKER_BLOCK_END}}')) {
      skipBlock = false;
      continue;
    }

    if (skipBlock) continue;

    // Line markers
    if (line.includes('// {{GIN_ONLY}}') || line.includes('# {{GIN_ONLY}}')) {
      if (answers.goFramework === 'gin') {
        result.push(line.replace(/\s*\/\/\s*\{\{GIN_ONLY\}\}/, '').replace(/\s*#\s*\{\{GIN_ONLY\}\}/, ''));
      }
      continue;
    }
    if (line.includes('// {{AUTH_ONLY}}') || line.includes('# {{AUTH_ONLY}}')) {
      if (answers.useAuth) {
        result.push(line.replace(/\s*\/\/\s*\{\{AUTH_ONLY\}\}/, '').replace(/\s*#\s*\{\{AUTH_ONLY\}\}/, ''));
      }
      continue;
    }
    if (line.includes('// {{REDUX_ONLY}}') || line.includes('# {{REDUX_ONLY}}')) {
      if (answers.stateManagement === 'redux') {
        result.push(line.replace(/\s*\/\/\s*\{\{REDUX_ONLY\}\}/, '').replace(/\s*#\s*\{\{REDUX_ONLY\}\}/, ''));
      }
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}
```

Apply `processMarkers` after `processFile` (placeholder replacement).

**Step 2: Commit**

```bash
git add src/template.ts && git commit -m "feat: add conditional marker and block marker processing"
```

---

### Task 18: Build, test locally, and publish

**Step 1: Build the CLI**

```bash
npm run build
```

**Step 2: Test locally with all 4 option combinations**

```bash
# Test 1: Gin + Redux + Auth + Full Docker
node bin/index.js test-gin-redux
# Verify generated project structure and files

# Test 2: Stdlib + Simple + No Auth + Local Docker
node bin/index.js test-stdlib-simple
# Verify generated project structure and files

# Clean up test projects
rm -rf test-gin-redux test-stdlib-simple
```

**Step 3: Verify generated projects work**

```bash
# In a test project:
cd test-project
docker compose up  # Verify DB starts and backend connects
cd web && npm install && npm run dev  # Verify frontend starts
```

**Step 4: Publish to npm**

```bash
npm version 2.0.2
npm publish
```

**Step 5: Commit final changes**

```bash
git add -A && git commit -m "chore: build and prepare v2.0.2 release"
```
