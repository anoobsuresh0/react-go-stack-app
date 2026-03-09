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
