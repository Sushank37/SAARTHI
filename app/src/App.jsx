import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import WorkDetailDrawer from "./components/WorkDetailDrawer";
import PreSanctionValidator from "./components/PreSanctionValidator";
import GeoPhotoVerifier from "./components/GeoPhotoVerifier";

import Dashboard from "./pages/Dashboard";
import RiskIntelligence from "./pages/RiskIntelligence";
import DuplicateIntelligence from "./pages/DuplicateIntelligence";
import ReviewQueue from "./pages/ReviewQueue";
import StateIntelligence from "./pages/StateIntelligence";
import WorkExplorer from "./pages/WorkExplorer";

import { API_BASE } from "./constants";
import "./App.css";

export default function App() {
  const [house, setHouse] = useState("Lok Sabha");
  const [role, setRole] = useState("mospi"); // "mospi" | "mp" | "collector" | "vendor"
  const [theme, setTheme] = useState("official"); // "official" (light) or "dark"
  const [fontSize, setFontSize] = useState(15);
  const [summary, setSummary] = useState(null);
  const [selectedWork, setSelectedWork] = useState(null);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "official" ? "dark" : "official"));
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/summary`)
      .then((res) => res.json())
      .then(setSummary)
      .catch((err) => console.error("Summary fetch error:", err));
  }, []);

  const roleBanners = {
    mospi: {
      icon: "🏛️",
      text: "Central Nodal Agency (MoSPI) Active: National macro surveillance, cross-state benchmarking, and fund audit mode enabled.",
    },
    mp: {
      icon: "🎖️",
      text: "Hon'ble MP Portal View Active: Constituency work recommendations and ₹5.00 Cr annual entitlement earmarking mode enabled.",
    },
    collector: {
      icon: "⚖️",
      text: "District Authority (NDA / Collector) Active: Pre-sanction feasibility check, duplicate work blocking, and milestone approval mode enabled.",
    },
    vendor: {
      icon: "👷",
      text: "Implementing Agency / Vendor Active: Milestone reporting, MB records, and GPS geo-tagged photo verification mode enabled.",
    },
  };

  return (
    <BrowserRouter>
      <div
        className={`gov-app-shell theme-${theme}`}
        data-theme={theme}
        style={{ fontSize: `${fontSize}px` }}
      >
        {/* Official MoSPI Header */}
        <Header
          house={house}
          setHouse={setHouse}
          role={role}
          setRole={setRole}
          theme={theme}
          toggleTheme={toggleTheme}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />

        {/* Main Two-Column Layout (Sidebar + Content) */}
        <div className="gov-layout-body">
          <Sidebar summary={summary} />

          <main className="gov-content-viewport">
            {/* Stakeholder Role Advisory Strip */}
            <div className={`stakeholder-context-strip role-${role}`}>
              <span className="strip-icon">{roleBanners[role]?.icon}</span>
              <span className="strip-text">{roleBanners[role]?.text}</span>
              <span className="strip-switch-hint">Switch personas anytime in the top bar</span>
            </div>

            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    summary={summary}
                    house={house}
                    onSelectWork={setSelectedWork}
                  />
                }
              />
              <Route
                path="/risk-cases"
                element={<RiskIntelligence onSelectWork={setSelectedWork} />}
              />
              <Route
                path="/duplicates"
                element={<DuplicateIntelligence onSelectWork={setSelectedWork} />}
              />
              <Route
                path="/review"
                element={<ReviewQueue onSelectWork={setSelectedWork} />}
              />
              <Route path="/states" element={<StateIntelligence />} />
              <Route
                path="/works"
                element={<WorkExplorer onSelectWork={setSelectedWork} />}
              />
              <Route
                path="/pre-sanction"
                element={<PreSanctionValidator onSelectWork={setSelectedWork} />}
              />
              <Route path="/photo-verifier" element={<GeoPhotoVerifier />} />
            </Routes>

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
    </BrowserRouter>
  );
}