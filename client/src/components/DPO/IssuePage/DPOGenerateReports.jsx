import React, { useState, useEffect, useCallback } from "react";
import html2pdf from "html2pdf.js";
import "./DPOGenerateReports.css";
import DPOGenerateReportCard from "./DPOGenerateReportCard";
import EmptyStateCard from "../../common/EmptyStateCard";
import LoadingState from "../../common/LoadingState";
import api from "../../../api/axios";
import { getAuthValue } from "../../../utils/authStorage";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function GenerateReports({ isOpen, onClose }) {
  const [format, setFormat] = useState("pdf"); // 'pdf', 'excel', 'minute'
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [minuteDate, setMinuteDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [minuteHtml, setMinuteHtml] = useState("");
  const [hasEditedMinute, setHasEditedMinute] = useState(false);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  const handleDownload = async () => {
    // ==========================================
    // FRONTEND PRESENTATION PDF GENERATION
    // ==========================================
    if (format === "pdf") {
      const element = document.getElementById("pdf-presentation-content");

      const opt = {
        margin: 0,
        filename: "DDC_Presentation.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
        pagebreak: { mode: 'legacy' }
      };

      html2pdf().set(opt).from(element).save();
      onClose();
      return;
    }
    // ==========================================
    // FRONTEND MINUTE PDF GENERATION (BACKEND WEASYPRINT)
    // ==========================================
    if (format === "minute") {
      try {
        const payload = { html: minuteHtml };
        const response = await fetch(`${api.defaults.baseURL}/generate-minutes-pdf`, {
          method: "POST",
          headers: {
            Authorization: `Token ${getAuthValue("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          alert("Failed to generate PDF on server");
          return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `DDC_Minutes_${minuteDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        onClose();
        return;
      } catch (err) {
        console.error("Minute PDF generation error:", err);
        alert("Error downloading Minute PDF.");
        return;
      }
    }
    // ==========================================
    // BACKEND EXCEL GENERATION
    // ==========================================
    try {
      const payload = {
        format: "excel",
        reports: reports,
      };

      const response = await fetch(`${api.defaults.baseURL}/generate-report`, {
        method: "POST",
        headers: {
          Authorization: `Token ${getAuthValue("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        alert("Failed to generate report");
        return;
      }

      const blob = await response.blob();
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

        // Store full issue objects initially, or extract needed mapping including assigned_departments and resolution_status
        const normalized = receivedLike.map((issue) => ({
          id: issue.id,
          issue_no: issue.issue_no,
          department: issue.department || "",
          assigned_departments: issue.assigned_departments || [],
          resolution_status: issue.resolution_status || 'unresolved',
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

  // Utility to format the date in a readable Malayalam-friendly format if needed, or standard DD-MM-YYYY
  const formattedMinuteDate = new Date(minuteDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

  useEffect(() => {
    if (reports.length > 0 && !hasEditedMinute) {
      let html = `<div style="font-size: 16px; font-weight: bold; line-height: 1.6; text-align: center; margin-bottom: 30px;">
        ${formattedMinuteDate}-ൽ രാവിലെ 11.00 മണിക്ക് കലക്ട്രേറ്റ് കോൺഫറൻസ് ഹാളിൽ വെച്ച് ചേർന്ന ജില്ലാ വികസന സമിതി യോഗത്തിന്റെ നടപടികുറിപ്പ്
      </div>`;

      reports.forEach((report, index) => {
        html += `
          <p style="font-size: 15px; margin-bottom: 4px;"><strong>${index + 1}.</strong> ${report.issue}</p>
        `;
        if (report.resolution_status !== 'resolved' && report.assigned_departments && report.assigned_departments.length > 0) {
          const depts = report.assigned_departments.map(d => `${d.dept_name} - ${d.designation}`).join(', ');
          html += `<p class="ql-align-right" style="font-size: 15px; font-weight: bold; margin-bottom: 4px;">(നടപടി: ${depts})</p>`;
        }
        const responseText = report.response ? report.response.replace(/\[.*?\]\s/g, '') : "No response provided.";
        html += `<p class="ql-indent-1" style="font-size: 15px; margin-bottom: 20px;">${responseText}</p>`;
      });

      setMinuteHtml(html);
    }
  }, [reports, formattedMinuteDate, hasEditedMinute]);

  if (!isOpen) return null;

  return (
    <>
      <div className="dpo-modal-overlay">
        <div className={`dpo-generate-reports-container ${format === "minute" ? "dpo-minute-large" : ""}`} onClick={(e) => e.stopPropagation()}>
          <div className="dpo-generate-header">
            <div className="dpo-format-toggle">
              <button
                className={`dpo-format-btn ${format === "pdf" ? "dpo-active" : ""}`}
                onClick={() => setFormat("pdf")}
              >
                Presentation PDF
              </button>
              <button
                className={`dpo-format-btn ${format === "minute" ? "dpo-active" : ""}`}
                onClick={() => setFormat("minute")}
              >
                Minute PDF
              </button>
              <button
                className={`dpo-format-btn ${format === "excel" ? "dpo-active" : ""}`}
                onClick={() => setFormat("excel")}
              >
                Excel
              </button>
            </div>
            <button className="dpo-close" onClick={onClose}>&times;</button>
          </div>

          <div className="dpo-report-list">
            {format === "minute" ? (
              <div className="dpo-minute-preview-container">
                <div className="dpo-minute-date-selector">
                  <label>Meeting Date:</label>
                  <input type="date" value={minuteDate} onChange={(e) => setMinuteDate(e.target.value)} />
                </div>
                {loadingReports ? (
                  <LoadingState compact text="Generating minute..." />
                ) : (
                  <div className="dpo-minute-scroll-wrapper">
                    <ReactQuill
                      theme="snow"
                      value={minuteHtml}
                      onChange={(val) => {
                        setMinuteHtml(val);
                        setHasEditedMinute(true);
                      }}
                      modules={modules}
                      className="dpo-minute-editable-pane"
                    />
                  </div>
                )}
              </div>
            ) : (
              // EXCEL OR PRESENTATION PDF CARDS
              loadingReports ? (
                <LoadingState compact text="Loading received issues..." />
              ) : reports.length === 0 ? (
                <EmptyStateCard compact title="No received issues" description="Received issues will appear here for report generation." />
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
              )
            )}
          </div>

          <div className="dpo-download-section">
            <button className="dpo-generate-download-btn" onClick={handleDownload}>
              Download {format === 'minute' || format === 'pdf' ? 'PDF' : 'Report'}
            </button>
          </div>
        </div>
      </div>

      {/* ===============================================================
          HIDDEN PDF TEMPLATE (This renders off-screen for html2pdf - PRESENTATION ONLY)
          =============================================================== */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div id="pdf-presentation-content" style={{ width: "1122px", fontFamily: "sans-serif" }}>
          {reports.map((report, index) => (
            <React.Fragment key={index}>
              {/* SLIDE 1: THE ISSUE */}
              <div style={{ width: "100%", height: "785px", padding: "60px", backgroundColor: "white", position: "relative", boxSizing: "border-box" }}>
                <div style={{ backgroundColor: "#1e3a8a", color: "white", padding: "12px 24px", fontSize: "28px", fontWeight: "bold", marginBottom: "40px", display: "inline-block" }}>
                  Issue: {report.issue_no}
                </div>
                <div style={{ fontSize: "32px", lineHeight: "1.6", color: "#000" }}>
                  {report.issue}
                </div>
                {/* Department tag at bottom right */}
                <div style={{ position: "absolute", bottom: "60px", right: "60px", color: "#dc2626", fontSize: "28px", fontWeight: "bold" }}>
                  {report.department}
                </div>
              </div>

              {/* Force Page Break Between Issue and Response using html2pdf class */}
              <div className="html2pdf__page-break"></div>

              {/* SLIDE 2: THE RESPONSE */}
              <div style={{ width: "100%", height: "785px", padding: "60px", backgroundColor: "white", position: "relative", boxSizing: "border-box" }}>
                <div style={{ backgroundColor: "#0284c7", color: "white", padding: "12px 24px", fontSize: "28px", fontWeight: "bold", marginBottom: "40px", display: "inline-block" }}>
                  നിലവിലെ അവസ്ഥ / Action Taken
                </div>
                <div style={{ fontSize: "30px", lineHeight: "1.6", color: "#000", whiteSpace: "pre-wrap" }}>
                  {report.response || "No response yet."}
                </div>
              </div>

              {/* Force Page Break Before Next Issue (Except for the very last slide) */}
              {index !== reports.length - 1 && (
                <div className="html2pdf__page-break"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}