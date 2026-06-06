import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Target, CheckCircle2, Clock, TrendingUp, Flame, AlertTriangle, Calendar } from "lucide-react";
import { fetchTasks } from "../services/tasksApi";
import { fetchHabits } from "../services/habitsApi";

function sod(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addD(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function toYMD(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function fmtDay(d) { return d.toLocaleDateString(undefined, { weekday: "short" }); }

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

const COLORS = {
  completed: "#10b981",
  pending: "#f59e0b",
  accent: "#6366f1",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#94a3b8",
  purple: "#8b5cf6",
  blue: "#3b82f6",
};

const tooltipStyle = {
  background: "rgba(15, 23, 42, 0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  padding: "12px 16px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
  color: "#f8fafc",
  fontSize: "13px",
};

const chartAxisStyle = {
  fill: "#94a3b8",
  fontSize: 11,
};

const chartGridStyle = {
  stroke: "rgba(148, 163, 184, 0.1)",
  strokeDasharray: "4 4",
};

export default function Analytics() {
  const [range, setRange] = useState("7D");
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksData, habitsData] = await Promise.all([
          fetchTasks(),
          fetchHabits()
        ]);
        setTasks(tasksData || []);
        setHabits(habitsData || []);
      } catch (e) {
        console.error("Failed to load analytics data", e);
      }
    };
    
    loadData();

    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener("productivity-data-change", handleUpdate);
    return () => window.removeEventListener("productivity-data-change", handleUpdate);
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
      .slice(0, 6);
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

  const pieData = [{ name: "Completed", value: completed, color: COLORS.completed }, { name: "Pending", value: pending, color: COLORS.pending }];
  const priorityData = useMemo(() => {
    const c = { High: 0, Medium: 0, Low: 0 };
    norm.forEach((t) => { c[t.priority || "Medium"] = (c[t.priority || "Medium"] || 0) + 1; });
    return [
      { name: "High", value: c.High, fill: COLORS.high },
      { name: "Medium", value: c.Medium, fill: COLORS.medium },
      { name: "Low", value: c.Low, fill: COLORS.low },
    ];
  }, [norm]);

  const trendData = useMemo(() => {
    const days = range === "7D" ? 7 : 14;
    const start = sod(addD(now, -(days - 1)));
    const rows = Array.from({ length: days }, (_, i) => ({ 
      day: fmtDay(sod(addD(start, i))), 
      Completed: 0, 
      Pending: 0,
      total: 0 
    }));
    norm.forEach((t) => {
      const d = taskDate(t);
      if (!d) return;
      const day = sod(d);
      if (day < start) return;
      const idx = Math.round((day - start) / 86400000);
      if (idx >= 0 && idx < rows.length) {
        rows[idx].total++;
        if (t.status === "completed") rows[idx].Completed++;
        else rows[idx].Pending++;
      }
    });
    return rows;
  }, [norm, range]);

  const maxStreak = Math.max(...habitStreaks.map(h => h.streak), 1);

  return (
    <div className="fade-in" style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: 700, marginBottom: "var(--space-2)", color: "var(--text-primary)" }}>Analytics</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Track your productivity and habit consistency</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", background: "var(--bg-glass)", padding: "var(--space-1)", borderRadius: "var(--radius-xl)", border: "1px solid var(--glass-border)" }}>
          {[
            { key: "7D", label: "7 Days" },
            { key: "30D", label: "30 Days" },
            { key: "ALL", label: "All Time" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-lg)",
                border: "none",
                background: range === r.key ? "var(--primary)" : "transparent",
                color: range === r.key ? "var(--bg-primary)" : "var(--text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <StatCard icon={Target} label="Total Tasks" value={total} color={COLORS.accent} />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} color={COLORS.completed} />
        <StatCard icon={Clock} label="In Progress" value={pending} color={COLORS.pending} />
        <StatCard icon={TrendingUp} label="Success Rate" value={`${rate}%`} color={COLORS.purple} />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue} color={overdue > 0 ? COLORS.high : COLORS.low} />
        <StatCard icon={Flame} label="Today's Habits" value={`${habitsDoneToday}/${habitsTotal}`} color={COLORS.blue} />
      </div>

      {/* Main Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        
        {/* Progress Overview */}
        <div style={{ gridColumn: "span 4", background: "var(--bg-card)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", border: "1px solid var(--glass-border)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Task Progress</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>Completion overview</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={tooltipStyle} 
                  itemStyle={{ color: "#f8fafc" }}
                  formatter={(value) => [value, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>{rate}%</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Complete</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-6)", marginTop: "var(--space-4)" }}>
            {pieData.map((item) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div style={{ gridColumn: "span 4", background: "var(--bg-card)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", border: "1px solid var(--glass-border)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Priority Breakdown</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>Tasks by priority level</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid {...chartGridStyle} horizontal={false} />
                <XAxis type="number" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={chartAxisStyle} axisLine={false} tickLine={false} width={60} />
                <Tooltip 
                  contentStyle={tooltipStyle} 
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak Leaderboard */}
        <div style={{ gridColumn: "span 4", background: "var(--bg-card)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", border: "1px solid var(--glass-border)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Top Streaks</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>Your longest habit streaks</p>
          {habitStreaks.length === 0 ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
              <Flame size={40} style={{ color: "var(--text-muted)", opacity: 0.3, marginBottom: "var(--space-3)" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No daily habits yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {habitStreaks.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3)", background: "var(--bg-glass)", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg, #f59e0b, #d97706)" : "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 600, color: i === 0 ? "white" : "var(--text-muted)" }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>{h.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <Flame size={14} style={{ color: h.streak > 0 ? COLORS.pending : "var(--text-muted)" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: h.streak > 0 ? COLORS.pending : "var(--text-muted)" }}>{h.streak}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", border: "1px solid var(--glass-border)", marginBottom: "var(--space-8)" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Activity Trend</h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>Daily task completion over time</p>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.completed} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.completed} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.pending} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.pending} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid {...chartGridStyle} vertical={false} />
              <XAxis dataKey="day" tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="Completed" stroke={COLORS.completed} strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              <Area type="monotone" dataKey="Pending" stroke={COLORS.pending} strokeWidth={2} fillOpacity={1} fill="url(#colorPending)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Habit Consistency */}
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", border: "1px solid var(--glass-border)" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Habit Consistency</h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>Daily habit completion count</p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={habitConsistency}>
              <CartesianGrid {...chartGridStyle} vertical={false} />
              <XAxis dataKey="day" tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="done" fill={COLORS.accent} radius={[6, 6, 0, 0]} barSize={20}>
                {habitConsistency.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.done > 0 ? COLORS.accent : "var(--bg-tertiary)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Note */}
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "var(--space-6)", textAlign: "center" }}>
        Analytics reads from localStorage. Connect a backend to unlock full history.
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ 
      background: "var(--bg-card)", 
      borderRadius: "var(--radius-xl)", 
      padding: "var(--space-5)", 
      border: "1px solid var(--glass-border)",
      transition: "all 0.2s ease",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: color, opacity: 0.1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{value}</div>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>{label}</div>
        </div>
        <div style={{ 
          width: 44, 
          height: 44, 
          borderRadius: "var(--radius-lg)", 
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: color,
        }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
