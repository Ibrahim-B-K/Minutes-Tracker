// IssueAssignCard.jsx
import React, { useRef } from "react";

export default function IssueAssignCard({ issue, onChange, index }) {
  const dateRef = useRef(null);

  const handleChange = (field, value) => onChange(index, field, value);

  // Format text input as DD-MM-YYYY while typing
  const formatDateInput = (text) => {
    const digits = text.replace(/\D/g, ""); // keep only numbers
    let day = digits.substring(0, 2);
    let month = digits.substring(2, 4);
    let year = digits.substring(4, 8);

    let formatted = day;
    if (month) formatted += "-" + month;
    if (year) formatted += "-" + year;

    return formatted;
  };

  // Convert date picker value YYYY-MM-DD → DD-MM-YYYY
  const convertDatePickerValue = (value) => {
    const [y, m, d] = value.split("-");
    return `${d}-${m}-${y}`;
  };

  return (
    <div className="issue-assign-card">
      <div className="issue-top">
        <div className="entry-id">{issue.issue_no}</div>
        <button className="delete-btn">🗑️</button>
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
            onChange={(e) => handleChange("issue_description", e.target.value)}
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

        {/* ----- DEADLINE FIELD WITH DATE PICKER ----- */}
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

            {/* Hidden date picker */}
            <input
              type="date"
              ref={dateRef}
              style={{ display: "none" }}
              onChange={(e) =>
                handleChange("deadline", convertDatePickerValue(e.target.value))
              }
            />

            <span
              className="calendar-icon"
              onClick={() => dateRef.current.showPicker()}
              style={{ cursor: "pointer" }}
            >
              📅
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

