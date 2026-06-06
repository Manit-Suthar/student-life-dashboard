const prisma = require("../../prismaClient");

const getAssignments = async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({ where: { userId: req.userId } });
    const parsedAssignments = assignments.map((a) => ({
      ...a,
      references: a.references ? JSON.parse(a.references) : []
    }));
    res.json(parsedAssignments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { title, subject, dueDate, priority, status, references } = req.body;
    const assignment = await prisma.assignment.create({
      data: {
        title, subject, dueDate, priority, status, userId: req.userId,
        references: references ? JSON.stringify(references) : "[]"
      }
    });
    res.status(201).json({ ...assignment, references: references || [] });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const { title, subject, dueDate, priority, status, references } = req.body;
    const assignment = await prisma.assignment.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: {
        title, subject, dueDate, priority, status,
        references: references ? JSON.stringify(references) : "[]"
      }
    });
    if (assignment.count === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const assignment = await prisma.assignment.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { status }
    });
    if (assignment.count === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Status updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignment = await prisma.assignment.deleteMany({
      where: { id: req.params.id, userId: req.userId }
    });
    if (assignment.count === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateAssignmentStatus,
};
