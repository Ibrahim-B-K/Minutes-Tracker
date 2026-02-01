import React from "react";
import CollectorHeader from "../../components/Collector/CollectorHeader";
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
    <div className="notificationpage-container">
      <CollectorHeader />

      <div className="notificationpage-content">
        <div className="notification-header">
          <h1>Notifications</h1>
        </div>

        <div className="notification-list">
          {notifications.map((note) => (
                <div key={note.id} className={`notification-card ${note.type}`}>
              <div className="notification-icon">
                {note.type === "response" && <span>📩</span>}
                {note.type === "deadline" && <span>⏰</span>}
              </div>

              <div className="notification-content">
                <h3>{note.title}</h3>
                <p>{note.message}</p>
                <span className="time">{note.time}</span>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="no-notifications">No new notifications</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectorNotificationPage;
