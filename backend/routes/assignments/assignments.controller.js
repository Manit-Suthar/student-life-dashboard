let assignments = [];

const generateId = () => Date.now().toString();

exports.createAssignment = (req, res) => {
  const {
    title,
    subject = "General",
    dueDate,
    priority = "Medium",
    references = [],
  } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ message: "Title and due date are required" });
  }

  const newAssignment = {
    id: generateId(),
    title,
    subject,
    dueDate,
    priority,
    status: "pending",
    references,
    createdAt: new Date(),
  };

  assignments.push(newAssignment);
  res.status(201).json(newAssignment);
};

exports.getAssignments = (req, res) => {
  res.json(assignments);
};

exports.updateAssignment = (req, res) => {
  const { id } = req.params;
  const { title, subject, dueDate, priority, status, references } = req.body;
  const assignmentIndex = assignments.findIndex((a) => a.id === id);

  if (assignmentIndex === -1) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  if (!title || !dueDate) {
    return res.status(400).json({ message: "Title and due date are required" });
  }

  if (status && !["pending", "submitted"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (priority && !["High", "Medium", "Low"].includes(priority)) {
    return res.status(400).json({ message: "Invalid priority" });
  }

  assignments[assignmentIndex] = {
    ...assignments[assignmentIndex],
    title: title || assignments[assignmentIndex].title,
    subject: subject || assignments[assignmentIndex].subject,
    dueDate: dueDate || assignments[assignmentIndex].dueDate,
    priority: priority || assignments[assignmentIndex].priority,
    status: status || assignments[assignmentIndex].status,
    references: references || assignments[assignmentIndex].references,
  };

  res.json(assignments[assignmentIndex]);
};

exports.deleteAssignment = (req, res) => {
  const { id } = req.params;
  const assignmentIndex = assignments.findIndex((a) => a.id === id);

  if (assignmentIndex === -1) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  assignments.splice(assignmentIndex, 1);
  res.status(204).send();
};

exports.updateAssignmentStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const assignment = assignments.find((a) => a.id === id);

  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  if (!["pending", "submitted"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  assignment.status = status;
  res.json(assignment);
};
