import { BrowserRouter, Navigate, Route, Routes, NavLink } from "react-router-dom";
import Assignments from "./pages/Assignments";
import Inventory from "./pages/Inventory";
import Productivity from "./pages/Productivity";
import StudyMaterials from "./pages/StudyMaterials";

function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Student Life Dashboard</h1>
        <nav className="topnav">
          <NavLink to="/productivity">Productivity</NavLink>
          <NavLink to="/assignments">Assignments</NavLink>
          <NavLink to="/study-materials">Study</NavLink>
          <NavLink to="/inventory">Inventory</NavLink>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/inventory/dashboard" replace />} />
          <Route path="/productivity" element={<Productivity />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/study-materials" element={<StudyMaterials />} />
          <Route path="/inventory/*" element={<Inventory />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
