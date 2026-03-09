package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunMigrations executes all .up.sql migration files in order.
// It tracks applied migrations in a schema_migrations table to avoid re-running.
func RunMigrations(ctx context.Context, pool *pgxpool.Pool, migrationsPath string) error {
	// Create schema_migrations table if it doesn't exist
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version bigint NOT NULL PRIMARY KEY,
			dirty boolean NOT NULL DEFAULT false
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// Get current version
	var currentVersion int64
	err = pool.QueryRow(ctx, `SELECT COALESCE(MAX(version), 0) FROM schema_migrations`).Scan(&currentVersion)
	if err != nil {
		return fmt.Errorf("failed to get current migration version: %w", err)
	}

	// Read migration files
	files, err := os.ReadDir(migrationsPath)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	// Filter and sort .up.sql files
	var upMigrations []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".up.sql") {
			upMigrations = append(upMigrations, file.Name())
		}
	}
	sort.Strings(upMigrations)

	if len(upMigrations) == 0 {
		log.Println("No migration files found")
		return nil
	}

	applied := 0
	for _, filename := range upMigrations {
		// Extract version number from filename (e.g., "000001_create_table.up.sql")
		parts := strings.SplitN(strings.TrimSuffix(filename, ".up.sql"), "_", 2)
		version, err := strconv.ParseInt(parts[0], 10, 64)
		if err != nil {
			return fmt.Errorf("invalid migration filename %s: %w", filename, err)
		}

		// Skip already-applied migrations
		if version <= currentVersion {
			continue
		}

		// Read and execute migration
		content, err := os.ReadFile(filepath.Join(migrationsPath, filename))
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", filename, err)
		}

		_, err = pool.Exec(ctx, string(content))
		if err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", filename, err)
		}

		// Record the migration
		_, err = pool.Exec(ctx, `INSERT INTO schema_migrations (version, dirty) VALUES ($1, false)`, version)
		if err != nil {
			return fmt.Errorf("failed to record migration %s: %w", filename, err)
		}

		name := filename
		if len(parts) == 2 {
			name = parts[1]
		}
		log.Printf("Applied migration %d: %s", version, strings.TrimSuffix(name, ".up.sql"))
		applied++
	}

	if applied == 0 {
		log.Println("No new migrations to apply")
	} else {
		log.Printf("Applied %d migration(s) successfully", applied)
	}
	return nil
}
