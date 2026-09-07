import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Header from "./Header";
import Sidebar from "./Sidebar";
import WorkDetailDrawer from "./WorkDetailDrawer";
import { API_BASE } from "../constants";

export function RouteConsumer({ Component, extraProps = {} }) {
  const context = useOutletContext();
  return <Component {...context} {...extraProps} />;
}

export default function SharedLayout() {
  const { role, roleConfig, logout } = useAuth();
  const navigate = useNavigate();

  const [house, setHouse] = useState("Lok Sabha");
  const [theme, setTheme] = useState("official"); // "official" (light) or "dark"
  const [fontSize, setFontSize] = useState(15);
  const [summary, setSummary] = useState(null);
  const [selectedWork, setSelectedWork] = useState(null);
  const [backendStatus, setBackendStatus] = useState("connecting"); // "connected" | "connecting" | "offline"

  const toggleTheme = () => {
    setTheme((prev) => (prev === "official" ? "dark" : "official"));
  };

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

  return (
    <div
      className={`gov-app-shell theme-${theme}`}
      data-theme={theme}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Shared Government Header */}
      <Header
        house={house}
        setHouse={setHouse}
        theme={theme}
        toggleTheme={toggleTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        backendStatus={backendStatus}
        onReconnect={loadSummary}
        totalWorks={summary?.total_works}
        roleConfig={roleConfig}
        onLogout={handleLogout}
      />

      {/* Main Two-Column Layout (Sidebar + Content) */}
      <div className="gov-layout-body">
        <Sidebar summary={summary} roleConfig={roleConfig} />

        <main className="gov-content-viewport">
          {/* Stakeholder Role Advisory Strip */}
          <div className={`stakeholder-context-strip role-${(role || "mospi").toLowerCase()}`}>
            <span className="strip-icon">{roleConfig?.icon || "🏛️"}</span>
            <span className="strip-text">
              <strong>{roleConfig?.displayName || "Authenticated"}:</strong> {roleConfig?.scope || "National macro surveillance active."}
            </span>
            <button
              type="button"
              className="strip-switch-hint-btn"
              onClick={handleLogout}
              title="Click to switch persona or return to login"
            >
              Switch Persona
            </button>
          </div>

          {/* Child Route Viewport */}
          <Outlet
            context={{
              summary,
              house,
              selectedWork,
              setSelectedWork,
              onSelectWork: setSelectedWork,
            }}
          />

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
                  Designed & Developed for Smart India Hackathon (SIH 2026) · Organization: MoSPI ·
                  Department: Data Informatics & Innovation Division (DIID).
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
        onClose={() => setSelectedWork(null)}
      />
    </div>
  );
}
