import React from "react";
import "./DPOIssueCard.css";

function IssueCard({ issue }) {
  const status = issue.status || "pending";

  const getStatusStyle = () => {
    switch (status) {
      case "overdue":
        return { borderColor: "#b91c1c" };
      case "submitted": // Backend sends "submitted", Frontend logic maps this to "received" tab
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
        {/* Status Badge */}
        <span className={`status ${status === "submitted" ? "received" : status}`}>
          {status === "submitted" ? "Received" : status}
        </span>
      </div>

      <div className="issue-body">
        <div className="issue-row">
          <div className="label">Department</div>
          {/* Now displays "Police, PWD, KWA" */}
          <div className="value">{issue.department}</div>
        </div>

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
        <div className="footer-line"></div>

        {/* LOGIC FOR DISPLAYING RESPONSES */}

        {/* If there are NO responses yet */}
        {(!issue.response || issue.response.length === 0) && status === "pending" && (
          <p className="no-response">No response received yet</p>
        )}

        {/* If status is Overdue */}
        {status === "overdue" && (
          <p className="no-response">Response overdue ⚠️</p>
        )}

        {/* If there ARE responses (Show list) */}
        {issue.response && issue.response.length > 0 && (
          <div className="response-container" style={{ marginTop: "10px" }}>
            {issue.response.map((resObj, index) => (
              <div key={index} className="response-received">
                <p className="res">
                  <strong>{resObj.department}:</strong> {resObj.text}
                </p>
                {resObj.attachment && (
                  <button
                    className="res-button"
                    style={{ position: 'static', marginTop: '10px' }}
                    onClick={() => {
                      const baseUrl = "http://127.0.0.1:8000";
                      const fullUrl = resObj.attachment.startsWith("http") ? resObj.attachment : `${baseUrl}${resObj.attachment}`;
                      window.open(fullUrl, "_blank");
                    }}
                  >
                    Download Attachment
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IssueCard;