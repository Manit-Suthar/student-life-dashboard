const prisma = require("../../prismaClient");

const getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ where: { userId: req.userId } });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, due, priority, status } = req.body;
    const task = await prisma.task.create({
      data: { title, description, due, priority, status, userId: req.userId }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, due, priority, status } = req.body;
    const task = await prisma.task.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { title, description, due, priority, status }
    });
    if (task.count === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await prisma.task.deleteMany({
      where: { id: req.params.id, userId: req.userId }
    });
    if (task.count === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
