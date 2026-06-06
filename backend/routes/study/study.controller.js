const prisma = require("../../prismaClient");

const getMaterials = async (req, res) => {
  try {
    const materials = await prisma.studyMaterial.findMany({ where: { userId: req.userId } });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createMaterial = async (req, res) => {
  try {
    const material = await prisma.studyMaterial.create({
      data: { ...req.body, userId: req.userId }
    });
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const material = await prisma.studyMaterial.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: req.body
    });
    if (material.count === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const material = await prisma.studyMaterial.deleteMany({
      where: { id: req.params.id, userId: req.userId }
    });
    if (material.count === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
};
