import React, { useRef, useState } from "react";
import "./DepartmentResponseModal.css";
import api from "../../api/axios";
import { emitIssuesUpdated, emitNotificationsUpdated } from "../../utils/liveUpdates";

function ResponseModal({ isOpen, onClose, issue }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [responseText, setResponseText] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFileName(selected.name);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
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
        alert("Submitted successfully!");
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
    <div className="department-modal-overlay" >
      <div className="department-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="department-close-btn" onClick={onClose}>
          &times;
        </button>

        <h2 className="department-issue-title">Issue #{issue.issue_no}</h2>

        <div className="department-modal-fields">
          <div className="department-modal-row">
            <label>Issue</label>
            <input type="text" value={issue.issue} readOnly />
          </div>

          <div className="department-modal-row">
            <label>Priority</label>
            <input type="text" value={issue.priority} readOnly />
          </div>

          <div className="department-modal-row">
            <label>Location</label>
            <input type="text" value={issue.location} readOnly />
          </div>

          <div className="department-modal-row">
            <label>Deadline</label>
            <input type="text" value={issue.deadline} readOnly />
          </div>

          <div className="department-modal-row">
            <label>Your Response</label>
            <textarea
              placeholder="Type your response here..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
            />
          </div>

          <div className="department-modal-row">
            <label>Upload File</label>

            <div
              className="department-upload-area"
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {fileName ? (
                <p className="department-file-name">{fileName}</p>
              ) : (
                <p>
                  <strong>Click to upload</strong> or drag and drop file here
                </p>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                hidden
              />
            </div>
          </div>
        </div>

        <button className="department-submit-btn" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default ResponseModal;
