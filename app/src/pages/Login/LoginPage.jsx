import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { ROLE_LIST, ROLE_IDS } from "../../data/roles";
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  User,
  ExternalLink,
  HelpCircle,
  Award,
  CheckCircle2,
} from "lucide-react";
import "./LoginPage.css";

export default function LoginPage() {
  const { isAuthenticated, roleConfig, login } = useAuth();
  const navigate = useNavigate();

  // Default to Member of Parliament
  const [selectedRoleId, setSelectedRoleId] = useState(ROLE_IDS.MP);

  // If already authenticated, redirect directly to role dashboard
  if (isAuthenticated && roleConfig) {
    return <Navigate to={roleConfig.path} replace />;
  }

  const selectedRole = ROLE_LIST.find((r) => r.id === selectedRoleId) || ROLE_LIST[0];

  const handleLogin = (e) => {
    e.preventDefault();
    if (!selectedRoleId) return;

    const success = login(selectedRoleId);
    if (success) {
      navigate(selectedRole.path || "/");
    }
  };

  return (
    <div className="sih-signin-viewport">
      {/* 1. Official Government Top Header Bar (Matching SIH Portal Layout) */}
      <header className="sih-navbar-header">
        <div className="sih-header-top">
          {/* Official Logos Row (Left) */}
          <div className="sih-logos-row">
            {/* Government of India / MoSPI Logo */}
            <div className="sih-emblem-unit">
              <svg viewBox="0 0 100 130" className="sih-emblem-svg" aria-label="National Emblem of India">
                <circle cx="50" cy="50" r="46" fill="#1e3a8a" opacity="0.08" />
                <path
                  d="M50 15 C40 15 32 25 32 38 C32 46 37 53 44 57 C41 62 38 68 38 78 L62 78 C62 68 59 62 56 57 C63 53 68 46 68 38 C68 25 60 15 50 15 Z"
                  fill="currentColor"
                />
                <rect x="25" y="80" width="50" height="8" rx="2" fill="currentColor" />
                <circle cx="50" cy="94" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="50" cy="94" r="2" fill="currentColor" />
                <rect x="20" y="104" width="60" height="6" rx="2" fill="currentColor" />
                <text x="50" y="122" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor">
                  सत्यमेव जयते
                </text>
              </svg>
              <div className="sih-ministry-text">
                <span className="sih-ministry-en">Ministry of Statistics & Programme Implementation</span>
                <span className="sih-ministry-hi">Government of India · MoSPI</span>
              </div>
            </div>

            {/* eSAKSHI MPLADS Portal Badge */}
            <div className="sih-partner-logo">
              <span className="partner-badge">eSAKSHI</span>
              <span className="partner-text">MPLADS Portal</span>
            </div>

            {/* Smart India Hackathon Tag */}
            <div className="sih-event-logo">
              <span className="sih-event-tag">SIH 2026</span>
              <span className="text-xs font-bold text-slate-700">SAARTHI Prototype</span>
            </div>
          </div>

          {/* Header Action Buttons (Right, matching SIH buttons) */}
          <div className="sih-header-actions">
            <button
              type="button"
              className="btn-mic-alumni"
              onClick={() => alert("MPLADS Guidelines 2023: Standard annual allocation of ₹ 5.00 Cr per Lok Sabha / Rajya Sabha MP for local capital asset development.")}
            >
              Guidelines
            </button>
            <div className="btn-sih-login-pill">
              <div className="login-pill-avatar">
                <User size={13} />
              </div>
              <span>Portal Login</span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Links Bar (HOME | GUIDELINES | etc.) */}
        <nav className="sih-subnav-strip" aria-label="Portal Navigation">
          <div className="sih-subnav-inner">
            <span className="sih-nav-item active">HOME</span>
            <span className="sih-nav-item">ABOUT SAARTHI</span>
            <span className="sih-nav-item">MPLADS GUIDELINES</span>
            <span className="sih-nav-item">5 ROLE PORTALS</span>
            <span className="sih-nav-item">MASTER REPOSITORY (102,703 WORKS)</span>
            <span className="sih-nav-item">FAQS</span>
            <span className="sih-nav-item">CONTACT US</span>
          </div>
        </nav>
      </header>

      {/* 2. Main Body with Honeycomb Background & Centered Form Card */}
      <main className="sih-main-content">
        {/* Prominent Red Announcement Heading (matching SIH bold red title) */}
        <h1 className="sih-announcement-title">
          eSAKSHI PROTOTYPE ACCESS IS NOW OPEN
        </h1>
        <p className="sih-announcement-subtitle">
          Select your authorized stakeholder persona to access role-governed intelligence across the 102,703 canonical MPLADS works dataset.
        </p>

        {/* Centered Sign-In Card (Matching SIH Card Layout) */}
        <div className="sih-signin-card">
          <form onSubmit={handleLogin}>
            {/* Quick 5-Role Segmented Switcher */}
            <div className="sih-form-group">
              <span className="sih-role-chips-label">Quick Select Persona:</span>
              <div className="sih-role-chips-grid">
                {ROLE_LIST.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={`sih-chip-btn ${selectedRoleId === role.id ? "active" : ""}`}
                    onClick={() => setSelectedRoleId(role.id)}
                    title={role.displayName}
                  >
                    {role.icon} {role.shortName || role.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Stakeholder Role Dropdown (Matching SIH select dropdown) */}
            <div className="sih-form-group mt-2">
              <label className="sih-form-label" htmlFor="role-select-dropdown">
                Select Stakeholder Persona *
              </label>
              <select
                id="role-select-dropdown"
                className="sih-form-select"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                {ROLE_LIST.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.displayName} ({role.path})
                  </option>
                ))}
              </select>
            </div>

            {/* Persona Authority & Scope Readout Box */}
            <div className="sih-role-summary-box mt-3">
              <div className="summary-title-line">
                <span className="summary-role-name">
                  <span>{selectedRole.icon}</span>
                  <span>{selectedRole.displayName}</span>
                </span>
                <span className="summary-role-path">{selectedRole.path}</span>
              </div>
              <p className="summary-scope-desc">{selectedRole.scope}</p>
              <div className="summary-truth-pill">
                <ShieldCheck size={12} />
                <span>Single Source of Truth: 102,703 Master Records</span>
              </div>
            </div>

            {/* Green Government Submit Button (Directly like SIH green button) */}
            <div className="mt-4">
              <button
                type="submit"
                className="btn-sih-submit"
                id="btn-sih-submit"
              >
                <span>Submit</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Card Sub-links */}
            <div className="sih-card-links mt-3">
              <span className="sih-demo-caption">
                <Lock size={12} />
                <span>Evaluation prototype: Zero passwords required. Internal role routing active.</span>
              </span>
            </div>
          </form>
        </div>
      </main>

      {/* 3. Official Deep Blue Bottom Footer (Matching SIH footer) */}
      <footer className="sih-deep-blue-footer">
        <div className="sih-footer-inner">
          <div>
            © 2026 SAARTHI · Ministry of Statistics and Programme Implementation (MoSPI) · Government of India
          </div>
          <div className="sih-footer-links">
            <span className="sih-footer-link">Privacy Policy</span>
            <span className="sih-footer-link">Terms of Use</span>
            <span className="sih-footer-link">Smart India Hackathon (SIH 2026)</span>
            <span className="sih-footer-link">National Informatics Centre</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
