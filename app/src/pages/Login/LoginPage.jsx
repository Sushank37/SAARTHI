import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { ROLE_LIST, ROLE_IDS } from "../../data/roles";
import {
  Shield,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  ExternalLink,
} from "lucide-react";
import "./LoginPage.css";

// Demo credentials helper
const DEMO_CREDENTIALS = {
  [ROLE_IDS.MP]: {
    loginId: "mp.loksabha@sansad.nic.in",
    password: "••••••••",
    name: "Hon'ble MP",
    label: "Hon'ble Member of Parliament",
  },
  [ROLE_IDS.DISTRICT_AUTHORITY]: {
    loginId: "dc.collectorate@nic.in",
    password: "••••••••",
    name: "District Collector",
    label: "District Authority (NDA / Collector)",
  },
  [ROLE_IDS.IMPLEMENTING_AGENCY]: {
    loginId: "exec.engineer@pwd.gov.in",
    password: "••••••••",
    name: "Implementing Agency",
    label: "Implementing Agency (IA / Vendor)",
  },
  [ROLE_IDS.MOSPI]: {
    loginId: "central.admin@mospi.gov.in",
    password: "••••••••",
    name: "Central Admin",
    label: "MoSPI Central Nodal Agency",
  },
  [ROLE_IDS.CITIZEN]: {
    loginId: "citizen.socialaudit@gov.in",
    password: "••••••••",
    name: "Citizen",
    label: "Citizen Transparency Audit",
  },
};

// Generate random 5-character alphanumeric captcha
const generateCaptcha = () => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function LoginPage() {
  const { isAuthenticated, roleConfig, login } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [selectedRoleId, setSelectedRoleId] = useState(ROLE_IDS.MP);
  const [loginId, setLoginId] = useState(DEMO_CREDENTIALS[ROLE_IDS.MP].loginId);
  const [password, setPassword] = useState("SecurityPass@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // If already authenticated, redirect to authorized dashboard
  if (isAuthenticated && roleConfig) {
    return <Navigate to={roleConfig.path} replace />;
  }

  // Handle role selection change from dropdown
  const handleRoleChange = (roleId) => {
    setSelectedRoleId(roleId);
    if (DEMO_CREDENTIALS[roleId]) {
      setLoginId(DEMO_CREDENTIALS[roleId].loginId);
    }
    setCaptchaError("");
  };

  // Refresh Captcha
  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
    setCaptchaError("");
  };

  // One-click Demo Login for a specific dashboard
  const handleQuickDemoLogin = (roleId) => {
    const targetRole = ROLE_LIST.find((r) => r.id === roleId);
    if (!targetRole) return;

    const creds = DEMO_CREDENTIALS[roleId] || DEMO_CREDENTIALS[ROLE_IDS.MP];
    setSelectedRoleId(roleId);
    setLoginId(creds.loginId);
    setPassword("SecurityPass@2026");
    setCaptchaInput(captchaCode);

    const success = login(roleId);
    if (success) {
      navigate(targetRole.path || "/");
    }
  };

  // Submit standard login form
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setCaptchaError("");

    if (!loginId.trim()) {
      setCaptchaError("Please enter your Login ID / User ID.");
      return;
    }

    if (!password) {
      setCaptchaError("Please enter your password.");
      return;
    }

    // Verify Captcha (case-insensitive for convenience)
    if (
      captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase() &&
      captchaInput.trim() !== "DEMO"
    ) {
      setCaptchaError("Security Captcha does not match. Please try again.");
      handleRefreshCaptcha();
      return;
    }

    const targetRole = ROLE_LIST.find((r) => r.id === selectedRoleId) || ROLE_LIST[0];
    const success = login(selectedRoleId);
    if (success) {
      navigate(targetRole.path || "/");
    }
  };

  const currentRole = ROLE_LIST.find((r) => r.id === selectedRoleId) || ROLE_LIST[0];

  return (
    <div className="gov-login-viewport">
      {/* Tricolor National Accent Header Stripe */}
      <div className="gov-tricolor-stripe" />

      {/* Official Government Header */}
      <header className="gov-official-header">
        <div className="gov-header-container">
          <div className="gov-emblem-section">
            {/* National Emblem SVG */}
            <svg
              viewBox="0 0 100 130"
              className="gov-emblem-svg"
              aria-label="National Emblem of India"
            >
              <circle cx="50" cy="50" r="46" fill="#0f172a" opacity="0.05" />
              <path
                d="M50 15 C40 15 32 25 32 38 C32 46 37 53 44 57 C41 62 38 68 38 78 L62 78 C62 68 59 62 56 57 C63 53 68 46 68 38 C68 25 60 15 50 15 Z"
                fill="currentColor"
              />
              <rect x="25" y="80" width="50" height="8" rx="2" fill="currentColor" />
              <circle cx="50" cy="94" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="94" r="2" fill="currentColor" />
              <rect x="20" y="104" width="60" height="6" rx="2" fill="currentColor" />
              <text
                x="50"
                y="122"
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="currentColor"
              >
                सत्यमेव जयते
              </text>
            </svg>

            <div className="gov-title-meta">
              <span className="gov-hindi-title">
                सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय
              </span>
              <span className="gov-eng-title">
                Ministry of Statistics & Programme Implementation
              </span>
              <span className="gov-portal-tag">
                Government of India · भारत सरकार
              </span>
            </div>
          </div>

          <div className="gov-header-portal-brand">
            <div className="esakshi-badge-unit">
              <span className="esakshi-name">eSAKSHI</span>
              <span className="esakshi-sub">MPLADS Unified Portal</span>
            </div>
            <div className="gov-nic-auth-tag">
              <ShieldCheck size={14} className="text-emerald-700" />
              <span>Secured Gov Access</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="gov-login-main">
        <div className="gov-login-card-wrapper">
          {/* Main Card */}
          <div className="gov-login-card">
            {/* Card Header */}
            <div className="gov-card-header">
              <div className="gov-card-icon-circle">
                <Lock size={20} />
              </div>
              <h1 className="gov-card-title">Stakeholder Portal Login</h1>
              <p className="gov-card-subtitle">
                Members of Parliament Local Area Development Scheme (MPLADS)
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleFormSubmit} className="gov-card-form">
              {/* 1. Stakeholder Role Dropdown */}
              <div className="gov-form-group">
                <label className="gov-form-label" htmlFor="role-select">
                  Select Stakeholder Role <span className="text-red-500">*</span>
                </label>
                <div className="gov-select-wrapper">
                  <select
                    id="role-select"
                    className="gov-form-select"
                    value={selectedRoleId}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  >
                    {ROLE_LIST.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.icon} {role.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="gov-role-hint">
                  <span>Scope: {currentRole.scope}</span>
                </div>
              </div>

              {/* 2. Login ID / User ID */}
              <div className="gov-form-group">
                <label className="gov-form-label" htmlFor="login-id">
                  Official User ID / Email <span className="text-red-500">*</span>
                </label>
                <div className="gov-input-with-icon">
                  <User size={16} className="gov-field-icon" />
                  <input
                    id="login-id"
                    type="text"
                    className="gov-form-input"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter NIC / Parichay User ID or Email"
                    required
                  />
                </div>
              </div>

              {/* 3. Password */}
              <div className="gov-form-group">
                <div className="gov-label-row">
                  <label className="gov-form-label" htmlFor="login-password">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Please contact the District Nodal Officer or NIC eSAKSHI Helpdesk at 1800-11-eSAKSHI for password assistance.");
                    }}
                    className="gov-forgot-link"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="gov-input-with-icon">
                  <Lock size={16} className="gov-field-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="gov-form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    required
                  />
                  <button
                    type="button"
                    className="gov-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* 4. Captcha Verification */}
              <div className="gov-form-group">
                <label className="gov-form-label" htmlFor="captcha-input">
                  Security Captcha <span className="text-red-500">*</span>
                </label>
                <div className="gov-captcha-row">
                  <div className="gov-captcha-display" aria-label="Security Captcha">
                    <span className="gov-captcha-code">{captchaCode}</span>
                    <div className="gov-captcha-lines" />
                  </div>
                  <button
                    type="button"
                    className="gov-captcha-refresh-btn"
                    onClick={handleRefreshCaptcha}
                    title="Refresh Captcha Code"
                  >
                    <RefreshCw size={15} />
                  </button>
                  <input
                    id="captcha-input"
                    type="text"
                    className="gov-form-input gov-captcha-input"
                    value={captchaInput}
                    onChange={(e) => {
                      setCaptchaInput(e.target.value);
                      setCaptchaError("");
                    }}
                    placeholder="Enter code"
                    maxLength={6}
                    required
                  />
                </div>
                {captchaError && (
                  <div className="gov-form-error">
                    <AlertCircle size={13} />
                    <span>{captchaError}</span>
                  </div>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="gov-checkbox-row">
                <label className="gov-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep session active on this government terminal</span>
                </label>
              </div>

              {/* Sign In Button */}
              <div className="gov-submit-wrapper">
                <button type="submit" className="gov-btn-primary">
                  <span>Sign In to {currentRole.shortName || "Portal"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="gov-card-divider">
              <span>OR EVALUATE DEMO DASHBOARDS</span>
            </div>

            {/* Quick Demo Dashboard Logins */}
            <div className="gov-demo-section">
              <p className="gov-demo-label">
                One-Click Role Access (Instant Dashboard Redirect):
              </p>
              <div className="gov-demo-grid">
                {ROLE_LIST.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={`gov-demo-chip ${selectedRoleId === role.id ? "active" : ""}`}
                    onClick={() => handleQuickDemoLogin(role.id)}
                    title={`Open ${role.displayName}`}
                  >
                    <span className="gov-chip-icon">{role.icon}</span>
                    <span className="gov-chip-text">{role.shortName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Security Footer */}
            <div className="gov-card-security-note">
              <Shield size={13} className="text-slate-500" />
              <span>
                Authorized Government of India portal. Unauthorized access is punishable under IT Act 2000.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Official MoSPI / NIC Footer */}
      <footer className="gov-official-footer">
        <div className="gov-footer-content">
          <div className="gov-footer-top">
            <div className="gov-footer-dept">
              <strong>Ministry of Statistics and Programme Implementation (MoSPI)</strong>
              <span>Government of India · Sardar Patel Bhawan, Sansad Marg, New Delhi</span>
            </div>
            <div className="gov-footer-nic-badge">
              <Building2 size={14} />
              <span>National Informatics Centre (NIC)</span>
            </div>
          </div>
          <div className="gov-footer-bottom">
            <div className="gov-footer-links">
              <a href="#hyperlink" onClick={(e) => e.preventDefault()}>Hyperlink Policy</a>
              <span className="sep">|</span>
              <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <span className="sep">|</span>
              <a href="#terms" onClick={(e) => e.preventDefault()}>Terms & Conditions</a>
              <span className="sep">|</span>
              <a href="#security" onClick={(e) => e.preventDefault()}>Security Guidelines</a>
              <span className="sep">|</span>
              <a href="#helpdesk" onClick={(e) => e.preventDefault()}>Helpdesk: 1800-11-eSAKSHI</a>
            </div>
            <div className="gov-footer-copyright">
              © {new Date().getFullYear()} eSAKSHI Portal · Government of India. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
