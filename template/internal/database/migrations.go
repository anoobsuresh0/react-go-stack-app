package database

import (
	"context"
	"fmt"
	"io/fs"
	"log"
	"sort"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// migrationLockKey is an arbitrary constant used with pg_advisory_lock so
// only one instance runs migrations at a time.
const migrationLockKey = 7423_1180_4491

// RunMigrations executes all *.up.sql files from fsys in version order.
// Applied versions are tracked in a schema_migrations table; each migration
// runs inside a transaction.
func RunMigrations(ctx context.Context, pool *pgxpool.Pool, fsys fs.FS) error {
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire connection: %w", err)
	}
	defer conn.Release()

	if _, err := conn.Exec(ctx, `SELECT pg_advisory_lock($1)`, migrationLockKey); err != nil {
		return fmt.Errorf("acquire migration lock: %w", err)
	}
	defer func() {
		if _, err := conn.Exec(context.WithoutCancel(ctx), `SELECT pg_advisory_unlock($1)`, migrationLockKey); err != nil {
			log.Printf("release migration lock: %v", err)
		}
	}()

	if _, err := conn.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version    bigint      NOT NULL PRIMARY KEY,
			applied_at timestamptz NOT NULL DEFAULT NOW()
		)
	`); err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	var currentVersion int64
	if err := conn.QueryRow(ctx, `SELECT COALESCE(MAX(version), 0) FROM schema_migrations`).Scan(&currentVersion); err != nil {
		return fmt.Errorf("read current migration version: %w", err)
	}

	entries, err := fs.ReadDir(fsys, ".")
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	var upMigrations []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			upMigrations = append(upMigrations, entry.Name())
		}
	}
	sort.Strings(upMigrations)

	applied := 0
	for _, filename := range upMigrations {
		version, name, err := parseMigrationName(filename)
		if err != nil {
			return err
		}
		if version <= currentVersion {
			continue
		}

		content, err := fs.ReadFile(fsys, filename)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", filename, err)
		}

		if err := applyMigration(ctx, conn.Conn(), version, string(content)); err != nil {
			return fmt.Errorf("apply migration %s: %w", filename, err)
		}

		log.Printf("Applied migration %d: %s", version, name)
		applied++
	}

	if applied == 0 {
		log.Println("Database schema up to date")
	} else {
		log.Printf("Applied %d migration(s)", applied)
	}
	return nil
}

func applyMigration(ctx context.Context, conn *pgx.Conn, version int64, sql string) error {
	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Simple protocol allows multiple statements per migration file
	if _, err := tx.Exec(ctx, sql, pgx.QueryExecModeSimpleProtocol); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, version); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func parseMigrationName(filename string) (int64, string, error) {
	base := strings.TrimSuffix(filename, ".up.sql")
	parts := strings.SplitN(base, "_", 2)
	version, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return 0, "", fmt.Errorf("invalid migration filename %s (expected NNNNNN_name.up.sql): %w", filename, err)
	}
	name := base
	if len(parts) == 2 {
		name = parts[1]
	}
	return version, name, nil
}
