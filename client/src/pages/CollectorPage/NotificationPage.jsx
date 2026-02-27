import React from "react";
import CollectorHeader from "../../components/Collector/CollectorHeader";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import "./NotificationPage.css";

function CollectorNotificationPage() {
  const notifications = [
    {
      id: 1,
      title: "Response Received",
      message: "A response has been submitted for Issue #1023.",
      time: "10 minutes ago",
      type: "response",
    },
    {
      id: 2,
      title: "Deadline Exceeded",
      message: "Issue #1009 has exceeded its deadline. Immediate attention required.",
      time: "1 hour ago",
      type: "deadline",
    },
  ];

  return (
    <div className="collector-container">
      <CollectorHeader />

      <div className="collector-content">
        <div className="collector-notification-header">
          <h1>Notifications</h1>
        </div>

        <div className="collector-notification-list">
          {notifications.map((note) => (
                <div key={note.id} className={`collector-notification-card collector-${note.type}`}>
              <div className="collector-notification-icon">
                {note.type === "response" && <span>📩</span>}
                {note.type === "deadline" && <span>⏰</span>}
              </div>

              <div className="collector-notification-content">
                <h3>{note.title}</h3>
                <p>{note.message}</p>
                <span className="collector-time">{note.time}</span>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <EmptyStateCard
              compact
              title="No notifications"
              description="You are all caught up."
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectorNotificationPage;
