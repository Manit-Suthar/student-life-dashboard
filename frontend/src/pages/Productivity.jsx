import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../features/productivity/context/ThemeContext";
import Layout from "../features/productivity/layout/Layout";
import ProductivityDashboard from "../features/productivity/pages/Dashboard";
import Tasks from "../features/productivity/pages/Tasks";
import Habits from "../features/productivity/pages/Habits";
import Analytics from "../features/productivity/pages/Analytics";

export default function Productivity() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<ProductivityDashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}