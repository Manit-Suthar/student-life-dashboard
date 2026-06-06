const API_BASE_URL = "http://localhost:5000/api/assignments";

// Helper function to handle API errors
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Get all assignments
export async function getAssignments() {
  const response = await fetch(API_BASE_URL, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return handleResponse(response);
}

// Add a new assignment
export async function addAssignment(data) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// Update an assignment (full update)
export async function updateAssignment(id, data) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// Update assignment status (partial update)
export async function updateAssignmentStatus(id, status) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

// Delete an assignment
export async function deleteAssignment(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  
  // Delete operations typically return 204 No Content
  if (response.status === 204) {
    return null;
  }
  
  return handleResponse(response);
}

// Get assignments by status
export async function getAssignmentsByStatus(status) {
  const assignments = await getAssignments();
  return assignments.filter(assignment => assignment.status === status);
}

// Get overdue assignments
export async function getOverdueAssignments() {
  const assignments = await getAssignments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return assignments.filter(assignment => {
    const dueDate = new Date(assignment.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return assignment.status === "pending" && dueDate < today;
  });
}

// Get assignments due soon (within next N days)
export async function getUpcomingAssignments(days = 7) {
  const assignments = await getAssignments();
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return assignments.filter(assignment => {
    const dueDate = new Date(assignment.dueDate);
    return assignment.status === "pending" && dueDate >= today && dueDate <= futureDate;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

// Get assignments by subject
export async function getAssignmentsBySubject(subject) {
  const assignments = await getAssignments();
  return assignments.filter(assignment => 
    assignment.subject?.toLowerCase() === subject.toLowerCase()
  );
}

// Search assignments by title or subject
export async function searchAssignments(query) {
  const assignments = await getAssignments();
  const lowercaseQuery = query.toLowerCase();
  
  return assignments.filter(assignment => 
    assignment.title.toLowerCase().includes(lowercaseQuery) ||
    assignment.subject?.toLowerCase().includes(lowercaseQuery)
  );
}

// Get assignment statistics
export async function getAssignmentStats() {
  const assignments = await getAssignments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === "pending").length,
    submitted: assignments.filter(a => a.status === "submitted").length,
    overdue: assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return a.status === "pending" && dueDate < today;
    }).length,
  };
  
  // Calculate completion rate
  stats.completionRate = stats.total > 0 
    ? Math.round((stats.submitted / stats.total) * 100) 
    : 0;
  
  // Group by subject
  stats.bySubject = assignments.reduce((acc, assignment) => {
    const subject = assignment.subject || "General";
    if (!acc[subject]) {
      acc[subject] = { total: 0, completed: 0, pending: 0 };
    }
    acc[subject].total++;
    if (assignment.status === "submitted") {
      acc[subject].completed++;
    } else {
      acc[subject].pending++;
    }
    return acc;
  }, {});
  
  // Group by priority
  stats.byPriority = assignments.reduce((acc, assignment) => {
    const priority = assignment.priority || "Medium";
    if (!acc[priority]) {
      acc[priority] = 0;
    }
    acc[priority]++;
    return acc;
  }, {});
  
  return stats;
}