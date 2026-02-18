import React, { useEffect, useState } from "react";
// import axios from "axios";
import DPOHeader from "../../components/DPO/DPOHeader";
import "./DPONotificationPage.css";
import api from "../../api/axios";

function DPONotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const username = localStorage.getItem("username");
      try {
        const res = await api.get("/notifications", {
          params: { username }
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="DPO-notificationpage-container">
      <DPOHeader activeTab="notifications" />

      <div className="DPO-notificationpage-content">
        <div className="notification-header">
          <h1>Notifications</h1>
        </div>

        <div className="DPO-notification-list">
          {loading ? (
            <p>Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="DPO-no-notifications">No new notifications</div>
          ) : (
            notifications.map((note) => {
              const safeType = note.type || "general";
              return (
                <div key={note.id} className={`DPO-notification-card ${safeType}`}>
                  <div className="DPO-notification-icon">
                    {safeType === "response" && <span>📩</span>}
                    {safeType === "assign" && <span>📝</span>}
                    {safeType === "deadline" && <span>⏰</span>}
                    {safeType === "general" && <span>🔔</span>}
                  </div>

                  <div className="DPO-notification-content">
                    <h3>{safeType.toUpperCase()}</h3>
                    <p>{note.message}</p>
                    <span className="DPO-time">{note.time_ago}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default DPONotificationPage;