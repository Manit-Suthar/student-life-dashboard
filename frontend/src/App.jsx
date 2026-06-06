import { useState, useEffect, useContext } from "react";
import { Routes, Route, useLocation, useNavigate, Link, Navigate } from "react-router-dom";
import { BookOpen, BarChart3, ClipboardList, BookMarked, Package, Zap, Moon, Sun, ChevronDown, LayoutDashboard, ListTodo, Repeat2 } from "lucide-react";

import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Assignments from "./pages/Assignments";
import StudyMaterials from "./pages/StudyMaterials";
import Inventory from "./pages/Inventory";

function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

import ProductivityDashboard from "./features/productivity/pages/Dashboard";
import Tasks from "./features/productivity/pages/Tasks";
import Habits from "./features/productivity/pages/Habits";
import Analytics from "./features/productivity/pages/Analytics";

import "./styles/assignments.css";
import "./styles/productivity.css";

function AppLayout() {
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext);

  // Apply theme
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Navigation structure
  const navigationItems = [
    {
      path: '/assignments',
      label: 'Assignments',
      icon: <BookOpen size={18} />,
      subItems: [
        { path: '/assignments', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { path: '/assignments/list', label: 'List', icon: <ClipboardList size={16} /> }
      ]
    },
    {
      path: '/study',
      label: 'Study Materials',
      icon: <BookMarked size={18} />,
      subItems: []
    },
    {
      path: '/inventory',
      label: 'Inventory',
      icon: <Package size={18} />,
      subItems: []
    },
    {
      path: '/productivity',
      label: 'Productivity',
      icon: <Zap size={18} />,
      subItems: [
        { path: '/productivity', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { path: '/productivity/tasks', label: 'Tasks', icon: <ListTodo size={16} /> },
        { path: '/productivity/habits', label: 'Habits', icon: <Repeat2 size={16} /> },
        { path: '/productivity/analytics', label: 'Analytics', icon: <BarChart3 size={16} /> }
      ]
    }
  ];

  const isHomePage = location.pathname === '/';

  return (
    <div className="app">
      {/* Top Navigation Bar */}
      <header className="top-nav">
        <div className="top-nav-left">
          <Link to="/" className="brand">
            <div className="brand-icon">S</div>
            <span className="brand-text">Student Life</span>
          </Link>
        </div>

        <nav className="top-nav-links">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.subItems && item.subItems.some(sub => sub.path === location.pathname));
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.path} className="nav-item-container">
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-link-icon">{item.icon}</span>
                  <span className="nav-link-text">{item.label}</span>
                  {hasSubItems && (
                    <span className="dropdown-arrow">
                      <ChevronDown size={14} />
                    </span>
                  )}
                </Link>

                {/* Dropdown — always rendered, CSS controls visibility on hover */}
                {hasSubItems && (
                  <div className="dropdown-menu">
                    {item.subItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`dropdown-item ${isSubActive ? 'active' : ''}`}
                        >
                          <span className="dropdown-icon">{subItem.icon}</span>
                          <span className="dropdown-text">{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="top-nav-right" style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
          {token && (
            <button className="btn btn-secondary btn-sm" onClick={logout}>
              Sign out
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            title="Toggle theme"
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/assignments" replace />} />
            
            <Route path="/assignments" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/assignments/list" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
            <Route path="/study" element={<ProtectedRoute><StudyMaterials /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/productivity" element={<ProtectedRoute><ProductivityDashboard /></ProtectedRoute>} />
            <Route path="/productivity/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/productivity/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
            <Route path="/productivity/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
