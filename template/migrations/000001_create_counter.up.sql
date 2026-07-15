-- Single-row counter table: the CHECK constraint guarantees exactly one row
-- can ever exist, so updates are simple and atomic.
CREATE TABLE counter (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO counter (id, value) VALUES (1, 0);
