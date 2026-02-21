import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DPOHeader from "../../components/DPO/DPOHeader";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import LoadingState from "../../components/common/LoadingState";
import DPOUploadForm from "../../components/DPO/UploadPage/DPOUploadForm";
import DPOAssignIssues from "../../components/DPO/UploadPage/DPOAssignIssues";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { getDrafts, removeDraft } from "../../utils/dpoDrafts";
import "./DPODraftsPage.css";

function DPODraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const draftId = searchParams.get("draft");

  useEffect(() => {
    setLoading(true);
    setDrafts(getDrafts());
    setLoading(false);
  }, [searchParams]);

  const handleOpenDraft = (selectedDraftId) => {
    setSearchParams({ draft: selectedDraftId });
  };

  const handleDeleteDraft = (selectedDraftId) => {
    removeDraft(selectedDraftId);
    setDrafts(getDrafts());
  };

  const handleStartUpload = () => {
    setSearchParams({ mode: "upload" });
  };

  const handleUploadProcessed = () => {
    setDrafts(getDrafts());
    setSearchParams({});
  };

  const showListView = !mode && !draftId;

  return (
    <div className="dpo-drafts-container">
      <DPOHeader />

      <div className="dpo-drafts-content">
        {showListView && (
          <div className="dpo-drafts-topbar">
            <h1 className="dpo-drafts-title">Drafts</h1>
            <button className="dpo-drafts-upload-btn" onClick={handleStartUpload}>
              Upload Minutes
            </button>
          </div>
        )}

        <div
          className={`dpo-drafts-body ${mode === "upload" ? "dpo-drafts-body-upload" : ""} ${
            draftId ? "dpo-drafts-body-assign" : ""
          }`}
        >
          {mode === "upload" ? (
            <div className="dpo-drafts-upload-wrapper">
              <DPOUploadForm onProcessed={handleUploadProcessed} />
            </div>
          ) : draftId ? (
            <div className="dpo-drafts-assign-wrapper">
              <DPOAssignIssues draftId={draftId} />
            </div>
          ) : loading ? (
            <LoadingState text="Loading drafts..." />
          ) : drafts.length === 0 ? (
            <EmptyStateCard
              title="No drafts available"
              description="Upload and process a minutes file to create a draft."
            />
          ) : (
            <div className="dpo-drafts-grid">
              {drafts.map((draft) => (
                <div key={draft.id} className="dpo-draft-card">
                  <div className="dpo-draft-card-header">
                    <h3>{draft.title || "Untitled Draft"}</h3>
                    <span>{draft.meetingDate || "No meeting date"}</span>
                  </div>

                  <div className="dpo-draft-meta">
                    <p>
                      <strong>Issues:</strong> {Array.isArray(draft.issues) ? draft.issues.length : 0}
                    </p>
                    <p>
                      <strong>Updated:</strong>{" "}
                      {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : "Unknown"}
                    </p>
                  </div>

                  <div className="dpo-draft-actions">
                    <button className="dpo-draft-open-btn" onClick={() => handleOpenDraft(draft.id)} title="Open Draft">
                      <FolderOpenIcon fontSize="medium" sx={{ fill: "#2563eb" }} />
                    </button>
                    <button className="dpo-draft-delete-btn" onClick={() => handleDeleteDraft(draft.id)}>
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

export default DPODraftsPage;
