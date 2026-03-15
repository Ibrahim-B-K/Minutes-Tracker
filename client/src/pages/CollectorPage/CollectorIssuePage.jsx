import React, { useEffect, useState, useMemo } from "react";
import CollectorHeader from "../../components/Collector/CollectorHeader";
import CollectorTabs from "../../components/Collector/IssuePage/CollectorTabs";
import IssueCard from "../../components/common/IssueCard";
import DPOIssueLifecycleDrawer from "../../components/DPO/IssuePage/DPOIssueLifecycleDrawer";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import LoadingState from "../../components/common/LoadingState";
import { 
  getIssueDateKeys, 
  getIssueDateKey, 
  toDDMMYYYY, 
  parseDDMMYYYYToKey, 
  parseDeadline, 
  priorityRank 
} from "../../utils/issueDateUtils";
import IssueFilterBar from "../../components/common/IssueFilterBar";
import "./CollectorIssuePage.css";
import api from "../../api/axios";

function CollectorIssuePage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [filters, setFilters] = useState({});
  const [defaultDateRange, setDefaultDateRange] = useState(null);
  const [didInitDateRange, setDidInitDateRange] = useState(false);
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lifecycle Drawer State
  const [selectedIssueForDrawer, setSelectedIssueForDrawer] = useState(null);
  const [isLifecycleOpen, setIsLifecycleOpen] = useState(false);

  const handleOpenLifecycle = (issue) => {
    setSelectedIssueForDrawer(issue);
    setIsLifecycleOpen(true);
  };


  // 1. Fetch Logic: Get ALL issues once (or when Date filter changes)
  useEffect(() => {
    setLoading(true);

    // Use the specific date param if it exists, otherwise fetch all
    const params = filters.date ? { date: filters.date } : {};

    api.get("/issues", { params })
      .then((res) => {
        setAllIssues(res.data);
      })
      .catch((err) => console.error("Error fetching issues:", err))
      .finally(() => setLoading(false));

  }, [filters.date]); // Only re-fetch from server if the DATE filter changes

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

  // 2. Instant Client-Side Filtering (Same logic as DPO page)
  const displayedIssues = useMemo(() => {
    const filtered = allIssues.filter((issue) => {

      // A. Filter by Tab
      const status = issue.status ? issue.status.toLowerCase() : "pending";
      const tab = activeTab.toLowerCase();

      let statusMatch = false;
      if (tab === "received") {
        // "Received" tab shows 'submitted' or 'completed' status
        statusMatch = (status === "submitted" || status === "completed");
      } else {
        statusMatch = (status === tab);
      }

      if (!statusMatch) return false;

      // B. Filter by Search Query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          (issue.issue && issue.issue.toLowerCase().includes(query)) ||
          (issue.issue_no && issue.issue_no.toString().includes(query)) ||
          (issue.department && issue.department.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // C. Filter by Dropdown (Priority/Dept)
      if (filters.filterBy && filters.filterBy !== "all") {
        const filterVal = filters.filterBy.toLowerCase();

        // Check Priority
        if (['high', 'medium', 'low'].includes(filterVal)) {
          if (issue.priority.toLowerCase() !== filterVal) return false;
        }
        // Check Department
        else {
          if (!issue.department.toLowerCase().includes(filterVal)) return false;
        }
      }

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


    const sortBy = String(filters.sortBy || "newest").toLowerCase();
    const sorted = [...filtered];

    if (sortBy === "priority") {
      sorted.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
      return sorted;
    }

    if (sortBy === "department") {
      sorted.sort((a, b) => String(a.department || "").localeCompare(String(b.department || "")));
      return sorted;
    }

    if (sortBy === "deadline") {
      sorted.sort((a, b) => parseDeadline(a.deadline) - parseDeadline(b.deadline));
      return sorted;
    }

    sorted.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    return sorted;
  }, [allIssues, activeTab, filters]);

  return (
    <div className="collector-issuepage-container">
      <CollectorHeader />

      <div className="collector-issuepage-content">
        <div className="collector-page-title">
          <h1>District Monitor</h1>
        </div>

        <IssueFilterBar
          activeTab={activeTab}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          issue_date={defaultDateRange}
          role="collector"
        />

        <CollectorTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="collector-tab-scroll-area">
          {loading ? (
            <LoadingState text="Loading issues..." />
          ) : displayedIssues.length === 0 ? (
            <EmptyStateCard
              title="No issues found"
              description={`There are no ${activeTab.toLowerCase()} issues to display.`}
            />
          ) : (
            displayedIssues.map((issue) => (
              <IssueCard 
                key={issue.id} 
                issue={issue} 
                role="collector"
                onOpenLog={handleOpenLifecycle}
              />
            ))
          )}
        </div>

        <DPOIssueLifecycleDrawer
          isOpen={isLifecycleOpen}
          onClose={() => setIsLifecycleOpen(false)}
          selectedIssue={selectedIssueForDrawer}
        />
      </div>
    </div>
  );
}

export default CollectorIssuePage;
