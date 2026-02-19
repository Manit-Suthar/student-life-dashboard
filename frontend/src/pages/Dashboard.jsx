import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAssignments } from "../services/assignmentsApi";
import { BookOpen, Clock, CheckCircle2, AlertTriangle, PartyPopper, Plus, ClipboardList, BarChart3, ArrowRight } from "lucide-react";

function Dashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getAssignments();
        setAssignments(data);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  // Calculate statistics
  const totalAssignments = assignments.length;
  const pendingAssignments = assignments.filter(a => a.status === "pending").length;
  const submittedAssignments = assignments.filter(a => a.status === "submitted").length;
  const overdueAssignments = assignments.filter(a => {
    const dueDate = new Date(a.dueDate);
    const today = new Date();
    return a.status === "pending" && dueDate < today;
  }).length;

  // Sort assignments by due date for upcoming deadlines
  const upcomingDeadlines = assignments
    .filter(a => a.status === "pending")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  // Calculate days until due
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Get urgency level
  const getUrgency = (daysUntil) => {
    if (daysUntil < 0) return { level: "overdue", class: "urgency-high" };
    if (daysUntil <= 1) return { level: "high", class: "urgency-high" };
    if (daysUntil <= 3) return { level: "medium", class: "urgency-medium" };
    return { level: "low", class: "urgency-low" };
  };

  const getUrgencyLevel = (daysUntil) => {
    if (daysUntil < 0) return "Overdue";
    if (daysUntil <= 1) return "High";
    if (daysUntil <= 3) return "Medium";
    return "Low";
  };

  // Group assignments by subject
  const assignmentsBySubject = assignments.reduce((acc, assignment) => {
    const subject = assignment.subject || "General";
    if (!acc[subject]) {
      acc[subject] = { total: 0, completed: 0 };
    }
    acc[subject].total += 1;
    if (assignment.status === "submitted") {
      acc[subject].completed += 1;
    }
    return acc;
  }, {});

  // Subject colors for the bar chart
  const subjectColors = [
    "#6366f1", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"
  ];

  // Simple pie chart with only 2 colors: Completed vs Remaining
  const completedCount = submittedAssignments;
  const remainingCount = totalAssignments - submittedAssignments;
  const completionPercentage = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

  // Donut chart segments for legend
  const donutSegments = [
    { label: "Completed", value: completedCount, color: "#10b981" },
    { label: "Remaining", value: remainingCount, color: "#e5e7eb" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-center">
          <div className="text-2xl mb-2">Loading...</div>
          <div className="text-secondary">Fetching your assignments</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <div className="stat-number">{totalAssignments}</div>
              <div className="stat-label">Total Assignments</div>
            </div>
            <div className="stat-icon">
              <BookOpen size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <div className="stat-number">{pendingAssignments}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <div className="stat-number">{submittedAssignments}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <div className="stat-number">{overdueAssignments}</div>
              <div className="stat-label">Overdue</div>
            </div>
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}>
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Deadlines */}
      <div className="charts-container">
        {/* Modern Donut Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Completion Overview</h3>
          <div className="donut-chart">
            <div className="donut-visual">
              <svg viewBox="0 0 100 100" className="donut-svg">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="8"
                  transform="rotate(-90 50 50)"
                  opacity="0.3"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(completionPercentage / 100) * 220} 220`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="donut-center">
                <div className="number">{completionPercentage}%</div>
                <div className="label">Complete</div>
              </div>
            </div>
            <div className="donut-legend">
              {donutSegments.map(segment => (
                <div key={segment.label} className="legend-item">
                  <div className="legend-label">
                    <div
                      className="legend-color"
                      style={{ background: segment.color }}
                    />
                    {segment.label}
                  </div>
                  <div className="legend-value">{segment.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="chart-card">
          <div className="section-header">
            <h3 className="chart-title">Upcoming Deadlines</h3>
            <Link to="/assignments/list" className="view-all-btn">View All <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} /></Link>
          </div>
          <div className="deadlines-list">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.slice(0, 5).map((assignment) => {
                const daysUntilDue = getDaysUntilDue(assignment.dueDate);
                const urgencyLevel = getUrgencyLevel(daysUntilDue);
                const priorityBorderClass = `priority-${urgencyLevel.toLowerCase()}-border`;
                const subjectIndex = Object.keys(assignmentsBySubject).indexOf(assignment.subject || "General");
                const subjectColor = subjectColors[subjectIndex >= 0 ? subjectIndex % subjectColors.length : 0];

                return (
                  <div key={assignment.id} className="deadline-item">
                    <div className={`deadline-priority ${priorityBorderClass}`} />
                    <div className="deadline-content">
                      <div className="deadline-title">{assignment.title}</div>
                      <div className="deadline-meta">
                        <span className="deadline-subject" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <span className="subject-color-dot" style={{ background: subjectColor, width: 8, height: 8 }} />
                          {assignment.subject}
                        </span>
                        <span>•</span>
                        <span>{formatDate(assignment.dueDate)}</span>
                        <span className={`deadline-urgency urgency-${urgencyLevel.toLowerCase()}`}>
                          {urgencyLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{
                textAlign: "center",
                padding: "var(--space-6)",
                color: "var(--text-secondary)"
              }}>
                <div style={{ marginBottom: "var(--space-2)", opacity: 0.5 }}>
                  <PartyPopper size={32} style={{ margin: "0 auto" }} />
                </div>
                <div>No upcoming deadlines</div>
                <div style={{ fontSize: "0.875rem", marginTop: "var(--space-1)" }}>
                  You're all caught up!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject Breakdown */}
      {Object.keys(assignmentsBySubject).length > 0 && (
        <div className="chart-card" style={{ marginBottom: "var(--space-8)" }}>
          <h3 className="chart-title">Subject Breakdown</h3>
          <div className="subject-bars">
            {Object.entries(assignmentsBySubject).map(([subject, data], index) => {
              const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
              const color = subjectColors[index % subjectColors.length];
              return (
                <div key={subject} className="subject-bar-item">
                  <div className="subject-bar-header">
                    <div className="subject-bar-label">
                      <span className="subject-color-dot" style={{ background: color }} />
                      <span>{subject}</span>
                    </div>
                    <span className="subject-bar-count">{data.completed}/{data.total}</span>
                  </div>
                  <div className="subject-bar-track">
                    <div
                      className="subject-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="chart-card">
        <div className="section-header">
          <h3 className="chart-title">Quick Actions</h3>
        </div>
        <div className="quick-actions">
          <div className="action-card" onClick={() => navigate("/assignments/list")}>
            <div className="action-icon">
              <Plus size={24} />
            </div>
            <div className="action-title">Add Assignment</div>
            <div className="action-description">Create a new assignment quickly</div>
          </div>
          <div className="action-card" onClick={() => navigate("/assignments/list")}>
            <div className="action-icon">
              <ClipboardList size={24} />
            </div>
            <div className="action-title">Manage Tasks</div>
            <div className="action-description">View and edit all assignments</div>
          </div>
          <div className="action-card" onClick={() => navigate("/study")}>
            <div className="action-icon">
              <BookOpen size={24} />
            </div>
            <div className="action-title">Study Hub</div>
            <div className="action-description">Access your study materials</div>
          </div>
          <div className="action-card" onClick={() => navigate("/productivity")}>
            <div className="action-icon">
              <BarChart3 size={24} />
            </div>
            <div className="action-title">Analytics</div>
            <div className="action-description">Track your progress and stats</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;