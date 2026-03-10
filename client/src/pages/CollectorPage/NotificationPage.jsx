import React, { useEffect, useState } from "react";
import CollectorHeader from "../../components/Collector/CollectorHeader";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import LoadingState from "../../components/common/LoadingState";
import "./NotificationPage.css";
import api from "../../api/axios";
import { getAuthValue } from "../../utils/authStorage";
import { LIVE_EVENT_NOTIFICATIONS_UPDATED, addLiveEventListener } from "../../utils/liveUpdates";

function CollectorNotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const username = getAuthValue("username");
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
    const onNotificationsUpdated = () => fetchNotifications();
    const unsubscribe = addLiveEventListener(
      LIVE_EVENT_NOTIFICATIONS_UPDATED,
      onNotificationsUpdated
    );
    return unsubscribe;
  }, []);

  return (
    <div className="collector-container">
      <CollectorHeader />

      <div className="collector-content">
        <div className="collector-notification-header">
          <h1>Notifications</h1>
        </div>

        <div className="collector-notification-list">
          {loading ? (
            <LoadingState text="Loading notifications..." />
          ) : notifications.length === 0 ? (
            <EmptyStateCard
              compact
              title="No notifications"
              description="You are all caught up."
            />
          ) : (
            notifications.map((note) => {
              const safeType = note.type || "general";
              return (
                <div key={note.id} className={`collector-notification-card collector-${safeType}`}>
                  <div className="collector-notification-icon">
                    {safeType === "response" && <span>📩</span>}
                    {safeType === "assign" && <span>📝</span>}
                    {safeType === "deadline" && <span>⏰</span>}
                    {safeType === "general" && <span>🔔</span>}
                  </div>

                  <div className="collector-notification-content">
                    <h3>{safeType.toUpperCase()}</h3>
                    <p>{note.message}</p>
                    <span className="collector-time">{note.time_ago}</span>
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

export default CollectorNotificationPage;
