const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  updateAssignmentStatus,
} = require("./assignments.controller");

router.post("/", createAssignment);
router.get("/", getAssignments);
router.put("/:id", updateAssignment);
router.patch("/:id", updateAssignmentStatus);
router.delete("/:id", deleteAssignment);

module.exports = router;
