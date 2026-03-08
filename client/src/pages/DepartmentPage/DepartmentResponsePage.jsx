
// import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import DepartmentHeader from "../../components/Department/DepartmentHeader";
import DepartmentTabs from "../../components/Department/DepartmentTabs";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import LoadingState from "../../components/common/LoadingState";
import { LIVE_EVENT_ISSUES_UPDATED, addLiveEventListener } from "../../utils/liveUpdates";
import {
  getIssueDateKeys,
  getIssueDateKey,
  toDDMMYYYY,
  parseDDMMYYYYToKey,
  parseDeadline,
  priorityRank
} from "../../utils/issueDateUtils";
import IssueFilterBar from "../../components/common/IssueFilterBar";
import IssueCard from "../../components/common/IssueCard";
import DepartmentResponseModal from "../../components/Department/DepartmentResponseModal";
import "./DepartmentResponsePage.css";
import api from "../../api/axios";

function DepartmentResponsePage() {
  const { dept } = useParams();
  const [activeTab, setActiveTab] = useState("Pending");
  const [filters, setFilters] = useState({});
  const [defaultDateRange, setDefaultDateRange] = useState(null);
  const [didInitDateRange, setDidInitDateRange] = useState(false);
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Response Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssueForModal, setSelectedIssueForModal] = useState(null);

  const handleOpenResponseModal = (issue) => {
    setSelectedIssueForModal(issue);
    setIsModalOpen(true);
  };

  const handleSubmitSuccess = () => {
    setIsModalOpen(false);
    fetchDeptIssues(); // Refresh list to reflect response
    alert("Response submitted successfully!");
  };

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
    if (didInitDateRange || allIssues.length === 0) return;

    const dated = allIssues
      .map((issue) => {
        const k = getIssueDateKey(issue);
        if (!k) return null;
        const s = String(k);
        return new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
      })
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime());
    if (dated.length === 0) return;

    const latest = toDDMMYYYY(dated[0]);
    setDefaultDateRange({ fromDate: latest, toDate: latest });
    setFilters((prev) => ({ ...prev, fromDate: latest, toDate: latest }));
    setDidInitDateRange(true);
  }, [allIssues, didInitDateRange]);

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
    const filtered = allIssues.filter((issue) => {
      const status = String(issue?.status || "pending").toLowerCase().trim();
      const tabLower = activeTab.toLowerCase().trim();

      // A. Tab Filter
      if (tabLower === 'submitted') {
        if (!(status === 'submitted' || status === 'completed' || status === 'received')) return false;
      } else {
        if (status !== tabLower) return false;
      }

      // B. Search Filter
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (
          !issue.issue?.toLowerCase().includes(q) &&
          !issue.issue_no?.toString().includes(q) &&
          !issue.minutes_title?.toLowerCase().includes(q)
        )
          return false;
      }

      // C. Priority Filter
      if (filters.filterBy && filters.filterBy !== "all") {
        const f = filters.filterBy.toLowerCase();
        if (["high", "medium", "low"].includes(f)) {
          if (issue.priority?.toLowerCase() !== f) return false;
        }
      }

      // D. Date Range Filter
      const issueDateKeys = getIssueDateKeys(issue);
      const fromDateKeyRaw = parseDDMMYYYYToKey(filters.fromDate);
      const toDateKeyRaw = parseDDMMYYYYToKey(filters.toDate);
      const lowerBound =
        fromDateKeyRaw && toDateKeyRaw ? Math.min(fromDateKeyRaw, toDateKeyRaw) : fromDateKeyRaw;
      const upperBound =
        fromDateKeyRaw && toDateKeyRaw ? Math.max(fromDateKeyRaw, toDateKeyRaw) : toDateKeyRaw;

      if ((lowerBound || upperBound) && issueDateKeys.length === 0) return false;
      if (lowerBound || upperBound) {
        const inRange = issueDateKeys.some((key) => {
          if (lowerBound && key < lowerBound) return false;
          if (upperBound && key > upperBound) return false;
          return true;
        });
        if (!inRange) return false;
      }

      return true;
    });

    // Sorting
    const sortBy = String(filters.sortBy || "newest").toLowerCase();
    const sorted = [...filtered];

    if (sortBy === "priority") {
      sorted.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
      return sorted;
    }

    if (sortBy === "deadline") {
      sorted.sort((a, b) => parseDeadline(a.deadline) - parseDeadline(b.deadline));
      return sorted;
    }

    // Default newest (ID descending)
    sorted.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    return sorted;
  }, [allIssues, activeTab, filters]);

  return (
    <div className="department-container">
      <DepartmentHeader departmentName={dept} />
      <div className="department-content">
        <h1>{dept?.toUpperCase()} Department Portal</h1>

        <IssueFilterBar
          activeTab={activeTab}
          onFilterChange={(nf) => setFilters((p) => ({ ...p, ...nf }))}
          issue_date={defaultDateRange}
          role="department"
        />

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
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    role="department"
                    onSubmitResponse={() => handleOpenResponseModal(issue)}
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

      <DepartmentResponseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        issue={selectedIssueForModal}
        onSubmit={handleSubmitSuccess}
      />
    </div>
  );
}

export default DepartmentResponsePage;
