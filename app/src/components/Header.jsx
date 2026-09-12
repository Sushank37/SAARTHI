import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, ExternalLink, LogOut, Bell, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { ROLE_IDS } from "../data/roles";
import LanguageSelector from "./LanguageSelector";
import EarlyWarningCenter from "./EarlyWarningCenter";
import { API_BASE } from "../constants";

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
  onSelectWork,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, role: authRole, roleConfig: authRoleConfig } = useAuth() || {};
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAlertCenter, setShowAlertCenter] = useState(false);
  const [alertTotal, setAlertTotal] = useState(null);

  // Early alerts are strictly restricted to MP, DA, and MoSPI only
  const isEarlyAlertAuthorized = useMemo(() => {
    const activeId = roleConfig?.id || authRoleConfig?.id || authRole;
    if (activeId) {
      return (
        activeId === ROLE_IDS.MP ||
        activeId === ROLE_IDS.DISTRICT_AUTHORITY ||
        activeId === ROLE_IDS.MOSPI
      );
    }
    const path = location?.pathname || "";
    return path.startsWith("/mp") || path.startsWith("/da") || path.startsWith("/mospi");
  }, [roleConfig?.id, authRoleConfig?.id, authRole, location?.pathname]);

  useEffect(() => {
    if (!isEarlyAlertAuthorized) return;
    let isMounted = true;
    const loadAlertCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/alerts/early-warning?limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.total != null) {
            setAlertTotal(data.total);
          }
        }
      } catch (e) {
        // quiet fallback
      }
    };
    loadAlertCount();
    return () => {
      isMounted = false;
    };
  }, [isEarlyAlertAuthorized]);

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
              <span className="ministry-title">{t("MoSPI · Government of India")}</span>
              <span className="saarthi-pill">{t("AUDIT EXTENSION")}</span>
            </div>
            <div className="portal-title">{t("MPLADS eSAKSHI Work & Fund Verification System")}</div>
          </div>
        </div>

        {/* Center: House Switcher & Search */}
        <div className="header-center-group">
          <div className="segmented-house-toggle">
            <button
              className={`house-btn ${house === "Lok Sabha" ? "active" : ""}`}
              onClick={() => setHouse("Lok Sabha")}
            >
              {t("18th / 17th Lok Sabha")}
            </button>
            <button
              className={`house-btn ${house === "Rajya Sabha" ? "active" : ""}`}
              onClick={() => setHouse("Rajya Sabha")}
              title="Rajya Sabha (Council of States) — Whole-State Module in Active Development"
            >
              <span>{t("Rajya Sabha")}</span>
              <span className="house-upcoming-pill">Phase 2</span>
            </button>
          </div>

          <form className="compact-search-form" onSubmit={handleSearch}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search Work ID, MP, Constituency...")}
            />
          </form>
        </div>

        {/* Right: Actions, Stakeholder Role & Status */}
        <div className="header-right-group">
          {roleConfig ? (
            <div className="header-active-persona" title={`Active Persona: ${roleConfig.displayName}`}>
              <span className="persona-icon">{roleConfig.icon}</span>
              <span className="persona-name">{t(roleConfig.shortName)}</span>
            </div>
          ) : (
            setRole && (
              <div className="stakeholder-role-dropdown" title="Simulate Stakeholder Persona">
                <span className="role-label">{t("Persona:")}</span>
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



          {/* Authorities Early Warning Alert Trigger Button (MP, DA, MoSPI ONLY) */}
          {isEarlyAlertAuthorized && (
            <button
              type="button"
              className="header-early-alert-btn"
              onClick={() => setShowAlertCenter(true)}
              title="Early Warning Surveillance: Unusual Patterns, Delays, Cost Overruns, Duplicates, and Fund Misuse"
            >
              <span className="header-early-alert-pulse" />
              <Bell size={14} className="header-early-alert-icon" />
              <span>{t("Early Alerts")}</span>
              <span className="header-early-alert-badge">
                {alertTotal != null
                  ? (alertTotal >= 1000 ? `${(alertTotal / 1000).toFixed(1)}k` : alertTotal.toLocaleString("en-IN"))
                  : "..."}
              </span>
            </button>
          )}
          <LanguageSelector />

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
            <span>{t("Logout")}</span>
          </button>
        </div>
      </div>

      {/* Tricolor line */}
      <div className="compact-tricolor-line" />

      {/* Authorities Early Warning Alert Center (MP, DA, MoSPI ONLY) */}
      {isEarlyAlertAuthorized && (
        <EarlyWarningCenter
          isOpen={showAlertCenter}
          onClose={() => setShowAlertCenter(false)}
          onSelectWork={onSelectWork}
          roleConfig={roleConfig || authRoleConfig}
        />
      )}
    </header>
  );
}
