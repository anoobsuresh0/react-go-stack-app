-- Counter table for the example application
CREATE TABLE IF NOT EXISTS counters (
    id SERIAL PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
);

-- Insert initial counter if not exists
INSERT INTO counters (id, value) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
