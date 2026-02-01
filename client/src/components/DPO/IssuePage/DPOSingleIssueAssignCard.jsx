import React, { useRef } from "react";
import "./DPOSingleIssueAssignCard.css";
export default function DPOIssueAssignCard({ issue, onChange, index, onAllocate }) {
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
    <div className="dpo-assign-card">
      <div className="dpo-assign-top">
        <div className="dpo-assign-entry-id">{issue.issue_no}</div>

        <button
          className="dpo-assign-allocate-btn"
          onClick={() => onAllocate(issue)}
        >
          Allocate
        </button>
      </div>

      <div className="dpo-assign-form">
        <div className="dpo-assign-field">
          <label>Department:</label>
          <input
            type="text"
            value={issue.department}
            onChange={(e) => handleChange("department", e.target.value)}
          />
        </div>

        <div className="dpo-assign-field">
          <label>Issue title:</label>
          <textarea
            rows="2"
            value={issue.issue}
            onChange={(e) => handleChange("issue", e.target.value)}
          />
        </div>

        <div className="dpo-assign-field">
          <label>Description:</label>
          <textarea
            rows="2"
            value={issue.issue_description}
            onChange={(e) =>
              handleChange("issue_description", e.target.value)
            }
          />
        </div>

        <div className="dpo-assign-field">
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

        <div className="dpo-assign-field">
          <label>Location:</label>
          <input
            type="text"
            value={issue.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>

        <div className="dpo-assign-field">
          <label>Deadline:</label>
          <div className="dpo-assign-deadline">
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
              className="dpo-assign-calendar"
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
