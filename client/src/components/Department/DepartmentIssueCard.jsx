import React, { useState } from "react";
import DepartmentResponseModal from "./DepartmentResponseModal";
import "./DepartmentIssueCard.css";

function DepartmentIssueCard({ issue }) {
  // Normalize backend status: "received" → "submitted"
  const normalizedStatus = issue.status === "received" ? "submitted" : issue.status;
  const status = normalizedStatus || "pending";

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
      <div className="issue-card" style={getStatusStyle()}>
        <div className="issue-header">
          <span className="issue-id">{issue.issue_no}</span>
          <span className={`status ${status}`}>
            {status === "pending"
              ? "Response Required"
              : status === "overdue"
                ? "Overdue"
                : "Response Submitted"}
          </span>
        </div>

        <div className="issue-body">
          <div className="issue-row">
            <div className="label">Issue</div>
            <div className="value">{issue.issue}</div>
          </div>
          <div className="issue-row">
            <div className="label">Description</div>
            <div className="value">{issue.issue_description}</div>
          </div>
          <div className="issue-row">
            <div className="label">Priority</div>
            <div className="value">{issue.priority}</div>
          </div>

          <div className="issue-row">
            <div className="label">Location</div>
            <div className="value">{issue.location}</div>
          </div>

          <div className="issue-row">
            <div className={`label ${status === "overdue" ? "overdue-text" : ""}`}>
              Deadline
            </div>
            <div className={`value ${status === "overdue" ? "overdue-text" : ""}`}>
              <span>{issue.deadline}</span>
            </div>
          </div>
        </div>

        <div className="issue-footer">
          {status === "submitted" && (
            <>
              <div className="footer-line"></div>
              <div className="response-received">
                <p className="res">
                  <strong>Your Response:</strong> {issue.response?.text}
                </p>
                {issue.response?.attachment && (
                  <button
                    className="res-button"
                    onClick={() => {
                      const baseUrl = "http://127.0.0.1:8000";
                      const fullUrl = issue.response.attachment.startsWith("http") ? issue.response.attachment : `${baseUrl}${issue.response.attachment}`;
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
              className={`submit-btn ${status === "pending" ? "pending-btn" : "overdue-btn"
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
