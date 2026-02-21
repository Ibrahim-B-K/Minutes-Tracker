import React, { useState, useEffect,useRef } from "react";
import "./DPOAssignIssues.css";
import { Link } from "react-router-dom";
import DPOIssueAssignCard from "./DPOIssueAssignCard";
import EmptyStateCard from "../../common/EmptyStateCard";
import api from "../../../api/axios";
import { getDraftById, removeDraft, saveDraft } from "../../../utils/dpoDrafts";
import { emitIssuesUpdated, emitNotificationsUpdated } from "../../../utils/liveUpdates";

const DUMMY_UNRESOLVED_ISSUES = [
  { id: "unr-101", title: "Road widening pending near market junction" },
  { id: "unr-102", title: "Drainage blockage in ward 7 unresolved" },
  { id: "unr-103", title: "Streetlight maintenance issue not completed" },
  { id: "unr-104", title: "Water supply complaint still open" },
];

export default function AssignIssues({ draftId = null }) {
  const [issues, setIssues] = useState([]);
  const [minutesId, setMinutesId] = useState(null);
  const [openFlagForIssue, setOpenFlagForIssue] = useState(null);
  const [mappedIssues, setMappedIssues] = useState({});
  const [showLogModal, setShowLogModal] = useState(false);

  const applyDefaultDeadlines = (sourceIssues) => {
    return (sourceIssues || []).map((issue) => {
      if (!issue.deadline || issue.deadline.trim() === "") {
        const today = new Date();
        const deadline = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
        const day = String(deadline.getDate()).padStart(2, "0");
        const month = String(deadline.getMonth() + 1).padStart(2, "0");
        const year = deadline.getFullYear();
        return { ...issue, deadline: `${day}-${month}-${year}` };
      }
      return issue;
    });
  };

  useEffect(() => {
    const fetchIssuesFromServer = async () => {
      try {
        const res = await api.get("/assign-issues");
        const normalized = applyDefaultDeadlines(Array.isArray(res.data) ? res.data : []);
        setIssues(normalized);
        return normalized;
      } catch (err) {
        console.error("Failed to load issues:", err);
        setIssues([]);
        return [];
      }
    };

    if (draftId) {
      const draft = getDraftById(draftId);
      const draftIssues = Array.isArray(draft?.issues) ? draft.issues : [];

      if (draftIssues.length > 0) {
        setIssues(applyDefaultDeadlines(draftIssues));
        setMinutesId(draft.minutesId || null);
      } else {
        setMinutesId(draft?.minutesId || null);
        fetchIssuesFromServer().then((serverIssues) => {
          if (draft) {
            saveDraft({
              ...draft,
              issues: serverIssues,
              minutesId: draft.minutesId || null,
            });
          }
        });
      }
      return;
    }

    fetchIssuesFromServer();
    setMinutesId(null);
  }, [draftId]);

  const handleChange = (index, field, value) => {
    setIssues((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  useEffect(() => {
    if (!draftId) return;
    const draft = getDraftById(draftId);
    if (!draft) return;

    saveDraft({
      ...draft,
      issues,
      minutesId: draft.minutesId || minutesId || null,
    });
  }, [draftId, issues, minutesId]);

  const handleAllocateAll = () => {
    api
      .post("/assign-issues/allocate-all", { issues, minutes_id: minutesId })
      .then(() => {
        if (draftId) removeDraft(draftId);
        alert("All issues allocated!");
        emitIssuesUpdated({ source: "dpo-allocate-all" });
        emitNotificationsUpdated({ source: "dpo-allocate-all" });
      })
      .catch((err) => console.error(err));
  };

  const handleAllocateIssue = (issue, index) => {
    api
      .post("/assign-issues/allocate-single", { issue, minutes_id: minutesId })
      .then(() => {
        setIssues((prev) => prev.filter((_, i) => i !== index));
        emitIssuesUpdated({ source: "dpo-allocate-single" });
        emitNotificationsUpdated({ source: "dpo-allocate-single" });
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteIssue = (index) => {
    setIssues((prev) => prev.filter((_, i) => i !== index));
  };

  const getIssueKey = (issue, index) => `${issue.issue_no || "issue"}-${index}`;

  const handleToggleFlagPanel = (issueKey) => {
    setOpenFlagForIssue((prev) => (prev === issueKey ? null : issueKey));
  };

  const handleMapIssue = (issueKey, unresolvedId) => {
    setMappedIssues((prev) => ({ ...prev, [issueKey]: unresolvedId }));
    setOpenFlagForIssue(null);
  };

  return (
    <div className="dpo-assign-issues-container">
      <div className="dpo-assign-header">
        <h2>Assign Issues</h2>
        <Link to="/dpo/home">
          <button className="dpo-allocate-btn" onClick={handleAllocateAll}>
            Allocate All
          </button>
        </Link>
      </div>

      {issues.length === 0 && (
        <EmptyStateCard
          compact
          title="No pending issues"
          description="No pending issues found."
        />
      )}

      <div className="dpo-issue-cards">
        {issues.map((issue, index) => {
          const issueKey = getIssueKey(issue, index);
          return (
          <DPOIssueAssignCard
            key={issueKey}
            issue={issue}
            index={index}
            onChange={handleChange}
            onAllocate={handleAllocateIssue}
            onDelete={handleDeleteIssue}
            unresolvedIssues={DUMMY_UNRESOLVED_ISSUES}
            isFlagPanelOpen={openFlagForIssue === issueKey}
            mappedUnresolvedId={mappedIssues[issueKey] || null}
            onToggleFlagPanel={() => handleToggleFlagPanel(issueKey)}
            onMapIssue={(unresolvedId) => handleMapIssue(issueKey, unresolvedId)}
          />
          );
        })}
      </div>
    </div>
  );
}

