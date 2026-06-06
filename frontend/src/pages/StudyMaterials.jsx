import { useState, useEffect } from "react";
import { getMaterials, addMaterial, updateMaterial, deleteMaterial } from "../services/studyApi";
import { BookOpen, Search, Plus, ExternalLink, Trash2, Edit, FileText, Link as LinkIcon, Video } from "lucide-react";

export default function StudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: "", subject: "", type: "Document", url: "", description: "" });

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(materials.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.subject.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    ));
  }, [query, materials]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setFormData({ title: "", subject: "", type: "Document", url: "", description: "" });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setFormData({ title: item.title, subject: item.subject, type: item.type, url: item.url, description: item.description });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this material?")) {
      await deleteMaterial(id);
      fetchMaterials();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateMaterial(editingId, formData);
    } else {
      await addMaterial(formData);
    }
    setShowModal(false);
    fetchMaterials();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Video": return <Video size={16} />;
      case "Link": return <LinkIcon size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: "600", marginBottom: "var(--space-2)" }}>Study Materials</h1>
          <p style={{ color: "var(--text-secondary)" }}>Organize and access your learning resources</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleAdd}>
          <Plus size={18} />
          <span>Add Material</span>
        </button>
      </div>

      <div style={{ marginBottom: "var(--space-6)", position: "relative" }}>
        <Search size={18} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input 
          type="search" 
          placeholder="Search materials by title, subject, or description..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: "var(--space-10)" }}
        />
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: "var(--space-10)" }}>Loading materials...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center" style={{ padding: "var(--space-12)" }}>
          <BookOpen size={48} style={{ margin: "0 auto", color: "var(--text-muted)", marginBottom: "var(--space-4)" }} />
          <h3>No materials found</h3>
          <p>Add your first study resource to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
          {filtered.map(item => (
            <div key={item.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-primary)", fontWeight: 500 }}>
                  {getTypeIcon(item.type)}
                  <span>{item.title}</span>
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button onClick={() => handleEdit(item)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><Edit size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer" }}><Trash2 size={16} /></button>
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <span className="badge" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>{item.subject}</span>
                <span className="badge" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>{item.type}</span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", flex: 1 }}>{item.description || "No description provided."}</p>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full" style={{ marginTop: "auto" }}>
                <ExternalLink size={16} /> Open Resource
              </a>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "var(--space-4)" }}>{editingId ? "Edit Material" : "Add Material"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div>
                <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., Quantum Physics Notes" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>Subject</label>
                  <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="e.g., Physics" />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option>Document</option>
                    <option>Video</option>
                    <option>Link</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>URL</label>
                <input required type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: 500 }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief description..." rows={3} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? "Save Changes" : "Add Material"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}