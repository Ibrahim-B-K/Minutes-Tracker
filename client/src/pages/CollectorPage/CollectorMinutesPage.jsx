import React, { useEffect, useState } from "react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GetAppIcon from "@mui/icons-material/GetApp";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import CollectorHeader from "../../components/Collector/CollectorHeader";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import LoadingState from "../../components/common/LoadingState";
import api from "../../api/axios";

import "./CollectorMinutesPage.css";

function CollectorMinutesPage() {
  const [minutes, setMinutes] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "minutes.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      console.error("Download error:", downloadError);
      alert("Failed to download file. Please try again.");
    }
  };

  return (
    <div className="collector-minutespage-container">
      <CollectorHeader />

      <div className="collector-minutespage-content">
        <h1 className="collector-page-title">Meeting Minutes</h1>

        {error && <div className="collector-error-message">{error}</div>}

        <div className="collector-minutes-body">
          {loading ? (
            <LoadingState text="Loading minutes..." />
          ) : minutes.length === 0 ? (
            <EmptyStateCard
              title="No minutes uploaded"
              description="There are no meeting minutes to display yet."
            />
          ) : (
            <div className="collector-minutes-grid">
              {minutes.map((m) => (
                <div key={m.id} className="collector-minutes-card">
                  <div className="collector-card-header">
                    <PictureAsPdfIcon className="collector-pdf-icon" />
                    <h3 className="collector-file-name">{m.originalFileName || m.title}</h3>
                  </div>

                  <div className="collector-card-body">
                    <div className="collector-info-item">
                      <span className="collector-label">Uploaded:</span>
                      <span className="collector-value">{formatDate(m.uploadedDate)}</span>
                    </div>

                    {m.meetingDate && (
                      <div className="collector-info-item">
                        <span className="collector-label">Meeting Date:</span>
                        <span className="collector-value">{formatDate(m.meetingDate)}</span>
                      </div>
                    )}

                    <div className="collector-info-item">
                      <span className="collector-label">Uploaded By:</span>
                      <span className="collector-value">{m.uploadedBy}</span>
                    </div>
                  </div>

                  <div className="collector-card-actions">
                    <button
                      className="collector-action-btn collector-view-btn"
                      onClick={() => handleView(m.fileUrl)}
                      title="View document"
                    >
                      <OpenInNewIcon className="collector-btn-icon" />
                      View
                    </button>

                    <button
                      className="collector-action-btn collector-download-btn"
                      onClick={() => handleDownload(m.fileUrl, m.originalFileName)}
                      title="Download document"
                    >
                      <GetAppIcon className="collector-btn-icon" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectorMinutesPage;
