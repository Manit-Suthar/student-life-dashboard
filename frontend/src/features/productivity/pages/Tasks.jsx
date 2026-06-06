import { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus, Search, CheckCircle2, Circle, Trash2, Pencil, MoreHorizontal,
} from "lucide-react";

import { fetchTasks, addTask as apiAddTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from "../services/tasksApi";

const PRIORITIES = ["High", "Medium", "Low"];
const SORTS = [
  { value: "created_desc", label: "Newest" },
  { value: "due_asc", label: "Due date (soonest)" },
  { value: "due_desc", label: "Due date (latest)" },
  { value: "priority", label: "Priority (High → Low)" },
  { value: "title", label: "Title (A → Z)" },
];

export default function Tasks() {
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("All");
  const [sortBy, setSortBy] = useState("created_desc");
  const [tasks, setTasks] = useState([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formDue, setFormDue] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await fetchTasks();
        setTasks(data);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      }
    };
    loadTasks();
  }, []);

  // Sync data to other tabs/windows if needed, but not to localStorage anymore
  useEffect(() => {
    if (tasks.length > 0) {
      window.dispatchEvent(new CustomEvent("productivity-data-change", { detail: { type: "tasks" } }));
    }
  }, [tasks]);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const isOverdue = (dueStr) => {
    if (!dueStr) return false;
    return new Date(dueStr + "T00:00:00") < startOfToday;
  };
  const isToday = (dueStr) => {
    if (!dueStr) return false;
    return new Date(dueStr + "T00:00:00").getTime() === startOfToday.getTime();
  };
  const isThisWeek = (dueStr) => {
    if (!dueStr) return false;
    const due = new Date(dueStr + "T00:00:00");
    const end = new Date(startOfToday);
    end.setDate(end.getDate() + 7);
    return due >= startOfToday && due <= end;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tasks
      .filter((t) => (tab === "pending" ? t.status === "pending" : t.status === "completed"))
      .filter((t) => !q || t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
      .filter((t) => priorityFilter === "All" ? true : t.priority === priorityFilter)
      .filter((t) => {
        if (dueFilter === "All") return true;
        if (dueFilter === "NoDue") return !t.due;
        if (dueFilter === "Overdue") return isOverdue(t.due);
        if (dueFilter === "Today") return isToday(t.due);
        if (dueFilter === "ThisWeek") return isThisWeek(t.due);
        return true;
      });

    const pr = { High: 0, Medium: 1, Low: 2 };
    list.sort((a, b) => {
      if (sortBy === "created_desc") return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === "due_asc") return (a.due ? new Date(a.due).getTime() : Infinity) - (b.due ? new Date(b.due).getTime() : Infinity);
      if (sortBy === "due_desc") return (b.due ? new Date(b.due).getTime() : -Infinity) - (a.due ? new Date(a.due).getTime() : -Infinity);
      if (sortBy === "priority") return (pr[a.priority] ?? 9) - (pr[b.priority] ?? 9);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
    return list;
  }, [tasks, tab, query, priorityFilter, dueFilter, sortBy]);

  const toggleStatus = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === "pending" ? "completed" : "pending";
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    try {
      await apiUpdateTask(id, { status: newStatus });
    } catch (e) {
      // Revert on error
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: task.status } : t)));
    }
  };

  const deleteHandler = async (id) => {
    const prevTasks = [...tasks];
    // Optimistic delete for snappy UI
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
    try {
      await apiDeleteTask(id);
    } catch (e) {
      setTasks(prevTasks);
      alert("Failed to delete task.");
    }
  };

  const resetForm = () => { setFormTitle(""); setFormDesc(""); setFormPriority("Medium"); setFormDue(""); setEditingId(null); };
  const openAdd = () => { resetForm(); setIsAddOpen(true); };
  const openEdit = (task) => { setEditingId(task.id); setFormTitle(task.title || ""); setFormDesc(task.description || ""); setFormPriority(task.priority || "Medium"); setFormDue(task.due || ""); setIsEditOpen(true); };

  const submitAdd = async () => {
    if (!formTitle.trim()) return;
    const newTask = { title: formTitle.trim(), description: formDesc.trim(), due: formDue || null, priority: formPriority };
    setIsAddOpen(false); resetForm();
    try {
      const addedTask = await apiAddTask(newTask);
      setTasks((prev) => [addedTask, ...prev]);
    } catch (e) {
      alert("Failed to add task.");
    }
  };

  const submitEdit = async () => {
    if (!editingId || !formTitle.trim()) return;
    const updatedFields = { title: formTitle.trim(), description: formDesc.trim(), due: formDue || null, priority: formPriority };
    const prevTasks = [...tasks];
    
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === editingId ? { ...t, ...updatedFields } : t));
    setIsEditOpen(false); resetForm();
    
    try {
      await apiUpdateTask(editingId, updatedFields);
    } catch (e) {
      setTasks(prevTasks);
      alert("Failed to update task.");
    }
  };

  const priorityClass = (p) => {
    if (p === "High") return "badge-error";
    if (p === "Medium") return "badge-warning";
    return "badge-success";
  };

  const statusBadge = (t) => {
    if (t.status === "completed") return { cls: "badge-success", text: "Completed" };
    if (isOverdue(t.due)) return { cls: "badge-error", text: "Overdue" };
    return { cls: "badge-warning", text: "Pending" };
  };

  return (
    <div className="fade-in">
      {/* Header — matches Assignments header pattern */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: 600, marginBottom: "var(--space-2)" }}>Tasks</h1>
          <p style={{ color: "var(--text-secondary)" }}>Manage your tasks and track your progress</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAdd}>
          <Plus size={18} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Tabs — reusing .filter-tabs from assignments.css */}
      <div className="filter-tabs">
        <button className={`filter-tab ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
          Pending ({tasks.filter((t) => t.status === "pending").length})
        </button>
        <button className={`filter-tab ${tab === "completed" ? "active" : ""}`} onClick={() => setTab("completed")}>
          Completed ({tasks.filter((t) => t.status === "completed").length})
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..."
            className="form-input" style={{ paddingLeft: "var(--space-10)" }}
          />
        </div>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="form-select">
          <option value="All">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} className="form-select">
          <option value="All">All Dates</option>
          <option value="Today">Due Today</option>
          <option value="ThisWeek">This Week</option>
          <option value="Overdue">Overdue</option>
          <option value="NoDue">No Due Date</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Task List */}
      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {filtered.map((t) => {
          const sb = statusBadge(t);
          return (
            <div key={t.id} className="prod-item">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                {/* Toggle */}
                <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 2 }} onClick={() => toggleStatus(t.id)} title="Toggle complete">
                  {t.status === "completed"
                    ? <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
                    : <Circle size={20} style={{ color: "var(--text-muted)" }} />}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>{t.title}</span>
                    <span className={`badge ${priorityClass(t.priority)}`}>{t.priority}</span>
                    <span className={`badge ${sb.cls}`}>{sb.text}</span>
                  </div>
                  {t.description && <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>{t.description}</p>}
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "var(--space-2)" }}>Due: {t.due || "No due date"}</p>
                </div>

                {/* Triple-dot menu — reusing overflow-menu from assignments.css */}
                <ActionMenu onEdit={() => openEdit(t)} onDelete={() => deleteHandler(t.id)} />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state glass">
            <div className="empty-state-icon"><Search size={48} /></div>
            <h3 className="empty-state-title">No tasks found</h3>
            <p className="empty-state-description">
              {tab === "pending" ? "You're all caught up! Add a new task to get started." : "No completed tasks yet."}
            </p>
          </div>
        )}
      </div>

      {/* Modals — reusing modal-overlay/modal-container from assignments.css */}
      {isAddOpen && (
        <TaskModal title="Add Task" onClose={() => { setIsAddOpen(false); resetForm(); }} onSubmit={submitAdd} submitLabel="Create"
          formTitle={formTitle} setFormTitle={setFormTitle} formDesc={formDesc} setFormDesc={setFormDesc}
          formPriority={formPriority} setFormPriority={setFormPriority} formDue={formDue} setFormDue={setFormDue}
        />
      )}
      {isEditOpen && (
        <TaskModal title="Edit Task" onClose={() => { setIsEditOpen(false); resetForm(); }} onSubmit={submitEdit} submitLabel="Save"
          formTitle={formTitle} setFormTitle={setFormTitle} formDesc={formDesc} setFormDesc={setFormDesc}
          formPriority={formPriority} setFormPriority={setFormPriority} formDue={formDue} setFormDue={setFormDue}
        />
      )}
    </div>
  );
}

/* ── Overflow menu (reuses assignments.css classes) ── */
function ActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="overflow-menu-wrapper" ref={ref}>
      <button className="overflow-menu-trigger" onClick={() => setOpen(!open)}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="overflow-menu">
          <button className="overflow-menu-item" onClick={() => { onEdit(); setOpen(false); }}>
            <Pencil size={14} /> Edit
          </button>
          <button className="overflow-menu-item danger" onClick={() => { onDelete(); setOpen(false); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Modal (reuses assignments.css modal classes) ── */
function TaskModal({ title, onClose, onSubmit, submitLabel, formTitle, setFormTitle, formDesc, setFormDesc, formPriority, setFormPriority, formDue, setFormDue }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Complete assignment" autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={formDue} onChange={(e) => setFormDue(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Add a description (optional)" rows={3} />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={onSubmit}>{submitLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}