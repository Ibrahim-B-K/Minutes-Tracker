import React, { useState } from "react";
import "./DPOIssueCard.css";
import api from "../../../api/axios";

function IssueCard({ issue }) {
  const [showLog, setShowLog] = useState(false);
  const status = issue.status || "pending";

  const getStatusStyle = () => {
    switch (status) {
      case "overdue":
        return { borderColor: "#b91c1c" };
      case "submitted":
      case "received":
        return { borderColor: "#16a34a" };
      default:
        return { borderColor: "#facc15" };
    }
  };

  // ✅ Now backend provides structured logs
  const timeline = issue.logs || [];

  return (
    <>
      <div className="dpo-issue-card" style={getStatusStyle()}>
        <div className="dpo-issue-header">
          <div className="dpo-issue-header-left">
            <span className="dpo-issue-id">
              {issue.issue_no && issue.issue_no !== "" ? `#${issue.issue_no}` : `#${issue.id}`}
            </span>
            {issue.minutes_title && (
              <span className="dpo-issue-minute-tag" title={issue.minutes_title}>
                {issue.minutes_title}
              </span>
            )}
          </div>

          <span
            className={`dpo-status ${
              status === "submitted"
                ? "dpo-received"
                : "dpo-" + status
            }`}
          >
            {status === "submitted" ? "Received" : status}
          </span>
        </div>

        <div className="dpo-issue-body">
          <div className="dpo-issue-row">
            <div className="dpo-label">Issue</div>
            <div className="dpo-value">{issue.issue}</div>
          </div>

          <div className="dpo-issue-row">
            <div className="dpo-label">Description</div>
            <div className="dpo-value">{issue.issue_description}</div>
          </div>

          {issue.location && (
            <div className="dpo-issue-row">
              <div className="dpo-label">Location</div>
              <div className="dpo-value">{issue.location}</div>
            </div>
          )}
        </div>

        <div className="dpo-issue-metrics">
          <div className="dpo-metric">
            <div className="dpo-metric-label">DEPARTMENT</div>
            <div className="dpo-metric-value dpo-dept-tag">
              {issue.department?.replace(/_/g, " ")}
            </div>
          </div>

          <div className="dpo-metric">
            <div className="dpo-metric-label">PRIORITY</div>
            <div className={`dpo-metric-value dpo-priority-${issue.priority?.toLowerCase()}`}>
              {issue.priority === "High" ? "! High" : issue.priority}
            </div>
          </div>

          <div className="dpo-metric">
            <div className="dpo-metric-label">DEADLINE</div>
            <div className={`dpo-metric-value ${status === "overdue" ? "dpo-overdue-text" : ""}`}>
              {issue.deadline}
            </div>
          </div>
        </div>

        <div className="dpo-issue-footer">
          <div className="dpo-footer-line"></div>

          {/* RESPONSE DISPLAY */}
          {(!issue.response || issue.response.length === 0) &&
            status === "pending" && (
              <p className="dpo-no-response">
                No response received yet
              </p>
            )}

          {status === "overdue" && (
            <p className="dpo-no-response">
              Response overdue ⚠️
            </p>
          )}

          {issue.response && issue.response.length > 0 && (
            <div
              className="dpo-response-container"
              style={{ marginTop: "10px" }}
            >
              {issue.response.map((resObj, index) => (
                <div
                  key={index}
                  className="dpo-response-received"
                >
                  <p className="dpo-res">
                    <strong>{resObj.department}:</strong>{" "}
                    {resObj.text}
                  </p>

                  {resObj.attachment && (
                    <button
                      className="dpo-res-button"
                      style={{
                        position: "static",
                        marginTop: "10px",
                      }}
                      onClick={() => {
                        const baseUrl =
                          api.defaults.baseURL;
                        const fullUrl =
                          resObj.attachment.startsWith(
                            "http"
                          )
                            ? resObj.attachment
                            : `${baseUrl}${resObj.attachment}`;
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

          {/* LOG BUTTON */}
          <button
            className="dpo-log-btn"
            onClick={() => setShowLog(true)}
          >
            Log
          </button>
        </div>
      </div>

      {/* LOG MODAL */}
      {showLog && (
        <div className="dpo-log-overlay">
          <div
            className="dpo-log-backdrop"
            onClick={() => setShowLog(false)}
          ></div>

          <div className="dpo-log-modal">
            <div className="dpo-log-header">
              <h3>Issue Log - {issue.issue_no}</h3>
              <button
                className="dpo-log-close"
                onClick={() => setShowLog(false)}
              >
                ✕
              </button>
            </div>

            <div className="dpo-log-body">
              {timeline.length === 0 ? (
                <p>No log history available</p>
              ) : (
                timeline.map((log, index) => (
                  <div
                    key={log.id || index}
                    className="dpo-log-entry"
                  >
                    <div className="dpo-log-dot"></div>

                    <div>
                      <strong>{log.title}</strong>

                      {log.department && (
                        <p>
                          <strong>Department:</strong>{" "}
                          {log.department}
                        </p>
                      )}

                      {log.description && (
                        <p className="dpo-log-msg">
                          {log.description}
                        </p>
                      )}

                      <p className="dpo-log-date">
                        {new Date(
                          log.created_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default IssueCard;