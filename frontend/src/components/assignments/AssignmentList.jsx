import { useState, useRef, useEffect } from "react";
import References from "./References";
import { Calendar, ExternalLink, Pencil, Trash2, CheckCircle2, RotateCcw, MoreVertical, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";

function AssignmentList({ assignments, onEdit, onDelete, onStatusChange }) {
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
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
        const isMenuOpen = openMenuId === assignment.id;

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
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <div className={`priority-dot ${getPriorityClass(assignment.priority)}`}
                  title={`Priority: ${assignment.priority}`} />
                {/* Overflow Menu */}
                <div className="overflow-menu-wrapper" ref={isMenuOpen ? menuRef : null}>
                  <button
                    className="overflow-menu-trigger"
                    onClick={(e) => toggleMenu(assignment.id, e)}
                    title="More actions"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {isMenuOpen && (
                    <div className="overflow-menu">
                      <button
                        className="overflow-menu-item"
                        onClick={(e) => { e.stopPropagation(); onEdit(assignment); setOpenMenuId(null); }}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      {assignment.references && assignment.references.length > 0 && (
                        <button
                          className="overflow-menu-item"
                          onClick={(e) => { e.stopPropagation(); toggleCardExpansion(assignment.id); setOpenMenuId(null); }}
                        >
                          <LinkIcon size={14} /> {isExpanded ? "Hide" : "Show"} Links
                        </button>
                      )}
                      <button
                        className="overflow-menu-item danger"
                        onClick={(e) => { e.stopPropagation(); onDelete(assignment.id); setOpenMenuId(null); }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Meta Information */}
            <div className="assignment-meta">
              <div className="assignment-date">
                <Calendar size={14} /> {formatDate(assignment.dueDate)}
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
                  fontSize: "0.875rem",
                  marginBottom: "var(--space-2)",
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
                      <ExternalLink size={14} /> {ref.label || ref.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="assignment-actions">
              {assignment.status === "pending" ? (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => onStatusChange(assignment.id, "submitted")}
                >
                  <CheckCircle2 size={14} /> Mark Submitted
                </button>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onStatusChange(assignment.id, "pending")}
                >
                  <RotateCcw size={14} /> Mark Pending
                </button>
              )}
            </div>

            {/* Overdue Indicator */}
            {isOverdue && (
              <div className="overdue-badge">
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