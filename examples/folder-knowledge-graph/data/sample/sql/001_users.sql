-- 001_users.sql
-- Core identity tables: users and their login sessions.
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
