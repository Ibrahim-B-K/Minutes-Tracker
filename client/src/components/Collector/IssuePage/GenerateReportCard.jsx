import React from "react";

const GenerateReportCard = React.memo(function GenerateReportCard({
  report,
  index,
  handleChange,
  removeCard,
}) {
  return (
    <div className="generate-report-card">
      <div className="report-top">
        <div className="report-id">{report.issue_no}</div>
        <button className="report-delete-btn" onClick={() => removeCard(index)}>
          🗑️
        </button>
      </div>

      <div className="report-form">
        <div className="form-field">
          <label>Department:</label>
          <input
            type="text"
            value={report.department}
            onChange={e => handleChange(index, "department", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Issue:</label>
          <textarea
            value={report.issue}
            onChange={e => handleChange(index, "issue", e.target.value)}
            rows="3"
          />
        </div>
        <div className="form-field">
          <label>Description:</label>
          <textarea
            rows="2"
            value={report.issue_description}
            onChange={(e) => handleChange("issue_description", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Response:</label>
          <textarea
            value={report.response || ""}
            onChange={e => handleChange(index, "response", e.target.value)}
            rows="3"
          />
        </div>

        <div className="form-field">
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
