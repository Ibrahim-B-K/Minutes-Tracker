import React from "react";
import "./IssueCard.css";

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
            {issue.response.map((resText, index) => (
              <div 
                key={index} 
                className="response-received" 
                style={{ marginBottom: "8px", height: "auto", padding: "10px" }}
              >
                <p className="res" style={{ marginLeft: "0" }}>
                  <strong>Response:</strong> {resText}
                </p>
              </div>
            ))}
            {/* Optional: Add button only if needed */}
             {/* <button className="res-button" style={{position:'static', marginTop:'5px'}}>
               Download Attachment
             </button> */}
          </div>
        )}
      </div>
    </div>
  );
}

export default IssueCard;