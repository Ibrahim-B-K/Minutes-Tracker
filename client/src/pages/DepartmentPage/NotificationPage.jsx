import React, { useEffect, useState } from "react";
// import axios from "axios";
import DepartmentHeader from "../../components/Department/DepartmentHeader";
import "./NotificationPage.css";
import api from "../../api/axios";

function DepartmentNotificationPage() {
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
    <div className="notificationpage-container">
      <Header activeTab="notifications" />

      <div className="notificationpage-content">
        <div className="notification-header">
          <h1>Notifications</h1>
        </div>

        <div className="notification-list">
          {loading ? (
            <p>Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">No new notifications</div>
          ) : (
            notifications.map((note) => (
              <div key={note.notification_id} className={`notification-card ${note.type}`}>
                <div className="notification-icon">
                  {note.type === "assign" && <span>📝</span>}
                  {note.type === "deadline" && <span>⏰</span>}
                  {note.type === "response" && <span>📩</span>}
                </div>

                <div className="notification-content">
                  <h3>{note.type.toUpperCase()}</h3>
                  <p>{note.message}</p>
                  <span className="time">{note.time_ago}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DepartmentNotificationPage;