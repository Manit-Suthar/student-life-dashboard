PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL,
  description TEXT DEFAULT '',
  quantity_total INTEGER NOT NULL CHECK (quantity_total >= 0),
  quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
  status TEXT NOT NULL CHECK (status IN ('available', 'lent', 'consumed', 'maintenance')),
  photo_url TEXT DEFAULT '',
  location TEXT DEFAULT '',
  low_stock_threshold INTEGER NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS borrowed (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  borrow_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  returned_date TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL CHECK (status IN ('borrowed', 'returned', 'overdue')),
  notes TEXT DEFAULT '',
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  details_json TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  actor TEXT DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_borrowed_item_id ON borrowed(item_id);
CREATE INDEX IF NOT EXISTS idx_borrowed_status ON borrowed(status);
