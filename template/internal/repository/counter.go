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
		`SELECT value, updated_at FROM counter WHERE id = 1`,
	).Scan(&c.Value, &c.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get counter: %w", err)
	}
	return &c, nil
}

// Adjust atomically adds delta to the counter and returns the new state.
func (r *CounterRepository) Adjust(ctx context.Context, delta int64) (*models.Counter, error) {
	var c models.Counter
	err := r.db.QueryRow(ctx,
		`UPDATE counter SET value = value + $1, updated_at = NOW() WHERE id = 1 RETURNING value, updated_at`,
		delta,
	).Scan(&c.Value, &c.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("adjust counter: %w", err)
	}
	return &c, nil
}
