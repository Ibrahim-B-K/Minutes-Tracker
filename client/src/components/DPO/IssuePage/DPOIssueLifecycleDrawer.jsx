import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import TimelineIcon from "@mui/icons-material/Timeline";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "./DPOIssueLifecycleDrawer.css";

function formatDate(value) {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString();
}

function statusLabel(status) {
  const s = String(status || "pending").toLowerCase();
  if (s === "submitted" || s === "completed" || s === "received") return "Received";
  if (s === "overdue") return "Overdue";
  return "Pending";
}

function statusClass(status) {
  const s = String(status || "pending").toLowerCase();
  if (s === "submitted" || s === "completed" || s === "received") return "is-received";
  if (s === "overdue") return "is-overdue";
  return "is-pending";
}

export default function DPOIssueLifecycleDrawer({
  isOpen,
  onClose,
  selectedIssue,
}) {
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lifecycleItems, setLifecycleItems] = useState([]);
  const [meta, setMeta] = useState({ total_iterations: 0, filtered_iterations: 0, root_issue_no: null, root_issue_id: null });
  const [filters, setFilters] = useState({
    status: "all",
    department: "all",
    search: "",
    fromDate: "",
    toDate: "",
    hasResponse: "all",
  });

  useEffect(() => {
    if (!isOpen || !selectedIssue?.id) return;

    const fetchLifecycle = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (filters.status && filters.status !== "all") params.status = filters.status;
        if (filters.department && filters.department !== "all") params.department = filters.department;
        if (filters.search.trim()) params.search = filters.search.trim();
        if (filters.fromDate) params.from_date = filters.fromDate;
        if (filters.toDate) params.to_date = filters.toDate;
        if (filters.hasResponse && filters.hasResponse !== "all") {
          params.has_response = filters.hasResponse === "yes" ? "true" : "false";
        }

        const res = await api.get(`/issues/${selectedIssue.id}/lifecycle`, { params });
        const payload = res?.data || {};

        setLifecycleItems(Array.isArray(payload.items) ? payload.items : []);
        setMeta({
          total_iterations: payload.total_iterations || 0,
          filtered_iterations: payload.filtered_iterations || 0,
          root_issue_no: payload.root_issue_no,
          root_issue_id: payload.root_issue_id,
        });
      } catch (fetchErr) {
        console.error("Failed to fetch lifecycle:", fetchErr);
        setError("Unable to load lifecycle history.");
        setLifecycleItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLifecycle();
  }, [isOpen, selectedIssue?.id, filters]);

  const sortedItems = useMemo(() => {
    return [...(lifecycleItems || [])].sort((a, b) => {
      const aDate = new Date(a?.meeting_date || a?.created_at || 0).getTime();
      const bDate = new Date(b?.meeting_date || b?.created_at || 0).getTime();
      return aDate - bDate;
    });
  }, [lifecycleItems]);

  const departments = useMemo(() => {
    const set = new Set();
    (sortedItems || []).forEach((item) => {
      String(item?.department || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .forEach((dept) => set.add(dept));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [sortedItems]);

  if (!isOpen || !selectedIssue) return null;

  const rootItem = sortedItems[0] || selectedIssue;

  const toggleResponses = (issueId) => {
    setExpanded((prev) => ({ ...prev, [issueId]: !prev[issueId] }));
  };

  return (
    <div className="dpo-lifecycle-overlay" onClick={onClose}>
      <aside className="dpo-lifecycle-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="dpo-lifecycle-header">
          <div>
            <h2>Issue Lifecycle</h2>
            <p>
              #{selectedIssue.issue_no || selectedIssue.id} • {sortedItems.length} iteration{sortedItems.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="dpo-lifecycle-close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="dpo-lifecycle-summary">
          <div className="dpo-lifecycle-chip">
            <LinkIcon fontSize="small" />
            <span>Parent: #{meta.root_issue_no || rootItem.issue_no || meta.root_issue_id || rootItem.id}</span>
          </div>
          <div className="dpo-lifecycle-chip">
            <TimelineIcon fontSize="small" />
            <span>
              Showing {meta.filtered_iterations || sortedItems.length} of {meta.total_iterations || sortedItems.length} iteration(s)
            </span>
          </div>
        </div>

        <div className="dpo-lifecycle-filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="received">Received</option>
          </select>

          <select
            value={filters.department}
            onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.hasResponse}
            onChange={(e) => setFilters((prev) => ({ ...prev, hasResponse: e.target.value }))}
          >
            <option value="all">Response: All</option>
            <option value="yes">Has Response</option>
            <option value="no">No Response</option>
          </select>

          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Search issue/minutes"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>

        {loading && <div className="dpo-lifecycle-state">Loading lifecycle...</div>}
        {!loading && error && <div className="dpo-lifecycle-state error">{error}</div>}
        {!loading && !error && sortedItems.length === 0 && (
          <div className="dpo-lifecycle-state">No lifecycle items match this filter.</div>
        )}

        <div className="dpo-lifecycle-timeline">
          {sortedItems.map((item, index) => {
            const responses = Array.isArray(item.response) ? item.response : [];
            const isExpanded = !!expanded[item.id];
            const attachmentBase = api.defaults.baseURL;

            return (
              <div className="dpo-lifecycle-item" key={item.id || `${item.issue_no}-${index}`}>
                <div className="dpo-lifecycle-marker">
                  <span>{index + 1}</span>
                </div>

                <div className="dpo-lifecycle-content">
                  <div className="dpo-lifecycle-item-head">
                    <div>
                      <h4>{item.minutes_title || "Unknown Minutes"}</h4>
                      <p>{item.issue || "No title"}</p>
                    </div>
                    <span className={`dpo-lifecycle-status ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <div className="dpo-lifecycle-meta">
                    <span>
                      <CalendarMonthIcon fontSize="inherit" /> Meeting: {formatDate(item.meeting_date)}
                    </span>
                    <span>
                      <DescriptionIcon fontSize="inherit" /> Minutes ID: {item.minutes_id || "N/A"}
                    </span>
                    <span>
                      <LinkIcon fontSize="inherit" /> {item.parent_issue_id ? `Follow-up of #${rootItem.issue_no || rootItem.id}` : "Root issue"}
                    </span>
                  </div>

                  <div className="dpo-lifecycle-actions">
                    <button className="dpo-lifecycle-response-btn" onClick={() => toggleResponses(item.id)}>
                      <VisibilityIcon fontSize="inherit" />
                      {responses.length > 0
                        ? `${isExpanded ? "Hide" : "View"} response${responses.length > 1 ? "s" : ""} (${responses.length})`
                        : "No response recorded"}
                      <ExpandMoreIcon
                        fontSize="inherit"
                        className={`dpo-lifecycle-expand ${isExpanded ? "is-open" : ""}`}
                      />
                    </button>
                  </div>

                  {isExpanded && responses.length > 0 && (
                    <div className="dpo-lifecycle-response-list">
                      {responses.map((resp, idx) => {
                        const attachmentUrl = !resp?.attachment
                          ? null
                          : resp.attachment.startsWith("http")
                            ? resp.attachment
                            : `${attachmentBase}${resp.attachment}`;

                        return (
                          <div className="dpo-lifecycle-response-card" key={`${item.id}-${idx}`}>
                            <p><strong>{resp.department || "Department"}</strong></p>
                            <p>{resp.text || "No response text"}</p>
                            {attachmentUrl && (
                              <button
                                className="dpo-lifecycle-attachment"
                                onClick={() => window.open(attachmentUrl, "_blank")}
                              >
                                Open attachment
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
