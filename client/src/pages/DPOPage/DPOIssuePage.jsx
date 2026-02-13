import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DriveFolderUploadSharpIcon from "@mui/icons-material/DriveFolderUploadSharp";
import AddBoxIcon from "@mui/icons-material/AddBox";

// Components
import DPOHeader from "../../components/DPO/DPOHeader";
import DPOTabs from "../../components/DPO/IssuePage/DPOTabs";
import DPOFilterBar from "../../components/DPO/IssuePage/DPOFilterBar";
import DPOIssueCard from "../../components/DPO/IssuePage/DPOIssueCard";
import DPOSingleIssueAssignCard from "../../components/DPO/IssuePage/DPOSingleIssueAssignCard";

// CSS
import "./DPOIssuePage.css";

// API
import api from "../../api/axios";

function DPOIssuePage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [filters, setFilters] = useState({});
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);

  // ===== FETCH =====
  useEffect(() => {
    setLoading(true);
    api
      .get("/issues")
      .then((res) => setAllIssues(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.date]);

  // ===== FILTER =====
  const displayedIssues = useMemo(() => {
    return allIssues.filter((issue) => {
      const status = issue.status?.toLowerCase() || "pending";
      const tab = activeTab.toLowerCase();

      if (
        tab === "received"
          ? !["submitted", "completed"].includes(status)
          : status !== tab
      )
        return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (
          !issue.issue?.toLowerCase().includes(q) &&
          !issue.issue_no?.toString().includes(q) &&
          !issue.department?.toLowerCase().includes(q)
        )
          return false;
      }

      if (filters.filterBy && filters.filterBy !== "all") {
        const f = filters.filterBy.toLowerCase();
        if (["high", "medium", "low"].includes(f)) {
          if (issue.priority?.toLowerCase() !== f) return false;
        } else if (!issue.department?.toLowerCase().includes(f)) return false;
      }

      return true;
    });
  }, [allIssues, activeTab, filters]);
const handleAllocateIssue = (issue) => {
  console.log("Allocating issue:", issue);

  api.post("/issues/allocate", issue)
    .then(() => {
      alert("Issue allocated successfully");
      setShowAssignModal(false);
    })
    .catch(() => {
      alert("Backend not ready");
    });
};

  return (
    <div className="dpo-container">
      <DPOHeader />

      <div className="content">
  
        <DPOFilterBar
          activeTab={activeTab}
          onFilterChange={(nf) => setFilters((p) => ({ ...p, ...nf }))}
        />

        {/* ✅ Tabs wrapper (DO NOT TOUCH DPOTabs) */}
        <div className="tabs-wrapper">
          <DPOTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <AddBoxIcon
            className="tabs-add-icon"
            onClick={() => setShowAssignModal(true)}
          />
        </div>

        <div className="tab-scroll-area">
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : displayedIssues.length === 0 ? (
            <p className="no-issues">No issues found</p>
          ) : (
            displayedIssues.map((issue) => (
              <DPOIssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {showAssignModal && (
        <div className="assign-overlay">
          <div
            className="assign-backdrop"
            onClick={() => setShowAssignModal(false)}
          />

          <div className="assign-modal">
            <div className="assign-header">
              <h2>Add / Assign Issue</h2>
              <button
                className="close-btn"
                onClick={() => setShowAssignModal(false)}
              >
                ✕
              </button>
            </div>

            <DPOSingleIssueAssignCard
  issue={{
    issue_no: "NEW",
    department: "",
    issue: "",
    issue_description: "",
    priority: "Medium",
    location: "",
    deadline: "",
  }}
  index={0}
  onChange={() => {}}
  onAllocate={handleAllocateIssue}
/>

          </div>
        </div>
      )}
    </div>
  );
}

export default DPOIssuePage;
