import React, { useRef } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import OutlinedFlagIcon from "@mui/icons-material/OutlinedFlag";
import FlagIcon from "@mui/icons-material/Flag";

export default function IssueAssignCard({
  issue,
  onChange,
  index,
  onAllocate,
  onDelete,
  unresolvedIssues = [],
  isFlagPanelOpen = false,
  mappedUnresolvedId = null,
  onToggleFlagPanel,
  onMapIssue,
}) {
  const dateRef = useRef(null);

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

  return (
    <div className="dpo-issue-assign-card">
      <div className="dpo-issue-top">
        <div className="dpo-entry-id">{issue.issue_no}</div>
        <button
          className={`dpo-flag-btn ${mappedUnresolvedId ? "dpo-flag-btn-mapped" : ""}`}
          onClick={onToggleFlagPanel}
          title="Map with unresolved issue"
        >
          {mappedUnresolvedId ? <FlagIcon fontSize="small" /> : <OutlinedFlagIcon fontSize="small" />}
        </button>
      </div>

      {isFlagPanelOpen && (
        <div className="dpo-unresolved-panel">
          <p className="dpo-unresolved-title">Map to unresolved issue</p>
          <div className="dpo-unresolved-list">
            {unresolvedIssues.map((item) => (
              <label key={item.id} className="dpo-unresolved-item">
                <input
                  type="radio"
                  name={`unresolved-map-${index}`}
                  checked={mappedUnresolvedId === item.id}
                  onChange={() => onMapIssue?.(item.id)}
                />
                <span>{item.title}</span>
              </label>
            ))}
          </div>
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
