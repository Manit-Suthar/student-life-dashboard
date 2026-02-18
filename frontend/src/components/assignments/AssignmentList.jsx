import { useState } from "react";
import References from "./References";

function AssignmentList({ assignments, onEdit, onDelete, onStatusChange }) {
  const [expandedCards, setExpandedCards] = useState(new Set());

  const toggleCardExpansion = (id) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusBadge = (assignment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(assignment.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    let statusClass = "badge-pending";
    let statusText = "Pending";
    
    if (assignment.status === "submitted") {
      statusClass = "badge-submitted";
      statusText = "Submitted";
    } else if (dueDate < today) {
      statusClass = "badge-overdue";
      statusText = "Overdue";
    }
    
    return { class: statusClass, text: statusText };
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "High":
        return "priority-high";
      case "Medium":
        return "priority-medium";
      case "Low":
        return "priority-low";
      default:
        return "priority-medium";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    if (diffDays < 0) {
      return `${formattedDate} (${Math.abs(diffDays)} days overdue)`;
    } else if (diffDays === 0) {
      return `${formattedDate} (Due today)`;
    } else if (diffDays === 1) {
      return `${formattedDate} (Due tomorrow)`;
    } else if (diffDays <= 7) {
      return `${formattedDate} (${diffDays} days)`;
    } else {
      return formattedDate;
    }
  };

  if (assignments.length === 0) {
    return null; // Parent component handles empty state
  }

  return (
    <div className="assignments-grid">
      {assignments.map((assignment) => {
        const isExpanded = expandedCards.has(assignment.id);
        const statusBadge = getStatusBadge(assignment);
        const isOverdue = statusBadge.text === "Overdue";
        
        return (
          <div
            key={assignment.id}
            className={`assignment-card glass glass-hover ${isOverdue ? "overdue" : ""} fade-in`}
          >
            {/* Card Header */}
            <div className="assignment-header">
              <div style={{ flex: 1 }}>
                <h3 className="assignment-title">{assignment.title}</h3>
                {assignment.subject && (
                  <div className="assignment-subject">{assignment.subject}</div>
                )}
              </div>
              <div className={`priority-dot ${getPriorityClass(assignment.priority)}`} 
                   title={`Priority: ${assignment.priority}`} />
            </div>

            {/* Card Meta Information */}
            <div className="assignment-meta">
              <div className="assignment-date">
                📅 {formatDate(assignment.dueDate)}
              </div>
            </div>

            {/* Status and Priority Badges */}
            <div className="assignment-badges">
              <span className={`badge ${statusBadge.class}`}>
                {statusBadge.text}
              </span>
              <span className={`badge badge-${getPriorityClass(assignment.priority)}`}>
                {assignment.priority} Priority
              </span>
            </div>

            {/* References (shown when expanded) */}
            {isExpanded && assignment.references && assignment.references.length > 0 && (
              <div className="assignment-references">
                <h4 style={{ 
                  fontSize: "var(--font-size-sm)", 
                  marginBottom: "var(--spacing-2)",
                  color: "var(--text-secondary)"
                }}>
                  References
                </h4>
                <div className="reference-links">
                  {assignment.references.map((ref, index) => (
                    <a
                      key={index}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="reference-link"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(ref.url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      🔗 {ref.label || ref.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="assignment-actions">
              {assignment.status === "pending" ? (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => onStatusChange(assignment.id, "submitted")}
                >
                  ✓ Mark Submitted
                </button>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onStatusChange(assignment.id, "pending")}
                >
                  ↺ Mark Pending
                </button>
              )}
              
              {assignment.references && assignment.references.length > 0 && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleCardExpansion(assignment.id)}
                >
                  {isExpanded ? "▲" : "▼"} {isExpanded ? "Hide" : "Show"} Links
                </button>
              )}
              
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onEdit(assignment)}
              >
                ✏️ Edit
              </button>
              
              <button
                className="btn btn-error btn-sm"
                onClick={() => onDelete(assignment.id)}
              >
                🗑️ Delete
              </button>
            </div>

            {/* Overdue Indicator */}
            {isOverdue && (
              <div style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                background: "var(--error)",
                color: "white",
                fontSize: "var(--font-size-xs)",
                fontWeight: "600",
                padding: "var(--spacing-1) var(--spacing-2)",
                borderRadius: "0 0 0 var(--radius-lg)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }}>
                OVERDUE
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AssignmentList;