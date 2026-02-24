import React, { useRef, useState } from "react";
import "./DepartmentResponseModal.css";
import api from "../../api/axios";
import { emitIssuesUpdated, emitNotificationsUpdated } from "../../utils/liveUpdates";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";

function ResponseModal({ isOpen, onClose, issue }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFileName(selected.name);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files[0];
    if (selected) {
      setFile(selected);
      setFileName(selected.name);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleSubmit = async () => {
    const idToSend = issue.id || issue.issue_dept_id;

    if (!idToSend) {
      alert("Error: Issue ID is missing. Please refresh the page.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("issue_id", idToSend);
      formData.append("response", responseText);
      if (file) {
        formData.append("attachment", file);
      }

      const res = await api.post("/submit-response", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        // alert("Submitted successfully!");
        onClose();
        emitIssuesUpdated({ source: "department-response", department: issue.department });
        emitNotificationsUpdated({ source: "department-response" });
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);
      alert("Submission failed!");
    }
  };

  return (
    <div className="department-modal-overlay">
      <div className="department-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="department-modal-header">
          <div>
            <h2 className="department-issue-title">Submit Response</h2>
            <p className="department-issue-subtitle">Issue #{issue.issue_no}</p>
          </div>
          <button className="department-close-icon-btn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="department-modal-body">
          {/* Issue Details Section */}
          <div className="department-issue-details-grid">
            <div className="department-detail-item full-width">
              <label><DescriptionIcon fontSize="inherit" /> Issue Description</label>
              <div className="department-detail-value main-issue-text">{issue.issue}</div>
            </div>

            <div className={`department-detail-item priority-${issue.priority?.toLowerCase()}`}>
              <label><PriorityHighIcon fontSize="inherit" /> Priority</label>
              <div className="department-detail-value">{issue.priority}</div>
            </div>

            <div className="department-detail-item">
              <label><LocationOnIcon fontSize="inherit" /> Location</label>
              <div className="department-detail-value">{issue.location || "N/A"}</div>
            </div>

            <div className="department-detail-item">
              <label><EventIcon fontSize="inherit" /> Deadline</label>
              <div className="department-detail-value">{issue.deadline}</div>
            </div>
          </div>

          <div className="department-divider"></div>

          {/* Response Form Section */}
          <div className="department-form-section">
            <label className="department-input-label">Your Response</label>
            <textarea
              className="department-response-textarea"
              placeholder="Type detailed action taken report here..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
            />

            <label className="department-input-label">Attachment (Optional)</label>
            <div
              className={`department-upload-area ${isDragging ? "dragging" : ""}`}
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                hidden
              />
              
              <div className="upload-icon-wrapper">
                <CloudUploadIcon fontSize="large" />
              </div>
              
              {fileName ? (
                <div className="department-file-info">
                  <span className="file-name">{fileName}</span>
                  <span className="change-file-text">Click to change</span>
                </div>
              ) : (
                <div className="department-upload-text">
                  <span className="upload-main-text">Click to upload document</span>
                  <span className="upload-sub-text">or drag and drop (PDF, JPG, DOCX)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="department-modal-footer">
          <button className="department-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="department-submit-btn" onClick={handleSubmit} disabled={!responseText.trim()}>
            Submit Response
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResponseModal;
