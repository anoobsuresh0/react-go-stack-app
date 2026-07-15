package models

import "time"

type Counter struct {
	Value     int64     `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}
