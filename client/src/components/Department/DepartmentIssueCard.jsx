import React, { useState } from "react";
import DepartmentResponseModal from "./DepartmentResponseModal";
import "./DepartmentIssueCard.css";
import api from "../../api/axios";

function DepartmentIssueCard({ issue }) {
  // Normalize backend status variants for stable rendering.
  const rawStatus = String(issue?.status || "pending").toLowerCase().trim();
  const status =
    rawStatus === "received" || rawStatus === "completed" ? "submitted" : rawStatus;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = () => {
    setIsModalOpen(false);
    alert("Response submitted successfully!");
  };

  const getStatusStyle = () => {
    switch (status) {
      case "overdue":
        return { borderColor: "#b91c1c" };
      case "submitted":
        return { borderColor: "#16a34a" };
      default:
        return { borderColor: "#facc15" };
    }
  };

  return (
    <>
      <div className="department-issue-card" style={getStatusStyle()}>
        <div className="department-issue-header">
          <span className="department-issue-id">{issue.issue_no}</span>
          <span className={`department-status department-${status}`}>
            {status === "pending"
              ? "Response Required"
              : status === "overdue"
                ? "Overdue"
                : "Response Submitted"}
          </span>
        </div>

        <div className="department-issue-body">
          <div className="department-issue-row">
            <div className="department-label">Issue</div>
            <div className="department-value">{issue.issue}</div>
          </div>
          <div className="department-issue-row">
            <div className="department-label">Description</div>
            <div className="department-value">{issue.issue_description}</div>
          </div>

          {issue.location && (
            <div className="department-issue-row">
              <div className="department-label">Location</div>
              <div className="department-value">{issue.location}</div>
            </div>
          )}
        </div>

        <div className="department-issue-metrics">
          <div className="department-metric">
            <div className="department-metric-label">DEPARTMENT</div>
            <div className="department-metric-value department-dept-tag">
              {issue.department?.replace(/_/g, " ")}
            </div>
          </div>

          <div className="department-metric">
            <div className="department-metric-label">PRIORITY</div>
            <div className={`department-metric-value department-priority-${issue.priority?.toLowerCase()}`}>
              {issue.priority === "High" ? "! High" : issue.priority}
            </div>
          </div>

          <div className="department-metric">
            <div className="department-metric-label">DEADLINE</div>
            <div className={`department-metric-value ${status === "overdue" ? "department-overdue-text" : ""}`}>
              {issue.deadline}
            </div>
          </div>
        </div>

        <div className="department-issue-footer">
          {status === "submitted" && (
            <>
              <div className="department-footer-line"></div>
              <div className="department-response-received">
                <p className="department-res">
                  <strong>Your Response:</strong> {issue.response?.text}
                </p>
                {issue.response?.attachment && (
                  <button
                    className="department-res-button"
                    onClick={() => {
                      const baseUrl = api.defaults.baseURL;
                      const fullUrl = issue.response.attachment.startsWith("http")
                        ? issue.response.attachment
                        : `${baseUrl}${issue.response.attachment}`;
                      window.open(fullUrl, "_blank");
                    }}
                  >
                    View Attachment
                  </button>
                )}
              </div>
            </>
          )}

          {(status === "pending" || status === "overdue") && (
            <button
              className={`department-submit-btn ${status === "pending" ? "department-pending-btn" : "department-overdue-btn"
                }`}
              onClick={() => setIsModalOpen(true)}
            >
              Submit Response
            </button>
          )}
        </div>
      </div>

      <DepartmentResponseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        issue={issue}
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default DepartmentIssueCard;
