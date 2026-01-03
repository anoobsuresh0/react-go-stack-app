package repository

import (
	"database/sql"

	"backend/internal/models"
)

type CounterRepository struct {
	db *sql.DB
}

func NewCounterRepository(db *sql.DB) *CounterRepository {
	return &CounterRepository{db: db}
}

func (r *CounterRepository) Get() (*models.Counter, error) {
	counter := &models.Counter{}
	err := r.db.QueryRow("SELECT id, value FROM counters WHERE id = 1").Scan(&counter.ID, &counter.Value)
	if err != nil {
		return nil, err
	}
	return counter, nil
}

func (r *CounterRepository) Increment() (*models.Counter, error) {
	counter := &models.Counter{}
	err := r.db.QueryRow(
		"UPDATE counters SET value = value + 1 WHERE id = 1 RETURNING id, value",
	).Scan(&counter.ID, &counter.Value)
	if err != nil {
		return nil, err
	}
	return counter, nil
}

func (r *CounterRepository) Decrement() (*models.Counter, error) {
	counter := &models.Counter{}
	err := r.db.QueryRow(
		"UPDATE counters SET value = value - 1 WHERE id = 1 RETURNING id, value",
	).Scan(&counter.ID, &counter.Value)
	if err != nil {
		return nil, err
	}
	return counter, nil
}
