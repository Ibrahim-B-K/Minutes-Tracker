import React, { useState } from "react";
import "./CollectorIssueCard.css";
import api from "../../../api/axios";

function IssueCard({ issue }) {
  const [showLog, setShowLog] = useState(false);

  const rawStatus = issue.status || "pending";
  const normalizedStatus =
    rawStatus === "submitted" ? "received" : rawStatus;

  const responses = Array.isArray(issue.response)
    ? issue.response
    : [];

  const getStatusStyle = () => {
    switch (normalizedStatus) {
      case "overdue":
        return { borderColor: "#b91c1c" };
      case "received":
        return { borderColor: "#16a34a" };
      default:
        return { borderColor: "#facc15" };
    }
  };

  // 🔹 BUILD TIMELINE
  const buildTimeline = () => {
    let timeline = [];

    // Issue Created
    if (issue.created_at) {
      timeline.push({
        type: "Created",
        text: "Issue Raised",
        date: issue.created_at,
      });
    }

    // Reuploads
    if (issue.reuploads && issue.reuploads.length > 0) {
      issue.reuploads.forEach((item) => {
        timeline.push({
          type: "Reupload",
          text: "Issue Re-uploaded",
          date: item.date,
        });
      });
    }

    // Responses
    if (responses.length > 0) {
      responses.forEach((resObj) => {
        timeline.push({
          type: "Response",
          text: `${resObj.department} responded`,
          date: resObj.date,
          message: resObj.text,
        });
      });
    }

    // Sort by date
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    return timeline;
  };

  const timeline = buildTimeline();

  return (
    <>
      <div
        className="collector-issue-card"
        style={getStatusStyle()}
      >
        <div className="collector-issue-header">
          <span className="collector-issue-id">
            {issue.issue_no}
          </span>
          <span
            className={`collector-status collector-${normalizedStatus}`}
          >
            {normalizedStatus}
          </span>
        </div>

        <div className="collector-issue-body">
          <div className="collector-issue-row">
            <div className="collector-label">Issue</div>
            <div className="collector-value">
              {issue.issue}
            </div>
          </div>

          <div className="collector-issue-row">
            <div className="collector-label">
              Description
            </div>
            <div className="collector-value">
              {issue.issue_description}
            </div>
          </div>

          {issue.location && (
            <div className="collector-issue-row">
              <div className="collector-label">
                Location
              </div>
              <div className="collector-value">
                {issue.location}
              </div>
            </div>
          )}
        </div>

        <div className="collector-issue-metrics">
          <div className="collector-metric">
            <div className="collector-metric-label">DEPARTMENT</div>
            <div className="collector-metric-value collector-dept-tag">
              {issue.department?.replace(/_/g, " ")}
            </div>
          </div>

          <div className="collector-metric">
            <div className="collector-metric-label">PRIORITY</div>
            <div className={`collector-metric-value collector-priority-${issue.priority?.toLowerCase()}`}>
              {issue.priority === "High" ? "! High" : issue.priority}
            </div>
          </div>

          <div className="collector-metric">
            <div className="collector-metric-label">DEADLINE</div>
            <div className={`collector-metric-value ${normalizedStatus === "overdue" ? "collector-overdue-text" : ""}`}>
              {issue.deadline}
            </div>
          </div>
        </div>

        <div className="collector-issue-footer">
          <div className="collector-footer-line"></div>

          {normalizedStatus === "pending" &&
            responses.length === 0 && (
              <p className="collector-no-response">
                No response received yet
              </p>
            )}

          {normalizedStatus === "overdue" && (
            <p className="collector-no-response">
              Response overdue ⚠️
            </p>
          )}

          {responses.length > 0 && (
            <div
              className="collector-response-container"
              style={{ marginTop: "10px" }}
            >
              {responses.map((resObj, index) => (
                <div
                  key={index}
                  className="collector-response-received"
                >
                  <p className="collector-res">
                    <strong>
                      {resObj.department}:
                    </strong>{" "}
                    {resObj.text}
                  </p>

                  {resObj.attachment && (
                    <button
                      className="collector-res-button"
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

          {/* 🔹 LOG BUTTON BOTTOM RIGHT */}
          <button
            className="collector-log-btn"
            onClick={() => setShowLog(true)}
          >
            Log
          </button>
        </div>
      </div>

      {/* 🔹 LOG MODAL */}
      {showLog && (
        <div className="collector-log-overlay">
          <div
            className="collector-log-backdrop"
            onClick={() => setShowLog(false)}
          ></div>

          <div className="collector-log-modal">
            <div className="collector-log-header">
              <h3>
                Issue Log - {issue.issue_no}
              </h3>
              <button
                className="collector-log-close"
                onClick={() => setShowLog(false)}
              >
                ✕
              </button>
            </div>

            <div className="collector-log-body">
              {timeline.length === 0 ? (
                <p>No log history available</p>
              ) : (
                timeline.map((item, index) => (
                  <div
                    key={index}
                    className="collector-log-entry"
                  >
                    <div className="collector-log-dot"></div>
                    <div>
                      <strong>{item.text}</strong>
                      <p>{item.date}</p>
                      {item.message && (
                        <p className="collector-log-msg">
                          {item.message}
                        </p>
                      )}
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