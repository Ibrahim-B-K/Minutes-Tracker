import React, { useState } from "react";
import "./DPOIssueCard.css";
import api from "../../../api/axios";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UndoIcon from "@mui/icons-material/Undo";

function IssueCard({ issue, onResolve, onOpenLog }) {
  const [resolving, setResolving] = useState(false);
  const status = issue.status || "pending";
  const isResolved = issue.resolution_status === "resolved";

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

  const isFollowUp = !!issue.parent_issue_id;
  const hasFollowUps = (issue.follow_up_count || 0) > 0;

  const handleResolveToggle = async () => {
    const newStatus = isResolved ? "unresolved" : "resolved";
    setResolving(true);
    try {
      await api.patch(`/issues/resolve/${issue.id}`, { resolution_status: newStatus });
      if (onResolve) onResolve(issue.id, newStatus);
    } catch (err) {
      console.error("Failed to update resolution status:", err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <>
      <div className={`dpo-issue-card ${isResolved ? "dpo-issue-resolved" : ""}`} style={getStatusStyle()}>
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
            {isFollowUp && (
              <span className="dpo-follow-up-badge" title="This is a follow-up of a previous issue">
                <LinkIcon style={{ fontSize: 13 }} /> Follow-up
              </span>
            )}
            {hasFollowUps && (
              <span className="dpo-has-followups-badge" title={`${issue.follow_up_count} follow-up(s) in later meetings`}>
                {issue.follow_up_count} follow-up{issue.follow_up_count > 1 ? "s" : ""}
              </span>
            )}
            {isResolved && (
              <span className="dpo-resolved-badge">Resolved</span>
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
          <div className="dpo-footer-actions">
            <button
              className="dpo-log-btn"
              onClick={() => onOpenLog?.(issue)}
            >
              Log
            </button>
            {(status === "submitted" || status === "completed" || status === "received") && (
              <button
                className={`dpo-resolve-btn ${isResolved ? "dpo-resolve-btn-undo" : ""}`}
                onClick={handleResolveToggle}
                disabled={resolving}
                title={isResolved ? "Mark as unresolved" : "Mark as resolved"}
              >
                {isResolved ? (
                  <><UndoIcon style={{ fontSize: 16 }} /> Unresolve</>
                ) : (
                  <><CheckCircleOutlineIcon style={{ fontSize: 16 }} /> Resolve</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default IssueCard;