// Temporary in-memory storage
let assignments = [];

// Utility function to generate unique IDs
const generateId = () => Date.now().toString();

// Create a new assignment
exports.createAssignment = (req, res) => {
  const {
    title,
    subject = "General",
    dueDate,
    priority = "Medium",
    references = [],
  } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({
      message: "Title and due date are required",
    });
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

// Get all assignments
exports.getAssignments = (req, res) => {
  res.json(assignments);
};

// Full update of assignment
exports.updateAssignment = (req, res) => {
  const { id } = req.params;
  const { title, subject, dueDate, priority, status, references } = req.body;

  const assignmentIndex = assignments.findIndex(a => a.id === id);

  if (assignmentIndex === -1) {
    return res.status(404).json({
      message: "Assignment not found",
    });
  }

  // Validate required fields
  if (!title || !dueDate) {
    return res.status(400).json({
      message: "Title and due date are required",
    });
  }

  // Validate status if provided
  if (status && !["pending", "submitted"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status",
    });
  }

  // Validate priority if provided
  if (priority && !["High", "Medium", "Low"].includes(priority)) {
    return res.status(400).json({
      message: "Invalid priority",
    });
  }

  // Update assignment
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

// Delete assignment
exports.deleteAssignment = (req, res) => {
  const { id } = req.params;

  const assignmentIndex = assignments.findIndex(a => a.id === id);

  if (assignmentIndex === -1) {
    return res.status(404).json({
      message: "Assignment not found",
    });
  }

  assignments.splice(assignmentIndex, 1);

  res.status(204).send();
};

// Update assignment status
exports.updateAssignmentStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const assignment = assignments.find(a => a.id === id);

  if (!assignment) {
    return res.status(404).json({
      message: "Assignment not found",
    });
  }

  if (!["pending", "submitted"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status",
    });
  }

  assignment.status = status;

  res.json(assignment);
};
