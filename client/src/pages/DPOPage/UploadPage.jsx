// src/pages/UploadPage.jsx
import React, { useState } from "react";
import DPOHeader from "../../components/DPO/DPOHeader";
import DPOStepper from "../../components/DPO/UploadPage/DPOStepper";
import DPOUploadForm from "../../components/DPO/UploadPage/DPOUploadForm";
import DPOAssignIssues from "../../components/DPO/UploadPage/DPOAssignIssues";
import "./UploadPage.css";

function UploadPage() {
  const [step, setStep] = useState(1);

  const handleProcessComplete = () => {
    setStep(2); // just go to next step
  };

  return (
    <div className="uploadpage-container">
      <DPOHeader />

      <div className="uploadpage-content">
        <DPOStepper step={step} />

        {step === 1 && (
          <div className="upload-card">
            <DPOUploadForm onProcessed={handleProcessComplete} />
          </div>
        )}

        {step === 2 && (
          <div className="assign-card">
            <DPOAssignIssues /> {/* issues not needed */}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
