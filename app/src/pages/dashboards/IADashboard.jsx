import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  Building2,
  ShieldCheck,
  Layers,
  Bell,
  Activity,
  CheckCircle2,
  IndianRupee,
  Clock,
  FileCheck,
  Camera,
  ShieldAlert,
  Sparkles,
  Search,
  ChevronDown,
  Download,
  Eye,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  FileText,
  Check,
  MapPin,
  Coins,
  BarChart3,
  HelpCircle,
  Filter,
} from "lucide-react";
import {
  API_BASE,
  formatNumber,
  formatCrores,
  formatCurrency,
  formatDecimal,
  exportToCSV,
} from "../../constants";
import WorkDetailDrawer from "../../components/WorkDetailDrawer";
import "./IADashboard.css";

// 10 Standard Implementing Agency Sections requested by user
const IA_MODULES = [
  { id: "assigned-works", label: "Assigned Works", icon: Layers, desc: "Works assigned to that IA" },
  { id: "execution-progress", label: "Execution Progress", icon: Activity, desc: "Stage/progress of each work" },
  { id: "upcoming-deadlines", label: "Upcoming Deadlines", icon: Clock, desc: "Works nearing completion deadline" },
  { id: "payment-requests", label: "Payment Requests", icon: IndianRupee, desc: "Payment requests and status" },
  { id: "vendor-activity", label: "Vendor Activity", icon: Building2, desc: "Vendor-wise execution/payment information" },
  { id: "evidence-upload", label: "Evidence Upload", icon: FileCheck, desc: "Stage-wise photographs/documents" },
  { id: "geo-photo-verification", label: "Geo-Photo Verification", icon: Camera, desc: "Location/evidence status" },
  { id: "missing-evidence", label: "Missing Evidence", icon: AlertTriangle, desc: "Required evidence not uploaded" },
  { id: "completion", label: "Completion", icon: CheckCircle2, desc: "Works ready to mark complete" },
  { id: "ai-alerts", label: "AI Alerts", icon: Sparkles, desc: "Inconsistencies requiring correction" },
];

// Helper to format clean, human-readable agency titles
export const cleanAgencyName = (raw) => {
  if (!raw) return "Select Implementing Agency";
  if (raw === "ALL") return "All Implementing Agencies";

  const match = raw.match(/^([^(]+)\(([^)]+)\)$/);
  if (match) {
    const district = match[1].trim();
    let agency = match[2].trim().replace(/_IDA$/i, "").trim();

    // Check if district name is repeated inside agency
    const distRegex = new RegExp(`\\b${district}\\b`, "i");
    const cleanedAgency = agency.replace(distRegex, "").trim();
    const targetAgency = cleanedAgency.length > 2 ? cleanedAgency : agency;

    // Capitalize words nicely
    const formattedAgency = targetAgency
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => {
        if (["drda", "pwd", "ida", "zp", "mc", "dm", "dc"].includes(w)) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");

    return `${district} (${formattedAgency})`;
  }
  return raw;
};

export default function IADashboard({ summary, onSelectWork }) {
  const { roleConfig } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active module tab from URL query param: e.g. /ia?tab=upcoming-deadlines
  const rawTab = searchParams.get("tab");
  const currentTab = (!rawTab || rawTab === "overview") ? "assigned-works" : rawTab;

  // Subfilter within the active module tab
  const [subfilter, setSubfilter] = useState("all");

  // Implementing Agency selection (Default: specific prominent IA from canonical dataset)
  const [selectedIDA, setSelectedIDA] = useState(() => {
    return searchParams.get("ia") || localStorage.getItem("mplads_selected_ia") || "PURI(DISTRICT COLLECTOR PURI_IDA)";
  });
  const [idaDropdownOpen, setIdaDropdownOpen] = useState(false);
  const [idaSearchText, setIdaSearchText] = useState("");
  const [idasList, setIdasList] = useState([]);
  const dropdownRef = useRef(null);

  // Sync if URL search parameter changes
  useEffect(() => {
    const urlIA = searchParams.get("ia");
    if (urlIA && urlIA !== selectedIDA) {
      setSelectedIDA(urlIA);
    }
  }, [searchParams]);

  // Handle switching selected IA
  const handleSelectIA = (newIA) => {
    setSelectedIDA(newIA);
    setIdaDropdownOpen(false);
    setWorksPage(1);
    try {
      localStorage.setItem("mplads_selected_ia", newIA);
    } catch (e) {}

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("ia", newIA);
    setSearchParams(nextParams);

    window.dispatchEvent(new CustomEvent("ia-changed", { detail: newIA }));
  };

  // Telemetry state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Works registry table state
  const [works, setWorks] = useState([]);
  const [worksTotal, setWorksTotal] = useState(0);
  const [worksPage, setWorksPage] = useState(1);
  const [worksLimit] = useState(15);
  const [worksLoading, setWorksLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState("All");
  const [selectedRisk, setSelectedRisk] = useState("All");
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);
  const [workSearchQuery, setWorkSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [localSelectedWork, setLocalSelectedWork] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIdaDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Map active module tab to dossier audit section
  const getAuditSectionForTab = (tab) => {
    switch (tab) {
      case "assigned-works": return "overview";
      case "execution-progress": return "sanction";
      case "upcoming-deadlines": return "sanction";
      case "payment-requests": return "financials";
      case "vendor-activity": return "overview";
      case "evidence-upload": return "evidence";
      case "geo-photo-verification": return "geo-photo";
      case "missing-evidence": return "evidence";
      case "completion": return "completion";
      case "ai-alerts": return "actions";
      default: return "overview";
    }
  };

  const handleSelectWork = (work, section = null) => {
    if (!work) return;
    const targetSec = section || getAuditSectionForTab(currentTab);
    const workWithSec = { ...work, __initialSection: targetSec, __authority: "IMPLEMENTING_AGENCY" };
    if (typeof onSelectWork === "function") {
      onSelectWork(workWithSec);
    } else {
      setLocalSelectedWork(workWithSec);
    }
  };

  // Switch active tab
  const handleTabChange = (tabId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tabId);
    if (selectedIDA) {
      nextParams.set("ia", selectedIDA);
    }
    setSearchParams(nextParams);
    setWorksPage(1);
    setSubfilter("all");
    setSelectedStage("All");
    setSelectedRisk("All");
    setFilterFlaggedOnly(false);
  };

  // Load master list of Implementing Agencies (763 IDAs) from dataset
  useEffect(() => {
    async function fetchIDAs() {
      try {
        const res = await fetch(`${API_BASE}/api/idas`);
        if (res.ok) {
          const data = await res.json();
          if (data.idas && data.idas.length > 0) {
            setIdasList(data.idas);
          }
        }
      } catch (err) {
        console.error("Failed to load Implementing Agencies:", err);
      }
    }
    fetchIDAs();
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(workSearchQuery);
      setWorksPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [workSearchQuery]);

  // Load IA Analytics Telemetry
  useEffect(() => {
    let isMounted = true;
    async function fetchAnalytics() {
      setAnalyticsLoading(true);
      try {
        const idaParam = selectedIDA && selectedIDA !== "ALL" ? `?ida_name=${encodeURIComponent(selectedIDA)}` : "";
        const res = await fetch(`${API_BASE}/api/analytics/ia${idaParam}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAnalytics(data);
          }
        }
      } catch (err) {
        console.error("Failed to load IA analytics:", err);
      } finally {
        if (isMounted) setAnalyticsLoading(false);
      }
    }
    fetchAnalytics();
    return () => { isMounted = false; };
  }, [selectedIDA]);

  // Load Works Table for Current Tab & Filter Context
  useEffect(() => {
    let isMounted = true;
    async function fetchWorks() {
      setWorksLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("page", worksPage.toString());
        params.append("limit", worksLimit.toString());

        if (selectedIDA && selectedIDA !== "ALL") {
          params.append("ida_name", selectedIDA);
        }

        // Module-specific tab filtering
        params.append("tab", currentTab);

        if (subfilter && subfilter !== "all") {
          params.append("subfilter", subfilter);
        }

        // Generic filters
        if (selectedStage && selectedStage !== "All") {
          params.append("stage", selectedStage);
        }
        if (selectedRisk && selectedRisk !== "All") {
          params.append("risk_level", selectedRisk);
        }
        if (filterFlaggedOnly) {
          params.append("requires_review", "true");
        }
        if (debouncedSearch) {
          params.append("q", debouncedSearch);
        }

        const res = await fetch(`${API_BASE}/api/works?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setWorks(data.data || data.works || []);
            setWorksTotal(data.total || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load IA works:", err);
      } finally {
        if (isMounted) setWorksLoading(false);
      }
    }
    fetchWorks();
    return () => { isMounted = false; };
  }, [
    currentTab,
    selectedIDA,
    worksPage,
    worksLimit,
    selectedStage,
    selectedRisk,
    filterFlaggedOnly,
    debouncedSearch,
    subfilter,
  ]);

  // Filtered list of IDAs for dropdown search
  const filteredIDAs = useMemo(() => {
    if (!idaSearchText.trim()) return idasList.slice(0, 100);
    const q = idaSearchText.toLowerCase();
    return idasList.filter((ida) => {
      const name = typeof ida === "string" ? ida : (ida.ida_name || "");
      const dist = typeof ida === "string" ? "" : (ida.district_name || "");
      const st = typeof ida === "string" ? "" : (ida.state || "");
      return name.toLowerCase().includes(q) || dist.toLowerCase().includes(q) || st.toLowerCase().includes(q);
    }).slice(0, 100);
  }, [idasList, idaSearchText]);

  // Total pages
  const totalPages = Math.ceil(worksTotal / worksLimit) || 1;

  // CSV Export handler
  const handleExportCSV = () => {
    if (!works || works.length === 0) return;
    const exportData = works.map((w) => ({
      "Work ID": w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID,
      "Description": w.WORK_DESCRIPTION || "N/A",
      "Stage": w.WORK_STAGE || "N/A",
      "Executing Agency / Vendor": w.IDA_NAME || "N/A",
      "Sanction Amount (₹)": w.SANCTION_AMOUNT || 0,
      "Actual Expenditure (₹)": w.ACTUAL_AMOUNT || 0,
      "Risk Level": w.RISK_LEVEL || "LOW",
      "Evidence Score": w.EVIDENCE_SCORE ?? "N/A",
      "Requires Review": w.REQUIRES_REVIEW ? "YES" : "NO",
      "Completion Days": w.COMPLETION_DURATION_DAYS ?? "N/A",
      "Peer Median Days": w.PEER_MEDIAN_COMPLETION_DAYS ?? "N/A",
    }));
    exportToCSV(exportData, `IA_${currentTab}_Export_${Date.now()}.csv`);
  };

  return (
    <div className="ia-dashboard-container">
      {/* ============================================================
          1. OFFICIAL HEADER CARD & AGENCY SWITCHER
          ============================================================ */}
      <div className="ia-header-card">
        <div className="ia-header-top">
          <div className="ia-title-unit">
            <div className="ia-sub-row">
              <span className="ia-badge">
                <Building2 size={12} />
                Executing Agency Dashboard
              </span>
              <span className="ia-location-tag">
                <MapPin size={12} />
                {cleanAgencyName(selectedIDA)}
              </span>
              <span className="ia-live-pill">
                <span className="ia-pulse-dot"></span>
                {formatNumber(analytics?.total_works || worksTotal || 0)} Assigned Works
              </span>
            </div>
            <h1 className="ia-page-title">
              {cleanAgencyName(selectedIDA)} — Execution Portal
            </h1>
            <p className="ia-page-desc">
              Civil execution monitoring, milestone progression, Measurement Book (MB) verification, contractor payment compliance, and site photo evidence.
            </p>
          </div>

          {/* Searchable Agency Switcher */}
          <div className="ia-selector-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="ia-selector-btn"
              onClick={() => setIdaDropdownOpen(!idaDropdownOpen)}
              title="Select Implementing Agency (IA) from dataset"
            >
              <div className="ia-selector-col">
                <span className="ia-selector-caption">Select IA</span>
                <span className="ia-selector-active-name">
                  {cleanAgencyName(selectedIDA)}
                </span>
              </div>
              <ChevronDown size={16} />
            </button>

            {idaDropdownOpen && (
              <div className="ia-dropdown-menu">
                <div className="ia-dropdown-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search Implementing Agency (e.g. Puri, DRDA, PWD)..."
                    value={idaSearchText}
                    onChange={(e) => setIdaSearchText(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="ia-dropdown-scroll">
                  {filteredIDAs.map((idaObj) => {
                    const idaName = typeof idaObj === "string" ? idaObj : idaObj.ida_name;
                    const cleanName = cleanAgencyName(idaName);
                    const state = typeof idaObj === "object" ? idaObj.state : "";
                    const worksCount = typeof idaObj === "object" ? idaObj.works_count : 0;
                    const isSelected = selectedIDA === idaName;

                    return (
                      <div
                        key={idaName}
                        className={`ia-dropdown-row ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectIA(idaName)}
                      >
                        <div className="ia-dropdown-item-meta">
                          <strong>{cleanName}</strong>
                          <small>
                            {idaName} {state ? `· ${state}` : ""}
                          </small>
                        </div>
                        <div className="ia-dropdown-item-end">
                          {worksCount > 0 && (
                            <span className="ia-dropdown-count-badge">
                              {formatNumber(worksCount)} Works
                            </span>
                          )}
                          {isSelected && <Check size={14} color="#0284c7" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          2. TOP MODULE NAVIGATION TABS (10 Standard Sections)
          ============================================================ */}
      <div className="ia-tab-nav-bar">
        {IA_MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentTab === mod.id;
          const badgeVal = analytics?.sidebar_badges?.[mod.id.replace(/-/g, "_")];
          return (
            <button
              key={mod.id}
              type="button"
              className={`ia-tab-pill ${isActive ? "active" : ""}`}
              onClick={() => handleTabChange(mod.id)}
              title={mod.desc}
            >
              <Icon size={14} />
              <span>{mod.label}</span>
              {badgeVal !== undefined && badgeVal !== null && (
                <span className="ia-tab-count">{formatNumber(badgeVal)}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================
          3. 4 PRIMARY KPI CARDS (Strict Government of India Standard)
          ============================================================ */}
      <div className="ia-kpi-grid">
        {/* KPI 1: Assigned Works */}
        <div
          className="ia-kpi-card kpi-blue cursor-pointer"
          onClick={() => handleTabChange("assigned-works")}
          title="Click to view assigned works"
        >
          <div className="ia-kpi-top">
            <span className="ia-kpi-label">Assigned Works</span>
            <div className="ia-kpi-icon-wrap">
              <Layers size={18} />
            </div>
          </div>
          <div className="ia-kpi-value">
            {analyticsLoading ? "..." : formatNumber(analytics?.primary_kpis?.assigned_works || 0)}
          </div>
          <div className="ia-kpi-sub">
            ₹ {formatCrores(analytics?.financials?.sanction_amount || 0)} Cr Sanctioned Value
          </div>
        </div>

        {/* KPI 2: Execution Progress */}
        <div
          className="ia-kpi-card kpi-teal cursor-pointer"
          onClick={() => handleTabChange("execution-progress")}
          title="Click to view execution progress"
        >
          <div className="ia-kpi-top">
            <span className="ia-kpi-label">Execution Progress</span>
            <div className="ia-kpi-icon-wrap">
              <Activity size={18} />
            </div>
          </div>
          <div className="ia-kpi-value">
            {analyticsLoading ? "..." : formatNumber(analytics?.primary_kpis?.ongoing_works || 0)}
          </div>
          <div className="ia-kpi-sub">
            ₹ {formatCrores(analytics?.financials?.actual_amount || 0)} Cr Disbursed Spend
          </div>
        </div>

        {/* KPI 3: Upcoming Deadlines */}
        <div
          className="ia-kpi-card kpi-amber cursor-pointer"
          onClick={() => handleTabChange("upcoming-deadlines")}
          title="Click to view upcoming deadlines"
        >
          <div className="ia-kpi-top">
            <span className="ia-kpi-label">Upcoming Deadlines</span>
            <div className="ia-kpi-icon-wrap">
              <Clock size={18} />
            </div>
          </div>
          <div className="ia-kpi-value">
            {analyticsLoading ? "..." : formatNumber(analytics?.sidebar_badges?.upcoming_deadlines || 0)}
          </div>
          <div className="ia-kpi-sub">
            Nearing deadline or past peer median
          </div>
        </div>

        {/* KPI 4: AI Alerts */}
        <div
          className="ia-kpi-card kpi-rose cursor-pointer"
          onClick={() => handleTabChange("ai-alerts")}
          title="Click to view AI alerts"
        >
          <div className="ia-kpi-top">
            <span className="ia-kpi-label">AI Alerts</span>
            <div className="ia-kpi-icon-wrap">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="ia-kpi-value">
            {analyticsLoading ? "..." : formatNumber(analytics?.primary_kpis?.attention_required || 0)}
          </div>
          <div className="ia-kpi-sub">
            Inconsistencies requiring field correction
          </div>
        </div>
      </div>

      {/* ============================================================
          4. DYNAMIC MODULE VIEWS & CONTENT PANELS (10 Standard Sections)
          ============================================================ */}

      {/* ------------------------------------------------------------
          SECTION 1: ASSIGNED WORKS (Works assigned to that IA)
          ------------------------------------------------------------ */}
      {currentTab === "assigned-works" && (
        <div className="ia-section-card">
          <div className="ia-section-header">
            <div className="ia-section-title-wrap">
              <h2 className="ia-section-heading">
                <Layers size={16} />
                Assigned Works Inventory
              </h2>
              <p className="ia-section-subtitle">
                Master register of infrastructure projects assigned to this implementing agency
              </p>
            </div>
            <div className="ia-section-actions">
              <button
                type="button"
                className="ia-action-btn"
                onClick={handleExportCSV}
                title="Download CSV export"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="ia-filter-bar">
            <div className="ia-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by Work ID, description, category, or constituency..."
                value={workSearchQuery}
                onChange={(e) => setWorkSearchQuery(e.target.value)}
                className="ia-search-input"
              />
            </div>

            <div className="ia-filter-group">
              <select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setWorksPage(1);
                }}
                className="ia-filter-select"
              >
                <option value="All">All Stages</option>
                <option value="Physical Inspection">Physical Inspection</option>
                <option value="Work partially Completed">Work partially Completed</option>
                <option value="Vendor Identification">Vendor Identification</option>
                <option value="Time Estimation">Time Estimation</option>
                <option value="Work Completed">Work Completed</option>
                <option value="Sanction">Sanction</option>
              </select>

              <select
                value={selectedRisk}
                onChange={(e) => {
                  setSelectedRisk(e.target.value);
                  setWorksPage(1);
                }}
                className="ia-filter-select"
              >
                <option value="All">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>

            <div className="ia-total-count-tag">
              Showing {formatNumber(works.length)} of {formatNumber(worksTotal)} works
            </div>
          </div>

          <div className="ia-table-responsive">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Work ID</th>
                  <th>Description & Category</th>
                  <th>Stage</th>
                  <th>Executing Agency</th>
                  <th>Sanctioned (₹)</th>
                  <th>Actual Spend (₹)</th>
                  <th>Risk</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {worksLoading ? (
                  <tr>
                    <td colSpan={8} className="ia-loading-state">
                      Loading assigned works from repository...
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ia-empty-state">
                      <Layers size={32} className="ia-empty-icon" />
                      <strong>No Assigned Works Found</strong>
                      <p>Try adjusting your search criteria or selecting a different agency scope.</p>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => {
                    const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                    return (
                      <tr key={wid}>
                        <td>
                          <button
                            type="button"
                            className="ia-work-id-btn"
                            onClick={() => handleSelectWork(w, "overview")}
                          >
                            {wid}
                          </button>
                        </td>
                        <td>
                          <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                            {w.WORK_DESCRIPTION || "Description not available"}
                          </span>
                          <span className="ia-desc-subtext">
                            {w.WORK_CATEGORY || "General"} · {w.CONSTITUENCY || w.STATE_NAME || ""}
                          </span>
                        </td>
                        <td>
                          <span className={`ia-stage-pill ${w.WORK_STAGE === "Work Completed" ? "completed" : w.WORK_STAGE === "Physical Inspection" ? "inspection" : "ongoing"}`}>
                            {w.WORK_STAGE || "Pending"}
                          </span>
                        </td>
                        <td>
                          <span className="ia-desc-subtext">
                            {w.IDA_NAME || "Agency Not Specified"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                        </td>
                        <td>
                          ₹ {formatNumber(w.ACTUAL_AMOUNT || 0)}
                        </td>
                        <td>
                          <span className={`ia-risk-tag ${(w.RISK_LEVEL || "LOW").toLowerCase()}`}>
                            {w.RISK_LEVEL || "LOW"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="ia-action-btn"
                            onClick={() => handleSelectWork(w, "overview")}
                          >
                            <Eye size={13} />
                            <span>Work Order Dossier →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ia-pagination">
            <span>Page {worksPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage <= 1}
                onClick={() => setWorksPage(worksPage - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage >= totalPages}
                onClick={() => setWorksPage(worksPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SECTION 2: EXECUTION PROGRESS (Stage/progress of each work)
          ------------------------------------------------------------ */}
      {currentTab === "execution-progress" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Lifecycle Progress Cards */}
          <div className="ia-section-card">
            <div className="ia-section-header">
              <div className="ia-section-title-wrap">
                <h2 className="ia-section-heading">
                  <Activity size={16} />
                  Milestone Stage Distribution
                </h2>
                <p className="ia-section-subtitle">
                  Progression across civil infrastructure execution milestones
                </p>
              </div>
            </div>
            <div className="ia-lifecycle-list">
              {analytics?.lifecycle?.stages_breakdown ? (
                Object.entries(analytics.lifecycle.stages_breakdown).map(([stage, count]) => {
                  const totalAssigned = analytics?.primary_kpis?.assigned_works || 1;
                  const pct = Math.min(100, Math.round((count / totalAssigned) * 100));
                  let colorClass = "";
                  if (stage === "Work Completed") colorClass = "green";
                  else if (stage === "Physical Inspection") colorClass = "indigo";
                  else if (stage === "Work partially Completed") colorClass = "amber";

                  return (
                    <div key={stage} className="ia-lifecycle-item">
                      <span className="ia-lifecycle-label">{stage}</span>
                      <div className="ia-lifecycle-bar-wrap">
                        <div
                          className={`ia-lifecycle-bar-fill ${colorClass}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="ia-lifecycle-count">
                        {formatNumber(count)} ({pct}%)
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="ia-loading-state">Loading milestone distribution...</div>
              )}
            </div>
          </div>

          {/* Progress Works Table */}
          <div className="ia-section-card">
            <div className="ia-section-header">
              <div className="ia-section-title-wrap">
                <h2 className="ia-section-heading">
                  <Activity size={16} />
                  Work Progress Tracking
                </h2>
                <p className="ia-section-subtitle">
                  Elapsed construction duration vs peer median across active works
                </p>
              </div>
              <div className="ia-section-actions">
                <button
                  type="button"
                  className="ia-action-btn"
                  onClick={handleExportCSV}
                >
                  <Download size={13} />
                  <span>Export Progress</span>
                </button>
              </div>
            </div>

            <div className="ia-table-responsive">
              <table className="ia-table">
                <thead>
                  <tr>
                    <th>Work ID</th>
                    <th>Description</th>
                    <th>Current Stage</th>
                    <th>Execution Duration</th>
                    <th>Peer Median</th>
                    <th>Sanction (₹)</th>
                    <th>Actual Spend (₹)</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {worksLoading ? (
                    <tr>
                      <td colSpan={8} className="ia-loading-state">
                        Loading execution progress records...
                      </td>
                    </tr>
                  ) : works.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="ia-empty-state">
                        <Activity size={32} className="ia-empty-icon" />
                        <strong>No Active Execution Works Found</strong>
                        <p>All projects are either concluded or awaiting sanction clearance.</p>
                      </td>
                    </tr>
                  ) : (
                    works.map((w) => {
                      const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                      return (
                        <tr key={wid}>
                          <td>
                            <button
                              type="button"
                              className="ia-work-id-btn"
                              onClick={() => handleSelectWork(w, "sanction")}
                            >
                              {wid}
                            </button>
                          </td>
                          <td>
                            <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                              {w.WORK_DESCRIPTION || "Description not available"}
                            </span>
                            <span className="ia-desc-subtext">
                              {w.IDA_NAME || "Executing Agency"}
                            </span>
                          </td>
                          <td>
                            <span className="ia-stage-pill ongoing">
                              {w.WORK_STAGE || "Active"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {w.COMPLETION_DURATION_DAYS !== null && w.COMPLETION_DURATION_DAYS !== undefined
                              ? `${w.COMPLETION_DURATION_DAYS} Days`
                              : "Under Execution"}
                          </td>
                          <td>
                            {w.PEER_MEDIAN_COMPLETION_DAYS ? `${w.PEER_MEDIAN_COMPLETION_DAYS} Days` : "N/A"}
                          </td>
                          <td>
                            ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                          </td>
                          <td>
                            ₹ {formatNumber(w.ACTUAL_AMOUNT || 0)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="ia-action-btn"
                              onClick={() => handleSelectWork(w, "sanction")}
                            >
                              <Eye size={13} />
                              <span>Milestone Dossier →</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="ia-pagination">
              <span>Page {worksPage} of {totalPages}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="ia-page-btn"
                  disabled={worksPage <= 1}
                  onClick={() => setWorksPage(worksPage - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="ia-page-btn"
                  disabled={worksPage >= totalPages}
                  onClick={() => setWorksPage(worksPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SECTION 3: UPCOMING DEADLINES (Works nearing completion deadline)
          ------------------------------------------------------------ */}
      {currentTab === "upcoming-deadlines" && (
        <div className="ia-section-card">
          <div className="ia-context-banner">
            <div className="ia-context-banner-left">
              <div className="ia-context-eyebrow">
                <Clock size={13} />
                Timeline Surveillance
              </div>
              <h2 className="ia-context-title">Upcoming Deadlines & Pacing Surveillance</h2>
              <p className="ia-context-desc">
                Works approaching completion duration thresholds (80%+ of peer median) or exceeding typical delivery timelines.
              </p>
            </div>
            <div className="ia-section-actions">
              <select
                value={subfilter}
                onChange={(e) => {
                  setSubfilter(e.target.value);
                  setWorksPage(1);
                }}
                className="ia-filter-select"
              >
                <option value="all">All Deadline Alerts</option>
                <option value="nearing">Nearing Deadline (80-100% Peer Median)</option>
                <option value="overdue">Overdue (&gt;100% Peer Median)</option>
              </select>
              <button
                type="button"
                className="ia-action-btn"
                onClick={handleExportCSV}
              >
                <Download size={13} />
                <span>Export Deadlines</span>
              </button>
            </div>
          </div>

          <div className="ia-table-responsive">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Work ID</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Days Elapsed</th>
                  <th>Peer Median</th>
                  <th>Status / Urgency</th>
                  <th>Sanction Amount (₹)</th>
                  <th style={{ textAlign: "right" }}>Intervene</th>
                </tr>
              </thead>
              <tbody>
                {worksLoading ? (
                  <tr>
                    <td colSpan={8} className="ia-loading-state">
                      Scanning deadline schedules...
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ia-empty-state">
                      <CheckCircle2 size={32} color="#16a34a" />
                      <strong>No Imminent Deadlines</strong>
                      <p>All active works are well within standard peer completion durations.</p>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => {
                    const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                    const duration = w.COMPLETION_DURATION_DAYS || 0;
                    const median = w.PEER_MEDIAN_COMPLETION_DAYS || 1;
                    const isOver = duration > median;
                    return (
                      <tr key={wid}>
                        <td>
                          <button
                            type="button"
                            className="ia-work-id-btn"
                            onClick={() => handleSelectWork(w, "sanction")}
                          >
                            {wid}
                          </button>
                        </td>
                        <td>
                          <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                            {w.WORK_DESCRIPTION || "Description not available"}
                          </span>
                          <span className="ia-desc-subtext">
                            {w.IDA_NAME || "Agency Not Recorded"}
                          </span>
                        </td>
                        <td>
                          <span className="ia-stage-pill ongoing">
                            {w.WORK_STAGE || "Active"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: isOver ? "#dc2626" : "#b45309" }}>
                          {duration} Days
                        </td>
                        <td>
                          {median} Days
                        </td>
                        <td>
                          <span className={`ia-urgency-badge ${isOver ? "overdue" : "nearing"}`}>
                            {isOver ? `Overdue (+${duration - median}d)` : "Nearing Deadline (80%+)"}
                          </span>
                        </td>
                        <td>
                          ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="ia-action-btn"
                            onClick={() => handleSelectWork(w, "sanction")}
                          >
                            <Eye size={13} />
                            <span>SLA Dossier →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ia-pagination">
            <span>Page {worksPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage <= 1}
                onClick={() => setWorksPage(worksPage - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage >= totalPages}
                onClick={() => setWorksPage(worksPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SECTION 4: PAYMENT REQUESTS (Payment requests and status)
          ------------------------------------------------------------ */}
      {currentTab === "payment-requests" && (
        <div className="ia-section-card">
          <div className="ia-context-banner">
            <div className="ia-context-banner-left">
              <div className="ia-context-eyebrow">
                <Coins size={13} />
                Financial Governance
              </div>
              <h2 className="ia-context-title">Payment Requests & Disbursement Ledger</h2>
              <p className="ia-context-desc">
                Sanctioned allocations vs recorded expenditure (ACTUAL_AMOUNT), contractor disbursements, and cost variance reconciliations.
              </p>
            </div>
            <div className="ia-section-actions">
              <select
                value={subfilter}
                onChange={(e) => {
                  setSubfilter(e.target.value);
                  setWorksPage(1);
                }}
                className="ia-filter-select"
              >
                <option value="all">All Payment Records</option>
                <option value="escalation">Cost Escalations Only</option>
                <option value="disbursed">Disbursements Booked</option>
              </select>
              <button
                type="button"
                className="ia-action-btn"
                onClick={handleExportCSV}
              >
                <Download size={13} />
                <span>Export Payments</span>
              </button>
            </div>
          </div>

          <div className="ia-table-responsive">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Work ID</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Sanctioned Value (₹)</th>
                  <th>Recorded Spend (₹)</th>
                  <th>Variance / Status</th>
                  <th>Cost vs Peer</th>
                  <th style={{ textAlign: "right" }}>Financial Ledger</th>
                </tr>
              </thead>
              <tbody>
                {worksLoading ? (
                  <tr>
                    <td colSpan={8} className="ia-loading-state">
                      Reconciling payment requests...
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ia-empty-state">
                      <Coins size={32} className="ia-empty-icon" />
                      <strong>No Payment Records Found</strong>
                      <p>Payment requests and disbursement claims will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => {
                    const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                    const variance = (w.ACTUAL_AMOUNT || 0) - (w.SANCTION_AMOUNT || 0);
                    const isOver = variance > 0;
                    return (
                      <tr key={wid}>
                        <td>
                          <button
                            type="button"
                            className="ia-work-id-btn"
                            onClick={() => handleSelectWork(w, "financials")}
                          >
                            {wid}
                          </button>
                        </td>
                        <td>
                          <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                            {w.WORK_DESCRIPTION || "Description not available"}
                          </span>
                          <span className="ia-desc-subtext">
                            {w.IDA_NAME || "Agency Not Recorded"}
                          </span>
                        </td>
                        <td>
                          <span className="ia-stage-pill ongoing">
                            {w.WORK_STAGE || "Active"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                        </td>
                        <td>
                          ₹ {formatNumber(w.ACTUAL_AMOUNT || 0)}
                        </td>
                        <td>
                          <span className={`ia-risk-tag ${isOver ? "high" : "low"}`}>
                            {isOver ? `+ ₹ ${formatNumber(variance)} Escalation` : "Within Sanction"}
                          </span>
                        </td>
                        <td>
                          {w.COST_VS_PEER ? `${formatDecimal(w.COST_VS_PEER, 2)}x Peer` : "Normal"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="ia-action-btn"
                            onClick={() => handleSelectWork(w, "financials")}
                          >
                            <Eye size={13} />
                            <span>MB Billing Dossier →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ia-pagination">
            <span>Page {worksPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage <= 1}
                onClick={() => setWorksPage(worksPage - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage >= totalPages}
                onClick={() => setWorksPage(worksPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SECTION 5: VENDOR ACTIVITY (Vendor-wise execution/payment info)
          ------------------------------------------------------------ */}
      {currentTab === "vendor-activity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Top Executing Agencies Summary Cards */}
          <div className="ia-section-card">
            <div className="ia-section-header">
              <div className="ia-section-title-wrap">
                <h2 className="ia-section-heading">
                  <Building2 size={16} />
                  Executing Agency & Vendor Distribution
                </h2>
                <p className="ia-section-subtitle">
                  Work volume, financial sanctions, and actual payments across designated implementing authorities
                </p>
              </div>
            </div>

            <div className="ia-vendor-grid">
              {analytics?.vendor_summary && analytics.vendor_summary.length > 0 ? (
                analytics.vendor_summary.slice(0, 12).map((vend) => (
                  <div
                    key={vend.ida_name}
                    className={`ia-vendor-card ${selectedIDA === vend.ida_name ? "selected" : ""}`}
                    onClick={() => {
                      handleSelectIA(vend.ida_name);
                    }}
                    title="Click to filter entire dashboard to this agency"
                  >
                    <div className="ia-vendor-card-header">
                      <span className="ia-vendor-name" title={vend.ida_name}>
                        {vend.clean_name}
                      </span>
                      <span className="ia-vendor-works-pill">
                        {vend.total_works} Works
                      </span>
                    </div>
                    <div className="ia-vendor-metrics-row">
                      <div className="ia-vendor-metric-item">
                        <span>Sanctioned</span>
                        <strong>₹ {formatCrores(vend.sanction_amount)} Cr</strong>
                      </div>
                      <div className="ia-vendor-metric-item">
                        <span>Disbursed</span>
                        <strong>₹ {formatCrores(vend.actual_amount)} Cr</strong>
                      </div>
                      <div className="ia-vendor-metric-item">
                        <span>Completed</span>
                        <strong>{vend.completed_works}</strong>
                      </div>
                      <div className="ia-vendor-metric-item">
                        <span>Utilization</span>
                        <strong>{vend.utilization_pct}%</strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="ia-loading-state">Loading executing agency distribution...</div>
              )}
            </div>
          </div>

          {/* Detailed Vendor Works Table */}
          <div className="ia-section-card">
            <div className="ia-section-header">
              <div className="ia-section-title-wrap">
                <h2 className="ia-section-heading">
                  <Building2 size={16} />
                  Vendor Execution & Payment Ledger
                </h2>
                <p className="ia-section-subtitle">
                  Project assignments and recorded financial disbursements by executing body
                </p>
              </div>
              <div className="ia-section-actions">
                <button
                  type="button"
                  className="ia-action-btn"
                  onClick={handleExportCSV}
                >
                  <Download size={13} />
                  <span>Export Vendor Works</span>
                </button>
              </div>
            </div>

            <div className="ia-table-responsive">
              <table className="ia-table">
                <thead>
                  <tr>
                    <th>Work ID</th>
                    <th>Description</th>
                    <th>Implementing Agency / Vendor</th>
                    <th>Stage</th>
                    <th>Sanction (₹)</th>
                    <th>Disbursed Spend (₹)</th>
                    <th style={{ textAlign: "right" }}>Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {worksLoading ? (
                    <tr>
                      <td colSpan={7} className="ia-loading-state">
                        Loading vendor execution records...
                      </td>
                    </tr>
                  ) : works.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="ia-empty-state">
                        <Building2 size={32} className="ia-empty-icon" />
                        <strong>No Vendor Records Found</strong>
                        <p>No active assignments recorded under this scope.</p>
                      </td>
                    </tr>
                  ) : (
                    works.map((w) => {
                      const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                      return (
                        <tr key={wid}>
                          <td>
                            <button
                              type="button"
                              className="ia-work-id-btn"
                              onClick={() => handleSelectWork(w, "overview")}
                            >
                              {wid}
                            </button>
                          </td>
                          <td>
                            <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                              {w.WORK_DESCRIPTION || "Description not available"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {w.IDA_NAME || "Executing Agency"}
                          </td>
                          <td>
                            <span className="ia-stage-pill ongoing">
                              {w.WORK_STAGE || "Active"}
                            </span>
                          </td>
                          <td>
                            ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                          </td>
                          <td>
                            ₹ {formatNumber(w.ACTUAL_AMOUNT || 0)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="ia-action-btn"
                              onClick={() => handleSelectWork(w, "overview")}
                            >
                              <Eye size={13} />
                              <span>Contractor Dossier →</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="ia-pagination">
              <span>Page {worksPage} of {totalPages}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="ia-page-btn"
                  disabled={worksPage <= 1}
                  onClick={() => setWorksPage(worksPage - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="ia-page-btn"
                  disabled={worksPage >= totalPages}
                  onClick={() => setWorksPage(worksPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SECTION 6: EVIDENCE UPLOAD (Stage-wise photographs/documents)
          ------------------------------------------------------------ */}
      {currentTab === "evidence-upload" && (
        <div className="ia-section-card">
          <div className="ia-context-banner">
            <div className="ia-context-banner-left">
              <div className="ia-context-eyebrow">
                <FileCheck size={13} />
                Quality Assurance
              </div>
              <h2 className="ia-context-title">Stage-Wise Evidence & Photographic Documentation</h2>
              <p className="ia-context-desc">
                Mandatory inspection records, Measurement Book (MB) uploads, and AI evidence quality scores.
              </p>
            </div>
            <div className="ia-section-actions">
              <button
                type="button"
                className="ia-action-btn"
                onClick={handleExportCSV}
              >
                <Download size={13} />
                <span>Export Evidence</span>
              </button>
            </div>
          </div>

          <div className="ia-table-responsive">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Work ID</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Evidence Quality Score</th>
                  <th>Evidence Status</th>
                  <th>Executing Agency</th>
                  <th style={{ textAlign: "right" }}>Examine</th>
                </tr>
              </thead>
              <tbody>
                {worksLoading ? (
                  <tr>
                    <td colSpan={7} className="ia-loading-state">
                      Loading evidence upload records...
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ia-empty-state">
                      <FileCheck size={32} className="ia-empty-icon" />
                      <strong>No Uploaded Evidence Found</strong>
                      <p>Stage documentation records will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => {
                    const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                    const score = w.EVIDENCE_SCORE;
                    const isLow = score !== null && score < 60;
                    return (
                      <tr key={wid}>
                        <td>
                          <button
                            type="button"
                            className="ia-work-id-btn"
                            onClick={() => handleSelectWork(w, "evidence")}
                          >
                            {wid}
                          </button>
                        </td>
                        <td>
                          <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                            {w.WORK_DESCRIPTION || "Description not available"}
                          </span>
                        </td>
                        <td>
                          <span className="ia-stage-pill inspection">
                            {w.WORK_STAGE || "Inspection"}
                          </span>
                        </td>
                        <td>
                          <span className={`ia-risk-tag ${isLow ? "high" : score >= 80 ? "low" : "medium"}`}>
                            {score !== null && score !== undefined ? `${score} / 100` : "Assessing"}
                          </span>
                        </td>
                        <td>
                          <span className={`ia-evidence-tag ${isLow ? "flagged" : ""}`}>
                            {isLow ? "Rectification Required" : "Stage Verified"}
                          </span>
                        </td>
                        <td>
                          {w.IDA_NAME || "Agency Not Recorded"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="ia-action-btn"
                            onClick={() => handleSelectWork(w, "evidence")}
                          >
                            <Eye size={13} />
                            <span>Site Evidence Dossier →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ia-pagination">
            <span>Page {worksPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage <= 1}
                onClick={() => setWorksPage(worksPage - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage >= totalPages}
                onClick={() => setWorksPage(worksPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SECTION 7: GEO-PHOTO VERIFICATION (Location/evidence status)
          ------------------------------------------------------------ */}
      {currentTab === "geo-photo-verification" && (
        <div className="ia-section-card">
          <div className="ia-context-banner">
            <div className="ia-context-banner-left">
              <div className="ia-context-eyebrow">
                <Camera size={13} />
                Site GPS Compliance
              </div>
              <h2 className="ia-context-title">Geo-Tagged Site Photo Verification</h2>
              <p className="ia-context-desc">
                Physical site photos, GPS geofence compliance, and automated perceptual image deduplication.
              </p>
            </div>
            <div className="ia-section-actions">
              <Link to="/photo-verifier" className="ia-action-btn" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
                <Camera size={14} />
                <span>Launch Geo-Photo AI Verifier</span>
              </Link>
            </div>
          </div>

          <div className="ia-table-responsive">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Work ID</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Sanction Amount (₹)</th>
                  <th>Geo-Photo Status</th>
                  <th>Constituency / State</th>
                  <th style={{ textAlign: "right" }}>Verify</th>
                </tr>
              </thead>
              <tbody>
                {worksLoading ? (
                  <tr>
                    <td colSpan={7} className="ia-loading-state">
                      Verifying geo-tagged photographic records...
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ia-empty-state">
                      <Camera size={32} className="ia-empty-icon" />
                      <strong>No Photographic Records Pending</strong>
                      <p>All active inspection sites have validated photography.</p>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => {
                    const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                    return (
                      <tr key={wid}>
                        <td>
                          <button
                            type="button"
                            className="ia-work-id-btn"
                            onClick={() => handleSelectWork(w, "geo-photo")}
                          >
                            {wid}
                          </button>
                        </td>
                        <td>
                          <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                            {w.WORK_DESCRIPTION || "Description not available"}
                          </span>
                        </td>
                        <td>
                          <span className="ia-stage-pill inspection">
                            {w.WORK_STAGE || "Physical Inspection"}
                          </span>
                        </td>
                        <td>
                          ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                        </td>
                        <td>
                          <span className="ia-evidence-tag">
                            <Camera size={11} />
                            GPS Geo-Tagged
                          </span>
                        </td>
                        <td>
                          {w.CONSTITUENCY || w.STATE_NAME || "National"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="ia-action-btn"
                            onClick={() => handleSelectWork(w, "geo-photo")}
                          >
                            <Eye size={13} />
                            <span>Geo-Photo Dossier →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ia-pagination">
            <span>Page {worksPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage <= 1}
                onClick={() => setWorksPage(worksPage - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage >= totalPages}
                onClick={() => setWorksPage(worksPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SECTION 8: MISSING EVIDENCE (Required evidence not uploaded)
          ------------------------------------------------------------ */}
      {currentTab === "missing-evidence" && (
        <div className="ia-section-card">
          <div className="ia-context-banner">
            <div className="ia-context-banner-left">
              <div className="ia-context-eyebrow">
                <AlertTriangle size={13} />
                Compliance Deficiencies
              </div>
              <h2 className="ia-context-title">Missing Evidence & Incomplete Documentation</h2>
              <p className="ia-context-desc">
                Active civil infrastructure works lacking mandatory milestone photographs, low AI quality scores (&lt;60), or audit flags.
              </p>
            </div>
            <div className="ia-section-actions">
              <button
                type="button"
                className="ia-action-btn"
                onClick={handleExportCSV}
              >
                <Download size={13} />
                <span>Export Deficiencies</span>
              </button>
            </div>
          </div>

          <div className="ia-table-responsive">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Work ID</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Sanction (₹)</th>
                  <th>Quality Score</th>
                  <th>Deficiency Reason</th>
                  <th style={{ textAlign: "right" }}>Remediation</th>
                </tr>
              </thead>
              <tbody>
                {worksLoading ? (
                  <tr>
                    <td colSpan={7} className="ia-loading-state">
                      Auditing missing documentation...
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ia-empty-state">
                      <CheckCircle2 size={32} color="#16a34a" />
                      <strong>Zero Evidence Deficiencies</strong>
                      <p>All active works possess compliant stage documentation and photographs.</p>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => {
                    const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                    return (
                      <tr key={wid}>
                        <td>
                          <button
                            type="button"
                            className="ia-work-id-btn"
                            onClick={() => handleSelectWork(w, "evidence")}
                          >
                            {wid}
                          </button>
                        </td>
                        <td>
                          <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                            {w.WORK_DESCRIPTION || "Description not available"}
                          </span>
                          <span className="ia-desc-subtext">
                            {w.IDA_NAME || "Agency Not Recorded"}
                          </span>
                        </td>
                        <td>
                          <span className="ia-stage-pill ongoing">
                            {w.WORK_STAGE || "Active"}
                          </span>
                        </td>
                        <td>
                          ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                        </td>
                        <td>
                          <span className="ia-risk-tag high">
                            {w.EVIDENCE_SCORE !== null && w.EVIDENCE_SCORE !== undefined ? `${w.EVIDENCE_SCORE}/100` : "Missing"}
                          </span>
                        </td>
                        <td>
                          <span className="ia-evidence-tag flagged">
                            {w.REVIEW_REASON || "Stage photo/MB record missing"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="ia-action-btn"
                            onClick={() => handleSelectWork(w, "evidence")}
                          >
                            <Eye size={13} />
                            <span>Compliance Dossier →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ia-pagination">
            <span>Page {worksPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage <= 1}
                onClick={() => setWorksPage(worksPage - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage >= totalPages}
                onClick={() => setWorksPage(worksPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SECTION 9: COMPLETION (Works ready to mark complete)
          ------------------------------------------------------------ */}
      {currentTab === "completion" && (
        <div className="ia-section-card">
          <div className="ia-context-banner">
            <div className="ia-context-banner-left">
              <div className="ia-context-eyebrow">
                <CheckCircle2 size={13} />
                Asset Delivery & Handover
              </div>
              <h2 className="ia-context-title">Completion Verification & Asset Handover</h2>
              <p className="ia-context-desc">
                Works in partial completion nearing duration limits, and completed infrastructure ready for administrative handover.
              </p>
            </div>
            <div className="ia-section-actions">
              <select
                value={subfilter}
                onChange={(e) => {
                  setSubfilter(e.target.value);
                  setWorksPage(1);
                }}
                className="ia-filter-select"
              >
                <option value="all">All Completion Records</option>
                <option value="ready">Ready for Final Inspection (Partially Completed)</option>
                <option value="completed">Work Completed (Handover Ready)</option>
              </select>
              <button
                type="button"
                className="ia-action-btn"
                onClick={handleExportCSV}
              >
                <Download size={13} />
                <span>Export Completion</span>
              </button>
            </div>
          </div>

          <div className="ia-table-responsive">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Work ID</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Completion / Recommendation Date</th>
                  <th>Sanctioned (₹)</th>
                  <th>Actual Final Cost (₹)</th>
                  <th>Duration (Days)</th>
                  <th style={{ textAlign: "right" }}>Signoff</th>
                </tr>
              </thead>
              <tbody>
                {worksLoading ? (
                  <tr>
                    <td colSpan={8} className="ia-loading-state">
                      Loading completion records...
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ia-empty-state">
                      <CheckCircle2 size={32} className="ia-empty-icon" />
                      <strong>No Works Ready for Completion</strong>
                      <p>Projects ready for final inspection or handover will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => {
                    const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                    const isFullyDone = w.WORK_STAGE === "Work Completed";
                    return (
                      <tr key={wid}>
                        <td>
                          <button
                            type="button"
                            className="ia-work-id-btn"
                            onClick={() => handleSelectWork(w, "completion")}
                          >
                            {wid}
                          </button>
                        </td>
                        <td>
                          <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                            {w.WORK_DESCRIPTION || "Description not available"}
                          </span>
                          <span className="ia-desc-subtext">
                            {w.IDA_NAME || "Agency Not Recorded"}
                          </span>
                        </td>
                        <td>
                          <span className={`ia-stage-pill ${isFullyDone ? "completed" : "ongoing"}`}>
                            {w.WORK_STAGE || "In Progress"}
                          </span>
                        </td>
                        <td>
                          {w.ACTUAL_END_DATE || w.RECOMMENDATION_DATE || "Recorded"}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                        </td>
                        <td>
                          ₹ {formatNumber(w.ACTUAL_AMOUNT || 0)}
                        </td>
                        <td>
                          {w.COMPLETION_DURATION_DAYS ? `${w.COMPLETION_DURATION_DAYS} d` : "N/A"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="ia-action-btn"
                            onClick={() => handleSelectWork(w, "completion")}
                          >
                            <Eye size={13} />
                            <span>Handover Dossier →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ia-pagination">
            <span>Page {worksPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage <= 1}
                onClick={() => setWorksPage(worksPage - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage >= totalPages}
                onClick={() => setWorksPage(worksPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SECTION 10: AI ALERTS (Inconsistencies requiring correction)
          ------------------------------------------------------------ */}
      {currentTab === "ai-alerts" && (
        <div className="ia-section-card">
          <div className="ia-context-banner">
            <div className="ia-context-banner-left">
              <div className="ia-context-eyebrow">
                <Sparkles size={13} />
                Automated Audit Surveillance
              </div>
              <h2 className="ia-context-title">AI Alerts & Execution Inconsistencies</h2>
              <p className="ia-context-desc">
                Machine-learning flags covering duplicate proposals, cost escalation anomalies, duration overruns, and audit review triggers.
              </p>
            </div>
            <div className="ia-section-actions">
              <button
                type="button"
                className="ia-action-btn"
                onClick={handleExportCSV}
              >
                <Download size={13} />
                <span>Export AI Alerts</span>
              </button>
            </div>
          </div>

          <div className="ia-table-responsive">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Work ID</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Sanction Amount (₹)</th>
                  <th>AI Inconsistency Classification</th>
                  <th>Audit Trigger Reason</th>
                  <th style={{ textAlign: "right" }}>Resolve</th>
                </tr>
              </thead>
              <tbody>
                {worksLoading ? (
                  <tr>
                    <td colSpan={7} className="ia-loading-state">
                      Scanning AI inconsistency flags...
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ia-empty-state">
                      <Sparkles size={32} className="ia-empty-icon" />
                      <strong>No Inconsistencies Detected</strong>
                      <p>All active works pass AI verification tests with no audit flags.</p>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => {
                    const wid = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                    const isDup = w.DUPLICATE_RISK === "HIGH";
                    const isCost = (w.COST_VARIANCE || 0) > 0;
                    return (
                      <tr key={wid}>
                        <td>
                          <button
                            type="button"
                            className="ia-work-id-btn"
                            onClick={() => handleSelectWork(w, "actions")}
                          >
                            {wid}
                          </button>
                        </td>
                        <td>
                          <span className="ia-desc-text" title={w.WORK_DESCRIPTION}>
                            {w.WORK_DESCRIPTION || "Description not available"}
                          </span>
                          <span className="ia-desc-subtext">
                            {w.IDA_NAME || "Agency Not Recorded"}
                          </span>
                        </td>
                        <td>
                          <span className="ia-stage-pill ongoing">
                            {w.WORK_STAGE || "Active"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                        </td>
                        <td>
                          <span className="ia-risk-tag high">
                            {isDup ? "Duplicate Cluster" : isCost ? "Cost Escalation" : w.RISK_LEVEL || "Audit Flag"}
                          </span>
                        </td>
                        <td>
                          <span className="ia-evidence-tag flagged">
                            {w.REVIEW_REASON || "Inconsistency detected requiring correction"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="ia-action-btn"
                            onClick={() => handleSelectWork(w, "actions")}
                          >
                            <Eye size={13} />
                            <span>IA Correction Dossier →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ia-pagination">
            <span>Page {worksPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage <= 1}
                onClick={() => setWorksPage(worksPage - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="ia-page-btn"
                disabled={worksPage >= totalPages}
                onClick={() => setWorksPage(worksPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Drawer Container if not handled at App root */}
      {localSelectedWork && (
        <WorkDetailDrawer
          work={localSelectedWork}
          onClose={() => setLocalSelectedWork(null)}
        />
      )}
    </div>
  );
}
