const express = require("express");
const cors = require("cors");

// 🔽 IMPORT FEATURE ROUTES
const assignmentsRoutes = require("./routes/assignments");
// 🔼 IMPORT FEATURE ROUTES

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// 🔽 REGISTER FEATURE ROUTES
app.use("/api/assignments", assignmentsRoutes);
// 🔼 REGISTER FEATURE ROUTES

// Health check (keep this)
app.get("/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
