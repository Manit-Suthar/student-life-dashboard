import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Target, CheckCircle2, Clock, TrendingUp, Flame, AlertTriangle } from "lucide-react";

const TASK_KEYS = ["productivity_tasks_v1", "productivity_tasks", "tasks"];
const HABIT_KEYS = ["productivity_habits_v1", "productivity_habits", "habits"];

function readAny(keys) {
  for (const k of keys) {
    const r = localStorage.getItem(k);
    if (!r) continue;
    try { const p = JSON.parse(r); if (Array.isArray(p)) return p; } catch { /* skip */ }
  }
  return [];
}

function sod(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addD(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function toYMD(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function fmtDay(d) { return d.toLocaleDateString(undefined, { weekday: "short" }); }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function taskDate(t) {
  const raw = t?.due || t?.createdAt || t?.date;
  if (!raw || raw === "No due date") return null;
  const d = typeof raw === "number" ? new Date(raw) : new Date(raw.includes("T") ? raw : raw + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function calcStreak(set, todayYMD) {
  const t = new Date(todayYMD + "T00:00:00");
  const yy = toYMD(addD(t, -1));
  const end = set.has(todayYMD) ? todayYMD : set.has(yy) ? yy : null;
  if (!end) return 0;
  let s = 0, c = new Date(end + "T00:00:00");
  while (set.has(toYMD(c))) { s++; c = addD(c, -1); }
  return s;
}

export default function Analytics() {
  const [range, setRange] = useState("7D");
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);

  useEffect(() => { setTasks(readAny(TASK_KEYS)); setHabits(readAny(HABIT_KEYS)); }, []);
  useEffect(() => {
    const h = () => { setTasks(readAny(TASK_KEYS)); setHabits(readAny(HABIT_KEYS)); };
    window.addEventListener("focus", h);
    return () => window.removeEventListener("focus", h);
  }, []);

  const now = new Date();
  const todayYMD = toYMD(now);
  const todayStart = sod(now);

  const rangeStart = useMemo(() => {
    if (range === "7D") return sod(addD(now, -6));
    if (range === "30D") return sod(addD(now, -29));
    return null;
  }, [range]);

  const fTasks = useMemo(() => {
    if (!rangeStart) return tasks;
    return tasks.filter((t) => { const d = taskDate(t); return d ? d >= rangeStart : false; });
  }, [tasks, rangeStart]);

  const norm = useMemo(() => fTasks.map((t) => {
    const s = (t.status || "").toLowerCase();
    return { ...t, status: s === "done" || s === "complete" ? "completed" : s };
  }), [fTasks]);

  const total = norm.length;
  const completed = norm.filter((t) => t.status === "completed").length;
  const pending = total - completed;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
  const overdue = norm.filter((t) => {
    if (t.status === "completed") return false;
    const d = taskDate(t);
    return d ? sod(d) < todayStart : false;
  }).length;
  const dueToday = norm.filter((t) => { const d = taskDate(t); return d ? sameDay(sod(d), todayStart) : false; }).length;

  // Habit metrics
  const habitsTotal = habits.length;
  const habitsDoneToday = habits.filter((h) => (h?.completions || []).includes(todayYMD)).length;

  const habitStreaks = useMemo(() => {
    return habits
      .filter((h) => h?.goalType === "daily")
      .map((h) => ({
        name: h.name || "Unnamed",
        streak: calcStreak(new Set(h.completions || []), todayYMD),
      }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 8);
  }, [habits, todayYMD]);

  const habitConsistency = useMemo(() => {
    const daysToCheck = range === "7D" ? 7 : range === "30D" ? 30 : 14;
    const start = sod(addD(now, -(daysToCheck - 1)));
    const rows = [];
    for (let i = 0; i < daysToCheck; i++) {
      const day = sod(addD(start, i));
      const ymd = toYMD(day);
      const done = habits.filter((h) => (h?.completions || []).includes(ymd)).length;
      rows.push({ day: fmtDay(day), done, total: habitsTotal });
    }
    return rows;
  }, [habits, range, habitsTotal]);

  // Chart data
  const pieData = [{ name: "Completed", value: completed }, { name: "Pending", value: pending }];
  const priorityData = useMemo(() => {
    const c = { High: 0, Medium: 0, Low: 0 };
    norm.forEach((t) => { c[t.priority || "Medium"] = (c[t.priority || "Medium"] || 0) + 1; });
    return [{ name: "High", value: c.High }, { name: "Medium", value: c.Medium }, { name: "Low", value: c.Low }];
  }, [norm]);

  const trendData = useMemo(() => {
    const days = range === "7D" ? 7 : 14;
    const start = sod(addD(now, -(days - 1)));
    const rows = Array.from({ length: days }, (_, i) => ({ day: fmtDay(sod(addD(start, i))), Completed: 0, Pending: 0 }));
    norm.forEach((t) => {
      const d = taskDate(t);
      if (!d) return;
      const day = sod(d);
      if (day < start) return;
      const idx = Math.round((day - start) / 86400000);
      if (idx >= 0 && idx < rows.length) {
        if (t.status === "completed") rows[idx].Completed++;
        else rows[idx].Pending++;
      }
    });
    return rows;
  }, [norm, range]);

  const C = { done: "#22c55e", pending: "#f59e0b", accent: "#6366f1", high: "#ef4444", medium: "#f59e0b", low: "#94a3b8" };
  const tt = { background: "var(--tooltip-bg)", border: "1px solid var(--tooltip-border)", borderRadius: 12, color: "var(--tooltip-text)", backdropFilter: "blur(8px)", fontSize: 13 };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Insights across Tasks and Habits.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {["7D", "30D", "ALL"].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
              style={range === r ? { background: "var(--accent-500)", color: "#FFF" } : { color: "var(--text-muted)" }}
              onMouseEnter={(e) => { if (range !== r) e.currentTarget.style.background = "var(--hover-bg)"; }}
              onMouseLeave={(e) => { if (range !== r) e.currentTarget.style.background = "transparent"; }}
            >{r === "ALL" ? "All" : r}</button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat icon={Target} label="Total Tasks" value={total} />
        <Stat icon={CheckCircle2} label="Completed" value={completed} color={C.done} />
        <Stat icon={Clock} label="Pending" value={pending} color={C.pending} />
        <Stat icon={TrendingUp} label="Completion" value={`${rate}%`} />
        <Stat icon={AlertTriangle} label="Overdue" value={overdue} color={overdue > 0 ? C.high : undefined} />
        <Stat icon={Flame} label="Habits Today" value={`${habitsDoneToday}/${habitsTotal}`} />
      </div>

      {/* Row 1: Pie + Priority Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Completed vs Pending" subtitle="Donut breakdown of task statuses.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={4}>
                  <Cell fill={C.done} /><Cell fill={C.pending} />
                </Pie>
                <Tooltip contentStyle={tt} /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Tasks by Priority" subtitle="Distribution across High, Medium, Low.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fill: "var(--chart-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--chart-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tt} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill={C.high} /><Cell fill={C.medium} /><Cell fill={C.low} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Row 2: Task Trend Line */}
      <Panel title="Task Completion Trend" subtitle="Completed vs Pending over recent days.">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="day" tick={{ fill: "var(--chart-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--chart-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tt} /><Legend />
              <Line type="monotone" dataKey="Completed" stroke={C.done} strokeWidth={2.5} dot={{ r: 3, fill: C.done }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Pending" stroke={C.pending} strokeWidth={2.5} dot={{ r: 3, fill: C.pending }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Row 3: Habit Consistency + Streak Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Habit Consistency" subtitle="Habits completed per day over time.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitConsistency}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="day" tick={{ fill: "var(--chart-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--chart-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tt} />
                <Bar dataKey="done" name="Done" fill={C.accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Streak Leaderboard" subtitle="Current daily streaks for your habits.">
          {habitStreaks.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-faint)" }}>No daily habits yet.</p>
          ) : (
            <div className="space-y-2 mt-1">
              {habitStreaks.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: "var(--hover-bg)" }}>
                  <div className="flex items-center gap-2">
                    <Flame size={14} style={{ color: h.streak > 0 ? C.pending : "var(--text-faint)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{h.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: h.streak > 0 ? C.pending : "var(--text-faint)" }}>
                    {h.streak}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        Analytics reads from localStorage. Connect a backend to unlock full history.
      </p>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl p-4 transition-all duration-150" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={14} style={{ color: color || "var(--text-faint)" }} />
        <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
      <div className="text-lg font-bold" style={{ color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-150" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div className="mb-3">
        <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{title}</div>
        {subtitle && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}