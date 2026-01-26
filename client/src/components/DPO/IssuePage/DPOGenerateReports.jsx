import React, { useState, useEffect, useCallback } from "react";
import "./DPOGenerateReports.css";
import DPOGenerateReportCard from "./DPOGenerateReportCard";

export default function GenerateReports({ isOpen, onClose }) {
  const [format, setFormat] = useState("pdf");
  const [reports, setReports] = useState([]);

  const handleDownload = async () => {
    try {
      // 1. Request the blob (file) from backend
      // Note: We don't need to send 'reports' body anymore, the backend fetches fresh data.
      const response = await fetch("http://127.0.0.1:8000/generate-report", {
        method: "POST",
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`, // Auth is important!
        },
      });

      if (!response.ok) {
        alert("Failed to generate report");
        return;
      }

      // 2. Convert response to a downloadable file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Action_Taken_Report.xlsx"; // The file name
      document.body.appendChild(a);
      a.click();
      
      // 3. Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);
      onClose();

    } catch (err) {
      console.error("Download error:", err);
      alert("Error downloading file.");
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    fetch("http://localhost:5000/issues/received")
      .then((res) => res.json())
      .then((data) => setReports(data))
      .catch((err) => console.error("Error fetching reports:", err));
  }, [isOpen]);

  const handleChange = useCallback((index, field, value) => {
    setReports((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const removeCard = useCallback((index) => {
    setReports((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="generate-reports-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="generate-header">
          <div className="format-toggle">
            <button
              className={`format-btn ${format === "pdf" ? "active" : ""}`}
              onClick={() => setFormat("pdf")}
            >
              PDF
            </button>
            <button
              className={`format-btn ${format === "excel" ? "active" : ""}`}
              onClick={() => setFormat("excel")}
            >
              Excel
            </button>
          </div>

          <button className="close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="report-list">
          {reports.length === 0 ? (
            <p>No received issues available</p>
          ) : (
            reports.map((report, index) => (
              <DPOGenerateReportCard
                key={report.id || index}
                report={report}
                index={index}
                handleChange={handleChange}
                removeCard={removeCard}
              />
            ))
          )}
        </div>

        <div className="download-section">
          <button className="generate-download-btn" onClick={handleDownload}>
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
