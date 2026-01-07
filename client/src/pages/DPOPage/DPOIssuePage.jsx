import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import DriveFolderUploadSharpIcon from "@mui/icons-material/DriveFolderUploadSharp";

// Import your existing components (Old Paths)
import Header from "../../components/DPO/Header";
import Tabs from "../../components/DPO/IssuePage/Tabs";
import FilterBar from "../../components/DPO/IssuePage/FilterBar";
import IssueCard from "../../components/DPO/IssuePage/IssueCard";

// Import your existing CSS
import "./DPOIssuePage.css";
import api from "../../api/axios";

function DPOIssuePage() {
  // 1. State Management
  const [activeTab, setActiveTab] = useState("Pending");
  const [filters, setFilters] = useState({});
  const [allIssues, setAllIssues] = useState([]); // Stores everything (Fast!)
  const [loading, setLoading] = useState(false);

  // 2. FETCH Logic (Runs only on Load or Date Change)
  useEffect(() => {
    setLoading(true);
    api
      .get("/issues")
      .then((res) => {
        setAllIssues(res.data);
      })
      .catch((err) => console.error("Error fetching issues:", err))
      .finally(() => setLoading(false));
      
  }, [filters.date]); // <--- CRITICAL: Only re-fetch if DATE changes. Ignore Tab/Search.


  // 3. INSTANT FILTERING (Client-Side)
  // This replaces the server call for tabs/search
  const displayedIssues = useMemo(() => {
    return allIssues.filter((issue) => {
        // A. Filter by Tab
        const status = issue.status ? issue.status.toLowerCase() : "pending";
        const tab = activeTab.toLowerCase();
        
        let statusMatch = false;
        if (tab === "received") {
            // UI says "Received", Database says "submitted" or "completed"
            statusMatch = (status === "submitted" || status === "completed");
        } else {
            statusMatch = (status === tab);
        }

        if (!statusMatch) return false;

        // B. Filter by Search Query (Instant Search)
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesSearch = 
                (issue.issue && issue.issue.toLowerCase().includes(query)) ||
                (issue.issue_no && issue.issue_no.toString().includes(query)) ||
                (issue.department && issue.department.toLowerCase().includes(query));
            
            if (!matchesSearch) return false;
        }

        // C. Filter by Priority (if selected in dropdown)
        if (filters.filterBy && filters.filterBy !== "all") {
             const filterVal = filters.filterBy.toLowerCase();
             // Check Priority
             if (['high', 'medium', 'low'].includes(filterVal)) {
                 if (issue.priority.toLowerCase() !== filterVal) return false;
             }
             // Check Department (if your dropdown includes departments)
             else {
                 if (!issue.department.toLowerCase().includes(filterVal)) return false;
             }
        }

        return true;
    });
  }, [allIssues, activeTab, filters]); // Re-runs instantly when you click tabs/search


  return (
    <div className="dpo-container">
      <Header />

      <div className="content">
        <div className="page-title">
          <h1>Issue Tracking & Management</h1>
          <Link to="/dpo/upload">
            <DriveFolderUploadSharpIcon className="upload-icon" />
          </Link>
        </div>

        {/* Reuse your existing FilterBar */}
        <FilterBar
          activeTab={activeTab}
          onFilterChange={(newFilters) => setFilters(prev => ({...prev, ...newFilters}))}
        />

        {/* Reuse your existing Tabs */}
        <Tabs
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
        />

        <div className="tab-scroll-area">
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : displayedIssues.length === 0 ? (
            <p className="no-issues">No issues found</p>
          ) : (
            displayedIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DPOIssuePage;