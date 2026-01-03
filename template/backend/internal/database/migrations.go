package database

import (
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"sort"
	"strings"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// RunMigrations executes all pending up migrations
func RunMigrations(db *sql.DB) error {
	// Create migrations tracking table if not exists
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get all migration files
	entries, err := fs.ReadDir(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	// Filter and sort up migrations
	var upMigrations []string
	for _, entry := range entries {
		if strings.HasSuffix(entry.Name(), ".up.sql") {
			upMigrations = append(upMigrations, entry.Name())
		}
	}
	sort.Strings(upMigrations)

	// Run each migration
	for _, migration := range upMigrations {
		version := strings.TrimSuffix(migration, ".up.sql")

		// Check if already applied
		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", version).Scan(&exists)
		if err != nil {
			return fmt.Errorf("failed to check migration status: %w", err)
		}

		if exists {
			log.Printf("Migration %s already applied, skipping", version)
			continue
		}

		// Read migration file
		content, err := fs.ReadFile(migrationsFS, "migrations/"+migration)
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", migration, err)
		}

		// Execute migration
		log.Printf("Running migration: %s", version)
		_, err = db.Exec(string(content))
		if err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", migration, err)
		}

		// Record migration
		_, err = db.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", version)
		if err != nil {
			return fmt.Errorf("failed to record migration %s: %w", migration, err)
		}

		log.Printf("Migration %s applied successfully", version)
	}

	return nil
}

// RollbackMigration rolls back the last applied migration
func RollbackMigration(db *sql.DB) error {
	// Get the last applied migration
	var version string
	err := db.QueryRow("SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1").Scan(&version)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Println("No migrations to rollback")
			return nil
		}
		return fmt.Errorf("failed to get last migration: %w", err)
	}

	// Read down migration file
	downFile := version + ".down.sql"
	content, err := fs.ReadFile(migrationsFS, "migrations/"+downFile)
	if err != nil {
		return fmt.Errorf("failed to read down migration %s: %w", downFile, err)
	}

	// Execute rollback
	log.Printf("Rolling back migration: %s", version)
	_, err = db.Exec(string(content))
	if err != nil {
		return fmt.Errorf("failed to execute rollback %s: %w", downFile, err)
	}

	// Remove migration record
	_, err = db.Exec("DELETE FROM schema_migrations WHERE version = $1", version)
	if err != nil {
		return fmt.Errorf("failed to remove migration record %s: %w", version, err)
	}

	log.Printf("Migration %s rolled back successfully", version)
	return nil
}
