package repository

import (
	"context"
	"fmt"
	"time"

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

func (r *AuthRepository) CreateSession(ctx context.Context, userID, token string, expiresAt time.Time) (*models.Session, error) {
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
