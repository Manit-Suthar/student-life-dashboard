import { useEffect, useState } from "react";
import AssignmentList from "./AssignmentList";
import { getAssignments } from "../../services/assignmentsApi";
import "../../styles/assignments.css";

/* ============================
   Helper Functions
============================ */

function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}

function priorityRank(priority) {
  if (priority === "High") return 1;
  if (priority === "Medium") return 2;
  return 3;
}

function sortAssignments(list) {
  return [...list]
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

/* ============================
   Component
============================ */

function AssignmentsDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState("all"); // all | overdue | upcoming

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      const data = await getAssignments();
      setAssignments(data);
    } catch (error) {
      console.error("Failed to load assignments", error);
    }
  }

  const overdue = sortAssignments(
    assignments.filter((a) => isOverdue(a.dueDate))
  );

  const upcoming = sortAssignments(
    assignments.filter((a) => !isOverdue(a.dueDate))
  );

  let visibleOverdue = overdue;
  let visibleUpcoming = upcoming;

  if (filter === "overdue") visibleUpcoming = [];
  if (filter === "upcoming") visibleOverdue = [];

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Assignments Dashboard</h2>

      {/* ================= CARDS ================= */}
      <div className="cards">
        <div className="card total">
          <p>Total</p>
          <h3>{assignments.length}</h3>
        </div>

        <div className="card overdue">
          <p>Overdue</p>
          <h3>{overdue.length}</h3>
        </div>

        <div className="card upcoming">
          <p>Upcoming</p>
          <h3>{upcoming.length}</h3>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="filter-buttons">
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("overdue")}>Overdue</button>
        <button onClick={() => setFilter("upcoming")}>Upcoming</button>
      </div>

      {/* ================= OVERDUE ================= */}
      {visibleOverdue.length > 0 && (
        <>
          <h3 className="section-title overdue-text">
            Overdue Assignments
          </h3>
          <div className="assignments-grid">
            <AssignmentList assignments={visibleOverdue} />
          </div>
        </>
      )}

      {/* ================= UPCOMING ================= */}
      {visibleUpcoming.length > 0 && (
        <>
          <h3 className="section-title upcoming-text">
            Upcoming Assignments
          </h3>
          <div className="assignments-grid">
            <AssignmentList assignments={visibleUpcoming} />
          </div>
        </>
      )}

      {visibleOverdue.length === 0 &&
        visibleUpcoming.length === 0 && (
          <p className="empty-text">No assignments found.</p>
        )}
    </div>
  );
}

export default AssignmentsDashboard;
