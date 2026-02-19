import { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus, CheckCircle2, Circle, Trash2, Pencil, X, Undo2, Flame, MoreHorizontal,
} from "lucide-react";

const STORAGE_KEY = "productivity_habits_v1";

const defaultHabits = [
  { id: 1, name: "Study", goalType: "daily", weeklyTarget: 5, notes: "At least 45 minutes", completions: [], createdAt: Date.now() - 100000 },
  { id: 2, name: "Workout", goalType: "weekly", weeklyTarget: 4, notes: "Any cardio/strength", completions: [], createdAt: Date.now() - 90000 },
  { id: 3, name: "Read", goalType: "daily", weeklyTarget: 5, notes: "10 pages", completions: [], createdAt: Date.now() - 80000 },
];

const FILTERS = [
  { value: "all", label: "All" },
  { value: "done_today", label: "Done Today" },
  { value: "not_done_today", label: "Not Done Today" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "streak", label: "Highest streak" },
  { value: "name", label: "Name (A–Z)" },
  { value: "recent_done", label: "Recently done" },
];

function toYMD(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function parseYMD(s) { return new Date(s + "T00:00:00"); }
function addD(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function weekStart(d) {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = c.getDay();
  c.setDate(c.getDate() + ((day === 0 ? -6 : 1) - day));
  return c;
}

function inWeek(ymd, ws) {
  const dt = parseYMD(ymd);
  return dt >= ws && dt <= addD(ws, 6);
}

function calcStreak(set, todayYMD) {
  const t = parseYMD(todayYMD);
  const yy = toYMD(addD(t, -1));
  const end = set.has(todayYMD) ? todayYMD : set.has(yy) ? yy : null;
  if (!end) return 0;
  let s = 0, c = parseYMD(end);
  while (set.has(toYMD(c))) { s++; c = addD(c, -1); }
  return s;
}

function lastDone(comps) {
  if (!comps || !comps.length) return "";
  return [...comps].sort().pop();
}

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formGoalType, setFormGoalType] = useState("daily");
  const [formWeeklyTarget, setFormWeeklyTarget] = useState(5);
  const [formNotes, setFormNotes] = useState("");

  const todayYMD = toYMD(new Date());
  const ws = weekStart(new Date());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const p = JSON.parse(raw); setHabits(Array.isArray(p) ? p : defaultHabits); }
      else setHabits(defaultHabits);
    } catch { setHabits(defaultHabits); }
  }, []);
  useEffect(() => { 
    if (habits.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
      window.dispatchEvent(new CustomEvent("productivity-data-change", { detail: { type: "habits" } }));
    }
  }, [habits]);

  const summary = useMemo(() => {
    const done = habits.filter((h) => (h.completions || []).includes(todayYMD)).length;
    let longest = 0, active = 0;
    habits.forEach((h) => {
      if (h.goalType !== "daily") return;
      const s = calcStreak(new Set(h.completions || []), todayYMD);
      longest = Math.max(longest, s);
      if (s > 0) active++;
    });
    return { done, total: habits.length, longest, active };
  }, [habits, todayYMD]);

  const filtered = useMemo(() => {
    let list = [...habits].filter((h) => {
      const doneToday = (h.completions || []).includes(todayYMD);
      if (filter === "all") return true;
      if (filter === "done_today") return doneToday;
      if (filter === "not_done_today") return !doneToday;
      if (filter === "daily") return h.goalType === "daily";
      if (filter === "weekly") return h.goalType === "weekly";
      return true;
    });
    list.sort((a, b) => {
      if (sortBy === "newest") return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === "streak") return calcStreak(new Set(b.completions || []), todayYMD) - calcStreak(new Set(a.completions || []), todayYMD);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "recent_done") return (lastDone(b.completions) || "").localeCompare(lastDone(a.completions) || "");
      return 0;
    });
    return list;
  }, [habits, filter, sortBy, todayYMD]);

  const resetForm = () => { setEditingId(null); setFormName(""); setFormGoalType("daily"); setFormWeeklyTarget(5); setFormNotes(""); };
  const openAdd = () => { resetForm(); setIsAddOpen(true); };
  const openEdit = (h) => { setEditingId(h.id); setFormName(h.name || ""); setFormGoalType(h.goalType || "daily"); setFormWeeklyTarget(h.weeklyTarget || 5); setFormNotes(h.notes || ""); setIsEditOpen(true); };

  const submitAdd = () => {
    if (!formName.trim()) return;
    setHabits((p) => [{ id: Date.now(), name: formName.trim(), goalType: formGoalType, weeklyTarget: Number(formWeeklyTarget) || 1, notes: formNotes.trim(), completions: [], createdAt: Date.now() }, ...p]);
    setIsAddOpen(false); resetForm();
  };
  const submitEdit = () => {
    if (!editingId || !formName.trim()) return;
    setHabits((p) => p.map((h) => h.id === editingId ? { ...h, name: formName.trim(), goalType: formGoalType, weeklyTarget: Number(formWeeklyTarget) || 1, notes: formNotes.trim() } : h));
    setIsEditOpen(false); resetForm();
  };
  const deleteHabit = (id) => { setHabits((p) => p.filter((h) => h.id !== id)); if (editingId === id) setEditingId(null); };

  const markDone = (id) => setHabits((p) => p.map((h) => {
    if (h.id !== id) return h;
    const s = new Set(h.completions || []); s.add(todayYMD);
    return { ...h, completions: [...s].sort() };
  }));
  const undoDone = (id) => setHabits((p) => p.map((h) => {
    if (h.id !== id) return h;
    const s = new Set(h.completions || []); s.delete(todayYMD);
    return { ...h, completions: [...s].sort() };
  }));

  const weekProg = (h) => {
    if (h.goalType !== "weekly") return null;
    const done = (h.completions || []).filter((d) => inWeek(d, ws)).length;
    return { done, target: Number(h.weeklyTarget) || 1 };
  };

  return (
    <div className="fade-in">
      {/* Header — matches Assignments pattern */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: 600, marginBottom: "var(--space-2)" }}>Habits</h1>
          <p style={{ color: "var(--text-secondary)" }}>Build consistency with streaks and daily check-ins</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAdd}>
          <Plus size={18} />
          <span>Add Habit</span>
        </button>
      </div>

      {/* Summary Stats — reusing stat-card from assignments.css */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <div className="stat-number">{summary.done}/{summary.total}</div>
              <div className="stat-label">Done Today</div>
            </div>
            <div className="stat-icon"><CheckCircle2 size={22} /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <div className="stat-number">{summary.longest}d</div>
              <div className="stat-label">Longest Streak</div>
            </div>
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}><Flame size={22} /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <div className="stat-number">{summary.active}</div>
              <div className="stat-label">Active Streaks</div>
            </div>
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}><CheckCircle2 size={22} /></div>
          </div>
        </div>
      </div>

      {/* Filters — reusing filter-tabs from assignments.css */}
      <div className="filter-tabs" style={{ marginBottom: "var(--space-4)" }}>
        {FILTERS.map((f) => (
          <button key={f.value} className={`filter-tab ${filter === f.value ? "active" : ""}`} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select" style={{ maxWidth: 240 }}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Habit Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
        {filtered.map((h) => {
          const doneToday = (h.completions || []).includes(todayYMD);
          const streak = h.goalType === "daily" ? calcStreak(new Set(h.completions || []), todayYMD) : 0;
          const wp = weekProg(h);

          return (
            <div key={h.id} className="prod-item">
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)" }}>{h.name}</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
                    {h.goalType === "daily" ? "Daily habit" : `${wp?.target || 0}x / week`}
                  </p>
                </div>
                <HabitMenu onEdit={() => openEdit(h)} onDelete={() => deleteHabit(h.id)} />
              </div>

              {h.notes && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>{h.notes}</p>}

              {/* Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
                {h.goalType === "daily" ? (
                  <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Flame size={12} /> {streak} day streak
                  </span>
                ) : (
                  <span className="badge badge-primary">
                    {wp?.done || 0}/{wp?.target || 0} this week
                  </span>
                )}
                <span className={`badge ${doneToday ? "badge-success" : ""}`}>
                  {doneToday ? "Done today" : "Not done"}
                </span>
              </div>

              {/* Mark done */}
              <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
                <button
                  onClick={() => markDone(h.id)} disabled={doneToday}
                  className={`prod-done-btn ${doneToday ? "completed" : ""}`}
                  style={{ flex: 1, justifyContent: "center", ...(doneToday ? { cursor: "not-allowed", opacity: 0.7 } : {}) }}
                >
                  {doneToday ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  {doneToday ? "Done" : "Mark done"}
                </button>
                <button onClick={() => undoDone(h.id)} disabled={!doneToday} title="Undo"
                  className="btn btn-secondary"
                  style={{ padding: "var(--space-2)", ...(!doneToday ? { cursor: "not-allowed", opacity: 0.4 } : {}) }}
                ><Undo2 size={16} /></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state glass" style={{ gridColumn: "1 / -1" }}>
            <div className="empty-state-icon"><CheckCircle2 size={48} /></div>
            <h3 className="empty-state-title">No habits yet</h3>
            <p className="empty-state-description">Add one to start building consistency.</p>
          </div>
        )}
      </div>

      {/* Modals — reusing assignment modal classes */}
      {isAddOpen && (
        <HabitModal title="Add Habit" submitLabel="Create" onClose={() => { setIsAddOpen(false); resetForm(); }} onSubmit={submitAdd}
          formName={formName} setFormName={setFormName} formGoalType={formGoalType} setFormGoalType={setFormGoalType}
          formWeeklyTarget={formWeeklyTarget} setFormWeeklyTarget={setFormWeeklyTarget} formNotes={formNotes} setFormNotes={setFormNotes}
        />
      )}
      {isEditOpen && (
        <HabitModal title="Edit Habit" submitLabel="Save" onClose={() => { setIsEditOpen(false); resetForm(); }} onSubmit={submitEdit}
          formName={formName} setFormName={setFormName} formGoalType={formGoalType} setFormGoalType={setFormGoalType}
          formWeeklyTarget={formWeeklyTarget} setFormWeeklyTarget={setFormWeeklyTarget} formNotes={formNotes} setFormNotes={setFormNotes}
        />
      )}
    </div>
  );
}

/* ── Overflow menu (reuses assignments.css classes) ── */
function HabitMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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
function HabitModal({ title, submitLabel, onClose, onSubmit, formName, setFormName, formGoalType, setFormGoalType, formWeeklyTarget, setFormWeeklyTarget, formNotes, setFormNotes }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Habit name *</label>
            <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Morning walk" autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Goal type</label>
              <select className="form-select" value={formGoalType} onChange={(e) => setFormGoalType(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Weekly target</label>
              <input type="number" className="form-input" min={1} value={formWeeklyTarget} onChange={(e) => setFormWeeklyTarget(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input form-textarea" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="e.g. 30 minutes minimum" rows={3} />
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