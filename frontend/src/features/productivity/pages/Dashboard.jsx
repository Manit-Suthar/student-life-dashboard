import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Target, Flame, Clock, Zap, Repeat2, CheckCircle2, AlertCircle } from "lucide-react";
import { fetchTasks } from "../services/tasksApi";
import { fetchHabits } from "../services/habitsApi";

const COLORS = {
  completed: "#10b981",
  pending: "#f59e0b",
  accent: "#6366f1",
  error: "#ef4444",
  purple: "#8b5cf6",
};



function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function toYMD(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function fmtDayShort(d) { return d.toLocaleDateString(undefined, { weekday: "short" }); }
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

export default function ProductivityDashboard() {
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
      } catch (err) {
        console.error("Failed to load productivity dashboard data", err);
      }
    };
    
    loadData();

    // Listen to custom event for dynamic updates across tabs or pages
    const handleUpdate = () => loadData();
    window.addEventListener("productivity-data-change", handleUpdate);
    return () => window.removeEventListener("productivity-data-change", handleUpdate);
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
    if (overdueCount > 0) return `You have ${overdueCount} overdue task${overdueCount > 1 ? "s" : ""}. Clear those first for a quick win.`;
    if (completionRate >= 70) return "Strong progress — keep the momentum going today.";
    return "Stay focused. Small steps daily compound fast.";
  }, [totalTasks, habitsTotal, overdueCount, completionRate]);

  const tooltipStyle = {
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "12px 16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
    color: "#f8fafc",
    fontSize: "13px",
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Hero Section */}
      <div style={{ 
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)",
        borderRadius: "var(--radius-2xl)", 
        padding: "var(--space-8)", 
        border: "1px solid var(--glass-border)",
        marginBottom: "var(--space-8)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-6)" }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              <Zap size={16} style={{ color: COLORS.purple }} />
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--text-muted)" }}>
                Productivity Overview
              </span>
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 0, lineHeight: 1.4 }}>
              {insightLine}
            </h1>
          </div>

          <div style={{ 
            background: "var(--bg-card)", 
            borderRadius: "var(--radius-xl)", 
            padding: "var(--space-5)", 
            border: "1px solid var(--glass-border)",
            minWidth: 180,
            textAlign: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              <Zap size={16} style={{ color: productivityScore >= 70 ? COLORS.completed : productivityScore >= 40 ? COLORS.pending : COLORS.error }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)" }}>Your Score</span>
            </div>
            <div style={{ 
              fontSize: "3rem", 
              fontWeight: 800, 
              lineHeight: 1,
              background: productivityScore >= 70 
                ? "linear-gradient(135deg, #10b981, #059669)" 
                : productivityScore >= 40 
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : "linear-gradient(135deg, #ef4444, #dc2626)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {productivityScore}
            </div>
            <div style={{ 
              height: 6, 
              background: "var(--bg-tertiary)", 
              borderRadius: "var(--radius-full)", 
              marginTop: "var(--space-3)",
              overflow: "hidden",
            }}>
              <div style={{ 
                height: "100%", 
                width: `${productivityScore}%`, 
                background: productivityScore >= 70 
                  ? "linear-gradient(90deg, #10b981, #059669)" 
                  : productivityScore >= 40 
                    ? "linear-gradient(90deg, #f59e0b, #d97706)"
                    : "linear-gradient(90deg, #ef4444, #dc2626)",
                borderRadius: "var(--radius-full)",
                transition: "width 0.5s ease",
              }} />
            </div>
            <p style={{ fontSize: "0.75rem", marginTop: "var(--space-2)", color: "var(--text-muted)" }}>Based on tasks, habits & streaks</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", 
        gap: "var(--space-4)", 
        marginBottom: "var(--space-8)" 
      }}>
        <StatCard icon={Target} label="Total Tasks" value={totalTasks} color={COLORS.accent} />
        <StatCard icon={CheckCircle2} label="Completed" value={completedTasks} color={COLORS.completed} />
        <StatCard icon={Clock} label="In Progress" value={pendingTasks} color={COLORS.pending} />
        <StatCard icon={TrendingUp} label="Success Rate" value={`${completionRate}%`} color={COLORS.purple} />
        <StatCard icon={Flame} label="Best Streak" value={`${bestStreak}d`} color="#f59e0b" />
        <StatCard icon={Repeat2} label="Today's Habits" value={`${habitsDoneToday}/${habitsTotal}`} color={COLORS.accent} />
      </div>

      {/* Weekly Activity Chart */}
      <div style={{ 
        background: "var(--bg-card)", 
        borderRadius: "var(--radius-2xl)", 
        padding: "var(--space-6)", 
        border: "1px solid var(--glass-border)",
        marginBottom: "var(--space-6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Weekly Activity</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Completed vs Pending tasks</p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.completed }} />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Completed</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.pending }} />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Pending</span>
            </div>
          </div>
        </div>
        
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
              <XAxis 
                dataKey="day" 
                tick={{ fill: "#94a3b8", fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                tick={{ fill: "#94a3b8", fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
                dx={-10}
              />
              <Tooltip 
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Bar dataKey="Completed" fill={COLORS.completed} radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="Pending" fill={COLORS.pending} radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue Warning */}
      {overdueCount > 0 && (
        <div style={{ 
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "var(--radius-xl)", 
          padding: "var(--space-5)", 
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
        }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: "var(--radius-lg)", 
            background: "rgba(239, 68, 68, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <AlertCircle size={22} style={{ color: COLORS.error }} />
          </div>
          <div>
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: COLORS.error, marginBottom: "var(--space-1)" }}>
              {overdueCount} overdue task{overdueCount > 1 ? "s" : ""} need your attention
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Complete these to boost your productivity score
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalTasks === 0 && habitsTotal === 0 && (
        <div style={{ 
          background: "var(--bg-card)", 
          borderRadius: "var(--radius-2xl)", 
          padding: "var(--space-12)", 
          border: "1px solid var(--glass-border)",
          textAlign: "center",
        }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: "50%", 
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto var(--space-5)",
          }}>
            <Zap size={36} style={{ color: COLORS.accent }} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
            Ready to boost your productivity?
          </h3>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", maxWidth: 400, margin: "0 auto" }}>
            Add your first task or habit to start tracking your progress and building streaks
          </p>
        </div>
      )}
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{value}</div>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>{label}</div>
        </div>
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: "var(--radius-lg)", 
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: color,
        }}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
