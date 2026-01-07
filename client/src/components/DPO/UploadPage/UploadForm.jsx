// src/components/Upload/UploadForm.jsx
import React, { useRef, useState } from "react";
import axios from "axios";
import "./UploadForm.css";
import api from "../../../api/axios";

export default function UploadForm({ onProcessed }) {
  const datePickerRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [date, setDate] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const formatDateInput = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  const handleDateChange = (e) => setDate(formatDateInput(e.target.value));

  const handleHiddenDatePick = (e) => {
    const parts = e.target.value.split("-");
    if (parts.length === 3) setDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
  };

  const handleFileSelect = (file) => {
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!date || !fileName) {
      alert("Please select a date and upload a file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("meeting_date", date);
      formData.append("file", selectedFile);

      await api.post(
        "/upload-minutes",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // 👇 Only move to next step — no data needed
      onProcessed();

    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file.");
    }
  };

  return (
    <div className="upload-form">
      <h2 className="upload-title">Upload Meeting Minutes</h2>

      <div className="form-content">
        <label className="field-label">Upload Date</label>
        <div className="date-input-wrapper">
          <input
            type="text"
            placeholder="dd-mm-yyyy"
            value={date}
            onChange={handleDateChange}
            maxLength={10}
          />
          <span
            className="calendar-icon"
            onClick={() => datePickerRef.current?.showPicker()}
          >
            📅
          </span>
          <input
            type="date"
            ref={datePickerRef}
            onChange={handleHiddenDatePick}
            style={{ visibility: "hidden", position: "absolute" }}
          />
        </div>

        <label className="field-label">Upload Minutes File</label>
        <div
          className={`file-drop ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileSelect(e.dataTransfer.files?.[0]);
          }}
        >
          <div className="file-drop-inner">
            <div className="file-icon">🖼️</div>
            <div className="file-text">
              {fileName || "Click to upload or drag and drop"}
            </div>

            <input
              type="file"
              className="file-input"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept=".pdf,.doc,.docx"
            />
          </div>
        </div>

        <button className="up" onClick={handleUploadAndProcess}>
          Upload & Continue
        </button>
      </div>
    </div>
  );
}
