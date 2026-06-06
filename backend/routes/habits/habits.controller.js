const prisma = require("../../prismaClient");

const getHabits = async (req, res) => {
  try {
    const habits = await prisma.habit.findMany({ where: { userId: req.userId } });
    const parsedHabits = habits.map(h => ({
      ...h,
      completions: h.completions ? JSON.parse(h.completions) : []
    }));
    res.json(parsedHabits);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createHabit = async (req, res) => {
  try {
    const { name, goalType, weeklyTarget, notes, completions } = req.body;
    const habit = await prisma.habit.create({
      data: { 
        name, goalType, weeklyTarget, notes, userId: req.userId,
        completions: completions ? JSON.stringify(completions) : "[]" 
      }
    });
    res.status(201).json({ ...habit, completions: completions || [] });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateHabit = async (req, res) => {
  try {
    const { name, goalType, weeklyTarget, notes, completions } = req.body;
    const habit = await prisma.habit.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { 
        name, goalType, weeklyTarget, notes,
        completions: completions ? JSON.stringify(completions) : "[]"
      }
    });
    if (habit.count === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const habit = await prisma.habit.deleteMany({
      where: { id: req.params.id, userId: req.userId }
    });
    if (habit.count === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getHabits, createHabit, updateHabit, deleteHabit };
