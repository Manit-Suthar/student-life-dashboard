INSERT OR IGNORE INTO categories (id, name, description) VALUES
  ('cat_gadgets', 'Gadgets', 'Electronics and accessories'),
  ('cat_stationery', 'Stationery', 'Daily study and writing supplies'),
  ('cat_books', 'Books', 'Academic and reference books'),
  ('cat_lab', 'Lab Equipment', 'Lab and workshop inventory');

INSERT OR IGNORE INTO items (
  id, name, sku, category_id, description, quantity_total, quantity_available, status, photo_url, location, low_stock_threshold, created_at, updated_at
) VALUES
  ('item_01', 'USB C Cable', 'CAB-USB-C-001', 'cat_gadgets', 'Type-C cable 1m', 10, 7, 'available', '', 'Shelf A', 2, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z'),
  ('item_02', 'HDMI Adapter', 'GAD-HDMI-001', 'cat_gadgets', 'USB-C to HDMI adapter', 8, 3, 'available', '', 'Shelf A', 2, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z'),
  ('item_03', 'Power Bank', 'GAD-PWB-001', 'cat_gadgets', '10000mAh portable power bank', 6, 2, 'available', '', 'Shelf B', 2, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z'),
  ('item_04', 'Blue Pens Pack', 'STA-PEN-001', 'cat_stationery', 'Pack of blue pens', 30, 12, 'available', '', 'Shelf C', 5, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z'),
  ('item_05', 'Sticky Notes', 'STA-STK-001', 'cat_stationery', 'Sticky notes set', 20, 4, 'available', '', 'Shelf C', 4, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z'),
  ('item_06', 'Physics Textbook', 'BOK-PHY-001', 'cat_books', 'Engineering physics textbook', 12, 8, 'available', '', 'Shelf D', 2, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z'),
  ('item_07', 'Calculus Workbook', 'BOK-CAL-001', 'cat_books', 'Practice workbook for calculus', 10, 6, 'available', '', 'Shelf D', 2, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z'),
  ('item_08', 'Lab Goggles', 'LAB-GOG-001', 'cat_lab', 'Protective eyewear', 15, 5, 'available', '', 'Shelf E', 3, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z'),
  ('item_09', 'Soldering Iron', 'LAB-SLD-001', 'cat_lab', 'Portable soldering iron', 5, 1, 'maintenance', '', 'Shelf E', 1, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z'),
  ('item_10', 'Notebook A4', 'STA-NBK-001', 'cat_stationery', 'A4 ruled notebook', 50, 30, 'available', '', 'Shelf C', 8, '2026-01-10T10:00:00.000Z', '2026-01-10T10:00:00.000Z');

INSERT OR IGNORE INTO borrowed (
  id, item_id, borrower_name, borrow_date, due_date, returned_date, quantity, status, notes
) VALUES
  ('b_01', 'item_01', 'Fenil', '2026-02-10', '2026-03-01', NULL, 2, 'borrowed', 'Project demo'),
  ('b_02', 'item_02', 'Aarav', '2026-02-05', '2026-02-20', NULL, 1, 'overdue', 'Hackathon setup'),
  ('b_03', 'item_06', 'Nisha', '2026-02-01', '2026-02-14', '2026-02-13', 1, 'returned', 'Exam prep'),
  ('b_04', 'item_08', 'Riya', '2026-02-08', '2026-02-22', NULL, 2, 'borrowed', 'Chemistry lab'),
  ('b_05', 'item_03', 'Karan', '2026-01-28', '2026-02-07', '2026-02-06', 1, 'returned', 'Event duty');

INSERT OR IGNORE INTO events (id, event_type, details_json, timestamp, actor) VALUES
  ('evt_01', 'seed', '{"message":"inventory seeded"}', '2026-02-20T00:00:00.000Z', 'system');
