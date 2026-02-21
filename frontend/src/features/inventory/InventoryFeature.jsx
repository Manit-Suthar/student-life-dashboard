import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  createBorrowed,
  createCategory,
  createItem,
  deleteCategory,
  getBorrowed,
  getCategories,
  getItems,
  getStats,
  returnBorrowed,
  updateCategory,
  updateItem,
} from "./services/inventoryApi";
import "./inventory.css";

const AUTH_KEY = "inventory_auth_user";

const defaultItemForm = {
  name: "",
  sku: "",
  category_id: "",
  description: "",
  quantity_total: 1,
  low_stock_threshold: 1,
  photo_url: "",
  location: "",
};

function statusClass(status) {
  return `inventory-status inventory-status-${status || "available"}`;
}

function isLowStock(item) {
  return Number(item.quantity_available) <= Number(item.low_stock_threshold);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function AuthGate({ children }) {
  const [user, setUser] = useState(() => localStorage.getItem(AUTH_KEY));
  const [form, setForm] = useState({ email: "", password: "" });

  if (user) {
    return (
      <div>
        <div className="inventory-user-banner chart-card">
          <div>Signed in as {user}</div>
          <button
            className="inventory-btn inventory-btn-muted"
            onClick={() => {
              localStorage.removeItem(AUTH_KEY);
              setUser("");
            }}
          >
            Sign out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="inventory-auth-wrap">
      <div className="inventory-auth-card">
        <h2 className="chart-title">Inventory Access</h2>
        <p className="text-secondary">Mock auth for inventory module</p>
        <div className="inventory-form-grid">
          <label className="inventory-field">
            <span>Email</span>
            <input
              className="inventory-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </label>
          <label className="inventory-field">
            <span>Password</span>
            <input
              className="inventory-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </label>
        </div>
        <button
          className="inventory-btn"
          onClick={() => {
            if (!form.email.trim() || !form.password.trim()) return;
            localStorage.setItem(AUTH_KEY, form.email.trim());
            setUser(form.email.trim());
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

function InventoryLayout() {
  return (
    <div className="fade-in">
      <div className="inventory-header chart-card">
        <div>
          <h2 className="chart-title">Inventory Management</h2>
          <p className="text-secondary">Dashboard, items, borrows, categories, and analytics</p>
        </div>
      </div>
      <nav className="inventory-subnav">
        <NavLink to="/inventory/dashboard">Dashboard</NavLink>
        <NavLink to="/inventory/items">Item List</NavLink>
        <NavLink to="/inventory/borrowed">Borrowed Items</NavLink>
        <NavLink to="/inventory/categories">Categories</NavLink>
        <NavLink to="/inventory/analytics">Availability Analytics</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/inventory/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/borrowed" element={<BorrowedPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [borrowed, setBorrowed] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [statsData, borrowedData] = await Promise.all([getStats(), getBorrowed()]);
        setStats(statsData);
        setBorrowed(borrowedData.borrowed || []);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  const activeBorrowed = borrowed.filter((row) => !row.returned_date);

  return (
    <div>
      {error ? <p className="inventory-error inventory-error-banner">{error}</p> : null}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{stats?.total_items ?? 0}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{activeBorrowed.length}</div>
          <div className="stat-label">Total Borrowed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.low_stock?.length ?? 0}</div>
          <div className="stat-label">Low Stock</div>
        </div>
      </div>

      <div className="chart-card inventory-page-header">
        <h3 className="chart-title">Recent Borrowed</h3>
        <button className="inventory-btn" onClick={() => navigate("/inventory/items")}>
          Quick Add Item
        </button>
      </div>
      <div className="chart-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Borrower</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {borrowed.slice(0, 5).map((row) => (
              <tr key={row.id}>
                <td>{row.item_name}</td>
                <td>{row.borrower_name}</td>
                <td>{row.quantity}</td>
                <td><span className={statusClass(row.status)}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Category Chart</h3>
        <div className="inventory-bars">
          {(stats?.by_category || []).map((row) => (
            <div className="inventory-bar-row" key={row.category}>
              <div className="inventory-bar-label">{row.category}</div>
              <div className="inventory-bar-track">
                <div className="inventory-bar-fill" style={{ width: `${Math.max(row.count * 12, 6)}%` }} />
              </div>
              <div className="inventory-bar-count">{row.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ItemsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 });
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState({ q: "", category: "", status: "" });
  const [error, setError] = useState("");
  const [itemModal, setItemModal] = useState(null);
  const [borrowModal, setBorrowModal] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailBorrowed, setDetailBorrowed] = useState([]);

  const load = async () => {
    try {
      const [itemsData, categoriesData] = await Promise.all([getItems(query), getCategories()]);
      setItems(itemsData.items || []);
      setMeta(itemsData.meta || { page: 1, pageSize: 20, total: 0 });
      setCategories(categoriesData.categories || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [query.q, query.category, query.status]);

  const openDetail = async (item) => {
    setDetailItem(item);
    try {
      const borrowedData = await getBorrowed({ item_id: item.id });
      setDetailBorrowed(borrowedData.borrowed || []);
    } catch {
      setDetailBorrowed([]);
    }
  };

  const categoryOptions = useMemo(() => categories.map((c) => c), [categories]);

  return (
    <div>
      {error ? <p className="inventory-error inventory-error-banner">{error}</p> : null}
      <div className="inventory-filters chart-card">
        <input
          className="inventory-input"
          placeholder="Search by name, sku, category"
          value={query.q}
          onChange={(e) => setQuery((prev) => ({ ...prev, q: e.target.value }))}
        />
        <select
          className="inventory-input"
          value={query.category}
          onChange={(e) => setQuery((prev) => ({ ...prev, category: e.target.value }))}
        >
          <option value="">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className="inventory-input"
          value={query.status}
          onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value="">All status</option>
          <option value="available">available</option>
          <option value="lent">lent</option>
          <option value="consumed">consumed</option>
          <option value="maintenance">maintenance</option>
        </select>
        <button className="inventory-btn inventory-btn-muted" onClick={() => setQuery({ q: "", category: "", status: "" })}>
          Reset
        </button>
        <button className="inventory-btn" onClick={() => setItemModal({ mode: "create", item: null })}>
          Add Item
        </button>
      </div>

      <div className="chart-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Availability</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="inventory-name-cell">
                    {item.name}
                    {isLowStock(item) ? <small className="inventory-low-stock-tag">Low stock</small> : null}
                  </div>
                </td>
                <td>{item.category}</td>
                <td>{item.quantity_available} / {item.quantity_total}</td>
                <td><span className={statusClass(item.status)}>{item.status}</span></td>
                <td>
                  <div className="inventory-action-row">
                    <button className="inventory-btn inventory-btn-muted" onClick={() => setItemModal({ mode: "edit", item })}>
                      Edit
                    </button>
                    <button className="inventory-btn" onClick={() => setBorrowModal(item)}>
                      Borrow
                    </button>
                    <button className="inventory-btn inventory-btn-muted" onClick={() => openDetail(item)}>
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-secondary">Showing {items.length} of {meta.total} items</p>
      </div>

      {itemModal ? (
        <ItemFormModal
          mode={itemModal.mode}
          item={itemModal.item}
          categories={categories}
          onClose={() => setItemModal(null)}
          onSaved={async () => {
            setItemModal(null);
            await load();
          }}
        />
      ) : null}

      {borrowModal ? (
        <BorrowModal
          item={borrowModal}
          onClose={() => setBorrowModal(null)}
          onSaved={async () => {
            setBorrowModal(null);
            await load();
          }}
        />
      ) : null}

      {detailItem ? (
        <ItemDetailsModal
          item={detailItem}
          borrowedRows={detailBorrowed}
          onClose={() => setDetailItem(null)}
        />
      ) : null}
    </div>
  );
}

function BorrowedPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await getBorrowed();
      setRows(data.borrowed || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      {error ? <p className="inventory-error inventory-error-banner">{error}</p> : null}
      <div className="chart-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Borrower</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.filter((row) => !row.returned_date).map((row) => {
              const overdue = row.status === "overdue" || row.due_date < todayISO();
              return (
                <tr key={row.id} className={overdue ? "inventory-overdue-row" : ""}>
                  <td>{row.item_name}</td>
                  <td>{row.borrower_name}</td>
                  <td>{row.borrow_date}</td>
                  <td>{row.due_date}</td>
                  <td>{row.quantity}</td>
                  <td><span className={statusClass(overdue ? "overdue" : row.status)}>{overdue ? "overdue" : row.status}</span></td>
                  <td>
                    <button
                      className="inventory-btn inventory-btn-success"
                      onClick={async () => {
                        try {
                          await returnBorrowed(row.id);
                          await load();
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                    >
                      Return Item
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", description: "" });

  const load = async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      {error ? <p className="inventory-error inventory-error-banner">{error}</p> : null}
      <div className="chart-card">
        <h3 className="chart-title">{editRow ? "Edit Category" : "Create Category"}</h3>
        <div className="inventory-form-grid">
          {!editRow ? (
            <label className="inventory-field">
              <span>Category ID</span>
              <input className="inventory-input" value={form.id} onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))} />
            </label>
          ) : null}
          <label className="inventory-field">
            <span>Name</span>
            <input className="inventory-input" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </label>
          <label className="inventory-field inventory-field-full">
            <span>Description</span>
            <input className="inventory-input" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </label>
        </div>
        <div className="inventory-action-row">
          <button
            className="inventory-btn"
            onClick={async () => {
              try {
                if (editRow) {
                  await updateCategory(editRow.id, { name: form.name, description: form.description });
                } else {
                  await createCategory(form);
                }
                setEditRow(null);
                setForm({ id: "", name: "", description: "" });
                await load();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            {editRow ? "Save Category" : "Create Category"}
          </button>
          {editRow ? (
            <button
              className="inventory-btn inventory-btn-muted"
              onClick={() => {
                setEditRow(null);
                setForm({ id: "", name: "", description: "" });
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      <div className="chart-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.description}</td>
                <td>{category.item_count}</td>
                <td>
                  <div className="inventory-action-row">
                    <button
                      className="inventory-btn inventory-btn-muted"
                      onClick={() => {
                        setEditRow(category);
                        setForm({ id: category.id, name: category.name, description: category.description || "" });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="inventory-btn inventory-btn-danger"
                      onClick={async () => {
                        try {
                          await deleteCategory(category.id);
                          await load();
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  const availabilityPercent = useMemo(() => {
    if (!stats?.total_items) return 0;
    if (!stats.total_available) return 0;
    const ratio = (stats.total_available / Math.max(stats.total_available + (stats.low_stock?.length || 0), 1)) * 100;
    return Math.max(0, Math.min(100, Math.round(ratio)));
  }, [stats]);

  return (
    <div>
      {error ? <p className="inventory-error inventory-error-banner">{error}</p> : null}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{availabilityPercent}%</div>
          <div className="stat-label">Availability Summary</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.top_borrowed?.[0]?.borrow_count ?? 0}</div>
          <div className="stat-label">Top Borrow Volume</div>
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Top Borrowed Items</h3>
        <ul className="inventory-list-plain">
          {(stats?.top_borrowed || []).map((row) => (
            <li key={row.item_id}>{row.name} - {row.borrow_count}</li>
          ))}
        </ul>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Low Stock List</h3>
        <ul className="inventory-list-plain">
          {(stats?.low_stock || []).map((row) => (
            <li key={row.item_id}>{row.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ItemFormModal({ mode, item, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!item) return defaultItemForm;
    return {
      name: item.name || "",
      sku: item.sku || "",
      category_id: item.category_id || "",
      description: item.description || "",
      quantity_total: item.quantity_total ?? 1,
      low_stock_threshold: item.low_stock_threshold ?? 1,
      photo_url: item.photo_url || "",
      location: item.location || "",
      quantity_available: item.quantity_available ?? 1,
      status: item.status || "available",
    };
  });
  const [error, setError] = useState("");

  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal-card">
        <h3 className="chart-title">{mode === "create" ? "Add Item" : "Edit Item"}</h3>
        <div className="inventory-form-grid">
          <label className="inventory-field">
            <span>Name</span>
            <input className="inventory-input" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </label>
          <label className="inventory-field">
            <span>SKU</span>
            <input className="inventory-input" value={form.sku} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} />
          </label>
          <label className="inventory-field">
            <span>Category</span>
            <select className="inventory-input" value={form.category_id} onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="inventory-field">
            <span>Quantity Total</span>
            <input
              className="inventory-input"
              type="number"
              min="0"
              value={form.quantity_total}
              onChange={(e) => setForm((prev) => ({ ...prev, quantity_total: Number(e.target.value) }))}
            />
          </label>
          {mode === "edit" ? (
            <label className="inventory-field">
              <span>Quantity Available</span>
              <input
                className="inventory-input"
                type="number"
                min="0"
                value={form.quantity_available}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity_available: Number(e.target.value) }))}
              />
            </label>
          ) : null}
          {mode === "edit" ? (
            <label className="inventory-field">
              <span>Status</span>
              <select className="inventory-input" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="available">available</option>
                <option value="lent">lent</option>
                <option value="consumed">consumed</option>
                <option value="maintenance">maintenance</option>
              </select>
            </label>
          ) : null}
          <label className="inventory-field">
            <span>Low Stock Threshold</span>
            <input
              className="inventory-input"
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) => setForm((prev) => ({ ...prev, low_stock_threshold: Number(e.target.value) }))}
            />
          </label>
          <label className="inventory-field">
            <span>Location</span>
            <input className="inventory-input" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
          </label>
          <label className="inventory-field inventory-field-full">
            <span>Description</span>
            <textarea className="inventory-input inventory-textarea" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </label>
        </div>
        {error ? <p className="inventory-error">{error}</p> : null}
        <div className="inventory-form-actions">
          <button className="inventory-btn inventory-btn-muted" onClick={onClose}>Cancel</button>
          <button
            className="inventory-btn"
            onClick={async () => {
              try {
                if (mode === "create") {
                  await createItem({
                    name: form.name,
                    sku: form.sku,
                    category_id: form.category_id,
                    quantity_total: Number(form.quantity_total),
                    low_stock_threshold: Number(form.low_stock_threshold),
                    description: form.description,
                    location: form.location,
                    photo_url: form.photo_url || "",
                  });
                } else {
                  await updateItem(item.id, {
                    ...form,
                    quantity_total: Number(form.quantity_total),
                    quantity_available: Number(form.quantity_available),
                    low_stock_threshold: Number(form.low_stock_threshold),
                  });
                }
                await onSaved();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function BorrowModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    borrower_name: "",
    quantity: 1,
    due_date: "",
    notes: "",
  });
  const [error, setError] = useState("");

  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal-card">
        <h3 className="chart-title">Borrow {item.name}</h3>
        <div className="inventory-form-grid">
          <label className="inventory-field">
            <span>Borrower Name</span>
            <input className="inventory-input" value={form.borrower_name} onChange={(e) => setForm((prev) => ({ ...prev, borrower_name: e.target.value }))} />
          </label>
          <label className="inventory-field">
            <span>Quantity</span>
            <input className="inventory-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} />
          </label>
          <label className="inventory-field">
            <span>Due Date</span>
            <input className="inventory-input" type="date" value={form.due_date} onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))} />
          </label>
          <label className="inventory-field inventory-field-full">
            <span>Notes</span>
            <textarea className="inventory-input inventory-textarea" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          </label>
        </div>
        {error ? <p className="inventory-error">{error}</p> : null}
        <div className="inventory-form-actions">
          <button className="inventory-btn inventory-btn-muted" onClick={onClose}>Cancel</button>
          <button
            className="inventory-btn"
            onClick={async () => {
              try {
                await createBorrowed({
                  item_id: item.id,
                  borrower_name: form.borrower_name,
                  quantity: Number(form.quantity),
                  due_date: form.due_date || todayISO(),
                  notes: form.notes,
                });
                await onSaved();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            Confirm Borrow
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemDetailsModal({ item, borrowedRows, onClose }) {
  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal-card">
        <h3 className="chart-title">{item.name}</h3>
        <p className="text-secondary">SKU: {item.sku} | Location: {item.location || "-"}</p>
        <p className="text-secondary">{item.description || "No description"}</p>
        <h4 className="chart-title">Borrow History</h4>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Borrower</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Returned</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {borrowedRows.map((row) => (
              <tr key={row.id}>
                <td>{row.borrower_name}</td>
                <td>{row.borrow_date}</td>
                <td>{row.due_date}</td>
                <td>{row.returned_date || "-"}</td>
                <td><span className={statusClass(row.status)}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="inventory-form-actions">
          <button className="inventory-btn inventory-btn-muted" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryFeature() {
  return (
    <AuthGate>
      <InventoryLayout />
    </AuthGate>
  );
}
