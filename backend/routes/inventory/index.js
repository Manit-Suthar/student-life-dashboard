const express = require("express");
const router = express.Router();

const itemsRoutes = require("./items.routes");
const {
  getBorrowed,
  createBorrowed,
  returnBorrowed,
  getStats,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("./items.controller");

router.use("/items", itemsRoutes);
router.get("/borrowed", getBorrowed);
router.post("/borrowed", createBorrowed);
router.post("/borrowed/:id/return", returnBorrowed);
router.get("/stats", getStats);

router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

module.exports = router;
