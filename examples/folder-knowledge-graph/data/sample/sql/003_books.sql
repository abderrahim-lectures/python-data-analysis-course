-- 003_books.sql
-- Inventory and pricing tables for the bookstore.
CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tax_rates (
    id INTEGER PRIMARY KEY,
    country_code TEXT NOT NULL UNIQUE,
    rate REAL NOT NULL
);
