import React, { useEffect, useState } from "react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GetAppIcon from "@mui/icons-material/GetApp";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import DepartmentHeader from "../../components/Department/DepartmentHeader";
import api from "../../api/axios";

import "./DepartmentMinutesPage.css";

function DepartmentMinutesPage() {
  const [minutes, setMinutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMinutes();
  }, []);

  const fetchMinutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/minutes");
      setMinutes(res.data);
    } catch (err) {
      console.error("Error fetching minutes:", err);
      setError("Failed to load minutes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const handleView = (fileUrl) => {
    if (fileUrl) {
      // Open in new tab for preview
      const link = document.createElement("a");
      link.href = fileUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownload = async (fileUrl, fileName) => {
    if (!fileUrl) return;
    
    try {
      // Fetch the file as a blob
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "minutes.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  return (
    <div className="dept-container">
      <DepartmentHeader />

      <div className="minutes-page-content">
        <h1 className="page-title">📄 Meeting Minutes</h1>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading minutes...</p>
          </div>
        ) : minutes.length === 0 ? (
          <div className="no-minutes">
            <PictureAsPdfIcon className="empty-icon" />
            <p>No minutes uploaded yet</p>
          </div>
        ) : (
          <div className="minutes-grid">
            {minutes.map((m) => (
              <div key={m.id} className="minutes-card">
                <div className="card-header">
                  <PictureAsPdfIcon className="pdf-icon" />
                  <h3 className="file-name">{m.originalFileName || m.title}</h3>
                </div>

                <div className="card-body">
                  <div className="info-item">
                    <span className="label">📅 Uploaded:</span>
                    <span className="value">{formatDate(m.uploadedDate)}</span>
                  </div>

                  {m.meetingDate && (
                    <div className="info-item">
                      <span className="label">📋 Meeting Date:</span>
                      <span className="value">{formatDate(m.meetingDate)}</span>
                    </div>
                  )}

                  <div className="info-item">
                    <span className="label">👤 Uploaded By:</span>
                    <span className="value">{m.uploadedBy}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleView(m.fileUrl)}
                    title="View document"
                  >
                    <OpenInNewIcon className="btn-icon" />
                    View
                  </button>

                  <button
                    className="action-btn download-btn"
                    onClick={() =>
                      handleDownload(m.fileUrl, m.originalFileName)
                    }
                    title="Download document"
                  >
                    <GetAppIcon className="btn-icon" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentMinutesPage;
