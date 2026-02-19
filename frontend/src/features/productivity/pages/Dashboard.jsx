import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ListTodo, Repeat2, BarChart3, ArrowRight, TrendingUp, Target, Flame, Clock, Zap } from "lucide-react";

const TASK_KEYS = ["productivity_tasks_v1", "productivity_tasks", "tasks"];
const HABIT_KEYS = ["productivity_habits_v1", "productivity_habits", "habits"];

function readAnyKey(keys) {
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch { /* skip */ }
  }
  return [];
}

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function toYMD(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function safeDueDate(t) {
  if (!t?.due || t?.due === "No due date") return null;
  const dt = new Date(t.due + "T00:00:00");
  return isNaN(dt.getTime()) ? null : dt;
}
function isOverdue(t, todayStart) {
  if (t?.status === "completed" || t?.status === "done") return false;
  const due = safeDueDate(t);
  return due ? startOfDay(due) < todayStart : false;
}
function fmtDayShort(d) { return d.toLocaleDateString(undefined, { weekday: "short" }); }

export default function Dashboard() {
  const nav = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);

  useEffect(() => { setTasks(readAnyKey(TASK_KEYS)); setHabits(readAnyKey(HABIT_KEYS)); }, []);
  useEffect(() => {
    const onFocus = () => { setTasks(readAnyKey(TASK_KEYS)); setHabits(readAnyKey(HABIT_KEYS)); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayYMD = toYMD(now);

  const normalizedTasks = useMemo(() => tasks.map((t) => {
    const s = (t.status || "").toLowerCase();
    return { ...t, status: s === "done" || s === "complete" ? "completed" : s };
  }), [tasks]);

  const totalTasks = normalizedTasks.length;
  const completedTasks = normalizedTasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueCount = normalizedTasks.filter((t) => isOverdue(t, todayStart)).length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const habitsTotal = habits.length;
  const habitsDoneToday = habits.filter((h) =>
    Array.isArray(h?.completions) ? h.completions.includes(todayYMD) : false
  ).length;

  const bestStreak = useMemo(() => {
    const calcStreak = (set, ty) => {
      const t = new Date(ty + "T00:00:00");
      const yy = toYMD(addDays(t, -1));
      const end = set.has(ty) ? ty : set.has(yy) ? yy : null;
      if (!end) return 0;
      let s = 0, c = new Date(end + "T00:00:00");
      while (set.has(toYMD(c))) { s++; c = addDays(c, -1); }
      return s;
    };
    let best = 0;
    for (const h of habits) {
      if (h?.goalType !== "daily") continue;
      best = Math.max(best, calcStreak(new Set(h?.completions || []), todayYMD));
    }
    return best;
  }, [habits, todayYMD]);

  const productivityScore = useMemo(() => {
    const habitRate = habitsTotal === 0 ? 0 : Math.round((habitsDoneToday / habitsTotal) * 100);
    const streakBonus = Math.min(bestStreak * 5, 20);
    const overduePenalty = Math.min(overdueCount * 10, 30);
    return Math.max(0, Math.min(100, Math.round(completionRate * 0.4 + habitRate * 0.4 + streakBonus - overduePenalty)));
  }, [completionRate, habitsTotal, habitsDoneToday, bestStreak, overdueCount]);

  const weeklyData = useMemo(() => {
    const start = startOfDay(addDays(now, -6));
    const rows = Array.from({ length: 7 }, (_, i) => ({
      day: fmtDayShort(startOfDay(addDays(start, i))),
      Completed: 0,
      Pending: 0,
    }));
    normalizedTasks.forEach((t) => {
      let dt = safeDueDate(t);
      if (!dt && t?.createdAt) { const tmp = new Date(t.createdAt); if (!isNaN(tmp.getTime())) dt = tmp; }
      if (!dt) return;
      const day = startOfDay(dt);
      if (day < start) return;
      const idx = Math.round((day - start) / 86400000);
      if (idx >= 0 && idx < 7) {
        if (t.status === "completed") rows[idx].Completed += 1;
        else rows[idx].Pending += 1;
      }
    });
    return rows;
  }, [normalizedTasks, now]);

  const insightLine = useMemo(() => {
    if (totalTasks === 0 && habitsTotal === 0) return "Start by adding a task or a habit to get going.";
    if (overdueCount > 0) return `You have ${overdueCount} overdue task(s). Clear those first for a quick win.`;
    if (completionRate >= 70) return "Strong progress — keep the momentum going today.";
    return "Stay focused. Small steps daily compound fast.";
  }, [totalTasks, habitsTotal, overdueCount, completionRate]);

  const tooltipStyle = {
    background: "var(--tooltip-bg)",
    border: "1px solid var(--tooltip-border)",
    borderRadius: 12,
    color: "var(--tooltip-text)",
    backdropFilter: "blur(8px)",
    fontSize: 13,
  };

  return (
    <div className="space-y-6">
      {/* ── Hero Section ── */}
      <div
        className="rounded-2xl p-6 md:p-8"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs tracking-widest uppercase font-medium" style={{ color: "var(--text-faint)" }}>
              Productivity Overview
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-bold leading-tight" style={{ color: "var(--text)" }}>
              {insightLine}
            </h1>
          </div>

          {/* Productivity Score */}
          <div
            className="rounded-2xl p-5 min-w-[180px] text-center flex-shrink-0"
            style={{ background: "var(--canvas)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap size={16} style={{ color: "var(--accent-500)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Productivity Score</span>
            </div>
            <div className="text-4xl font-extrabold" style={{ color: "var(--accent-500)" }}>
              {productivityScore}
            </div>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${productivityScore}%`, background: "var(--accent-500)" }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>Based on tasks, habits & streaks</p>
          </div>
        </div>
      </div>

      {/* ── Navigation Cards (Consistent Styling) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NavCard
          icon={ListTodo}
          title="Tasks"
          subtitle={`${pendingTasks} pending, ${completedTasks} completed`}
          onClick={() => nav("/productivity/tasks")}
        />
        <NavCard
          icon={Repeat2}
          title="Habits"
          subtitle={`${habitsDoneToday}/${habitsTotal} done today`}
          onClick={() => nav("/productivity/habits")}
        />
        <NavCard
          icon={BarChart3}
          title="Analytics"
          subtitle="View insights and trends"
          onClick={() => nav("/productivity/analytics")}
        />
      </div>

      {/* ── Key Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI icon={Target} label="Total Tasks" value={totalTasks} />
        <KPI icon={TrendingUp} label="Completed" value={completedTasks} color="var(--success)" />
        <KPI icon={Clock} label="Pending" value={pendingTasks} color="var(--warning)" />
        <KPI icon={Flame} label="Best Streak" value={`${bestStreak}d`} color="var(--warning)" />
        <KPI icon={Repeat2} label="Habits Today" value={`${habitsDoneToday}/${habitsTotal}`} />
      </div>

      {/* ── Weekly Chart ── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="font-semibold" style={{ color: "var(--text)" }}>Weekly Activity</div>
        <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Completed vs Pending tasks over the last 7 days
        </div>
        <div className="mt-4 h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="day" tick={{ fill: "var(--chart-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--chart-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--hover-bg)" }} />
              <Legend />
              <Bar dataKey="Completed" fill="var(--success)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pending" fill="var(--warning)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Overdue Warning ── */}
      {overdueCount > 0 && (
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-3 cursor-pointer transition-all duration-150"
          style={{ background: "var(--danger-bg)", border: "1px solid rgba(239,68,68,0.2)" }}
          onClick={() => nav("/productivity/tasks")}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
        >
          <Clock size={18} style={{ color: "var(--danger)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--danger-text)" }}>
            {overdueCount} overdue task{overdueCount > 1 ? "s" : ""} need your attention
          </span>
          <ArrowRight size={16} className="ml-auto" style={{ color: "var(--danger)" }} />
        </div>
      )}
    </div>
  );
}

/* ── Navigation Card (consistent styling for Tasks/Habits/Analytics) ── */
function NavCard({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-all duration-200 group"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "var(--accent-200)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
            style={{ background: "var(--accent-50)", color: "var(--accent-500)" }}
          >
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{title}</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
          </div>
        </div>
        <ArrowRight
          size={16}
          className="mt-1 transition-all duration-200 opacity-0 group-hover:opacity-100"
          style={{ color: "var(--accent-500)" }}
        />
      </div>
    </button>
  );
}

/* ── KPI Stat ── */
function KPI({ icon: Icon, label, value, color }) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-150"
      style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} style={{ color: color || "var(--text-faint)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold" style={{ color: color || "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}
