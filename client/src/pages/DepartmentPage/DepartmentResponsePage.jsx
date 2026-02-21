
// import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import DepartmentHeader from "../../components/Department/DepartmentHeader";
import DepartmentTabs from "../../components/Department/DepartmentTabs";
import DepartmentIssueCard from "../../components/Department/DepartmentIssueCard";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import LoadingState from "../../components/common/LoadingState";
import { LIVE_EVENT_ISSUES_UPDATED, addLiveEventListener } from "../../utils/liveUpdates";
import "./DepartmentResponsePage.css";
import api from "../../api/axios";

function DepartmentResponsePage() {
  const { dept } = useParams();
  const [activeTab, setActiveTab] = useState("Pending");
  const [allIssues, setAllIssues] = useState([]); // Renamed for clarity
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDeptIssues = async () => {
    if (!dept) return;

    if (allIssues.length === 0) setLoading(true);
    setError("");
    try {
      const res = await api.get(`/issues/${dept}`);
      setAllIssues(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching department issues:", err);
      setError("Failed to refresh issues. Retrying automatically...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeptIssues();
  }, [dept]);

  useEffect(() => {
    const onIssuesUpdated = (evt) => {
      const eventDept = String(evt?.detail?.department || "").toUpperCase();
      if (!eventDept || eventDept.includes(String(dept || "").toUpperCase())) {
        fetchDeptIssues();
      }
    };
    const unsubscribe = addLiveEventListener(LIVE_EVENT_ISSUES_UPDATED, onIssuesUpdated);
    return unsubscribe;
  }, [dept, allIssues.length]);

  // 2. OPTIMIZATION: Filter instantly in memory using useMemo
  const displayedIssues = useMemo(() => {
    const tabLower = activeTab.toLowerCase().trim();

    return allIssues.filter((i) => {
      const status = String(i?.status || "pending").toLowerCase().trim();

      // Handle the 'Submitted' vs 'Received' logic if needed
      if (tabLower === 'submitted') {
        return status === 'submitted' || status === 'completed' || status === 'received';
      }
      return status === tabLower;
    });
  }, [allIssues, activeTab]); // Re-runs instantly when tab changes

  return (
    <div className="department-container">
      <DepartmentHeader departmentName={dept} />
      <div className="department-content">
        <h1>{dept?.toUpperCase()} Department Portal</h1>

        <DepartmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="department-tab-scroll-area">
          {loading && allIssues.length === 0 ? (
            <LoadingState text="Loading issues..." />
          ) : error && allIssues.length === 0 ? (
            <EmptyStateCard
              title="Unable to load issues"
              description={error}
            />
          ) : (
            <>
              {displayedIssues.length > 0 ? (
                displayedIssues.map((issue) => (
                  <DepartmentIssueCard
                    // We fixed the serializer to return 'id', so use that
                    key={issue.id}
                    issue={issue}
                  />
                ))
              ) : (
                <EmptyStateCard
                  title="No issues found"
                  description={`There are no ${activeTab.toLowerCase()} issues right now.`}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DepartmentResponsePage;
