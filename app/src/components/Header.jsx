import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ExternalLink, LogOut } from "lucide-react";
import { useAuth } from "../context/useAuth";
import LanguageSelector from "./LanguageSelector";

export default function Header({
  house,
  setHouse,
  role = "mospi",
  setRole,
  fontSize,
  setFontSize,
  backendStatus = "connected",
  onReconnect,
  totalWorks,
  roleConfig,
  onLogout,
}) {
  const navigate = useNavigate();
  const { logout, login, role: authRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else if (logout) {
      logout();
      navigate("/login");
    } else {
      localStorage.removeItem("mplads_token");
      localStorage.removeItem("mplads_role");
      navigate("/login");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/works?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="gov-header-compact">
      <div className="header-main-row">
        {/* Left: Emblem + Titles */}
        <div className="header-brand-group">
          <div className="ashoka-emblem-small">
            <svg viewBox="0 0 100 130" className="ashoka-svg" aria-label="National Emblem">
              <circle cx="50" cy="50" r="46" fill="#1e3a8a" opacity="0.08" />
              <path
                d="M50 15 C40 15 32 25 32 38 C32 46 37 53 44 57 C41 62 38 68 38 78 L62 78 C62 68 59 62 56 57 C63 53 68 46 68 38 C68 25 60 15 50 15 Z"
                fill="currentColor"
              />
              <circle cx="50" cy="35" r="7" fill="#0088ff" opacity="0.4" />
              <rect x="25" y="80" width="50" height="8" rx="2" fill="currentColor" />
              <circle cx="50" cy="94" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="94" r="2" fill="currentColor" />
              <rect x="20" y="104" width="60" height="6" rx="2" fill="currentColor" />
              <text x="50" y="122" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor">
                सत्यमेव जयते
              </text>
            </svg>
          </div>

          <div className="header-title-block">
            <div className="brand-title-line">
              <span className="ministry-title">MoSPI · Government of India</span>
              <span className="saarthi-pill">AUDIT EXTENSION</span>
            </div>
            <div className="portal-title">MPLADS eSAKSHI Work & Fund Verification System</div>
          </div>
        </div>

        {/* Center: House Switcher & Search */}
        <div className="header-center-group">
          <div className="segmented-house-toggle">
            <button
              className={`house-btn ${house === "Lok Sabha" ? "active" : ""}`}
              onClick={() => setHouse("Lok Sabha")}
            >
              18th / 17th Lok Sabha
            </button>
            <button
              className={`house-btn ${house === "Rajya Sabha" ? "active" : ""}`}
              onClick={() => setHouse("Rajya Sabha")}
            >
              Rajya Sabha
            </button>
          </div>

          <form className="compact-search-form" onSubmit={handleSearch}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Work ID, MP, Constituency..."
            />
          </form>
        </div>

        {/* Right: Actions, Stakeholder Role & Status */}
        <div className="header-right-group">
          {roleConfig ? (
            <div className="header-active-persona" title={`Active Persona: ${roleConfig.displayName}`}>
              <span className="persona-icon">{roleConfig.icon}</span>
              <span className="persona-name">{roleConfig.shortName}</span>
            </div>
          ) : (
            setRole && (
              <div className="stakeholder-role-dropdown" title="Simulate Stakeholder Persona">
                <span className="role-label">Persona:</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="role-select"
                >
                  <option value="mospi">🏛️ MoSPI Admin</option>
                  <option value="mp">🎖️ Hon'ble MP</option>
                  <option value="collector">⚖️ Collector (NDA)</option>
                  <option value="vendor">👷 Vendor (IA)</option>
                </select>
              </div>
            )
          )}




          <div
            className={`live-status-tag ${
              backendStatus === "connected"
                ? "connected"
                : backendStatus === "connecting"
                ? "connecting"
                : "offline"
            }`}
            title={
              backendStatus === "connected"
                ? `Connected to FastAPI Backend · ${
                    totalWorks ? totalWorks.toLocaleString("en-IN") : "102,703"
                  } works loaded`
                : "Backend Disconnected. Click to retry connection."
            }
            onClick={backendStatus !== "connected" ? onReconnect : undefined}
            style={{ cursor: backendStatus !== "connected" ? "pointer" : "default" }}
          >
            <span
              className={`live-dot ${
                backendStatus === "connected"
                  ? "green"
                  : backendStatus === "connecting"
                  ? "yellow"
                  : "red"
              }`}
            />
            <span>
              {backendStatus === "connected"
                ? `Live: ${
                    totalWorks
                      ? totalWorks.toLocaleString("en-IN")
                      : "102,703"
                  } Works`
                : backendStatus === "connecting"
                ? "Connecting..."
                : "Offline (Retry)"}
            </span>
          </div>

          <LanguageSelector />

          {authRole !== "CITIZEN" ? (
            <button
              type="button"
              className="external-portal-btn"
              style={{ background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0", fontWeight: "700" }}
              onClick={() => {
                if (login) login("CITIZEN");
                navigate("/citizen");
              }}
              title="Switch to Public / Citizen Oversight Portal"
            >
              <span>👥 Public Portal</span>
            </button>
          ) : (
            <button
              type="button"
              className="external-portal-btn"
              style={{ background: "#eff6ff", color: "#1e40af", borderColor: "#bfdbfe", fontWeight: "700" }}
              onClick={() => {
                if (login) login("MOSPI");
                navigate("/mospi");
              }}
              title="Switch to Central MoSPI Admin Portal"
            >
              <span>🏛️ Admin Portal</span>
            </button>
          )}

          <a
            href="https://mplads.mospi.gov.in/digigov/dashboard.html"
            target="_blank"
            rel="noreferrer"
            className="external-portal-btn"
            title="Open official eSAKSHI portal"
          >
            <span>eSAKSHI</span>
            <ExternalLink size={12} />
          </a>

          <button
            type="button"
            className="header-logout-btn"
            onClick={handleLogout}
            title="Sign out of current session"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Tricolor line */}
      <div className="compact-tricolor-line" />
    </header>
  );
}
