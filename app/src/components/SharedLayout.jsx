import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import Header from "./Header";
import Sidebar from "./Sidebar";
import WorkDetailDrawer from "./WorkDetailDrawer";
import RajyaSabhaNotice from "./RajyaSabhaNotice";
import { API_BASE } from "../constants";

export function RouteConsumer({ Component, extraProps = {} }) {
  const context = useOutletContext();
  return <Component {...context} {...extraProps} />;
}

export default function SharedLayout() {
  const { role, roleConfig, logout } = useAuth();
  const { currentLang, t } = useLanguage();
  const navigate = useNavigate();

  const [house, setHouse] = useState("Lok Sabha");
  const [fontSize, setFontSize] = useState(15);
  const [summary, setSummary] = useState(null);
  const [selectedWork, setSelectedWork] = useState(null);
  const [backendStatus, setBackendStatus] = useState("connecting"); // "connected" | "connecting" | "offline"

  const loadSummary = async () => {
    try {
      setBackendStatus((prev) => (prev === "connected" ? "connected" : "connecting"));
      const res = await fetch(`${API_BASE}/api/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data);
      setBackendStatus("connected");
    } catch (err) {
      console.error("Summary fetch error:", err);
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    loadSummary();
    const interval = setInterval(loadSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSelectWork = (work, section = null) => {
    if (!work) {
      setSelectedWork(null);
      return;
    }
    const initialSection = section || (typeof work === "object" ? work.__initialSection : null) || "all";
    const currentAuthority = (typeof work === "object" && work.__authority)
      ? String(work.__authority).toUpperCase()
      : (roleConfig?.id?.toUpperCase() || role?.toUpperCase() || "DISTRICT_AUTHORITY");

    if (typeof work === "object") {
      setSelectedWork({ ...work, __initialSection: initialSection, __authority: currentAuthority });
    } else {
      setSelectedWork({ WORK_ID: String(work).replace(/\.0$/, ""), __initialSection: initialSection, __authority: currentAuthority });
    }
  };

  return (
    <div
      className="gov-app-shell theme-official"
      data-theme="official"
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Shared Government Header */}
      <Header
        house={house}
        setHouse={setHouse}
        fontSize={fontSize}
        setFontSize={setFontSize}
        backendStatus={backendStatus}
        onReconnect={loadSummary}
        totalWorks={summary?.total_works}
        roleConfig={roleConfig}
        onLogout={handleLogout}
        onSelectWork={handleSelectWork}
      />

      {/* Main Layout (Sidebar only shown for Lok Sabha) */}
      <div className={`gov-layout-body ${house === "Rajya Sabha" ? "gov-layout-body-rs" : ""}`}>
        {house !== "Rajya Sabha" && (
          <Sidebar summary={summary} roleConfig={roleConfig} onLogout={handleLogout} />
        )}

        <main className="gov-content-viewport">
          {/* If Rajya Sabha is selected, show the Phase 2 development / upcoming release notice */}
          {house === "Rajya Sabha" ? (
            <RajyaSabhaNotice onSwitchToLokSabha={() => setHouse("Lok Sabha")} />
          ) : (
            <Outlet
              context={{
                summary,
                house,
                selectedWork,
                setSelectedWork: handleSelectWork,
                onSelectWork: handleSelectWork,
              }}
            />
          )}

          {/* Official Government Footer */}
          <footer className="gov-official-footer">
            <div className="footer-tricolor-line" />
            <div className="footer-content">
              <div className="footer-left">
                <strong>
                  सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय | Ministry of Statistics and
                  Programme Implementation (MoSPI)
                </strong>
                <p>
                  eSAKSHI — Members of Parliament Local Area Development Scheme (MPLADS)
                  Surveillance & Anomaly Extension Layer.
                </p>
                <small>
                  Official Digital Portal · Ministry of Statistics & Programme Implementation (MoSPI) ·
                  Data Informatics & National Surveillance Division (DIID).
                </small>
              </div>
              <div className="footer-right">
                <div className="footer-badge">
                  <span>DIGITAL INDIA</span>
                </div>
                <div className="footer-badge nic">
                  <span>NATIONAL INFORMATICS CENTRE</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Work Inspection Dossier Drawer */}
      <WorkDetailDrawer
        work={selectedWork}
        initialSection={selectedWork?.__initialSection || "all"}
        onClose={() => setSelectedWork(null)}
      />
    </div>
  );
}
