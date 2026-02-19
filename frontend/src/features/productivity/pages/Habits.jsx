import { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  X,
  Undo2,
  Flame,
  MoreHorizontal,
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
  { value: "name", label: "Name (A\u2013Z)" },
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
    const saved = localStorage.getItem("productivity_habits");
    if (saved) setHabits(JSON.parse(saved));
  }, []);
  useEffect(() => { localStorage.setItem("productivity_habits", JSON.stringify(habits)); }, [habits]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const p = JSON.parse(raw); setHabits(Array.isArray(p) ? p : defaultHabits); }
      else setHabits(defaultHabits);
    } catch { setHabits(defaultHabits); }
  }, []);
  useEffect(() => { if (habits.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(habits)); }, [habits]);

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Habits</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Build consistency with streaks and daily check-ins.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150"
          style={{ background: "var(--accent-500)" }} onClick={openAdd}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-700)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-500)")}
        ><Plus size={18} /> Add Habit</button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Done Today" value={`${summary.done}/${summary.total}`} />
        <StatCard title="Longest Streak" value={`${summary.longest}d`} />
        <StatCard title="Active Streaks" value={`${summary.active}`} />
        <StatCard title="This Week" value="Mon \u2192 Sun" />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CtrlCard label="Filter">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={selS()}>
            {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </CtrlCard>
        <CtrlCard label="Sort">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selS()}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </CtrlCard>
      </div>

      {/* Habit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((h) => {
          const doneToday = (h.completions || []).includes(todayYMD);
          const streak = h.goalType === "daily" ? calcStreak(new Set(h.completions || []), todayYMD) : 0;
          const wp = weekProg(h);

          return (
            <div key={h.id} className="rounded-2xl p-4 transition-all duration-150 group"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-sm" style={{ color: "var(--text)" }}>{h.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                    {h.goalType === "daily" ? "Daily habit" : `${wp?.target || 0}x / week`}
                  </p>
                </div>
                <HabitMenu onEdit={() => openEdit(h)} onDelete={() => deleteHabit(h.id)} />
              </div>

              {h.notes && <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>{h.notes}</p>}

              {/* Badges */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {h.goalType === "daily" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "var(--warning-bg)", color: "var(--warning-text)" }}>
                    <Flame size={12} /> {streak} day streak
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "var(--accent-50)", color: "var(--accent-500)" }}>
                    {wp?.done || 0}/{wp?.target || 0} this week
                  </span>
                )}
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={doneToday
                    ? { background: "var(--success-bg)", color: "var(--success-text)" }
                    : { background: "var(--hover-bg)", color: "var(--text-muted)" }
                  }>
                  {doneToday ? "Done today" : "Not done"}
                </span>
              </div>

              {/* Primary action: Mark done */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => markDone(h.id)} disabled={doneToday}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                  style={doneToday
                    ? { background: "var(--success-bg)", color: "var(--success-text)", cursor: "not-allowed", opacity: 0.7 }
                    : { background: "var(--success)", color: "#FFF" }}
                >
                  {doneToday ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  {doneToday ? "Done" : "Mark done"}
                </button>
                <button onClick={() => undoDone(h.id)} disabled={!doneToday} title="Undo"
                  className="px-2.5 py-2 rounded-xl transition-all duration-150"
                  style={doneToday
                    ? { border: "1px solid var(--border)", color: "var(--text-secondary)" }
                    : { border: "1px solid var(--border)", color: "var(--text-faint)", cursor: "not-allowed", opacity: 0.4 }}
                ><Undo2 size={16} /></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-sm text-center rounded-2xl p-8"
            style={{ color: "var(--text-muted)", background: "var(--card)", border: "1px dashed var(--border-strong)" }}>
            No habits yet. Add one to get started.
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddOpen && <HabitModal title="Add Habit" submitLabel="Create" onClose={() => { setIsAddOpen(false); resetForm(); }} onSubmit={submitAdd}
        formName={formName} setFormName={setFormName} formGoalType={formGoalType} setFormGoalType={setFormGoalType}
        formWeeklyTarget={formWeeklyTarget} setFormWeeklyTarget={setFormWeeklyTarget} formNotes={formNotes} setFormNotes={setFormNotes} />}
      {isEditOpen && <HabitModal title="Edit Habit" submitLabel="Save" onClose={() => { setIsEditOpen(false); resetForm(); }} onSubmit={submitEdit}
        formName={formName} setFormName={setFormName} formGoalType={formGoalType} setFormGoalType={setFormGoalType}
        formWeeklyTarget={formWeeklyTarget} setFormWeeklyTarget={setFormWeeklyTarget} formNotes={formNotes} setFormNotes={setFormNotes} />}
    </div>
  );
}

/* ── Triple-dot menu ── */
function HabitMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg transition-all duration-150 opacity-60 group-hover:opacity-100"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      ><MoreHorizontal size={18} /></button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 rounded-xl py-1 animate-scale-in"
          style={{ background: "var(--modal)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
          <button onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-all duration-100"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          ><Pencil size={14} /> Edit</button>
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-all duration-100"
            style={{ color: "var(--danger)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--danger-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          ><Trash2 size={14} /> Delete</button>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function StatCard({ title, value }) {
  return (
    <div className="rounded-xl p-4 transition-all duration-150" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{title}</p>
      <p className="text-xl font-bold mt-1.5" style={{ color: "var(--text)" }}>{value}</p>
    </div>
  );
}

function CtrlCard({ label, children }) {
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

function HabitModal({ title, submitLabel, onClose, onSubmit, formName, setFormName, formGoalType, setFormGoalType, formWeeklyTarget, setFormWeeklyTarget, formNotes, setFormNotes }) {
  const [showNotes, setShowNotes] = useState(Boolean(formNotes));
  const inp = { marginTop: 4, width: "100%", padding: "9px 12px", borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: 14 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: "var(--overlay)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl animate-scale-in" style={{ background: "var(--modal)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          ><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Habit name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Morning walk" style={inp} autoFocus />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Goal type</label>
              <select value={formGoalType} onChange={(e) => setFormGoalType(e.target.value)} style={inp}>
                <option value="daily">Daily</option><option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Weekly target</label>
              <input type="number" min={1} value={formWeeklyTarget} onChange={(e) => setFormWeeklyTarget(e.target.value)} style={inp} />
            </div>
          </div>
          {!showNotes ? (
            <button onClick={() => setShowNotes(true)} className="text-xs font-medium transition-all duration-150" style={{ color: "var(--accent-500)" }}>
              + Add notes
            </button>
          ) : (
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Notes (optional)</label>
              <input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="e.g. 30 minutes minimum" style={inp} />
            </div>
          )}
        </div>
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