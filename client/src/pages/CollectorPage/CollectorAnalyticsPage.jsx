import React, { useEffect, useState } from "react";
import CollectorHeader from "../../components/Collector/CollectorHeader";
import LoadingState from "../../components/common/LoadingState";
import api from "../../api/axios";
import "./CollectorAnalyticsPage.css";

// Material UI Icons for the dashboard
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BusinessIcon from "@mui/icons-material/Business";

function CollectorAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/collector/analytics");
        setData(res.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-container">
        <CollectorHeader />
        <div className="analytics-content">
          <LoadingState text="Preparing your dashboard..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <CollectorHeader />
        <div className="analytics-content">
          <div className="error-message-box">
            <WarningAmberIcon />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { total_issues, resolved_count, unresolved_count, dept_performance } = data;

  return (
    <div className="analytics-container">
      <CollectorHeader />

      <div className="analytics-content">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
          <p>Real-time insights into issue resolution and department performance.</p>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards-grid">
          <div className="summary-card total">
            <div className="card-icon">
              <AssignmentIcon />
            </div>
            <div className="card-info">
              <h3>Total Issues</h3>
              <span className="card-number">{total_issues}</span>
            </div>
            <div className="card-decoration"></div>
          </div>

          <div className="summary-card resolved">
            <div className="card-icon">
              <CheckCircleIcon />
            </div>
            <div className="card-info">
              <h3>Resolved</h3>
              <span className="card-number">{resolved_count}</span>
            </div>
            <div className="card-decoration"></div>
          </div>

          <div className="summary-card unresolved">
            <div className="card-icon">
              <PendingActionsIcon />
            </div>
            <div className="card-info">
              <h3>Unresolved</h3>
              <span className="card-number">{unresolved_count}</span>
            </div>
            <div className="card-decoration"></div>
          </div>
        </div>

        {/* Department Performance Table/Grid */}
        <div className="performance-section">
          <h2>Department Performance</h2>
          <div className="performance-grid">
            {dept_performance.map((dept, index) => {
              const completionRate = dept.total > 0 
                ? Math.round((dept.resolved / dept.total) * 100) 
                : 0;
              
              return (
                <div key={index} className="dept-performance-card">
                  <div className="dept-info-header">
                    <div className="dept-title">
                      <BusinessIcon className="dept-icon" />
                      <div>
                        <h4>{dept.designation}</h4>
                        <span>{dept.department}</span>
                      </div>
                    </div>
                    <div className="completion-badge" style={{
                      backgroundColor: completionRate > 70 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                      color: completionRate > 70 ? '#16a34a' : '#ca8a04'
                    }}>
                      {completionRate}% Done
                    </div>
                  </div>

                  <div className="stat-bars">
                    <div className="stat-row">
                      <span>Resolved ({dept.resolved})</span>
                      <div className="custom-progress-bg">
                        <div className="custom-progress-fill completed" style={{ width: `${(dept.resolved / dept.total) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className="stat-row">
                      <span>Submitted ({dept.submitted})</span>
                      <div className="custom-progress-bg">
                        <div className="custom-progress-fill submitted" style={{ width: `${dept.latest_total > 0 ? (dept.submitted / dept.latest_total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div className="stat-row">
                      <span>Pending ({dept.pending})</span>
                      <div className="custom-progress-bg">
                        <div className="custom-progress-fill pending" style={{ width: `${dept.latest_total > 0 ? (dept.pending / dept.latest_total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div className="stat-row">
                      <span className="overdue-label">Overdue ({dept.overdue})</span>
                      <div className="custom-progress-bg">
                        <div className="custom-progress-fill overdue" style={{ width: `${dept.latest_total > 0 ? (dept.overdue / dept.latest_total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectorAnalyticsPage;
