const express = require("express");
const cors = require("cors");

// 🔽 IMPORT FEATURE ROUTES
const authRoutes = require("./routes/auth");
const assignmentsRoutes = require("./routes/assignments");
const studyRoutes = require("./routes/study");
const inventoryRoutes = require("./routes/inventory");
const tasksRoutes = require("./routes/tasks");
const habitsRoutes = require("./routes/habits");
const authMiddleware = require("./middleware/authMiddleware");
// 🔼 IMPORT FEATURE ROUTES

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// 🔽 REGISTER FEATURE ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/assignments", authMiddleware, assignmentsRoutes);
app.use("/api/study", authMiddleware, studyRoutes);
app.use("/api/inventory", authMiddleware, inventoryRoutes);
app.use("/api/tasks", authMiddleware, tasksRoutes);
app.use("/api/habits", authMiddleware, habitsRoutes);
// 🔼 REGISTER FEATURE ROUTES

// Health check (keep this)
app.get("/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
