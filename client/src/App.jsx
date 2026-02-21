import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DPOIssuePage from "./pages/DPOPage/DPOIssuePage.jsx";
import DepartmentResponsePage from "./pages/DepartmentPage/DepartmentResponsePage.jsx";
import CollectorIssuePage from "./pages/CollectorPage/CollectorIssuePage.jsx";
import DPONotificationsPage from "./pages/DPOPage/DPONotificationPage.jsx";
import DPOMinutesPage from "./pages/DPOPage/DPOMinutesPage.jsx"
import DPODraftsPage from "./pages/DPOPage/DPODraftsPage.jsx";
import DepartmentMinutesPage from "./pages/DepartmentPage/DepartmentMinutesPage.jsx"
import DepartmentNotificationPage from "./pages/DepartmentPage/DepartmentNotificationPage.jsx";
import CollectorNotificationPage from "./pages/CollectorPage/NotificationPage.jsx";
import CollectorMinutesPage from "./pages/CollectorPage/CollectorMinutesPage.jsx"
import Login from "./pages/LoginPage.jsx";
import "./App.css";

function UploadRedirect() {
  const location = useLocation();
  return <Navigate to={`/dpo/drafts${location.search || ""}`} replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route -> DPO Page */}
        <Route path="/" element={<Navigate to="/login" />} />
        {/* DPO Page */}
        <Route path="/login" element={<Login />} />
        <Route path="/dpo/home" element={<DPOIssuePage />} />
        {/* Upload Page */}
        <Route path="/dpo/upload" element={<UploadRedirect />} />
        <Route path="/dpo/drafts" element={<DPODraftsPage />} />
        <Route path="/dpo/notifications" element={<DPONotificationsPage />} />
        <Route path="/dpo/minutes" element={<DPOMinutesPage />} />
        <Route path="/department/:dept" element={<DepartmentResponsePage />} />
        <Route path="/department/:dept/minutes" element={<DepartmentMinutesPage />} />
        <Route path="/department/notifications" element={<DepartmentNotificationPage />} />
        <Route path="/collector" element={<CollectorIssuePage />} />
        <Route path="/collector/notifications" element={<CollectorNotificationPage />} />
        <Route path="/collector/minutes" element={<CollectorMinutesPage />} />
      </Routes>
    </Router>
  );
}

export default App;

