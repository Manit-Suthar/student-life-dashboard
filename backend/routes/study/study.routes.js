const express = require("express");
const router = express.Router();
const {
  createMaterial,
  getMaterials,
  updateMaterial,
  deleteMaterial,
} = require("./study.controller");

router.post("/", createMaterial);
router.get("/", getMaterials);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

module.exports = router;
