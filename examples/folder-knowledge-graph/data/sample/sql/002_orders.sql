-- 002_orders.sql
-- Sales tables: orders belong to a user, order_items belong to an order
-- and point back at a book.
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_cents INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    book_id INTEGER NOT NULL REFERENCES books(id),
    quantity INTEGER NOT NULL DEFAULT 1
);
