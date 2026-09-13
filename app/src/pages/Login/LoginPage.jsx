import { useState } from "react";
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
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  UserCheck,
  KeyRound,
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

// Major Indian States for Citizen Registration
const INDIAN_STATES = [
  "Telangana",
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Delhi (NCT)",
  "Gujarat",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Uttar Pradesh",
  "West Bengal",
];

export default function LoginPage() {
  const { isAuthenticated, roleConfig, login } = useAuth();
  const navigate = useNavigate();

  // Primary Persona Switcher: "OFFICIAL" (Govt officers) vs "CITIZEN" (Public)
  const [portalPersona, setPortalPersona] = useState("OFFICIAL");

  // Official Login Form State
  const [selectedOfficialRoleId, setSelectedOfficialRoleId] = useState(ROLE_IDS.MP);
  const [officialLoginId, setOfficialLoginId] = useState("");
  const [officialPassword, setOfficialPassword] = useState("");
  const [showOfficialPassword, setShowOfficialPassword] = useState(false);

  // Citizen Portal State: "LOGIN" (Registered Citizen) vs "REGISTER" (New Citizen)
  const [citizenSubMode, setCitizenSubMode] = useState("LOGIN");
  const [citizenLoginId, setCitizenLoginId] = useState("");
  const [citizenPassword, setCitizenPassword] = useState("");
  const [showCitizenPassword, setShowCitizenPassword] = useState(false);

  // Citizen Registration Form State
  const [regFullName, setRegFullName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regState, setRegState] = useState("Telangana");
  const [regDistrict, setRegDistrict] = useState("Nizamabad");
  const [regAddress, setRegAddress] = useState("");
  const [regPincode, setRegPincode] = useState("");
  const [regVoterId, setRegVoterId] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regConsent, setRegConsent] = useState(false);

  // Shared Captcha State
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  // Feedback Messages
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  // Demo dashboard selector state (replaces Direct Access)
  const [demoDashboardId, setDemoDashboardId] = useState(ROLE_IDS.MP);

  // Filter official roles (exclude citizen from official dropdown)
  const officialRoles = ROLE_LIST.filter((r) => r.id !== ROLE_IDS.CITIZEN);

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

  // Switch persona tabs cleanly
  const handleSwitchPersona = (newPersona) => {
    setPortalPersona(newPersona);
    setFeedbackError("");
    setFeedbackSuccess("");
    setCaptchaError("");
    setCaptchaInput("");
    setCaptchaCode(generateCaptcha());
  };

  // Submit Government Official Login
  const handleOfficialSubmit = (e) => {
    e.preventDefault();
    setCaptchaError("");
    setFeedbackError("");
    setFeedbackSuccess("");

    if (!officialLoginId.trim()) {
      setFeedbackError("Please enter your NIC / Parichay User ID or Official Email.");
      return;
    }

    if (!officialPassword) {
      setFeedbackError("Please enter your password.");
      return;
    }

    // Verify Captcha
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError("Invalid Captcha code! Please enter the new code shown.");
      setCaptchaCode(generateCaptcha());
      setCaptchaInput("");
      return;
    }

    const targetRole = ROLE_LIST.find((r) => r.id === selectedOfficialRoleId) || ROLE_LIST[0];
    const success = login(selectedOfficialRoleId);
    if (success) {
      navigate(targetRole.path || "/");
    }
  };

  // Submit Citizen Login
  const handleCitizenLogin = (e) => {
    e.preventDefault();
    setCaptchaError("");
    setFeedbackError("");
    setFeedbackSuccess("");

    const identifier = citizenLoginId.trim();
    if (!identifier) {
      setFeedbackError("Please enter your Registered Mobile Number or Email.");
      return;
    }

    if (!citizenPassword) {
      setFeedbackError("Please enter your password.");
      return;
    }

    // Verify Captcha
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError("Invalid Captcha code! Please enter the new code shown.");
      setCaptchaCode(generateCaptcha());
      setCaptchaInput("");
      return;
    }

    // Check registered citizens in localStorage
    let registeredCitizens;
    try {
      registeredCitizens = JSON.parse(localStorage.getItem("esakshi_registered_citizens") || "[]");
    } catch {
      registeredCitizens = [];
    }

    const citizenMatch = registeredCitizens.find(
      (c) =>
        c.mobile.trim() === identifier ||
        c.email.trim().toLowerCase() === identifier.toLowerCase()
    );

    if (!citizenMatch) {
      // Citizen has not registered yet
      setFeedbackError(
        "No registered Citizen account found with this Mobile / Email. Please click 'Register as New Citizen' first."
      );
      return;
    }

    if (citizenMatch.password !== citizenPassword) {
      setFeedbackError("Incorrect password for this registered Citizen account.");
      return;
    }

    // Store active citizen profile in localStorage
    try {
      localStorage.setItem("saarthi_citizen_profile", JSON.stringify(citizenMatch));
    } catch {
      // localStorage fallback
    }

    const success = login(ROLE_IDS.CITIZEN);
    if (success) {
      navigate("/citizen");
    }
  };

  // Submit New Citizen Registration
  const handleCitizenRegister = (e) => {
    e.preventDefault();
    setFeedbackError("");
    setFeedbackSuccess("");

    if (!regFullName.trim()) {
      setFeedbackError("Please enter your Full Name as per official ID.");
      return;
    }

    const cleanMobile = regMobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setFeedbackError("Please enter a valid 10-digit Indian Mobile Number.");
      return;
    }

    if (!regEmail.trim() || !regEmail.includes("@")) {
      setFeedbackError("Please enter a valid Email Address.");
      return;
    }

    if (!regAddress.trim()) {
      setFeedbackError("Please enter your current residential address / ward.");
      return;
    }

    const cleanPincode = regPincode.replace(/\D/g, "");
    if (cleanPincode.length !== 6) {
      setFeedbackError("Please enter a valid 6-digit Pincode.");
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setFeedbackError("Password must be at least 6 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setFeedbackError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!regConsent) {
      setFeedbackError("Please accept the Citizen Charter declaration to proceed.");
      return;
    }

    // Check if already registered with same mobile or email
    let existingCitizens;
    try {
      existingCitizens = JSON.parse(localStorage.getItem("esakshi_registered_citizens") || "[]");
    } catch {
      existingCitizens = [];
    }

    const alreadyExists = existingCitizens.some(
      (c) =>
        c.mobile.trim() === cleanMobile ||
        c.email.trim().toLowerCase() === regEmail.trim().toLowerCase()
    );

    if (alreadyExists) {
      setFeedbackError(
        "A citizen account is already registered with this Mobile or Email. Please switch to 'Sign In'."
      );
      return;
    }

    const citizenId = `CIT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newCitizen = {
      id: citizenId,
      fullName: regFullName.trim(),
      mobile: cleanMobile,
      email: regEmail.trim().toLowerCase(),
      state: regState,
      district: regDistrict.trim(),
      address: regAddress.trim(),
      pincode: cleanPincode,
      voterId: regVoterId.trim() || null,
      password: regPassword,
      registeredAt: new Date().toISOString(),
    };

    existingCitizens.push(newCitizen);
    try {
      localStorage.setItem("esakshi_registered_citizens", JSON.stringify(existingCitizens));
      localStorage.setItem("saarthi_citizen_profile", JSON.stringify(newCitizen));
    } catch {
      // ignore
    }

    // Populate citizen login fields and switch to login tab
    setCitizenLoginId(cleanMobile);
    setCitizenPassword(regPassword);
    setCitizenSubMode("LOGIN");
    setFeedbackSuccess(
      `Registration Successful! Generated Citizen ID: ${citizenId}. You can now sign in.`
    );
  };

  // Demo Access navigation (replaces Direct Access)
  const handleDemoAccess = (roleId) => {
    const targetRole = ROLE_LIST.find((r) => r.id === roleId);
    if (!targetRole) return;

    if (roleId === ROLE_IDS.CITIZEN) {
      // Setup demo citizen profile if none exists
      try {
        const existing = localStorage.getItem("saarthi_citizen_profile");
        if (!existing) {
          localStorage.setItem(
            "saarthi_citizen_profile",
            JSON.stringify({
              id: "CIT-DEMO-2026",
              fullName: "Demo Citizen (Evaluator)",
              mobile: "9876543210",
              email: "evaluator@sih.gov.in",
              state: "Telangana",
              district: "Nizamabad",
              address: "Collectorate Road, Nizamabad",
              pincode: "503001",
            })
          );
        }
      } catch {
        // ignore
      }
    }

    const success = login(roleId);
    if (success) {
      navigate(targetRole.path || "/");
    }
  };

  const isCitizenRegister = portalPersona === "CITIZEN" && citizenSubMode === "REGISTER";

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

      {/* 3. Main Centered Login Section */}
      <main className="gov-main-viewport">
        <div className={`gov-card ${isCitizenRegister ? "wide" : ""}`}>
          {/* Card Top Title */}
          <div className="gov-card-top">
            <div className="gov-lock-icon">
              {portalPersona === "OFFICIAL" ? <Lock size={18} /> : <UserCheck size={18} />}
            </div>
            <div>
              <h1 className="gov-title">
                {portalPersona === "OFFICIAL"
                  ? "Government Official Login"
                  : citizenSubMode === "REGISTER"
                  ? "Citizen Registration"
                  : "Citizen Portal Login"}
              </h1>
              <p className="gov-card-subtext">
                {portalPersona === "OFFICIAL"
                  ? "MoSPI / NIC issued Single Sign-On credentials for authorized personnel"
                  : citizenSubMode === "REGISTER"
                  ? "Register with verified contact & location details for Saarthi Social Audit"
                  : "Saarthi public transparency portal for Indian citizens"}
              </p>
            </div>
          </div>

          {/* Primary Persona Switcher */}
          <div className="gov-persona-toggle">
            <button
              type="button"
              className={`gov-persona-btn ${portalPersona === "OFFICIAL" ? "active" : ""}`}
              onClick={() => handleSwitchPersona("OFFICIAL")}
            >
              <Building2 size={14} />
              <span>Government Officials</span>
              <span className="gov-persona-badge">Govt ID</span>
            </button>
            <button
              type="button"
              className={`gov-persona-btn ${portalPersona === "CITIZEN" ? "active" : ""}`}
              onClick={() => handleSwitchPersona("CITIZEN")}
            >
              <User size={14} />
              <span>Citizen Portal</span>
              <span className="gov-persona-badge public">Saarthi</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {feedbackError && (
            <div className="gov-alert">
              <AlertCircle size={14} />
              <span>{feedbackError}</span>
            </div>
          )}

          {feedbackSuccess && (
            <div className="gov-success-alert">
              <CheckCircle2 size={14} />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* CASE 1: GOVERNMENT OFFICIAL LOGIN                            */}
          {/* ============================================================ */}
          {portalPersona === "OFFICIAL" && (
            <form onSubmit={handleOfficialSubmit} className="gov-form">
              {/* Role Dropdown */}
              <div className="gov-field">
                <label className="gov-label" htmlFor="role-select">
                  Select Role / Stakeholder Designation <span className="gov-req">*</span>
                </label>
                <select
                  id="role-select"
                  className="gov-select"
                  value={selectedOfficialRoleId}
                  onChange={(e) => {
                    setSelectedOfficialRoleId(e.target.value);
                    setFeedbackError("");
                  }}
                >
                  {officialRoles.map((role) => (
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
                    value={officialLoginId}
                    onChange={(e) => {
                      setOfficialLoginId(e.target.value);
                      setFeedbackError("");
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
                    onClick={() =>
                      alert(
                        "Please contact the District Nodal Officer or NIC Helpdesk at 1800-11-eSAKSHI for password recovery."
                      )
                    }
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="gov-input-wrap">
                  <Lock size={15} className="gov-icon-left" />
                  <input
                    id="user-pwd"
                    type={showOfficialPassword ? "text" : "password"}
                    className="gov-input"
                    value={officialPassword}
                    onChange={(e) => {
                      setOfficialPassword(e.target.value);
                      setFeedbackError("");
                    }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="gov-pwd-toggle"
                    onClick={() => setShowOfficialPassword(!showOfficialPassword)}
                    aria-label={showOfficialPassword ? "Hide password" : "Show password"}
                  >
                    {showOfficialPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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
                    className={`gov-input gov-captcha-in ${
                      captchaError ? "gov-input-error" : ""
                    }`}
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

              {/* Submit Button */}
              <button type="submit" className="gov-btn-submit">
                <span>Sign In to Official Portal</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* CASE 2: CITIZEN PORTAL (SUB-MODES: LOGIN OR REGISTER)        */}
          {/* ============================================================ */}
          {portalPersona === "CITIZEN" && (
            <div className="gov-citizen-section">
              {/* Citizen Sub-Tabs: Sign In vs Register */}
              <div className="gov-citizen-tabs">
                <button
                  type="button"
                  className={`gov-citizen-tab-btn ${citizenSubMode === "LOGIN" ? "active" : ""}`}
                  onClick={() => {
                    setCitizenSubMode("LOGIN");
                    setFeedbackError("");
                    setFeedbackSuccess("");
                  }}
                >
                  <KeyRound size={13} />
                  <span>Citizen Sign In</span>
                </button>
                <button
                  type="button"
                  className={`gov-citizen-tab-btn ${
                    citizenSubMode === "REGISTER" ? "active" : ""
                  }`}
                  onClick={() => {
                    setCitizenSubMode("REGISTER");
                    setFeedbackError("");
                    setFeedbackSuccess("");
                  }}
                >
                  <UserCheck size={13} />
                  <span>New Citizen Registration</span>
                </button>
              </div>

              {/* SUB-MODE A: CITIZEN LOGIN */}
              {citizenSubMode === "LOGIN" && (
                <form onSubmit={handleCitizenLogin} className="gov-form">
                  <div className="gov-citizen-hint-box">
                    <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                    <span>
                      Enter your verified Indian Mobile Number or registered Email ID to log into Saarthi.
                    </span>
                  </div>

                  {/* Registered Mobile or Email */}
                  <div className="gov-field">
                    <label className="gov-label" htmlFor="cit-login-id">
                      Registered Mobile Number / Email <span className="gov-req">*</span>
                    </label>
                    <div className="gov-input-wrap">
                      <Phone size={15} className="gov-icon-left" />
                      <input
                        id="cit-login-id"
                        type="text"
                        className="gov-input"
                        value={citizenLoginId}
                        onChange={(e) => {
                          setCitizenLoginId(e.target.value);
                          setFeedbackError("");
                        }}
                        placeholder="e.g. 9876543210 or citizen@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="gov-field">
                    <label className="gov-label" htmlFor="cit-pwd">
                      Account Password <span className="gov-req">*</span>
                    </label>
                    <div className="gov-input-wrap">
                      <Lock size={15} className="gov-icon-left" />
                      <input
                        id="cit-pwd"
                        type={showCitizenPassword ? "text" : "password"}
                        className="gov-input gov-pwd-input"
                        value={citizenPassword}
                        onChange={(e) => {
                          setCitizenPassword(e.target.value);
                          setFeedbackError("");
                        }}
                        placeholder="Enter your citizen password"
                        required
                      />
                      <button
                        type="button"
                        className="gov-pwd-toggle"
                        onClick={() => setShowCitizenPassword(!showCitizenPassword)}
                      >
                        {showCitizenPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Captcha */}
                  <div className="gov-field">
                    <label className="gov-label" htmlFor="cit-captcha-box">
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
                        id="cit-captcha-box"
                        type="text"
                        className={`gov-input gov-captcha-in ${
                          captchaError ? "gov-input-error" : ""
                        }`}
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

                  {/* Submit Button */}
                  <button type="submit" className="gov-btn-submit">
                    <span>Sign In as Citizen</span>
                    <ArrowRight size={15} />
                  </button>

                  <div className="gov-citizen-toggle-prompt">
                    <span>New citizen? </span>
                    <button
                      type="button"
                      className="gov-text-link"
                      onClick={() => setCitizenSubMode("REGISTER")}
                    >
                      Register your Citizen Account first →
                    </button>
                  </div>
                </form>
              )}

              {/* SUB-MODE B: CITIZEN REGISTRATION */}
              {citizenSubMode === "REGISTER" && (
                <form onSubmit={handleCitizenRegister} className="gov-form gov-reg-form">
                  <div className="gov-reg-grid">
                    {/* Full Name */}
                    <div className="gov-field">
                      <label className="gov-label" htmlFor="reg-name">
                        Full Name (as per ID) <span className="gov-req">*</span>
                      </label>
                      <div className="gov-input-wrap">
                        <User size={15} className="gov-icon-left" />
                        <input
                          id="reg-name"
                          type="text"
                          className="gov-input"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          required
                        />
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="gov-field">
                      <label className="gov-label" htmlFor="reg-mobile">
                        10-Digit Mobile Number <span className="gov-req">*</span>
                      </label>
                      <div className="gov-input-wrap">
                        <Phone size={15} className="gov-icon-left" />
                        <input
                          id="reg-mobile"
                          type="tel"
                          maxLength={10}
                          className="gov-input"
                          value={regMobile}
                          onChange={(e) => setRegMobile(e.target.value)}
                          placeholder="e.g. 9876543210"
                          required
                        />
                      </div>
                    </div>

                    {/* Email ID */}
                    <div className="gov-field">
                      <label className="gov-label" htmlFor="reg-email">
                        Email Address <span className="gov-req">*</span>
                      </label>
                      <div className="gov-input-wrap">
                        <Mail size={15} className="gov-icon-left" />
                        <input
                          id="reg-email"
                          type="email"
                          className="gov-input"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. citizen@email.com"
                          required
                        />
                      </div>
                    </div>

                    {/* State */}
                    <div className="gov-field">
                      <label className="gov-label" htmlFor="reg-state">
                        State / UT <span className="gov-req">*</span>
                      </label>
                      <select
                        id="reg-state"
                        className="gov-select"
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* District / Constituency */}
                    <div className="gov-field">
                      <label className="gov-label" htmlFor="reg-district">
                        District / Constituency <span className="gov-req">*</span>
                      </label>
                      <div className="gov-input-wrap">
                        <MapPin size={15} className="gov-icon-left" />
                        <input
                          id="reg-district"
                          type="text"
                          className="gov-input"
                          value={regDistrict}
                          onChange={(e) => setRegDistrict(e.target.value)}
                          placeholder="e.g. Nizamabad"
                          required
                        />
                      </div>
                    </div>

                    {/* Pincode */}
                    <div className="gov-field">
                      <label className="gov-label" htmlFor="reg-pincode">
                        Pincode <span className="gov-req">*</span>
                      </label>
                      <div className="gov-input-wrap">
                        <MapPin size={15} className="gov-icon-left" />
                        <input
                          id="reg-pincode"
                          type="text"
                          maxLength={6}
                          className="gov-input"
                          value={regPincode}
                          onChange={(e) => setRegPincode(e.target.value)}
                          placeholder="e.g. 503001"
                          required
                        />
                      </div>
                    </div>

                    {/* Current Residential Address */}
                    <div className="gov-field full-width">
                      <label className="gov-label" htmlFor="reg-address">
                        Current Residential Address / Village / Ward <span className="gov-req">*</span>
                      </label>
                      <div className="gov-input-wrap">
                        <MapPin size={15} className="gov-icon-left" />
                        <input
                          id="reg-address"
                          type="text"
                          className="gov-input"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          placeholder="House / Street / Ward, Locality"
                          required
                        />
                      </div>
                    </div>

                    {/* Voter ID / EPIC (Optional) */}
                    <div className="gov-field full-width">
                      <label className="gov-label" htmlFor="reg-voter">
                        Voter ID / EPIC Card No. (Optional · for Priority Social Audit)
                      </label>
                      <div className="gov-input-wrap">
                        <ShieldCheck size={15} className="gov-icon-left" />
                        <input
                          id="reg-voter"
                          type="text"
                          className="gov-input"
                          value={regVoterId}
                          onChange={(e) => setRegVoterId(e.target.value)}
                          placeholder="e.g. ABC1234567 (Optional)"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="gov-field">
                      <label className="gov-label" htmlFor="reg-pwd">
                        Create Password <span className="gov-req">*</span>
                      </label>
                      <div className="gov-input-wrap">
                        <Lock size={15} className="gov-icon-left" />
                        <input
                          id="reg-pwd"
                          type="password"
                          className="gov-input"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          required
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="gov-field">
                      <label className="gov-label" htmlFor="reg-cpwd">
                        Confirm Password <span className="gov-req">*</span>
                      </label>
                      <div className="gov-input-wrap">
                        <Lock size={15} className="gov-icon-left" />
                        <input
                          id="reg-cpwd"
                          type="password"
                          className="gov-input"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Citizen Consent Declaration */}
                  <div className="gov-consent-row">
                    <input
                      id="reg-consent"
                      type="checkbox"
                      checked={regConsent}
                      onChange={(e) => setRegConsent(e.target.checked)}
                      required
                    />
                    <label htmlFor="reg-consent" className="gov-consent-label">
                      I declare that I am an Indian citizen and the details provided above are true for eSAKSHI Saarthi Social Audit registration.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="gov-btn-submit">
                    <span>Register Citizen Account & Proceed to Sign In</span>
                    <ArrowRight size={15} />
                  </button>

                  <div className="gov-citizen-toggle-prompt">
                    <span>Already registered? </span>
                    <button
                      type="button"
                      className="gov-text-link"
                      onClick={() => setCitizenSubMode("LOGIN")}
                    >
                      Sign In to your account →
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 4. DEMO ACCESS Panel (replaces Direct Access) */}
          <div className="gov-demo-nav-panel">
            <div className="gov-demo-header">
              <span className="gov-demo-tag">DEMO ACCESS</span>
              <span className="gov-demo-desc">Quick evaluation demo access for all roles:</span>
            </div>
            <div className="gov-demo-controls">
              <select
                className="gov-demo-select"
                value={demoDashboardId}
                onChange={(e) => setDemoDashboardId(e.target.value)}
                aria-label="Demo Dashboard Navigation"
              >
                {ROLE_LIST.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.icon} {role.displayName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="gov-btn-demo"
                onClick={() => handleDemoAccess(demoDashboardId)}
              >
                <span>Launch Demo Dashboard</span>
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
