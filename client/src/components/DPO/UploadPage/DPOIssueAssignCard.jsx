// IssueAssignCard.jsx
import React, { useRef } from "react";

export default function IssueAssignCard({ issue, onChange, index, onAllocate }) {
  const dateRef = useRef(null);

  const handleChange = (field, value) => onChange(index, field, value);

  const formatDateInput = (text) => {
    const digits = text.replace(/\D/g, "");
    let day = digits.substring(0, 2);
    let month = digits.substring(2, 4);
    let year = digits.substring(4, 8);

    let formatted = day;
    if (month) formatted += "-" + month;
    if (year) formatted += "-" + year;

    return formatted;
  };

  const convertDatePickerValue = (value) => {
    const [y, m, d] = value.split("-");
    return `${d}-${m}-${y}`;
  };

  return (
    <div className="issue-assign-card">
      <div className="issue-top">
        <div className="entry-id">{issue.issue_no}</div>

        {/* 🔹 ACTION BUTTONS */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginTop: "-10px",   // 👈 move buttons up
  }}
>

  <button
    style={{
      background: "none",
      border: "none",
      color: "#b91c1c",
      fontSize: "18px",
      cursor: "pointer",
    }}
  >
    🗑️
  </button>
  {/* Allocate Button */}
  <button
    onClick={() => onAllocate(issue)}
    style={{
      backgroundColor: "#2563eb",
      color: "#fff",
      border: "none",
      padding: "4px 10px",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "400",
    }}
  >
    Allocate
  </button>

  {/* Delete Button */}
  
</div>

      </div>

      <div className="issue-form">
        <div className="form-field">
          <label>Department:</label>
          <input
            type="text"
            value={issue.department}
            onChange={(e) => handleChange("department", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Issue title:</label>
          <textarea
            rows="2"
            value={issue.issue}
            onChange={(e) => handleChange("issue", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Description:</label>
          <textarea
            rows="2"
            value={issue.issue_description}
            onChange={(e) =>
              handleChange("issue_description", e.target.value)
            }
          />
        </div>

        <div className="form-field">
          <label>Priority:</label>
          <select
            value={issue.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div className="form-field">
          <label>Location:</label>
          <input
            type="text"
            value={issue.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Deadline:</label>
          <div className="deadline-input">
            <input
              type="text"
              placeholder="DD-MM-YYYY"
              value={issue.deadline}
              onChange={(e) =>
                handleChange("deadline", formatDateInput(e.target.value))
              }
            />

            <input
              type="date"
              ref={dateRef}
              style={{ display: "none" }}
              onChange={(e) =>
                handleChange(
                  "deadline",
                  convertDatePickerValue(e.target.value)
                )
              }
            />

            <span
              className="calendar-icon"
              onClick={() => dateRef.current.showPicker()}
            >
              📅
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
