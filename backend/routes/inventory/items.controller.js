const db = require("./db");

const VALID_ITEM_STATUS = ["available", "lent", "consumed", "maintenance"];
const VALID_BORROW_STATUS = ["borrowed", "returned", "overdue"];

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

const createId = (prefix) => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}_${suffix}`;
};

const asInt = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
};

const normalize = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const toItemStatus = (quantityAvailable, quantityTotal, currentStatus) => {
  if (currentStatus === "maintenance" || currentStatus === "consumed") return currentStatus;
  if (quantityAvailable <= 0 && quantityTotal > 0) return "lent";
  return "available";
};

const recordEvent = db.prepare(`
  INSERT INTO events (id, event_type, details_json, timestamp, actor)
  VALUES (@id, @event_type, @details_json, @timestamp, @actor)
`);

const runInTransaction = (fn) => {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

const itemSelectBase = `
  SELECT
    i.id,
    i.name,
    i.sku,
    i.category_id,
    c.name AS category,
    i.description,
    i.quantity_total,
    i.quantity_available,
    i.status,
    i.photo_url,
    i.location,
    i.low_stock_threshold,
    i.created_at,
    i.updated_at
  FROM items i
  LEFT JOIN categories c ON c.id = i.category_id
`;

exports.getItems = (req, res) => {
  const page = Math.max(asInt(req.query.page, 1), 1);
  const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100);
  const offset = (page - 1) * pageSize;
  const q = normalize(req.query.q);
  const category = normalize(req.query.category);
  const status = normalize(req.query.status).toLowerCase();

  const where = [];
  const params = {};

  if (q) {
    where.push("(LOWER(i.name) LIKE @q OR LOWER(i.sku) LIKE @q OR LOWER(c.name) LIKE @q)");
    params.q = `%${q.toLowerCase()}%`;
  }
  if (category) {
    where.push("(i.category_id = @categoryId OR LOWER(c.name) = @categoryName)");
    params.categoryId = category;
    params.categoryName = category.toLowerCase();
  }
  if (status) {
    where.push("LOWER(i.status) = @status");
    params.status = status;
  }
  if (String(req.query.lowStock).toLowerCase() === "true") {
    where.push("i.quantity_available <= i.low_stock_threshold");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS total FROM items i LEFT JOIN categories c ON c.id = i.category_id ${whereSql}`)
    .get(params);

  const rows = db
    .prepare(
      `${itemSelectBase}
       ${whereSql}
       ORDER BY i.updated_at DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: pageSize, offset });

  res.json({
    items: rows,
    meta: {
      page,
      pageSize,
      total: totalRow.total,
    },
  });
};

exports.createItem = (req, res) => {
  const name = normalize(req.body.name);
  const sku = normalize(req.body.sku);
  const categoryId = normalize(req.body.category_id);
  const quantityTotal = asInt(req.body.quantity_total, NaN);
  const lowStockThreshold = asInt(req.body.low_stock_threshold, 0);
  const description = normalize(req.body.description);
  const location = normalize(req.body.location);
  const photoUrl = normalize(req.body.photo_url);

  if (!name || !sku || !categoryId || !Number.isFinite(quantityTotal) || quantityTotal < 0) {
    return res.status(400).json({ message: "Invalid item payload" });
  }
  if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
    return res.status(400).json({ message: "Invalid low stock threshold" });
  }

  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId);
  if (!category) return res.status(400).json({ message: "Category not found" });

  const id = createId("item");
  const createdAt = nowIso();
  const quantityAvailable = quantityTotal;
  const status = toItemStatus(quantityAvailable, quantityTotal, "available");

  try {
    db.prepare(`
      INSERT INTO items (
        id, name, sku, category_id, description, quantity_total, quantity_available, status,
        photo_url, location, low_stock_threshold, created_at, updated_at
      ) VALUES (
        @id, @name, @sku, @category_id, @description, @quantity_total, @quantity_available, @status,
        @photo_url, @location, @low_stock_threshold, @created_at, @updated_at
      )
    `).run({
      id,
      name,
      sku,
      category_id: categoryId,
      description,
      quantity_total: quantityTotal,
      quantity_available: quantityAvailable,
      status,
      photo_url: photoUrl,
      location,
      low_stock_threshold: lowStockThreshold,
      created_at: createdAt,
      updated_at: createdAt,
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "SKU already exists" });
    }
    throw error;
  }

  recordEvent.run({
    id: createId("evt"),
    event_type: "item_created",
    details_json: JSON.stringify({ item_id: id }),
    timestamp: nowIso(),
    actor: normalize(req.body.actor, "system"),
  });

  const created = db.prepare(`${itemSelectBase} WHERE i.id = ?`).get(id);
  return res.status(201).json(created);
};

exports.updateItem = (req, res) => {
  const id = normalize(req.params.id);
  const current = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
  if (!current) return res.status(404).json({ message: "Item not found" });

  const next = {
    name: normalize(req.body.name, current.name),
    sku: normalize(req.body.sku, current.sku),
    category_id: normalize(req.body.category_id, current.category_id),
    description: normalize(req.body.description, current.description),
    quantity_total: req.body.quantity_total === undefined ? current.quantity_total : asInt(req.body.quantity_total, NaN),
    quantity_available:
      req.body.quantity_available === undefined ? current.quantity_available : asInt(req.body.quantity_available, NaN),
    status: normalize(req.body.status, current.status).toLowerCase(),
    photo_url: normalize(req.body.photo_url, current.photo_url),
    location: normalize(req.body.location, current.location),
    low_stock_threshold:
      req.body.low_stock_threshold === undefined
        ? current.low_stock_threshold
        : asInt(req.body.low_stock_threshold, NaN),
  };

  if (
    !next.name ||
    !next.sku ||
    !next.category_id ||
    !Number.isFinite(next.quantity_total) ||
    !Number.isFinite(next.quantity_available) ||
    !Number.isFinite(next.low_stock_threshold)
  ) {
    return res.status(400).json({ message: "Invalid item payload" });
  }
  if (next.quantity_total < 0 || next.quantity_available < 0 || next.low_stock_threshold < 0) {
    return res.status(400).json({ message: "Quantities must be non-negative" });
  }
  if (next.quantity_available > next.quantity_total) {
    return res.status(400).json({ message: "quantity_available cannot exceed quantity_total" });
  }
  if (!VALID_ITEM_STATUS.includes(next.status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(next.category_id);
  if (!category) return res.status(400).json({ message: "Category not found" });

  try {
    db.prepare(`
      UPDATE items
      SET
        name = @name,
        sku = @sku,
        category_id = @category_id,
        description = @description,
        quantity_total = @quantity_total,
        quantity_available = @quantity_available,
        status = @status,
        photo_url = @photo_url,
        location = @location,
        low_stock_threshold = @low_stock_threshold,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id,
      ...next,
      updated_at: nowIso(),
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "SKU already exists" });
    }
    throw error;
  }

  recordEvent.run({
    id: createId("evt"),
    event_type: "item_updated",
    details_json: JSON.stringify({ item_id: id }),
    timestamp: nowIso(),
    actor: normalize(req.body.actor, "system"),
  });

  const updated = db.prepare(`${itemSelectBase} WHERE i.id = ?`).get(id);
  return res.json(updated);
};

exports.getBorrowed = (req, res) => {
  const itemId = normalize(req.query.item_id);
  const status = normalize(req.query.status).toLowerCase();
  const where = [];
  const params = {};

  if (itemId) {
    where.push("b.item_id = @itemId");
    params.itemId = itemId;
  }
  if (status && VALID_BORROW_STATUS.includes(status)) {
    where.push("LOWER(b.status) = @status");
    params.status = status;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db
    .prepare(`
      SELECT
        b.id,
        b.item_id,
        i.name AS item_name,
        b.borrower_name,
        b.borrow_date,
        b.due_date,
        b.returned_date,
        b.quantity,
        b.status,
        b.notes
      FROM borrowed b
      JOIN items i ON i.id = b.item_id
      ${whereSql}
      ORDER BY b.borrow_date DESC, b.id DESC
    `)
    .all(params);

  res.json({ borrowed: rows });
};

const borrowTxn = (payload) =>
  runInTransaction(() => {
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(payload.item_id);
    if (!item) throw new Error("ITEM_NOT_FOUND");

    const quantity = asInt(payload.quantity, NaN);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("INVALID_QUANTITY");

    if (item.status === "consumed" || item.status === "maintenance") {
      throw new Error("ITEM_NOT_BORROWABLE");
    }

    if (item.quantity_available < quantity) {
      throw new Error("NOT_ENOUGH_STOCK");
    }

    const borrowDate = normalize(payload.borrow_date, today());
    const dueDate = normalize(payload.due_date);
    const borrowerName = normalize(payload.borrower_name);

    if (!borrowerName || !dueDate) throw new Error("INVALID_BORROW_PAYLOAD");

    const id = createId("b");
    const nextAvailable = item.quantity_available - quantity;
    const nextStatus = toItemStatus(nextAvailable, item.quantity_total, item.status);

    db.prepare(`
      INSERT INTO borrowed (
        id, item_id, borrower_name, borrow_date, due_date, returned_date, quantity, status, notes
      ) VALUES (
        @id, @item_id, @borrower_name, @borrow_date, @due_date, NULL, @quantity, @status, @notes
      )
    `).run({
      id,
      item_id: item.id,
      borrower_name: borrowerName,
      borrow_date: borrowDate,
      due_date: dueDate,
      quantity,
      status: dueDate < today() ? "overdue" : "borrowed",
      notes: normalize(payload.notes),
    });

    db.prepare(`
      UPDATE items
      SET quantity_available = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(nextAvailable, nextStatus, nowIso(), item.id);

    recordEvent.run({
      id: createId("evt"),
      event_type: "item_borrowed",
      details_json: JSON.stringify({ borrowed_id: id, item_id: item.id, quantity }),
      timestamp: nowIso(),
      actor: normalize(payload.actor, borrowerName),
    });

    return db
      .prepare(`
        SELECT
          b.id,
          b.item_id,
          i.name AS item_name,
          b.borrower_name,
          b.borrow_date,
          b.due_date,
          b.returned_date,
          b.quantity,
          b.status,
          b.notes
        FROM borrowed b
        JOIN items i ON i.id = b.item_id
        WHERE b.id = ?
      `)
      .get(id);
  });

exports.createBorrowed = (req, res) => {
  try {
    const created = borrowTxn(req.body);
    return res.status(201).json(created);
  } catch (error) {
    if (error.message === "ITEM_NOT_FOUND") return res.status(404).json({ message: "Item not found" });
    if (error.message === "INVALID_QUANTITY") return res.status(400).json({ message: "Quantity must be greater than 0" });
    if (error.message === "ITEM_NOT_BORROWABLE") {
      return res.status(400).json({ message: "Item cannot be borrowed in current status" });
    }
    if (error.message === "NOT_ENOUGH_STOCK") {
      return res.status(400).json({ message: "Not enough stock available" });
    }
    if (error.message === "INVALID_BORROW_PAYLOAD") {
      return res.status(400).json({ message: "Borrower name and due date are required" });
    }
    throw error;
  }
};

const returnTxn = (borrowedId, actor) =>
  runInTransaction(() => {
    const row = db.prepare("SELECT * FROM borrowed WHERE id = ?").get(borrowedId);
    if (!row) throw new Error("BORROW_NOT_FOUND");
    if (row.returned_date) throw new Error("ALREADY_RETURNED");

    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(row.item_id);
    if (!item) throw new Error("ITEM_NOT_FOUND");

    const returnedDate = today();
    const nextAvailable = item.quantity_available + row.quantity;
    if (nextAvailable > item.quantity_total) {
      throw new Error("INVALID_RETURN_QUANTITY");
    }
    const nextStatus = toItemStatus(nextAvailable, item.quantity_total, item.status);

    db.prepare(`
      UPDATE borrowed
      SET returned_date = ?, status = 'returned'
      WHERE id = ?
    `).run(returnedDate, borrowedId);

    db.prepare(`
      UPDATE items
      SET quantity_available = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(nextAvailable, nextStatus, nowIso(), item.id);

    recordEvent.run({
      id: createId("evt"),
      event_type: "item_returned",
      details_json: JSON.stringify({ borrowed_id: borrowedId, item_id: item.id, quantity: row.quantity }),
      timestamp: nowIso(),
      actor,
    });

    return db
      .prepare(`
        SELECT
          b.id,
          b.item_id,
          i.name AS item_name,
          b.borrower_name,
          b.borrow_date,
          b.due_date,
          b.returned_date,
          b.quantity,
          b.status,
          b.notes
        FROM borrowed b
        JOIN items i ON i.id = b.item_id
        WHERE b.id = ?
      `)
      .get(borrowedId);
  });

exports.returnBorrowed = (req, res) => {
  const borrowedId = normalize(req.params.id);
  try {
    const updated = returnTxn(borrowedId, normalize(req.body?.actor, "system"));
    return res.json(updated);
  } catch (error) {
    if (error.message === "BORROW_NOT_FOUND") return res.status(404).json({ message: "Borrow record not found" });
    if (error.message === "ALREADY_RETURNED") return res.status(400).json({ message: "Item already returned" });
    if (error.message === "ITEM_NOT_FOUND") return res.status(404).json({ message: "Item not found" });
    if (error.message === "INVALID_RETURN_QUANTITY") {
      return res.status(409).json({ message: "Return would exceed total inventory quantity" });
    }
    throw error;
  }
};

exports.getStats = (req, res) => {
  const totals = db
    .prepare(`
      SELECT
        COUNT(*) AS total_items,
        COALESCE(SUM(quantity_available), 0) AS total_available
      FROM items
    `)
    .get();

  const lowStock = db
    .prepare(`
      SELECT id AS item_id, name
      FROM items
      WHERE quantity_available <= low_stock_threshold
      ORDER BY name
    `)
    .all();

  const byCategory = db
    .prepare(`
      SELECT c.name AS category, COUNT(i.id) AS count
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY count DESC, c.name ASC
    `)
    .all();

  const topBorrowed = db
    .prepare(`
      SELECT
        i.id AS item_id,
        i.name,
        COALESCE(SUM(b.quantity), 0) AS borrow_count
      FROM items i
      LEFT JOIN borrowed b ON b.item_id = i.id
      GROUP BY i.id, i.name
      ORDER BY borrow_count DESC, i.name ASC
      LIMIT 5
    `)
    .all();

  res.json({
    total_items: totals.total_items,
    total_available: totals.total_available,
    low_stock: lowStock,
    by_category: byCategory,
    top_borrowed: topBorrowed,
  });
};

exports.getCategories = (req, res) => {
  const categories = db
    .prepare(`
      SELECT
        c.id,
        c.name,
        c.description,
        COUNT(i.id) AS item_count
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id
      GROUP BY c.id, c.name, c.description
      ORDER BY c.name ASC
    `)
    .all();
  res.json({ categories });
};

exports.createCategory = (req, res) => {
  const name = normalize(req.body.name);
  const description = normalize(req.body.description);
  if (!name) return res.status(400).json({ message: "Category name is required" });

  const id = normalize(req.body.id, `cat_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`);
  if (!id) return res.status(400).json({ message: "Invalid category id" });

  try {
    db.prepare("INSERT INTO categories (id, name, description) VALUES (?, ?, ?)").run(id, name, description);
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "Category id or name already exists" });
    }
    throw error;
  }

  return res.status(201).json({ id, name, description });
};

exports.updateCategory = (req, res) => {
  const id = normalize(req.params.id);
  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ message: "Category not found" });

  const name = normalize(req.body.name, existing.name);
  const description = normalize(req.body.description, existing.description);
  if (!name) return res.status(400).json({ message: "Category name is required" });

  try {
    db.prepare("UPDATE categories SET name = ?, description = ? WHERE id = ?").run(name, description, id);
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "Category name already exists" });
    }
    throw error;
  }

  return res.json({ id, name, description });
};

exports.deleteCategory = (req, res) => {
  const id = normalize(req.params.id);
  const linked = db.prepare("SELECT COUNT(*) AS count FROM items WHERE category_id = ?").get(id);
  if (linked.count > 0) {
    return res.status(400).json({ message: "Cannot delete category with linked items" });
  }

  const result = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ message: "Category not found" });
  return res.status(204).send();
};
