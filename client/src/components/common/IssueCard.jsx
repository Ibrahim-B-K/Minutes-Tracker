import React, { useState } from "react";
import "./IssueCard.css";
import api from "../../api/axios";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UndoIcon from "@mui/icons-material/Undo";

/**
 * Unified Issue Card for all roles (DPO, Collector, Department)
 * 
 * Props:
 * - issue: The raw issue object
 * - role: 'dpo', 'collector', or 'department'
 * - onResolve: Callback when DPO resolves/unresolves (optional)
 * - onOpenLog: Callback to view log (DPO/Collector)
 * - onSubmitResponse: Callback for department submissions (optional)
 */
function IssueCard({ 
  issue, 
  role = "dpo", 
  onResolve, 
  onOpenLog, 
  onSubmitResponse 
}) {
  const [resolving, setResolving] = useState(false);
  const status = issue.status || "pending";
  const isResolved = issue.resolution_status === "resolved";

  const isDPO = role === "dpo";
  const isCollector = role === "collector";
  const isDept = role === "department";

  const getStatusStyle = () => {
    switch (status) {
      case "overdue":
        return { borderColor: "#b91c1c" };
      case "submitted":
      case "received":
      case "completed":
        return { borderColor: "#16a34a" };
      default:
        return { borderColor: "#facc15" };
    }
  };

  const isFollowUp = !!issue.parent_issue_id;
  const hasFollowUps = (issue.follow_up_count || 0) > 0;

  const handleResolveToggle = async () => {
    if (!isDPO) return;
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

  const downloadAttachment = (attachment) => {
    const baseUrl = api.defaults.baseURL;
    const fullUrl = attachment.startsWith("http")
      ? attachment
      : `${baseUrl}${attachment}`;
    window.open(fullUrl, "_blank");
  };

  return (
    <div className={`common-issue-card ${isResolved ? "common-issue-resolved" : ""}`} style={getStatusStyle()}>
      <div className="common-issue-header">
        <div className="common-issue-header-left">
          <span className="common-issue-id">
            {issue.issue_no && issue.issue_no !== "" ? `#${issue.issue_no}` : `#${issue.id}`}
          </span>
          {issue.minutes_title && (
            <span className="common-issue-minute-tag" title={issue.minutes_title}>
              {issue.minutes_title}
            </span>
          )}
          {isFollowUp && (
            <span className="common-follow-up-badge" title="This is a follow-up of a previous issue">
              <LinkIcon style={{ fontSize: 13 }} /> Follow-up
            </span>
          )}
          {hasFollowUps && (
            <span className="common-has-followups-badge" title={`${issue.follow_up_count} follow-up(s) in later meetings`}>
              {issue.follow_up_count} follow-up{issue.follow_up_count > 1 ? "s" : ""}
            </span>
          )}
          {isResolved && (
            <span className="common-resolved-badge">Resolved</span>
          )}
        </div>

        <span
          className={`common-status ${
            status === "submitted" || status === "received" || status === "completed"
              ? "common-status-received"
              : "common-status-" + status
          }`}
        >
          {status === "submitted" || status === "received" || status === "completed" ? "Received" : status}
        </span>
      </div>

      <div className="common-issue-body">
        <div className="common-issue-row">
          <div className="common-label">Issue</div>
          <div className="common-value">{issue.issue}</div>
        </div>

        <div className="common-issue-row">
          <div className="common-label">Description</div>
          <div className="common-value">{issue.issue_description}</div>
        </div>

        {issue.location && (
          <div className="common-issue-row">
            <div className="common-label">Location</div>
            <div className="common-value">{issue.location}</div>
          </div>
        )}
      </div>

      <div className="common-issue-metrics">
        <div className="common-metric">
          <div className="common-metric-label">DEPARTMENT</div>
          <div className="common-metric-value common-dept-tag">
            {issue.department?.replace(/_/g, " ")}
          </div>
        </div>

        <div className="common-metric">
          <div className="common-metric-label">PRIORITY</div>
          <div className={`common-metric-value common-priority-${issue.priority?.toLowerCase()}`}>
            {issue.priority}
          </div>
        </div>

        <div className="common-metric">
          <div className="common-metric-label">DEADLINE</div>
          <div className={`common-metric-value ${status === "overdue" ? "common-overdue-text" : ""}`}>
            {issue.deadline}
          </div>
        </div>
      </div>

      <div className="common-issue-footer">
        <div className="common-footer-line"></div>

        {/* RESPONSE DISPLAY FOR DPO/COLLECTOR (List of all responses) */}
        {(isDPO || isCollector) && (
          <>
            {(!issue.response || issue.response.length === 0) && status === "pending" && (
              <p className="common-no-response">No response received yet</p>
            )}
            {status === "overdue" && (
              <p className="common-no-response">Response overdue ⚠️</p>
            )}
            {issue.response && issue.response.length > 0 && (
              <div className="common-response-container">
                {(Array.isArray(issue.response) ? issue.response : [issue.response]).map((resObj, index) => (
                  <div key={index} className="common-response-item">
                    <p className="common-res-text">
                      <strong>{resObj.department || "Dept"}:</strong> {resObj.text}
                    </p>
                    {resObj.attachment && (
                      <button className="common-attachment-btn" onClick={() => downloadAttachment(resObj.attachment)}>
                        Download Attachment
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* RESPONSE DISPLAY FOR DEPARTMENT (Own response) */}
        {isDept && (status === "submitted" || status === "received" || status === "completed") && (
          <div className="common-response-container">
            <div className="common-response-item">
              <p className="common-res-text">
                <strong>Your Response:</strong> {issue.response?.text || issue.response?.[0]?.text}
              </p>
              {(issue.response?.attachment || issue.response?.[0]?.attachment) && (
                <button className="common-attachment-btn" onClick={() => downloadAttachment(issue.response?.attachment || issue.response?.[0]?.attachment)}>
                  Download Attachment
                </button>
              )}
            </div>
          </div>
        )}

        <div className="common-footer-actions">
          {isDept && (status === "pending" || status === "overdue") && (
            <button
              className={`common-submit-response-btn ${status === "overdue" ? "btn-overdue" : ""}`}
              onClick={onSubmitResponse}
            >
              Submit Response
            </button>
          )}

          {(isDPO || isCollector) && (
            <button className="common-log-btn" onClick={() => onOpenLog?.(issue)}>
              Log
            </button>
          )}

          {isDPO && (status === "submitted" || status === "completed" || status === "received") && (
            <button
              className={`common-resolve-btn ${isResolved ? "common-resolve-btn-undo" : ""}`}
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
  );
}

export default IssueCard;
