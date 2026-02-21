const express = require("express");
const cors = require("cors");
const assignmentsRoutes = require("./routes/assignments");
const inventoryRoutes = require("./routes/inventory");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.use("/api/assignments", assignmentsRoutes);
app.use("/api/inventory", inventoryRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
