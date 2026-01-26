import React, { useRef, useState } from "react";
import axios from "axios"; // THIS WAS MISSING
import "./DepartmentResponseModal.css";
import api from "../../api/axios";

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
    // Standardize the ID (using the one from our Serializer)
    const idToSend = issue.id || issue.issue_dept_id;

    if (!idToSend) {
      alert("Error: Issue ID is missing. Please refresh the page.");
      return;
    }

    try {
      // Create data object
      const payload = {
        issue_id: idToSend,
        response: responseText
      };

      const res = await api.post("/submit-response", payload);

      if (res.data.success) {
        alert("Submitted successfully!");
        onClose();
        window.location.reload(); // Moves issue to Submitted tab
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);
      alert("Submission failed!");
    }
  };

  return (
    <div className="modal-overlay" >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        <h2 className="issue-title">Issue #{issue.issue_no}</h2>

        <div className="modal-fields">
          <div className="modal-row">
            <label>Issue</label>
            <input type="text" value={issue.issue} readOnly />
          </div>

          <div className="modal-row">
            <label>Priority</label>
            <input type="text" value={issue.priority} readOnly />
          </div>

          <div className="modal-row">
            <label>Location</label>
            <input type="text" value={issue.location} readOnly />
          </div>

          <div className="modal-row">
            <label>Deadline</label>
            <input type="text" value={issue.deadline} readOnly />
          </div>

          <div className="modal-row">
            <label>Your Response</label>
            <textarea
              placeholder="Type your response here..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
            />
          </div>

          <div className="modal-row">
            <label>Upload File</label>

            <div
              className="upload-area"
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {fileName ? (
                <p className="file-name">{fileName}</p>
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

        <button className="su" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default ResponseModal;