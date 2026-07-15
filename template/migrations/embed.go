// Package migrations embeds the SQL migration files so the compiled binary
// is self-contained and can run migrations from anywhere.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
