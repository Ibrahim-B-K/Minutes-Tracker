import React from "react";

const GenerateReportCard = React.memo(function GenerateReportCard({
  report,
  index,
  handleChange,
  removeCard,
}) {
  return (
    <div className="dpo-generate-report-card">
      <div className="dpo-report-top">
        <div className="dpo-report-id">{report.issue_no}</div>
        <button className="dpo-report-delete-btn" onClick={() => removeCard(index)}>
          🗑️
        </button>
      </div>

      <div className="dpo-report-form">
        <div className="dpo-form-field">
          <label>Department:</label>
          <input
            type="text"
            value={report.department}
            onChange={e => handleChange(index, "department", e.target.value)}
          />
        </div>

        <div className="dpo-form-field">
          <label>Issue:</label>
          <textarea
            value={report.issue}
            onChange={e => handleChange(index, "issue", e.target.value)}
            rows="3"
          />
        </div>

        <div className="dpo-form-field">
          <label>Response:</label>
          <textarea
            value={report.response || ""}
            onChange={e => handleChange(index, "response", e.target.value)}
            rows="3"
          />
        </div>

        <div className="dpo-form-field">
          <label>Location:</label>
          <input
            type="text"
            value={report.location}
            onChange={e => handleChange(index, "location", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
});

export default GenerateReportCard;
