const prisma = require("../../prismaClient");

const getItems = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({ where: { userId: req.userId } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createItem = async (req, res) => {
  try {
    const item = await prisma.inventoryItem.create({
      data: { ...req.body, userId: req.userId }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateItem = async (req, res) => {
  try {
    const item = await prisma.inventoryItem.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: req.body
    });
    if (item.count === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await prisma.inventoryItem.deleteMany({
      where: { id: req.params.id, userId: req.userId }
    });
    if (item.count === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getItems,
  createItem,
  updateItem,
  deleteItem,
};
