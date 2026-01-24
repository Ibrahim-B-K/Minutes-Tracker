// src/components/Upload/UploadForm.jsx
import React, { useRef, useState, useEffect } from "react";
import "./UploadForm.css";
import api from "../../../api/axios";

export default function UploadForm({ onProcessed }) {
  /* ================= REFS ================= */
  const datePickerRef = useRef(null);

  /* ================= STATE ================= */
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [date, setDate] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ================= STATUS TEXT ================= */
  const statusMessages = [
    "This may take a few moments…",
    "Scanning document…",
    "Extracting fields…",
    "Validating extracted data…",
  ];

  const [statusIndex, setStatusIndex] = useState(0);

  /* ================= EFFECTS ================= */
  useEffect(() => {
    if (!uploading) return;

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [uploading, statusMessages.length]);

  /* ================= HELPERS ================= */
  const formatDateInput = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  /* ================= HANDLERS ================= */
  const handleDateChange = (e) => {
    setDate(formatDateInput(e.target.value));
  };

  const handleHiddenDatePick = (e) => {
    const [year, month, day] = e.target.value.split("-");
    if (day) setDate(`${day}-${month}-${year}`);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleUploadAndProcess = async () => {
    if (!date || !selectedFile) {
      alert("Please select a date and upload a file.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("meeting_date", date);
      formData.append("file", selectedFile);

      await api.post("/upload-minutes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onProcessed();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file.");
      setUploading(false);
    }
  };

  /* ================= LOADING UI ================= */
  if (uploading) {
    return (
      <div className="upload-form loading-card">
        <h4>Extracting fields from document…</h4>

        <div className="extract-wrapper">
          <div className="document">
            <div className="scan-line"></div>

            <div className="field"></div>
            <div className="field short"></div>
            <div className="field"></div>
            <div className="field medium"></div>
          </div>

          <p className="status">{statusMessages[statusIndex]}</p>
        </div>
      </div>
    );
  }

  /* ================= FORM UI ================= */
  return (
    <div className="upload-form">
      <h2 className="upload-title">Upload Meeting Minutes</h2>

      <div className="form-content">
        {/* DATE */}
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

        {/* FILE */}
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
            <div className="file-icon">📄</div>
            <div className="file-text">
              {fileName || "Click to upload or drag and drop"}
            </div>

            <input
              type="file"
              className="file-input"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>
        </div>

        {/* SUBMIT */}
        <button className="up" onClick={handleUploadAndProcess}>
          Upload & Continue
        </button>
      </div>
    </div>
  );
}
