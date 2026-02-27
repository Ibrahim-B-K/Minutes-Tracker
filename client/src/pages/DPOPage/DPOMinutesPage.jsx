import React, { useEffect, useState } from "react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import DeleteIcon from "@mui/icons-material/Delete";

import DPOHeader from "../../components/DPO/DPOHeader";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import LoadingState from "../../components/common/LoadingState";
import api from "../../api/axios";

import "./DPOMinutesPage.css";

function DPOMinutesPage() {
  const [minutes, setMinutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

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

  const handleDelete = async (minutesId, fileName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(minutesId);
    try {
      await api.delete(`/minutes/${minutesId}`);
      setMinutes(minutes.filter((m) => m.id !== minutesId));
      alert(`Deleted: ${fileName}`);
    } catch (err) {
      console.error("Error deleting minutes:", err);
      alert("Failed to delete minutes. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="dpo-container">
      <DPOHeader />

      <div className="dpo-minutes-page-content">
        <h1 className="dpo-page-title">Meeting Minutes</h1>

        {error && <div className="dpo-error-message">{error}</div>}

        <div className="dpo-minutes-body">
          {loading ? (
            <LoadingState text="Loading minutes..." />
          ) : minutes.length === 0 ? (
            <EmptyStateCard
              title="No minutes uploaded"
              description="There are no meeting minutes to display yet."
            />
          ) : (
            <div className="dpo-minutes-grid">
              {minutes.map((m) => (
                <div key={m.id} className="dpo-minutes-card">
                  <div className="dpo-card-header">
                    <PictureAsPdfIcon className="dpo-pdf-icon" />
                    <h3 className="dpo-file-name">{m.originalFileName || m.title}</h3>
                  </div>

                  <div className="dpo-card-body">
                    <div className="dpo-info-item">
                      <span className="dpo-label">Uploaded:</span>
                      <span className="dpo-value">{formatDate(m.uploadedDate)}</span>
                    </div>

                    {m.meetingDate && (
                      <div className="dpo-info-item">
                        <span className="dpo-label">Meeting Date:</span>
                        <span className="dpo-value">{formatDate(m.meetingDate)}</span>
                      </div>
                    )}

                    <div className="dpo-info-item">
                      <span className="dpo-label">Uploaded By:</span>
                      <span className="dpo-value">{m.uploadedBy}</span>
                    </div>

                    <div className="dpo-info-item">
                      <span className="dpo-label">Issues Allocated:</span>
                      <span className="dpo-value">{m.issueCount ?? 0}</span>
                    </div>

                  </div>

                  <div className="dpo-card-actions">
                    <button
                      className="dpo-minutes-view-btn"
                      onClick={() => handleView(m.fileUrl)}
                      title="View document"
                    >
                      <FileOpenIcon fontSize="medium" />
                    </button>

                    <button
                      className="dpo-minutes-download-btn"
                      onClick={() => handleDownload(m.fileUrl, m.originalFileName)}
                      title="Download document"
                    >
                      <CloudDownloadIcon fontSize="medium" />
                    </button>

                    <button
                      className="dpo-minutes-delete-btn"
                      onClick={() => handleDelete(m.id, m.originalFileName || m.title)}
                      disabled={deleting === m.id}
                      title="Delete minutes"
                    >
                      <DeleteIcon fontSize="medium" />
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

export default DPOMinutesPage;



