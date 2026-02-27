import React, { useState, useEffect, useCallback } from "react";
import "./CollectorGenerateReports.css";
import CollectorGenerateReportCard from "./CollectorGenerateReportCard";
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
      const res = await fetch(`${api.defaults.baseURL}/generate-report`, {
        method: "POST",
        headers: {
          Authorization: `Token ${getAuthValue("token")}`,
        },
      });

      if (!res.ok) {
        alert("Failed to generate file");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Follow_Up_Report.xlsx";
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
    setLoadingReports(true);
    setReports([]);

    api
      .get("/issues")
      .then((res) => {
        const receivedLike = (res.data || []).filter((issue) => {
          const status = String(issue.status || "").toLowerCase();
          return ["received", "submitted", "completed"].includes(status);
        });

        const normalized = receivedLike.map((issue) => ({
          id: issue.id,
          issue_no: issue.issue_no,
          department: issue.department || "",
          issue: issue.issue || "",
          issue_description: issue.issue_description || "",
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
    <div className="collector-modal-overlay">
      <div
        className="collector-generate-reports-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="collector-generate-header">
          <div className="collector-format-toggle">
            <button
              className={`collector-format-btn ${format === "pdf" ? "collector-active" : ""}`}
              onClick={() => setFormat("pdf")}
            >
              PDF
            </button>
            <button
              className={`collector-format-btn ${format === "excel" ? "collector-active" : ""}`}
              onClick={() => setFormat("excel")}
            >
              Excel
            </button>
          </div>

          <button className="collector-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="collector-report-list">
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
              <CollectorGenerateReportCard
                key={report.id || index}
                report={report}
                index={index}
                handleChange={handleChange}
                removeCard={removeCard}
              />
            ))
          )}
        </div>

        <div className="collector-download-section">
          <button className="collector-generate-download-btn" onClick={handleDownload}>
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
