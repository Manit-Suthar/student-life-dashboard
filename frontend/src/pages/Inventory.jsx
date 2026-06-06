import { useState, useEffect } from "react";
import { getItems, addItem, updateItem, deleteItem } from "../services/inventoryApi";
import { Package, Search, Plus, Trash2, Edit, AlertCircle } from "lucide-react";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", category: "Supply", quantity: 1, condition: "New", location: "" });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(items.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.category.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q)
    ));
  }, [query, items]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getItems();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setFormData({ name: "", category: "Supply", quantity: 1, condition: "New", location: "" });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setFormData({ name: item.name, category: item.category, quantity: item.quantity, condition: item.condition, location: item.location });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteItem(id);
      fetchItems();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateItem(editingId, formData);
    } else {
      await addItem(formData);
    }
    setShowModal(false);
    fetchItems();
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case "New": return "var(--success)";
      case "Good": return "var(--primary)";
      case "Fair": return "var(--warning)";
      case "Poor": return "var(--error)";
      default: return "var(--text-muted)";
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: "600", marginBottom: "var(--space-2)" }}>Inventory</h1>
          <p style={{ color: "var(--text-secondary)" }}>Manage your study equipment, books, and supplies</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleAdd}>
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </div>

      <div style={{ marginBottom: "var(--space-6)", position: "relative" }}>
        <Search size={18} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input 
          type="search" 
          placeholder="Search items by name, category, or location..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: "var(--space-10)" }}
        />
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: "var(--space-10)" }}>Loading inventory...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center" style={{ padding: "var(--space-12)" }}>
          <Package size={48} style={{ margin: "0 auto", color: "var(--text-muted)", marginBottom: "var(--space-4)" }} />
          <h3>No items found</h3>
          <p>Add your first inventory item to start tracking.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                <tr>
                  <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500, color: "var(--text-muted)", fontSize: "0.875rem" }}>Name</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500, color: "var(--text-muted)", fontSize: "0.875rem" }}>Category</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500, color: "var(--text-muted)", fontSize: "0.875rem" }}>Quantity</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500, color: "var(--text-muted)", fontSize: "0.875rem" }}>Location</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500, color: "var(--text-muted)", fontSize: "0.875rem" }}>Condition</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500, color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: index !== filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <span className="badge" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>{item.category}</span>
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        {item.quantity <= 1 && <AlertCircle size={14} style={{ color: "var(--warning)" }} />}
                        {item.quantity}
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--text-secondary)" }}>{item.location || "Unspecified"}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: getConditionColor(item.condition) }} />
                        <span style={{ fontSize: "0.875rem" }}>{item.condition}</span>
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>
                      <button onClick={() => handleEdit(item)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginRight: "var(--space-3)" }}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer" }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "var(--space-4)" }}>{editingId ? "Edit Item" : "Add Item"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div>
                <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>Item Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Scientific Calculator" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Supply</option>
                    <option>Book</option>
                    <option>Electronics</option>
                    <option>Furniture</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>Quantity</label>
                  <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value, 10)})} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>Condition</label>
                  <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                    <option>New</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Poor</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>Location</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g., Top Drawer" />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? "Save Changes" : "Add Item"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}