import React, { useEffect, useState } from "react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import CollectorHeader from "../../components/Collector/CollectorHeader";
import api from "../../api/axios";

import "./CollectorMinutesPage.css";

function CollectorMinutesPage() {
  const [minutes, setMinutes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/minutes")
      .then((res) => setMinutes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="collector-container">
      <CollectorHeader />

      <div className="content">
        <h1 className="page-title">Meeting Minutes</h1>

        {loading ? (
          <p className="loading-text">Loading minutes...</p>
        ) : minutes.length === 0 ? (
          <p className="no-minutes">No minutes uploaded yet</p>
        ) : (
          <div className="minutes-list">
            {minutes.map((m) => (
              <div key={m.id} className="minutes-card">
                <PictureAsPdfIcon className="pdf-icon" />

                <div className="minutes-info">
                  <h3>{m.title}</h3>
                  <p>{new Date(m.date).toDateString()}</p>
                </div>

                <div className="minutes-actions">
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>

                  <a href={m.file_url} download>
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectorMinutesPage;
