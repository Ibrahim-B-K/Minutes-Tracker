import React from "react";
import "./IssueCard.css";

function IssueCard({ issue }) {
  const status = issue.status || "pending";

  const getStatusStyle = () => {
    switch (status) {
      case "overdue":
        return { borderColor: "#b91c1c" };
      case "received":
        return { borderColor: "#16a34a" };
      default:
        return { borderColor: "#facc15" };
    }
  };

  return (
    <div className="issue-card" style={getStatusStyle()}>
      <div className="issue-header">
        <span className="issue-id">{issue.issue_no}</span>
        <span className={`status ${status}`}>{status}</span>
      </div>

      <div className="issue-body">
        <div className="issue-row">
          <div className="label">Department</div>
          <div className="value">{issue.department}</div>
        </div>

        <div className="issue-row">
          <div className="label">Issue</div>
          <div className="value">{issue.issue}</div>
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
        <div className="footer-line"></div>

        {status === "pending" && (
          <p className="no-response">No response received yet</p>
        )}

        {status === "overdue" && (
          <p className="no-response">Response overdue ⚠️</p>
        )}

        {status === "received" && (
          <div className="response-received">
            <p className="res">
              <strong>Department Response:</strong> {issue.response}
            </p>
            <button className="res-button">Download Attachment</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default IssueCard;
