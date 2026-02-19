import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link } from "react-router-dom";
import { BookOpen, BarChart3, ClipboardList, BookMarked, Package, Zap, Moon, Sun, ChevronDown, LayoutDashboard } from "lucide-react";

import WelcomePage from "./pages/WelcomePage";
import Dashboard from "./pages/Dashboard";
import Assignments from "./pages/Assignments";
import StudyMaterials from "./pages/StudyMaterials";
import Inventory from "./pages/Inventory";
import Productivity from "./pages/Productivity";

import "./styles/assignments.css";

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

function AppLayout() {
  const [darkMode, setDarkMode] = useState(true);
  const [hoveredSection, setHoveredSection] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleSectionHover = (sectionPath) => {
    setHoveredSection(sectionPath);
  };

  const handleSectionLeave = (sectionPath, e) => {
    // Prevent disappearing when moving to submenu
    try {
      if (e.relatedTarget && e.relatedTarget.closest && typeof e.relatedTarget.closest === 'function') {
        if (e.relatedTarget.closest('.dropdown-menu')) {
          return;
        }
      }
    } catch (error) {
      // Ignore errors related to relatedTarget
      console.debug('Navigation mouseleave error:', error);
    }
    setHoveredSection(null);
  };

  const handleSubSectionClick = (path) => {
    navigate(path);
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
      subItems: []
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
            const isHovered = hoveredSection === item.path;
            
            return (
              <div key={item.path} className="nav-item-container">
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => handleSectionHover(item.path)}
                  onMouseLeave={(e) => handleSectionLeave(item.path, e)}
                   onClick={() => {
                     navigate(item.path);
                     setHoveredSection(null);
                   }}
                >
                  <span className="nav-link-icon">{item.icon}</span>
                  <span className="nav-link-text">{item.label}</span>
                  {hasSubItems && (
                    <span className={`dropdown-arrow ${isHovered ? 'open' : ''}`}>
                      <ChevronDown size={14} />
                    </span>
                  )}
                </Link>
                
                {/* Dropdown Submenu */}
                {hasSubItems && isHovered && (
                  <div className="dropdown-menu">
                    {item.subItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`dropdown-item ${isSubActive ? 'active' : ''}`}
                          onClick={() => handleSubSectionClick(subItem.path)}
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

        <div className="top-nav-right">
          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            title="Toggle theme"
          >
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="content">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/assignments" element={<Dashboard />} />
            <Route path="/assignments/list" element={<Assignments />} />
            <Route path="/study" element={<StudyMaterials />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/productivity" element={<Productivity />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;