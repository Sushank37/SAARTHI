import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { ROLE_LIST, ROLE_IDS } from "../../data/roles";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Building2,
} from "lucide-react";
import "./LoginPage.css";

// Generate clean 5-character alphanumeric captcha
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

  // Form State — strictly blank, real login behavior
  const [selectedRoleId, setSelectedRoleId] = useState(ROLE_IDS.MP);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [loginError, setLoginError] = useState("");

  // Direct dashboard selector state
  const [directDashboardId, setDirectDashboardId] = useState(ROLE_IDS.MP);

  // If already authenticated, redirect to authorized dashboard
  if (isAuthenticated && roleConfig) {
    return <Navigate to={roleConfig.path} replace />;
  }

  // Refresh Captcha
  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
    setCaptchaError("");
  };

  // Submit standard login form
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setCaptchaError("");
    setLoginError("");

    if (!loginId.trim()) {
      setLoginError("Please enter your User ID / Official Email.");
      return;
    }

    if (!password) {
      setLoginError("Please enter your password.");
      return;
    }

    // Verify Captcha (case-insensitive check)
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError("Invalid Captcha code! Please enter the new code shown.");
      setCaptchaCode(generateCaptcha());
      setCaptchaInput("");
      return;
    }

    const targetRole = ROLE_LIST.find((r) => r.id === selectedRoleId) || ROLE_LIST[0];
    const success = login(selectedRoleId);
    if (success) {
      navigate(targetRole.path || "/");
    }
  };

  // Direct access to selected dashboard
  const handleDirectAccess = (roleId) => {
    const targetRole = ROLE_LIST.find((r) => r.id === roleId);
    if (!targetRole) return;
    const success = login(roleId);
    if (success) {
      navigate(targetRole.path || "/");
    }
  };

  const currentRole = ROLE_LIST.find((r) => r.id === selectedRoleId) || ROLE_LIST[0];

  return (
    <div className="gov-screen-container">
      {/* 1. Indian National Tricolor Top Ribbon */}
      <div className="gov-top-tricolor" />

      {/* 2. Official Government Header */}
      <header className="gov-header-bar">
        <div className="gov-header-inner">
          <div className="gov-emblem-unit">
            {/* National Emblem SVG */}
            <svg
              viewBox="0 0 100 130"
              className="gov-ashoka-svg"
              aria-label="National Emblem of India"
            >
              <circle cx="50" cy="50" r="46" fill="#0f172a" opacity="0.04" />
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

            <div className="gov-titles">
              <span className="gov-hi">सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय</span>
              <span className="gov-en">Ministry of Statistics and Programme Implementation</span>
              <span className="gov-in">Government of India · भारत सरकार</span>
            </div>
          </div>

          <div className="gov-portal-badge">
            <div className="portal-name-block">
              <span className="portal-main-name">eSAKSHI</span>
              <span className="portal-sub-name">MPLADS Portal</span>
            </div>
            <div className="portal-nic-pill">
              <ShieldCheck size={13} />
              <span>NIC Verified</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Centered Login Section (Strictly Fit to Screen) */}
      <main className="gov-main-viewport">
        <div className="gov-card">
          {/* Card Top Title */}
          <div className="gov-card-top">
            <div className="gov-lock-icon">
              <Lock size={18} />
            </div>
            <h1 className="gov-title">Login</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="gov-form">
            {/* Role Dropdown */}
            <div className="gov-field">
              <label className="gov-label" htmlFor="role-select">
                Select Role / Stakeholder Designation <span className="gov-req">*</span>
              </label>
              <select
                id="role-select"
                className="gov-select"
                value={selectedRoleId}
                onChange={(e) => {
                  setSelectedRoleId(e.target.value);
                  setErrorMessage("");
                }}
              >
                {ROLE_LIST.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.icon} {role.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Login ID / Username */}
            <div className="gov-field">
              <label className="gov-label" htmlFor="user-id">
                User ID / Official Email <span className="gov-req">*</span>
              </label>
              <div className="gov-input-wrap">
                <User size={15} className="gov-icon-left" />
                <input
                  id="user-id"
                  type="text"
                  className="gov-input"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Enter NIC / Parichay User ID or Email"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="gov-field">
              <div className="gov-label-flex">
                <label className="gov-label" htmlFor="user-pwd">
                  Password <span className="gov-req">*</span>
                </label>
                <button
                  type="button"
                  className="gov-link-btn"
                  onClick={() => alert("Please contact the District Nodal Officer or NIC Helpdesk at 1800-11-eSAKSHI for password recovery.")}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="gov-input-wrap">
                <Lock size={15} className="gov-icon-left" />
                <input
                  id="user-pwd"
                  type={showPassword ? "text" : "password"}
                  className="gov-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="gov-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Captcha */}
            <div className="gov-field">
              <label className="gov-label" htmlFor="captcha-box">
                Security Captcha <span className="gov-req">*</span>
              </label>
              <div className="gov-captcha-box">
                <div className="gov-captcha-render" title="Captcha Image">
                  <span className="gov-captcha-txt">{captchaCode}</span>
                  <div className="gov-captcha-hatch" />
                </div>
                <button
                  type="button"
                  className="gov-btn-reload"
                  onClick={handleRefreshCaptcha}
                  title="Reload Captcha"
                >
                  <RefreshCw size={14} />
                </button>
                <input
                  id="captcha-box"
                  type="text"
                  className={`gov-input gov-captcha-in ${captchaError ? "gov-input-error" : ""}`}
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    setCaptchaError("");
                  }}
                  placeholder="Enter captcha"
                  maxLength={6}
                  required
                />
              </div>
              {captchaError && (
                <div className="gov-captcha-error-alert">
                  <AlertCircle size={13} />
                  <span>{captchaError}</span>
                </div>
              )}
            </div>

            {/* General / Login Error Message */}
            {loginError && (
              <div className="gov-alert">
                <AlertCircle size={14} />
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="gov-btn-submit">
              <span>Sign In to Portal</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* 4. Direct Option to Select and Go to Dashboard */}
          <div className="gov-direct-nav-panel">
            <div className="gov-direct-header">
              <span className="gov-direct-tag">DIRECT ACCESS</span>
              <span className="gov-direct-desc">Select role and go to dashboard:</span>
            </div>
            <div className="gov-direct-controls">
              <select
                className="gov-direct-select"
                value={directDashboardId}
                onChange={(e) => setDirectDashboardId(e.target.value)}
                aria-label="Direct Dashboard Navigation"
              >
                {ROLE_LIST.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.icon} {role.displayName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="gov-btn-direct"
                onClick={() => handleDirectAccess(directDashboardId)}
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Official Government Bottom Footer (Slim & High-Contrast) */}
      <footer className="gov-bottom-footer">
        <div className="gov-footer-inner">
          <div className="gov-footer-left">
            <span className="gov-footer-mospi">
              Ministry of Statistics and Programme Implementation (MoSPI) · Government of India
            </span>
            <span className="gov-footer-addr">
              Sardar Patel Bhawan, Sansad Marg, New Delhi · Helpdesk: 1800-11-eSAKSHI
            </span>
          </div>
          <div className="gov-footer-right">
            <div className="gov-footer-nav">
              <a href="#hyperlink" onClick={(e) => e.preventDefault()}>Hyperlink Policy</a>
              <span>·</span>
              <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <span>·</span>
              <a href="#terms" onClick={(e) => e.preventDefault()}>Terms & Conditions</a>
            </div>
            <div className="gov-footer-nic">
              <Building2 size={13} />
              <span>National Informatics Centre (NIC)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
