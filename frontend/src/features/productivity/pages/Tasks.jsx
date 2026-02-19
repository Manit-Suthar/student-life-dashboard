import { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  X,
  MoreHorizontal,
} from "lucide-react";

const STORAGE_KEY = "productivity_tasks_v1";

const defaultTasks = [
  { id: 1, title: "Complete project proposal", description: "Write and submit proposal for final year project.", due: "2023-05-15", status: "pending", priority: "High", createdAt: Date.now() - 100000 },
  { id: 2, title: "Study for math exam", description: "Review chapters 5-7 and solve practice questions.", due: "2023-05-18", status: "pending", priority: "Medium", createdAt: Date.now() - 90000 },
  { id: 3, title: "Read research paper", description: "Summarize key points and note questions.", due: "", status: "completed", priority: "Low", createdAt: Date.now() - 80000 },
];

const PRIORITIES = ["High", "Medium", "Low"];
const SORTS = [
  { value: "created_desc", label: "Newest" },
  { value: "due_asc", label: "Due date (soonest)" },
  { value: "due_desc", label: "Due date (latest)" },
  { value: "priority", label: "Priority (High \u2192 Low)" },
  { value: "title", label: "Title (A \u2192 Z)" },
];

export default function Tasks() {
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("All");
  const [sortBy, setSortBy] = useState("created_desc");
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("productivity_tasks");
    if (saved) setTasks(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("productivity_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formDue, setFormDue] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setTasks(parsed);
        else setTasks(defaultTasks);
      } else setTasks(defaultTasks);
    } catch { setTasks(defaultTasks); }
  }, []);

  useEffect(() => {
    if (tasks.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
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
      .filter((t) => !q || t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t.priority || "").toLowerCase().includes(q))
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
      if (sortBy === "due_asc") return (a.due ? new Date(a.due + "T00:00:00").getTime() : Infinity) - (b.due ? new Date(b.due + "T00:00:00").getTime() : Infinity);
      if (sortBy === "due_desc") return (b.due ? new Date(b.due + "T00:00:00").getTime() : -Infinity) - (a.due ? new Date(a.due + "T00:00:00").getTime() : -Infinity);
      if (sortBy === "priority") return (pr[a.priority] ?? 9) - (pr[b.priority] ?? 9);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
    return list;
  }, [tasks, tab, query, priorityFilter, dueFilter, sortBy]);

  const toggleStatus = (id) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: t.status === "pending" ? "completed" : "pending" } : t));
  const deleteTask = (id) => { setTasks((prev) => prev.filter((t) => t.id !== id)); if (editingId === id) setEditingId(null); };
  const resetForm = () => { setFormTitle(""); setFormDesc(""); setFormPriority("Medium"); setFormDue(""); setEditingId(null); };
  const openAdd = () => { resetForm(); setIsAddOpen(true); };
  const openEdit = (task) => { setEditingId(task.id); setFormTitle(task.title || ""); setFormDesc(task.description || ""); setFormPriority(task.priority || "Medium"); setFormDue(task.due || ""); setIsEditOpen(true); };

  const submitAdd = () => {
    if (!formTitle.trim()) return;
    setTasks((prev) => [{ id: Date.now(), title: formTitle.trim(), description: formDesc.trim(), due: formDue || "", status: "pending", priority: formPriority, createdAt: Date.now() }, ...prev]);
    setIsAddOpen(false);
    resetForm();
  };
  const submitEdit = () => {
    if (!editingId || !formTitle.trim()) return;
    setTasks((prev) => prev.map((t) => t.id === editingId ? { ...t, title: formTitle.trim(), description: formDesc.trim(), due: formDue || "", priority: formPriority } : t));
    setIsEditOpen(false);
    resetForm();
  };

  const statusBadge = (t) => {
    if (t.status === "completed") return { bg: "var(--success-bg)", color: "var(--success-text)", text: "Completed" };
    if (isOverdue(t.due)) return { bg: "var(--danger-bg)", color: "var(--danger-text)", text: "Overdue" };
    return { bg: "var(--warning-bg)", color: "var(--warning-text)", text: "Pending" };
  };

  const priorityBadge = (p) => {
    if (p === "High") return { bg: "var(--danger-bg)", color: "var(--danger-text)" };
    if (p === "Medium") return { bg: "var(--warning-bg)", color: "var(--warning-text)" };
    return { bg: "var(--hover-bg)", color: "var(--text-muted)" };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Tasks</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage your tasks and track your progress.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150"
          style={{ background: "var(--accent-500)" }}
          onClick={openAdd}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-700)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-500)")}
        >
          <Plus size={18} /> Add Task
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <TabBtn active={tab === "pending"} onClick={() => setTab("pending")}>Pending</TabBtn>
          <TabBtn active={tab === "completed"} onClick={() => setTab("completed")}>Completed</TabBtn>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FilterCard label="Priority">
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={selS()}>
            <option>All</option>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </FilterCard>
        <FilterCard label="Due">
          <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} style={selS()}>
            <option value="All">All</option><option value="Today">Due Today</option><option value="ThisWeek">This Week</option><option value="Overdue">Overdue</option><option value="NoDue">No Due Date</option>
          </select>
        </FilterCard>
        <FilterCard label="Sort">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selS()}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </FilterCard>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map((t) => {
          const sb = statusBadge(t);
          const pb = priorityBadge(t.priority);
          return (
            <div
              key={t.id}
              className="rounded-2xl p-4 md:p-5 transition-all duration-150 group"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
            >
              <div className="flex items-start gap-3">
                {/* Toggle */}
                <button className="mt-0.5 flex-shrink-0" onClick={() => toggleStatus(t.id)} title="Toggle complete">
                  {t.status === "completed"
                    ? <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
                    : <Circle size={20} style={{ color: "var(--text-faint)" }} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm" style={{ color: "var(--text)" }}>{t.title}</h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: pb.bg, color: pb.color }}>{t.priority}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: sb.bg, color: sb.color }}>{sb.text}</span>
                  </div>
                  {t.description && <p className="text-sm mt-1 line-clamp-1" style={{ color: "var(--text-muted)" }}>{t.description}</p>}
                  <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>Due: {t.due || "No due date"}</p>
                </div>

                {/* Triple-dot menu */}
                <ActionMenu onEdit={() => openEdit(t)} onDelete={() => deleteTask(t.id)} />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-sm text-center rounded-2xl p-8" style={{ color: "var(--text-muted)", background: "var(--card)", border: "1px dashed var(--border-strong)" }}>
            No tasks found.
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddOpen && <TaskModal title="Add Task" onClose={() => { setIsAddOpen(false); resetForm(); }} onSubmit={submitAdd} submitLabel="Create" formTitle={formTitle} setFormTitle={setFormTitle} formDesc={formDesc} setFormDesc={setFormDesc} formPriority={formPriority} setFormPriority={setFormPriority} formDue={formDue} setFormDue={setFormDue} />}
      {isEditOpen && <TaskModal title="Edit Task" onClose={() => { setIsEditOpen(false); resetForm(); }} onSubmit={submitEdit} submitLabel="Save" formTitle={formTitle} setFormTitle={setFormTitle} formDesc={formDesc} setFormDesc={setFormDesc} formPriority={formPriority} setFormPriority={setFormPriority} formDue={formDue} setFormDue={setFormDue} />}
    </div>
  );
}

/* ── Triple-dot action menu ── */
function ActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg transition-all duration-150 opacity-60 group-hover:opacity-100"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-20 w-36 rounded-xl py-1 animate-scale-in"
          style={{ background: "var(--modal)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
        >
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-all duration-100"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-all duration-100"
            style={{ color: "var(--danger)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--danger-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function TabBtn({ active, children, onClick }) {
  return (
    <button onClick={onClick} className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
      style={active ? { background: "var(--accent-500)", color: "#FFF" } : { color: "var(--text-muted)" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--hover-bg)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >{children}</button>
  );
}

function FilterCard({ label, children }) {
  return (
    <div className="rounded-xl p-3 transition-all duration-150" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
    >
      <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

function selS() {
  return { marginTop: 6, width: "100%", padding: "7px 10px", borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: 13 };
}

function TaskModal({ title, onClose, onSubmit, submitLabel, formTitle, setFormTitle, formDesc, setFormDesc, formPriority, setFormPriority, formDue, setFormDue }) {
  const [showAdvanced, setShowAdvanced] = useState(Boolean(formDesc || formDue));
  const inp = { marginTop: 4, width: "100%", padding: "9px 12px", borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: 14 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: "var(--overlay)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl animate-scale-in" style={{ background: "var(--modal)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          ><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Title</label>
            <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Complete assignment" style={inp} autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Priority</label>
            <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} style={inp}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Expandable advanced fields */}
          {!showAdvanced ? (
            <button onClick={() => setShowAdvanced(true)} className="text-xs font-medium transition-all duration-150" style={{ color: "var(--accent-500)" }}>
              + Add description & due date
            </button>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Description</label>
                <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Short description (optional)" style={inp} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Due Date</label>
                <input type="date" value={formDue} onChange={(e) => setFormDue(e.target.value)} style={inp} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >Cancel</button>
          <button onClick={onSubmit} className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150"
            style={{ background: "var(--accent-500)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-700)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-500)")}
          >{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}