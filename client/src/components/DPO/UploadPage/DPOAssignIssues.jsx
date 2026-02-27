import React, { useState, useEffect, useRef } from "react";
import "./DPOAssignIssues.css";
import { Link } from "react-router-dom";
import DPOIssueAssignCard from "./DPOIssueAssignCard";
import EmptyStateCard from "../../common/EmptyStateCard";
import api from "../../../api/axios";
import { getDraftById, removeDraft, saveDraft } from "../../../utils/dpoDrafts";
import { emitIssuesUpdated, emitNotificationsUpdated } from "../../../utils/liveUpdates";

export default function AssignIssues({ draftId = null }) {
  const [issues, setIssues] = useState([]);
  const [minutesId, setMinutesId] = useState(null);
  const [openFlagForIssue, setOpenFlagForIssue] = useState(null);
  const [mappedIssues, setMappedIssues] = useState({});
  const [showLogModal, setShowLogModal] = useState(false);
  const [existingIssues, setExistingIssues] = useState([]);
  const [suggestedMatches, setSuggestedMatches] = useState({});
  const [matchingInProgress, setMatchingInProgress] = useState(false);

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

  // Fetch existing issues for the flag panel
  useEffect(() => {
    api.get("/existing-issues")
      .then((res) => setExistingIssues(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Failed to load existing issues:", err));
  }, []);

  // Trigger Gemini matching once we have both issues and existing issues
  useEffect(() => {
    if (issues.length === 0 || existingIssues.length === 0) return;

    const newForMatching = issues.map((iss, idx) => ({
      index: idx,
      issue: iss.issue || "",
      issue_description: iss.issue_description || "",
    }));

    const existingForMatching = existingIssues.map((iss) => ({
      id: iss.id,
      issue: iss.issue,
      issue_description: iss.issue_description,
      minutes_title: iss.minutes_title,
    }));

    setMatchingInProgress(true);
    api.post("/match-issues", {
      new_issues: newForMatching,
      existing_issues: existingForMatching,
    })
      .then((res) => {
        const matches = Array.isArray(res.data) ? res.data : [];
        const suggestions = {};
        for (const m of matches) {
          const issueKey = `${issues[m.new_index]?.issue_no || "issue"}-${m.new_index}`;
          suggestions[issueKey] = {
            existingId: m.existing_id,
            confidence: m.confidence,
          };
        }
        setSuggestedMatches(suggestions);

        // Auto-map high-confidence matches
        setMappedIssues((prev) => {
          const updated = { ...prev };
          for (const [key, val] of Object.entries(suggestions)) {
            if (val.confidence === "high" && !updated[key]) {
              updated[key] = val.existingId;
            }
          }
          return updated;
        });
      })
      .catch((err) => console.error("Matching failed:", err))
      .finally(() => setMatchingInProgress(false));
  }, [issues.length, existingIssues.length]); // only re-run when counts change

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

  // Inject parent_issue_id into issues before sending to backend
  const getIssuesWithParentMapping = () => {
    return issues.map((issue, index) => {
      const issueKey = getIssueKey(issue, index);
      const parentId = mappedIssues[issueKey] || null;
      return parentId ? { ...issue, parent_issue_id: parentId } : issue;
    });
  };

  const handleAllocateAll = () => {
    const issuesWithParent = getIssuesWithParentMapping();
    api
      .post("/assign-issues/allocate-all", { issues: issuesWithParent, minutes_id: minutesId })
      .then(() => {
        if (draftId) removeDraft(draftId);
        alert("All issues allocated!");
        emitIssuesUpdated({ source: "dpo-allocate-all" });
        emitNotificationsUpdated({ source: "dpo-allocate-all" });
      })
      .catch((err) => console.error(err));
  };

  const handleAllocateIssue = (issue, index) => {
    const issueKey = getIssueKey(issue, index);
    const parentId = mappedIssues[issueKey] || null;
    const payload = parentId ? { ...issue, parent_issue_id: parentId } : issue;
    api
      .post("/assign-issues/allocate-single", { issue: payload, minutes_id: minutesId })
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

  const handleMapIssue = (issueKey, existingId) => {
    setMappedIssues((prev) => {
      // If already mapped to this id, unmap it
      if (prev[issueKey] === existingId) {
        const updated = { ...prev };
        delete updated[issueKey];
        return updated;
      }
      return { ...prev, [issueKey]: existingId };
    });
    setOpenFlagForIssue(null);
  };

  return (
    <div className="dpo-assign-issues-container">
      <div className="dpo-assign-header">
        <h2>
          Assign Issues
          {matchingInProgress && (
            <span className="dpo-matching-badge">🔗 Matching...</span>
          )}
        </h2>
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
            existingIssues={existingIssues}
            isFlagPanelOpen={openFlagForIssue === issueKey}
            mappedExistingId={mappedIssues[issueKey] || null}
            suggestedMatch={suggestedMatches[issueKey] || null}
            onToggleFlagPanel={() => handleToggleFlagPanel(issueKey)}
            onMapIssue={(existingId) => handleMapIssue(issueKey, existingId)}
          />
          );
        })}
      </div>
    </div>
  );
}

