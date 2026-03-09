package middleware

import (
	"context"
	"net/http"
	"strings"

	"{{PROJECT_NAME}}/internal/repository"

	"github.com/golang-jwt/jwt/v5"
)

type AuthMiddleware struct {
	repo      *repository.AuthRepository
	jwtSecret string
}

func NewAuthMiddleware(repo *repository.AuthRepository, jwtSecret string) *AuthMiddleware {
	return &AuthMiddleware{repo: repo, jwtSecret: jwtSecret}
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"Missing authorization header"}`, http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.jwtSecret), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, `{"error":"Invalid token"}`, http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"error":"Invalid token claims"}`, http.StatusUnauthorized)
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok {
			http.Error(w, `{"error":"Invalid user ID in token"}`, http.StatusUnauthorized)
			return
		}

		_, err = m.repo.GetSessionByToken(r.Context(), tokenString)
		if err != nil {
			http.Error(w, `{"error":"Session expired"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "userID", userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
