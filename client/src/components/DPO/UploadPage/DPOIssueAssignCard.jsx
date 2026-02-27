import React, { useRef, useState, useMemo } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import OutlinedFlagIcon from "@mui/icons-material/OutlinedFlag";
import FlagIcon from "@mui/icons-material/Flag";
import LinkIcon from "@mui/icons-material/Link";

export default function IssueAssignCard({
  issue,
  onChange,
  index,
  onAllocate,
  onDelete,
  existingIssues = [],
  isFlagPanelOpen = false,
  mappedExistingId = null,
  suggestedMatch = null,
  onToggleFlagPanel,
  onMapIssue,
}) {
  const dateRef = useRef(null);
  const [flagSearch, setFlagSearch] = useState("");

  const handleChange = (field, value) => onChange(index, field, value);

  const formatDateInput = (text) => {
    const digits = text.replace(/\D/g, "");
    const day = digits.substring(0, 2);
    const month = digits.substring(2, 4);
    const year = digits.substring(4, 8);

    let formatted = day;
    if (month) formatted += `-${month}`;
    if (year) formatted += `-${year}`;
    return formatted;
  };

  const convertDatePickerValue = (value) => {
    const [y, m, d] = value.split("-");
    return `${d}-${m}-${y}`;
  };

  // Filter existing issues by search text
  const filteredExisting = useMemo(() => {
    if (!flagSearch.trim()) return existingIssues;
    const q = flagSearch.toLowerCase();
    return existingIssues.filter(
      (item) =>
        (item.issue || "").toLowerCase().includes(q) ||
        (item.issue_description || "").toLowerCase().includes(q) ||
        (item.minutes_title || "").toLowerCase().includes(q) ||
        (item.department || "").toLowerCase().includes(q)
    );
  }, [existingIssues, flagSearch]);

  // Sort: suggested match first, then rest
  const sortedExisting = useMemo(() => {
    if (!suggestedMatch) return filteredExisting;
    const suggestedId = suggestedMatch.existingId;
    return [...filteredExisting].sort((a, b) => {
      if (a.id === suggestedId) return -1;
      if (b.id === suggestedId) return 1;
      return 0;
    });
  }, [filteredExisting, suggestedMatch]);

  // Get info about the mapped issue for display
  const mappedIssueInfo = mappedExistingId
    ? existingIssues.find((e) => e.id === mappedExistingId)
    : null;

  return (
    <div className="dpo-issue-assign-card">
      <div className="dpo-issue-top">
        <div className="dpo-entry-id">
          {issue.issue_no}
          {mappedIssueInfo && (
            <span className="dpo-linked-badge" title={`Linked to: ${mappedIssueInfo.issue}`}>
              <LinkIcon style={{ fontSize: 14 }} /> Follow-up
            </span>
          )}
        </div>
        <button
          className={`dpo-flag-btn ${mappedExistingId ? "dpo-flag-btn-mapped" : ""} ${
            suggestedMatch && !mappedExistingId ? "dpo-flag-btn-suggested" : ""
          }`}
          onClick={onToggleFlagPanel}
          title={
            mappedExistingId
              ? "Linked to existing issue"
              : suggestedMatch
              ? `AI suggests a match (${suggestedMatch.confidence})`
              : "Link to existing issue"
          }
        >
          {mappedExistingId ? (
            <FlagIcon fontSize="small" />
          ) : (
            <OutlinedFlagIcon fontSize="small" />
          )}
        </button>
      </div>

      {isFlagPanelOpen && (
        <div className="dpo-unresolved-panel">
          <p className="dpo-unresolved-title">Link to existing issue</p>
          <input
            className="dpo-flag-search"
            type="text"
            placeholder="Search issues..."
            value={flagSearch}
            onChange={(e) => setFlagSearch(e.target.value)}
          />
          <div className="dpo-unresolved-list">
            {sortedExisting.length === 0 && (
              <p className="dpo-no-existing">No existing issues found</p>
            )}
            {sortedExisting.slice(0, 15).map((item) => {
              const isSuggested = suggestedMatch && suggestedMatch.existingId === item.id;
              return (
                <label
                  key={item.id}
                  className={`dpo-unresolved-item ${isSuggested ? "dpo-suggested-item" : ""}`}
                >
                  <input
                    type="radio"
                    name={`existing-map-${index}`}
                    checked={mappedExistingId === item.id}
                    onChange={() => onMapIssue?.(item.id)}
                  />
                  <div className="dpo-existing-info">
                    <span className="dpo-existing-title">
                      {item.issue}
                      {isSuggested && (
                        <span className="dpo-ai-badge">
                          AI {suggestedMatch.confidence}
                        </span>
                      )}
                    </span>
                    <span className="dpo-existing-meta">
                      {item.minutes_title} · {item.department}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
          {mappedExistingId && (
            <button
              className="dpo-unlink-btn"
              onClick={() => onMapIssue?.(mappedExistingId)}
            >
              Remove link
            </button>
          )}
        </div>
      )}

      <div className="dpo-issue-form">
        <div className="dpo-form-field">
          <label>Department:</label>
          <input
            type="text"
            value={issue.department}
            onChange={(e) => handleChange("department", e.target.value)}
          />
        </div>

        <div className="dpo-form-field">
          <label>Issue title:</label>
          <textarea rows="2" value={issue.issue} onChange={(e) => handleChange("issue", e.target.value)} />
        </div>

        <div className="dpo-form-field">
          <label>Description:</label>
          <textarea
            className="dpo-description-textarea"
            rows="4"
            value={issue.issue_description}
            onChange={(e) => handleChange("issue_description", e.target.value)}
          />
        </div>

        <div className="dpo-form-field">
          <label>Priority:</label>
          <select value={issue.priority} onChange={(e) => handleChange("priority", e.target.value)}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div className="dpo-form-field">
          <label>Location:</label>
          <input
            type="text"
            value={issue.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>

        <div className="dpo-form-field">
          <label>Deadline:</label>
          <div className="dpo-deadline-input">
            <input
              type="text"
              placeholder="DD-MM-YYYY"
              value={issue.deadline}
              onChange={(e) => handleChange("deadline", formatDateInput(e.target.value))}
            />

            <input
              type="date"
              ref={dateRef}
              style={{ display: "none" }}
              onChange={(e) => handleChange("deadline", convertDatePickerValue(e.target.value))}
            />

            <span className="dpo-calendar-icon" onClick={() => dateRef.current?.showPicker?.()}>
              📅
            </span>
          </div>
        </div>
      </div>

      <div className="dpo-card-bottom-actions">
        {typeof onDelete === "function" && (
          <button className="dpo-delete-btn" onClick={() => onDelete(index)} title="Delete issue">
            <DeleteIcon fontSize="medium" />
          </button>
        )}
        {typeof onAllocate === "function" && (
          <button className="dpo-inline-allocate-btn" onClick={() => onAllocate(issue, index)}>
            Allocate
          </button>
        )}
      </div>
    </div>
  );
}
