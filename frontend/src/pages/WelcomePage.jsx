import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function WelcomePage() {
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('light-mode');
  };

  const features = [
    {
      icon: "📚",
      title: "Assignments",
      description: "Track and manage all your academic assignments with deadlines, priorities, and reference links.",
      features: ["Smart Dashboard", "Priority Management", "Deadline Tracking", "Reference Links"]
    },
    {
      icon: "📖", 
      title: "Study Materials",
      description: "Organize and access your study resources, notes, and learning materials.",
      features: ["Resource Library", "Quick Search", "Category Organization"]
    },
    {
      icon: "📦",
      title: "Inventory", 
      description: "Manage your study equipment, books, and supplies efficiently.",
      features: ["Item Tracking", "Usage Analytics", "Smart Reminders"]
    },
    {
      icon: "⚡",
      title: "Productivity",
      description: "Boost your productivity with time tracking and study session management.",
      features: ["Time Tracking", "Study Sessions", "Performance Analytics"]
    }
  ];

  const stats = [
    { number: "4+", label: "Modules" },
    { number: "100%", label: "Responsive" },
    { number: "24/7", label: "Available" }
  ];

  return (
    <div style={{ 
      minHeight: "100vh",
      background: darkMode 
        ? "var(--bg-primary)" 
        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      transition: "all var(--transition-normal)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Pattern */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: darkMode 
          ? `radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`
          : "transparent",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "var(--spacing-4) var(--spacing-6)",
        background: darkMode ? "var(--bg-secondary)" : "rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${darkMode ? "var(--glass-border)" : "rgba(255,255,255,0.2)"}`,
        zIndex: 100
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
          <div style={{ 
            fontSize: "var(--font-size-xl)", 
            fontWeight: "700",
            background: darkMode ? "var(--accent-gradient)" : "white",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Student Life Hub
          </div>
          <button
            onClick={toggleDarkMode}
            style={{
              background: darkMode ? "var(--bg-glass)" : "rgba(255,255,255,0.2)",
              border: `1px solid ${darkMode ? "var(--glass-border)" : "rgba(255,255,255,0.3)"}`,
              color: darkMode ? "var(--text-primary)" : "white",
              padding: "var(--spacing-2) var(--spacing-3)",
              borderRadius: "var(--radius-lg)",
              cursor: "pointer",
              fontSize: "var(--font-size-base)",
              transition: "all var(--transition-normal)",
              backdropFilter: "blur(10px)"
            }}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "var(--spacing-6)",
        paddingTop: "var(--spacing-20)"
      }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-12)", maxWidth: "800px" }}>
          <h1 style={{
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            fontWeight: "700",
            marginBottom: "var(--spacing-4)",
            color: darkMode ? "var(--text-primary)" : "white",
            lineHeight: 1.2
          }}>
            Welcome to Your Student Life Hub
          </h1>
          
          <p style={{
            fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
            color: darkMode ? "var(--text-secondary)" : "rgba(255,255,255,0.9)",
            marginBottom: "var(--spacing-8)",
            lineHeight: 1.6
          }}>
            Your comprehensive student management platform for assignments, study materials, inventory tracking, and productivity tools. 
            Organize your academic life with our modern, intuitive interface.
          </p>

          {/* Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "var(--spacing-4)",
            marginBottom: "var(--spacing-10)"
          }}>
            {stats.map((stat, index) => (
              <div key={index} style={{
                background: darkMode ? "var(--bg-glass)" : "rgba(255,255,255,0.1)",
                padding: "var(--spacing-4)",
                borderRadius: "var(--radius-xl)",
                textAlign: "center",
                backdropFilter: "blur(10px)",
                border: `1px solid ${darkMode ? "var(--glass-border)" : "rgba(255,255,255,0.2)"}`
              }}>
                <div style={{
                  fontSize: "var(--font-size-3xl)",
                  fontWeight: "700",
                  color: darkMode ? "var(--accent-primary)" : "white",
                  marginBottom: "var(--spacing-1)"
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontSize: "var(--font-size-sm)",
                  color: darkMode ? "var(--text-secondary)" : "rgba(255,255,255,0.8)"
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--spacing-6)",
          maxWidth: "1200px",
          width: "100%"
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
                  onClick={() => feature.title === "Assignments" ? navigate("/assignments") : null}
              style={{
                background: darkMode ? "var(--bg-glass)" : "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${darkMode ? "var(--glass-border)" : "rgba(255,255,255,0.2)"}`,
                borderRadius: "var(--radius-2xl)",
                padding: "var(--spacing-6)",
                cursor: feature.title === "Assignments" ? "pointer" : "default",
                transition: "all var(--transition-normal)",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (feature.title === "Assignments") {
                  e.target.style.transform = "translateY(-4px)";
                  e.target.style.boxShadow = "var(--glass-shadow-hover)";
                  e.target.style.borderColor = "var(--accent-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (feature.title === "Assignments") {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "var(--glass-shadow)";
                  e.target.style.borderColor = darkMode ? "var(--glass-border)" : "rgba(255,255,255,0.2)";
                }
              }}
            >
              <div style={{
                fontSize: "3rem",
                marginBottom: "var(--spacing-3)",
                textAlign: "center"
              }}>
                {feature.icon}
              </div>
              
              <h3 style={{
                fontSize: "var(--font-size-xl)",
                fontWeight: "600",
                color: darkMode ? "var(--text-primary)" : "white",
                marginBottom: "var(--spacing-3)",
                textAlign: "center"
              }}>
                {feature.title}
              </h3>
              
              <p style={{
                fontSize: "var(--font-size-base)",
                color: darkMode ? "var(--text-secondary)" : "rgba(255,255,255,0.8)",
                marginBottom: "var(--spacing-4)",
                lineHeight: 1.5,
                textAlign: "center"
              }}>
                {feature.description}
              </p>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-1)"
              }}>
                {feature.features.map((feat, featIndex) => (
                  <div key={featIndex} style={{
                    fontSize: "var(--font-size-sm)",
                    color: darkMode ? "var(--text-muted)" : "rgba(255,255,255,0.7)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-2)"
                  }}>
                    <span>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {feature.title === "Assignments" && (
                <button style={{
                  marginTop: "var(--spacing-4)",
                  width: "100%",
                  padding: "var(--spacing-3)",
                  background: darkMode ? "var(--accent-gradient)" : "white",
                  color: darkMode ? "white" : "var(--accent-primary)",
                  border: "none",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "var(--font-size-base)",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all var(--transition-normal)"
                }}>
                  Launch Assignments →
                </button>
              )}

              {feature.title === "Assignments" && (
                <div style={{
                  position: "absolute",
                  top: "var(--spacing-2)",
                  right: "var(--spacing-2)",
                  background: "var(--success)",
                  color: "white",
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "600",
                  padding: "var(--spacing-1) var(--spacing-2)",
                  borderRadius: "var(--radius-lg)"
                }}>
                  Available
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;