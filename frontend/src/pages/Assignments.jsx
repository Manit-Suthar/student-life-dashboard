import { useState, useEffect } from "react";
import AssignmentList from "../components/assignments/AssignmentList";
import AssignmentForm from "../components/assignments/AssignmentForm";
import { getAssignments, deleteAssignment, updateAssignmentStatus } from "../services/assignmentsApi";
import { useLocation } from "react-router-dom";
import { ClipboardList, Search, Plus } from "lucide-react";

function Assignments() {
  const location = useLocation();
  const isListView = location.pathname === "/assignments/list";

  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    applyFilter(activeFilter);
  }, [assignments, activeFilter]);

  const fetchAssignments = async () => {
    try {
      const data = await getAssignments();
      setAssignments(data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = assignments;

    switch (filter) {
      case "pending":
        filtered = assignments.filter(a => a.status === "pending");
        break;
      case "submitted":
        filtered = assignments.filter(a => a.status === "submitted");
        break;
      case "overdue":
        filtered = assignments.filter(a => {
          const dueDate = new Date(a.dueDate);
          return a.status === "pending" && dueDate < today;
        });
        break;
      default:
        filtered = assignments;
    }

    // Sort by due date
    filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    setFilteredAssignments(filtered);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setShowForm(true);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAssignment(null);
  };

  const handleFormSubmit = () => {
    fetchAssignments();
    handleCloseForm();
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await deleteAssignment(id);
        setAssignments(assignments.filter(a => a.id !== id));
      } catch (error) {
        console.error("Error deleting assignment:", error);
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateAssignmentStatus(id, status);
      setAssignments(assignments.map(a =>
        a.id === id ? { ...a, status } : a
      ));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getFilterCounts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      all: assignments.length,
      pending: assignments.filter(a => a.status === "pending").length,
      submitted: assignments.filter(a => a.status === "submitted").length,
      overdue: assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return a.status === "pending" && dueDate < today;
      }).length
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-center">
          <div className="text-2xl mb-2">Loading assignments...</div>
          <div className="text-secondary">Please wait</div>
        </div>
      </div>
    );
  }

  // Show Dashboard view for /assignments, list view for /assignments/list
  if (!isListView) {
    return <Dashboard />;
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "var(--space-6)"
      }}>
        <div>
          <h1 style={{
            fontSize: "var(--font-size-3xl)",
            fontWeight: "600",
            marginBottom: "var(--space-2)"
          }}>
            Assignments
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Manage and track all your assignments in one place
          </p>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleAddAssignment}
        >
          <Plus size={18} />
          <span>Add Assignment</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => handleFilterChange("all")}
        >
          All ({counts.all})
        </button>
        <button
          className={`filter-tab ${activeFilter === "pending" ? "active" : ""}`}
          onClick={() => handleFilterChange("pending")}
        >
          Pending ({counts.pending})
        </button>
        <button
          className={`filter-tab ${activeFilter === "submitted" ? "active" : ""}`}
          onClick={() => handleFilterChange("submitted")}
        >
          Submitted ({counts.submitted})
        </button>
        <button
          className={`filter-tab ${activeFilter === "overdue" ? "active" : ""}`}
          onClick={() => handleFilterChange("overdue")}
        >
          Overdue ({counts.overdue})
        </button>
      </div>


      {/* Assignments List */}
      <div className="assignments-container">
        {filteredAssignments.length > 0 ? (
          <AssignmentList
            assignments={filteredAssignments}
            onEdit={handleEditAssignment}
            onDelete={handleDeleteAssignment}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="empty-state glass">
            <div className="empty-state-icon">
              {activeFilter === "all" ? <ClipboardList size={48} /> : <Search size={48} />}
            </div>
            <h3 className="empty-state-title">
              {activeFilter === "all"
                ? "No assignments yet"
                : `No ${activeFilter} assignments`
              }
            </h3>
            <p className="empty-state-description">
              {activeFilter === "all"
                ? "Start by adding your first assignment to stay organized"
                : `Great news! You have no ${activeFilter} assignments`
              }
            </p>
            {activeFilter === "all" && (
              <button
                className="btn btn-primary"
                onClick={handleAddAssignment}
              >
                <Plus size={16} />
                <span>Add Your First Assignment</span>
              </button>
            )}
            {activeFilter !== "all" && (
              <button
                className="btn btn-secondary"
                onClick={() => handleFilterChange("all")}
              >
                View All Assignments
              </button>
            )}
          </div>
        )}
      </div>

      {/* Assignment Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAssignment ? "Edit Assignment" : "Add New Assignment"}
              </h2>
              <button className="modal-close" onClick={handleCloseForm}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <AssignmentForm
                assignment={editingAssignment}
                onSubmit={handleFormSubmit}
                onCancel={handleCloseForm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;