import { useState, useEffect } from "react";
import { addAssignment, updateAssignment } from "../../services/assignmentsApi";
import References from "./References";

function AssignmentForm({ assignment, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    dueDate: "",
    priority: "Medium",
    status: "pending",
    references: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || "",
        subject: assignment.subject || "",
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : "",
        priority: assignment.priority || "Medium",
        status: assignment.status || "pending",
        references: assignment.references || []
      });
    }
  }, [assignment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReferencesChange = (references) => {
    setFormData(prev => ({
      ...prev,
      references
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (assignment) {
        await updateAssignment(assignment.id, formData);
      } else {
        await addAssignment(formData);
      }
      onSubmit();
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert("Error saving assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!assignment;

  return (
    <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-input"
            placeholder="e.g., Math Homework Chapter 5"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* Subject and Priority Row */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="subject">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="form-input"
              placeholder="e.g., Mathematics"
              value={formData.subject}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="priority">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              className="form-select"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Due Date and Status Row */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="dueDate">
              Due Date *
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              className="form-input"
              value={formData.dueDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {isEditing && (
            <div className="form-group">
              <label className="form-label" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
          )}
        </div>

        {/* References */}
        <div className="form-group">
          <label className="form-label">
            Reference Links
          </label>
          <References
            references={formData.references}
            onChange={handleReferencesChange}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !formData.title || !formData.dueDate}
          >
            {loading ? (
              <>
                <span className="animate-pulse">⏳</span>
                <span>{isEditing ? "Updating..." : "Adding..."}</span>
              </>
            ) : (
              <>
                <span>{isEditing ? "✓" : "+"}</span>
                <span>{isEditing ? "Update Assignment" : "Add Assignment"}</span>
              </>
            )}
          </button>
        </div>
      </form>
  );
}

export default AssignmentForm;