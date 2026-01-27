// AssignIssues.jsx
import React, { useState, useEffect } from "react";
import "./DPOAssignIssues.css";
import { Link } from "react-router-dom";
import DPOIssueAssignCard from "./DPOIssueAssignCard";
import api from "../../../api/axios";

export default function AssignIssues() {
  const [issues, setIssues] = useState([]);

  // 🔹 Fetch issues from backend on load
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await api.get("/assign-issues");
        setIssues(res.data);
      } catch (err) {
        console.error("Failed to load issues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // 🔹 Handle editing issue fields (department, deadline, priority etc.)
  const handleChange = (index, field, value) => {
    setIssues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // 🔹 Allocate all issues
  const handleAllocateAll = () => {
    api
      .post("/assign-issues/allocate-all", { issues })
      .then(() => alert("All issues allocated!"))
      .catch(err => console.error(err));
  };


  return (
    <div className="assign-issues-container">
      <div className="assign-header">
        <h2>Assign Issues</h2>

        <Link to="/dpo">
          <button className="allocate-btn" onClick={handleAllocateAll}>
            Allocate All
          </button>
        </Link>
      </div>

      {/* No issues */}
      {issues.length === 0 && <p>No pending issues found</p>}

      {/* Issue Cards */}
      <div className="issue-cards">
        {issues.map((issue, index) => (
          <DPOIssueAssignCard
            key={issue.issue_id}
            issue={issue}
            index={index}
            onChange={handleChange}
          />
        ))}
      </div>
    </div>
  );
}
