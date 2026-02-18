const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  updateAssignmentStatus,
} = require("./assignments.controller");

// Create assignment
router.post("/", createAssignment);

// Get all assignments
router.get("/", getAssignments);

// Full update assignment
router.put("/:id", updateAssignment);

// Update assignment status
router.patch("/:id", updateAssignmentStatus);

// Delete assignment
router.delete("/:id", deleteAssignment);

module.exports = router;
