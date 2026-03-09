module {{PROJECT_NAME}}

go 1.25

require (
	github.com/gin-contrib/cors v1.7.3 // {{GIN_ONLY}}
	github.com/gin-gonic/gin v1.10.0 // {{GIN_ONLY}}
	github.com/golang-jwt/jwt/v5 v5.2.1 // {{AUTH_ONLY}}
	github.com/golang-migrate/migrate/v4 v4.19.1
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.8.0
	github.com/joho/godotenv v1.5.1
	golang.org/x/oauth2 v0.30.0 // {{AUTH_ONLY}}
)
