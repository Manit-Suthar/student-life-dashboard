import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, ArrowLeft } from "lucide-react";

const BASE = "/productivity";

const PAGE_TITLES = {
  [`${BASE}`]: "Dashboard",
  [`${BASE}/tasks`]: "Tasks",
  [`${BASE}/habits`]: "Habits",
  [`${BASE}/analytics`]: "Analytics",
};

export default function Layout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";
  const isHome = location.pathname === BASE || location.pathname === `${BASE}/`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--canvas)" }}>
      {/* ── Top Bar ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 h-14"
        style={{
          background: "var(--canvas)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Back button on sub-pages */}
          {!isHome && (
            <button
              onClick={() => navigate(BASE)}
              className="p-2 rounded-xl transition-all duration-150"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--hover-bg)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Logo / Page Title */}
          {isHome ? (
            <h1
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--accent-500)" }}
            >
              Productiv
            </h1>
          ) : (
            <h1 className="text-base font-semibold" style={{ color: "var(--text)" }}>
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl transition-all duration-150"
          style={{
            background: "var(--hover-bg)",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-50)";
            e.currentTarget.style.color = "var(--accent-500)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--hover-bg)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 p-4 md:p-8 max-w-[1200px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
