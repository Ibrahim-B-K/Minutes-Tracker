import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../../components/DPO/Header";
import Tabs from "../../components/DPO/IssuePage/Tabs";
import FilterBar from "../../components/DPO/IssuePage/FilterBar";
import IssueCard from "../../components/DPO/IssuePage/IssueCard";
import { Link } from "react-router-dom";
import DriveFolderUploadSharpIcon from "@mui/icons-material/DriveFolderUploadSharp";
import "./DPOIssuePage.css";
import api from "../../api/axios";

function DPOIssuePage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [filters, setFilters] = useState({});
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch ALL issues from backend
  useEffect(() => {
    setLoading(true);
    api
      .get("/issues")
      .then((res) => {
        setIssues(res.data);
      })
      .catch((err) => console.error("Error fetching issues:", err))
      .finally(() => setLoading(false));
  }, [activeTab, filters]); // Refetch when tab or filters change

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

        <FilterBar
          activeTab={activeTab}
          onFilterChange={(newFilters) => setFilters(newFilters)}
        />

        <Tabs
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
        />

        <div className="tab-scroll-area">
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : issues.length === 0 ? (
            <p className="no-issues">No issues found</p>
          ) : (
            /* FIX: Filtering logic to match DB status names */
            issues
              .filter((issue) => {
                const status = issue.status.toLowerCase(); // from DB: 'pending', 'submitted', 'overdue'
                const tab = activeTab.toLowerCase(); // from UI: 'pending', 'received', 'overdue'

                if (tab === "received") {
                  return status === "submitted"; // UI "Received" tab = DB "submitted" status
                }
                return status === tab;
              })
              .map((issue) => (
                <IssueCard key={issue.id || issue.issue_dept_id} issue={issue} />
              ))
          )}
          
          {/* Show message if a tab is empty after filtering */}
          {!loading && issues.length > 0 && issues.filter(issue => {
              const status = issue.status.toLowerCase();
              const tab = activeTab.toLowerCase();
              return tab === "received" ? status === "submitted" : status === tab;
          }).length === 0 && (
            <p className="no-issues">No issues in {activeTab} status.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DPOIssuePage;