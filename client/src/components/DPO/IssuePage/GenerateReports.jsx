import React, { useState, useEffect, useCallback } from "react";
import "./GenerateReports.css";
import GenerateReportCard from "./GenerateReportCard";

export default function GenerateReports({ isOpen, onClose }) {
  const [format, setFormat] = useState("pdf");
  const [reports, setReports] = useState([]);

  const handleDownload = async () => {
    try {
      const res = await fetch("http://localhost:5000/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          format,
          reports
        })
      });

      if (!res.ok) {
        alert("Failed to generate file");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "pdf" ? "report.pdf" : "report.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error("Download error:", err);
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
              <GenerateReportCard
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
