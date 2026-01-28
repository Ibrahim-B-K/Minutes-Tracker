import React, { useEffect, useState, useMemo } from "react";
import CollectorHeader from "../../components/Collector/CollectorHeader";
import CollectorTabs from "../../components/Collector/IssuePage/CollectorTabs";
import CollectorFilterBar from "../../components/Collector/IssuePage/CollectorFilterBar";
import CollectorIssueCard from "../../components/Collector/IssuePage/CollectorIssueCard";
import "./CollectorIssuePage.css";
import api from "../../api/axios"; // Uses your configured axios with Token

function CollectorIssuePage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [filters, setFilters] = useState({});
  const [allIssues, setAllIssues] = useState([]); 
  const [loading, setLoading] = useState(false);

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

  // 2. Instant Client-Side Filtering (Same logic as DPO page)
  const displayedIssues = useMemo(() => {
    return allIssues.filter((issue) => {
        
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

        // D. Sort Logic (Optional client-side sorting)
        // You can add sort logic here if needed, currently implied by order of array

        return true;
    });
  }, [allIssues, activeTab, filters]);

  return (
    <div className="dpo-container">
      <CollectorHeader />

      <div className="content">
        <div className="page-title">
          <h1>District Monitor</h1>
        </div>

        <CollectorFilterBar
          activeTab={activeTab}
          onFilterChange={(newFilters) => setFilters(prev => ({...prev, ...newFilters}))}
          // specific date filtering if needed
        />

        <CollectorTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="tab-scroll-area">
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : displayedIssues.length === 0 ? (
            <p className="no-issues">No issues found</p>
          ) : (
            displayedIssues.map((issue) => (
                <CollectorIssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectorIssuePage;