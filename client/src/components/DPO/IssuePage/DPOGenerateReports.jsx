import React, { useState, useEffect, useCallback } from "react";
import "./DPOGenerateReports.css";
import DPOGenerateReportCard from "./DPOGenerateReportCard";
import EmptyStateCard from "../../common/EmptyStateCard";
import LoadingState from "../../common/LoadingState";
import api from "../../../api/axios";
import { getAuthValue } from "../../../utils/authStorage";

export default function GenerateReports({ isOpen, onClose }) {
  const [format, setFormat] = useState("pdf");
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const handleDownload = async () => {
    try {
      // 1. Request the blob (file) from backend
      // Note: We don't need to send 'reports' body anymore, the backend fetches fresh data.
      const response = await fetch(`${api.defaults.baseURL}/generate-report`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${getAuthValue("token")}`, // Auth is important!
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
      a.download = "Follow_Up_Report.xlsx"; // The file name
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
    setLoadingReports(true);
    setReports([]);

    api
      .get("/issues")
      .then((res) => {
        const receivedLike = (res.data || []).filter((issue) => {
          const status = String(issue.status || "").toLowerCase();
          return ["received", "submitted", "completed"].includes(status);
        });

        // Normalize modal card shape and flatten response objects to readable text
        const normalized = receivedLike.map((issue) => ({
          id: issue.id,
          issue_no: issue.issue_no,
          department: issue.department || "",
          issue: issue.issue || "",
          location: issue.location || "",
          response: Array.isArray(issue.response)
            ? issue.response
                .map((r) => `[${r.department || "Department"}] ${r.text || ""}`.trim())
                .join("\n")
            : issue.response || "",
        }));

        setReports(normalized);
      })
      .catch((err) => console.error("Error fetching reports:", err))
      .finally(() => setLoadingReports(false));
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
    <div className="dpo-modal-overlay">
      <div
        className="dpo-generate-reports-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dpo-generate-header">
          <div className="dpo-format-toggle">
            <button
              className={`dpo-format-btn ${format === "pdf" ? "dpo-active" : ""}`}
              onClick={() => setFormat("pdf")}
            >
              PDF
            </button>
            <button
              className={`dpo-format-btn ${format === "excel" ? "dpo-active" : ""}`}
              onClick={() => setFormat("excel")}
            >
              Excel
            </button>
          </div>

          <button className="dpo-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="dpo-report-list">
          {loadingReports ? (
            <LoadingState compact text="Loading received issues..." />
          ) : reports.length === 0 ? (
            <EmptyStateCard
              compact
              title="No received issues"
              description="Received issues will appear here for report generation."
            />
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

        <div className="dpo-download-section">
          <button className="dpo-generate-download-btn" onClick={handleDownload}>
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
