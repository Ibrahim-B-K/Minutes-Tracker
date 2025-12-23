import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import UploadPage from "./pages/DPOPage/UploadPage.jsx";
import DPOIssuePage from "./pages/DPOPage/DPOIssuePage.jsx";
import DepartmentResponsePage from "./pages/DepartmentPage/DepartmentResponsePage.jsx";
import CollectorIssuePage from "./pages/CollectorPage/CollectorIssuePage.jsx";
import DPONotificationsPage from "./pages/DPOPage/NotificationPage.jsx";
import DepartmentNotificationPage from "./pages/DepartmentPage/NotificationPage.jsx";
import CollectorNotificationPage from "./pages/CollectorPage/NotificationPage.jsx";
import Login from "./pages/LoginPage.jsx";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route -> DPO Page */}
        <Route path="/" element={<Navigate to="/login" />} />
        {/* DPO Page */}
        <Route path="/login" element={<Login />} />
        <Route path="/dpo" element={<DPOIssuePage />} />
        {/* Upload Page */}
        <Route path="/dpo/upload" element={<UploadPage />} />
        <Route path="/dpo/notifications" element={<DPONotificationsPage />} />
        <Route path="/department/:dept" element={<DepartmentResponsePage />} />
        <Route path="/department/notifications" element={<DepartmentNotificationPage />} />
        <Route path="/collector" element={<CollectorIssuePage />} />
        <Route path="/collector/notifications" element={<CollectorNotificationPage />} />
      </Routes>
    </Router>
  );
}

export default App;

