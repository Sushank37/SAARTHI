import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  ChevronDown,
  Download,
  Eye,
  RefreshCw,
  ExternalLink,
  MapPin,
  FileText,
  ShieldAlert,
  GitBranch,
  Camera,
  Layers,
  ArrowRight,
  TrendingUp,
  Coins,
  Building2,
  FileCheck,
  Bell,
  Filter,
  AlertOctagon,
  Menu,
  X,
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
import { getRequests, getRequestCounts } from "../../services/workflowService";
import RequestTable from "../../components/workflow/RequestTable";
import "./DADashboard.css";

// 11 Specific District Authority Navigation Modules
const DA_MODULES = [
  { id: "overview", label: "District Overview", icon: LayoutDashboardIcon },
  { id: "pending-sanctions", label: "Pending Sanctions", icon: Clock },
  { id: "compliance-45d", label: "45-Day Compliance", icon: AlertTriangle },
  { id: "completion", label: "Completion Monitoring", icon: CheckCircle2 },
  { id: "financials", label: "Financial Monitoring", icon: Coins },
  { id: "risk-cases", label: "Risk Cases", icon: ShieldAlert },
  { id: "duplicates", label: "Duplicate Intelligence", icon: GitBranch },
  { id: "ia-monitoring", label: "Vendor/IA Monitoring", icon: Building2 },
  { id: "evidence", label: "Evidence Verification", icon: FileCheck },
  { id: "geo-photo", label: "Geo-Photo Verification", icon: Camera },
  { id: "alerts-queue", label: "Alerts & Queue", icon: Bell },
];
function LayoutDashboardIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 15}
      height={props.size || 15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

export default function DADashboard({
  summary,
  onSelectWork,
  sidebarOpen: propSidebarOpen,
  setSidebarOpen: propSetSidebarOpen,
  toggleSidebar: propToggleSidebar,
}) {
  let outletCtx = {};
  try {
    outletCtx = useOutletContext() || {};
  } catch {
    outletCtx = {};
  }

  const [localSidebarOpen, setLocalSidebarOpen] = useState(true);

  const isSidebarOpen =
    propSidebarOpen !== undefined
      ? propSidebarOpen
      : outletCtx.sidebarOpen !== undefined
        ? outletCtx.sidebarOpen
        : localSidebarOpen;

  const handleToggleSidebar = () => {
    if (propToggleSidebar) {
      propToggleSidebar();
    } else if (outletCtx.toggleSidebar) {
      outletCtx.toggleSidebar();
    } else if (propSetSidebarOpen) {
      propSetSidebarOpen((prev) => !prev);
    } else if (outletCtx.setSidebarOpen) {
      outletCtx.setSidebarOpen((prev) => !prev);
    } else {
      setLocalSidebarOpen((prev) => !prev);
    }
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  const { roleConfig } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active module tab from URL query param: e.g. /da?tab=compliance-45d
  const currentTab = searchParams.get("tab") || "overview";

  // Subfilter within the active module tab
  const [subfilter, setSubfilter] = useState("all");

  // Active District Authority selection state
  // Default: Jaunpur DM Collectorate (High volume canonical district authority with 1,851 works)
  const [selectedIDA, setSelectedIDA] = useState("JAUNPUR(DISTRICT MAGISTRATE JAUNPUR_IDA)");
  const [idaDropdownOpen, setIdaDropdownOpen] = useState(false);
  const [idaSearchText, setIdaSearchText] = useState("");
  const [idasList, setIdasList] = useState([]);

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
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);
  const [workSearchQuery, setWorkSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeKpiFilter, setActiveKpiFilter] = useState(null);
  const [localSelectedWork, setLocalSelectedWork] = useState(null);

  // Incoming cross-role workflow requests
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [incomingRequestsLoading, setIncomingRequestsLoading] = useState(false);
  const [requestCounts, setRequestCounts] = useState(null);

  const fetchIncomingRequests = async () => {
    setIncomingRequestsLoading(true);
    try {
      const data = await getRequests({ targetRole: "DISTRICT_AUTHORITY" });
      setIncomingRequests(data.requests || []);
      const counts = await getRequestCounts("DISTRICT_AUTHORITY");
      setRequestCounts(counts);
    } catch (err) {
      console.error("Failed to load incoming requests:", err);
    } finally {
      setIncomingRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomingRequests();
  }, [selectedIDA]);

  // Map active module tab to dossier audit section
  const getAuditSectionForTab = (tab) => {
    switch (tab) {
      case "pending-sanctions": return "sanction";
      case "compliance-45d": return "compliance-45d";
      case "completion": return "completion";
      case "financials": return "financials";
      case "risk-cases": return "risk";
      case "duplicates": return "duplicates";
      case "ia-monitoring": return "ia";
      case "evidence": return "evidence";
      case "geo-photo": return "geo-photo";
      case "alerts-queue": return "actions";
      default: return "overview";
    }
  };

  const handleSelectWork = (work, section = null) => {
    if (!work) return;
    const targetSec = section || getAuditSectionForTab(currentTab);
    const workWithSec = { ...work, __initialSection: targetSec, __authority: "DISTRICT_AUTHORITY" };
    if (typeof onSelectWork === "function") {
      onSelectWork(workWithSec);
    } else {
      setLocalSelectedWork(workWithSec);
    }
  };

  // Switch active tab
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setWorksPage(1);
    setSubfilter("all");
    setSelectedStage("All");
    setFilterFlaggedOnly(false);
    setActiveKpiFilter(null);
  };

  // Load master list of District Authorities (763 IDAs) from dataset
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
        console.error("Failed to load District Authorities:", err);
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

  // Load DA Analytics
  const loadDAAnalytics = async (idaName) => {
    setAnalyticsLoading(true);
    try {
      let url = `${API_BASE}/api/analytics/da`;
      if (idaName && idaName !== "ALL") {
        url += `?ida_name=${encodeURIComponent(idaName)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching District Authority analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadDAAnalytics(selectedIDA);
    setWorksPage(1);
    setActiveKpiFilter(null);
  }, [selectedIDA]);

  // Load District Works from canonical backend
  const loadDistrictWorks = async () => {
    setWorksLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", worksPage);
      params.set("limit", worksLimit);

      if (selectedIDA && selectedIDA !== "ALL") {
        params.set("ida_name", selectedIDA);
      }

      // Pass current active module tab to backend
      if (currentTab && currentTab !== "overview") {
        params.set("tab", currentTab);
      }

      // Pass subfilter if active
      if (subfilter && subfilter !== "all") {
        params.set("subfilter", subfilter);
      }

      if (selectedStage && selectedStage !== "All") {
        params.set("stage", selectedStage);
      }

      if (filterFlaggedOnly || activeKpiFilter === "attention") {
        params.set("requires_review", "true");
      }

      if (debouncedSearch.trim()) {
        params.set("q", debouncedSearch.trim());
      }

      const res = await fetch(`${API_BASE}/api/works?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorks(data.data || []);
      setWorksTotal(data.total || 0);
    } catch (err) {
      console.error("Error loading district works register:", err);
      setWorks([]);
      setWorksTotal(0);
    } finally {
      setWorksLoading(false);
    }
  };

  useEffect(() => {
    loadDistrictWorks();
  }, [
    selectedIDA,
    currentTab,
    subfilter,
    worksPage,
    selectedStage,
    filterFlaggedOnly,
    activeKpiFilter,
    debouncedSearch,
  ]);

  // Filtered IDA list for selector dropdown
  const filteredIdas = useMemo(() => {
    if (!idaSearchText.trim()) return idasList.slice(0, 45);
    const q = idaSearchText.toLowerCase();
    return idasList
      .filter(
        (ida) =>
          (ida.ida_name && ida.ida_name.toLowerCase().includes(q)) ||
          (ida.district_name && ida.district_name.toLowerCase().includes(q)) ||
          (ida.state && ida.state.toLowerCase().includes(q))
      )
      .slice(0, 45);
  }, [idasList, idaSearchText]);

  // Derived factual values from backend analytics
  const kpis = analytics?.kpis || {};
  const financials = analytics?.financials || {};
  const sanctionMonitoring = analytics?.sanction_monitoring || {};
  const compliance45d = analytics?.compliance_45d || {};
  const completionMonitoring = analytics?.completion_monitoring || {};
  const stages = analytics?.stages || {};
  const riskSummary = analytics?.risk_summary || {};
  const evidenceVerification = analytics?.evidence_verification || {};
  const iaPerformance = analytics?.ia_performance || [];
  const priorityCases = analytics?.priority_cases || [];
  const sidebarBadges = analytics?.sidebar_badges || {};
  const totalWorks = analytics?.total_works || 0;

  const totalPages = Math.max(1, Math.ceil(worksTotal / worksLimit));

  // CSV Export handler
  const handleExportCSV = () => {
    if (!works.length) return;
    const safeName = (analytics?.district_name || "District").replace(/\s+/g, "_");
    const filename = `MPLADS_DA_${currentTab}_${safeName}.csv`;
    exportToCSV(works, filename);
  };

  // Toggle KPI Filters in Overview
  const handleKpiCardClick = (filterType) => {
    if (activeKpiFilter === filterType) {
      setActiveKpiFilter(null);
      setFilterFlaggedOnly(false);
    } else {
      setActiveKpiFilter(filterType);
      if (filterType === "attention") {
        setFilterFlaggedOnly(true);
      } else {
        setFilterFlaggedOnly(false);
      }
    }
    setWorksPage(1);
  };

  return (
    <div className="da-dashboard-container">
      {/* 1. Official Persona Identity & District Jurisdiction Header */}
      <div className="da-official-header-card">
        <div className="da-header-inner">
          <div className="da-identity-block">
            <div className="da-header-top-row">
              <button
                type="button"
                id="da-sidebar-toggle-btn"
                className={`da-hamburger-btn ${!isSidebarOpen ? "collapsed" : ""}`}
                onClick={handleToggleSidebar}
                title={isSidebarOpen ? t("Hide Sidebar Navigation") : t("Show Sidebar Navigation")}
                aria-label={isSidebarOpen ? t("Hide Sidebar Navigation") : t("Show Sidebar Navigation")}
              >
                <Menu size={16} className="da-hamburger-icon" />
                <span className="da-hamburger-text">{isSidebarOpen ? t("Hide Sidebar") : t("Show Sidebar")}</span>
                {isSidebarOpen && <X size={12} className="da-hamburger-close-indicator" />}
              </button>

              <div className="da-ministry-badge">
                <Scale size={13} />
                <span>{t("Nodal District Authority (DA / Collectorate) · Scrutiny & Sanction Portal")}</span>
              </div>
            </div>
            <h1 className="da-name-heading">
              {analytics?.district_name
                ? `${t(analytics.district_name)} ${t("District Administration")}`
                : t("District Magistrate / Collectorate")}
            </h1>
            <p className="da-constituency-crumb">
              <MapPin size={14} color="#64748b" />
              <span>
                {t("Nodal Authority:")} <strong>{t(analytics?.ida_name || selectedIDA)}</strong> · {t("State:")}{" "}
                <strong>{t(analytics?.state || "Uttar Pradesh")}</strong> · {t("Scope Jurisdiction:")}{" "}
                <strong>{formatNumber(totalWorks)} {t("Works Audited")}</strong>
              </span>
            </p>
          </div>

          {/* Searchable District Authority Selector Dropdown */}
          <div className="da-selector-wrapper">
            <button
              type="button"
              className="da-selector-btn"
              onClick={() => setIdaDropdownOpen(!idaDropdownOpen)}
              title={t("Select District Authority from 763 authorities in dataset")}
            >
              <div>
                <span className="da-selector-caption">
                  {t("Jurisdiction Authority")} ({idasList.length || 763} IDAs)
                </span>
                <span className="da-selector-active-name">
                  {selectedIDA === "ALL"
                    ? t("All District Authorities (National Scope)")
                    : t(analytics?.district_name || selectedIDA)}
                </span>
              </div>
              <ChevronDown size={16} color="#64748b" />
            </button>

            {idaDropdownOpen && (
              <div className="da-dropdown-menu">
                <div className="da-dropdown-search">
                  <Search size={13} color="#64748b" />
                  <input
                    type="text"
                    className="da-dropdown-input"
                    placeholder={t("Search district, collectorate or state...")}
                    value={idaSearchText}
                    onChange={(e) => setIdaSearchText(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="da-dropdown-scroll">
                  <div
                    className={`da-dropdown-row ${selectedIDA === "ALL" ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedIDA("ALL");
                      setIdaDropdownOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-semibold">{t("All District Authorities (National Scope)")}</div>
                      <div className="da-row-meta">{t("Aggregated across all 763 Collectorates")}</div>
                    </div>
                    <span className="da-row-works-count">102,703</span>
                  </div>

                  {filteredIdas.map((ida) => (
                    <div
                      key={ida.ida_name}
                      className={`da-dropdown-row ${ida.ida_name === selectedIDA ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedIDA(ida.ida_name);
                        setIdaDropdownOpen(false);
                      }}
                    >
                      <div style={{ maxWidth: "260px" }}>
                        <div className="truncate font-semibold">
                          {t(ida.district_name || ida.ida_name)}
                        </div>
                        <div className="da-row-meta truncate">
                          {t(ida.state)} {ida.constituency ? `· ${t(ida.constituency)}` : ""}
                        </div>
                      </div>
                      {ida.works_count > 0 && (
                        <span className="da-row-works-count">{formatNumber(ida.works_count)}</span>
                      )}
                    </div>
                  ))}
                  {filteredIdas.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500">
                      {t("No matching authority found")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Module Navigation Tabs (Synchronized with the 11 Sidebar Items) */}
      <div className="da-top-nav-bar">
        {DA_MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentTab === mod.id;
          const badgeVal = sidebarBadges[mod.id.replace("-", "_")];
          return (
            <button
              key={mod.id}
              type="button"
              className={`da-top-nav-pill ${isActive ? "active" : ""}`}
              onClick={() => handleTabChange(mod.id)}
            >
              <Icon size={14} />
              <span>{t(mod.label)}</span>
              {badgeVal !== undefined && (
                <span className="text-xs opacity-75">({formatNumber(badgeVal)})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Render Specific Content Based on Active Module Tab */}

      {/* TAB 1: DISTRICT OVERVIEW */}
      {currentTab === "overview" && (
        <>
          {/* 4-Metric Official KPI Bar */}
          <div className="da-metrics-bar">
            <div
              className={`da-metric-card ${activeKpiFilter === null ? "active-filter" : ""}`}
              onClick={() => handleKpiCardClick(null)}
              title="Total works under this District Authority"
            >
              <div className="da-metric-top">
                <span className="da-metric-caption">{t("Total Works in Scope")}</span>
                <span className="da-metric-pill neutral">{t("JURISDICTION")}</span>
              </div>
              <span className="da-metric-figure">{formatNumber(kpis.total_works || totalWorks)}</span>
              <span className="da-metric-subtext">
                {t("Recommended:")} <strong>{formatCrores(kpis.recommended_amount || 0)}</strong>
              </span>
            </div>

            <div
              className={`da-metric-card ${activeKpiFilter === "attention" ? "active-filter" : ""}`}
              onClick={() => handleKpiCardClick("attention")}
              title={t("Works requiring administrative scrutiny or review")}
            >
              <div className="da-metric-top">
                <span className="da-metric-caption">{t("Requires Attention")}</span>
                <span className="da-metric-pill alert">{t("SCRUTINY")}</span>
              </div>
              <span className="da-metric-figure">{formatNumber(kpis.attention_required || 0)}</span>
              <span className="da-metric-subtext">
                <strong>{riskSummary.requires_review || 0}</strong> {t("review flags")} ·{" "}
                <strong>{riskSummary.high_duplicate_risk || 0}</strong> {t("duplicate alerts")}
              </span>
            </div>

            <div
              className={`da-metric-card ${activeKpiFilter === "risk" ? "active-filter" : ""}`}
              onClick={() => handleKpiCardClick("risk")}
              title={t("High-risk and anomaly works")}
            >
              <div className="da-metric-top">
                <span className="da-metric-caption">{t("High Risk Anomalies")}</span>
                <span className="da-metric-pill warning">{t("INTELLIGENCE")}</span>
              </div>
              <span className="da-metric-figure">{formatNumber(kpis.high_risk_works || 0)}</span>
              <span className="da-metric-subtext">
                {t("Sanction Conversion:")} <strong>{kpis.sanction_conversion_rate || 0}%</strong> {t("of proposals")}
              </span>
            </div>

            <div
              className={`da-metric-card ${activeKpiFilter === "timeline" ? "active-filter" : ""}`}
              onClick={() => handleKpiCardClick("timeline")}
              title={t("Timeline delay concerns")}
            >
              <div className="da-metric-top">
                <span className="da-metric-caption">{t("Timeline Concerns")}</span>
                <span className="da-metric-pill neutral">{t("COMPLIANCE")}</span>
              </div>
              <span className="da-metric-figure">{formatNumber(kpis.timeline_concerns || 0)}</span>
              <span className="da-metric-subtext">
                {t("Completion Rate:")} <strong>{kpis.completion_rate || 0}%</strong> ·{" "}
                <strong>{completionMonitoring.overdue_count || 0}</strong> {t("overdue (>1 yr)")}
              </span>
            </div>
          </div>

          {/* Operational Status Strip */}
          <div className={`da-status-strip ${kpis.attention_required > 0 ? "has-alerts" : ""}`}>
            <div className="da-strip-left">
              {kpis.attention_required > 0 ? (
                <>
                  <AlertTriangle size={18} color="#b45309" />
                  <span>
                    <strong>{t("District Authority Action Required:")}</strong>{" "}
                    {riskSummary.requires_review || 0} {t("proposals pending feasibility review and")}{" "}
                    {riskSummary.high_duplicate_risk || 0} {t("duplicate clusters require clearance.")}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} color="#15803d" />
                  <span>
                    <strong>{t("Operational Clearance Up-to-Date:")}</strong> {t("All proposals within")}{" "}
                    {analytics?.district_name || "district"} {t("jurisdiction have verified status.")}
                  </span>
                </>
              )}
            </div>
            <div className="da-strip-actions">
              <button
                type="button"
                className="da-strip-btn"
                onClick={() => handleTabChange("alerts-queue")}
              >
                <FileText size={13} />
                <span>{t("Open Priority Queue")} ({formatNumber(kpis.attention_required || 0)})</span>
              </button>
            </div>
          </div>

          {/* Sanction Pipeline & Compliance Grid */}
          <div className="da-pipeline-section">
            <div className="da-panel-card">
              <div className="da-panel-header">
                <h2 className="da-panel-title">
                  <Layers size={16} color="#b45309" />
                  <span>{t("Sanction & Milestone Execution Pipeline")}</span>
                </h2>
                <span className="da-panel-meta">{t("Click stage to filter register")}</span>
              </div>

              <div className="da-stage-grid">
                {[
                  {
                    id: "Pending Sanction",
                    label: "Pending Sanction",
                    count: sanctionMonitoring.pending_sanction_count || stages["Pending Sanction"] || 0,
                  },
                  {
                    id: "Sanction",
                    label: "Sanction Issued",
                    count: stages["Sanction"] || 0,
                  },
                  {
                    id: "Physical Inspection",
                    label: "Site Inspection",
                    count: stages["Physical Inspection"] || 0,
                  },
                  {
                    id: "Work partially Completed",
                    label: "Under Construction",
                    count: stages["Work partially Completed"] || 0,
                  },
                  {
                    id: "Work Completed",
                    label: "Assets Handed Over",
                    count: stages["Work Completed"] || 0,
                  },
                ].map((st) => {
                  const pct = totalWorks > 0 ? ((st.count / totalWorks) * 100).toFixed(1) : 0;
                  const isSelected = selectedStage === st.id;
                  return (
                    <div
                      key={st.id}
                      className={`da-stage-step-card ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedStage(isSelected ? "All" : st.id);
                        setWorksPage(1);
                      }}
                      title={`Filter by ${t(st.label)}`}
                    >
                      <span className="da-stage-step-name">{t(st.label)}</span>
                      <span className="da-stage-step-count">{formatNumber(st.count)}</span>
                      <span className="da-stage-step-pct">{pct}{t("% of total")}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="da-panel-card">
              <div className="da-panel-header">
                <h2 className="da-panel-title">
                  <Clock size={16} color="#1e3a8a" />
                  <span>{t("Statutory Timeline Compliance")}</span>
                </h2>
              </div>

              <div className="da-compliance-box">
                <div className="da-compliance-row">
                  <span className="da-compliance-label">{t("Average Sanction Delay:")}</span>
                  <span className="da-compliance-val">
                    {formatDecimal(sanctionMonitoring.avg_sanction_delay_days || 0)} {t("Days")}
                  </span>
                </div>
                <div className="da-compliance-row">
                  <span className="da-compliance-label">{t("Peer District Median:")}</span>
                  <span className="da-compliance-val">
                    {formatDecimal(sanctionMonitoring.peer_median_delay_days || 0)} {t("Days")}
                  </span>
                </div>
                <div className="da-compliance-row">
                  <span className="da-compliance-label">{t("Delayed Beyond Peer Median:")}</span>
                  <span
                    className={`da-compliance-val ${sanctionMonitoring.delayed_past_peer_count > 0 ? "warn" : ""
                      }`}
                  >
                    {formatNumber(sanctionMonitoring.delayed_past_peer_count || 0)} {t("Works")}
                  </span>
                </div>
                <div className="da-compliance-row">
                  <span className="da-compliance-label">{t("Overdue > 12 Mo (Statutory MPLADS):")}</span>
                  <span
                    className={`da-compliance-val ${completionMonitoring.overdue_count > 0 ? "alert" : ""
                      }`}
                  >
                    {formatNumber(completionMonitoring.overdue_count || 0)} {t("Works")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Scrutiny Card */}
          <div className="da-panel-card">
            <div className="da-panel-header">
              <h2 className="da-panel-title">
                <TrendingUp size={16} color="#15803d" />
                <span>{t("District Financial Scrutiny & Fund Utilization")}</span>
              </h2>
              <span className="da-panel-meta">
                {t("Sanction Rate:")} <strong>{financials.sanction_rate_percent || 0}%</strong> · {t("Utilization:")}{" "}
                <strong>{financials.expenditure_rate_percent || 0}%</strong>
              </span>
            </div>

            <div className="da-financial-grid">
              <div className="da-fin-item">
                <span className="da-fin-label">{t("Total Recommended Value")}</span>
                <span className="da-fin-val">{formatCrores(financials.recommended_amount || 0)}</span>
                <span className="da-fin-note">{t("From MP Recommendations")}</span>
              </div>
              <div className="da-fin-item">
                <span className="da-fin-label">{t("Sanctioned Amount (AS/TS)")}</span>
                <span className="da-fin-val">{formatCrores(financials.sanction_amount || 0)}</span>
                <span className="da-fin-note">{t("Administrative & Technical Approval")}</span>
              </div>
              <div className="da-fin-item">
                <span className="da-fin-label">{t("Disbursed Expenditure")}</span>
                <span className="da-fin-val">{formatCrores(financials.actual_amount || 0)}</span>
                <span className="da-fin-note">{t("Released to Executing Agencies")}</span>
              </div>
              <div className="da-fin-item">
                <span className="da-fin-label">{t("Uncommitted Balance")}</span>
                <span className="da-fin-val">{formatCrores(financials.remaining_amount || 0)}</span>
                <span className="da-fin-note">{t("Available for Allocation")}</span>
              </div>
            </div>
          </div>

          {/* Priority Scrutiny Focus Strip with View Dossier */}
          {priorityCases.length > 0 && (
            <div className="da-panel-card">
              <div className="da-panel-header">
                <h2 className="da-panel-title">
                  <ShieldAlert size={16} color="#b45309" />
                  <span>{t("District Priority Action Focus")} ({priorityCases.length} Critical Cases in Scope)</span>
                </h2>
                <button
                  type="button"
                  className="da-panel-meta text-blue-700 hover:underline cursor-pointer"
                  onClick={() => handleTabChange("alerts-queue")}
                >
                  {t("View Complete Queue →")}
                </button>
              </div>
              <div className="da-part-spotlight-card warning">
                <div className="da-spotlight-left">
                  <div className="da-spotlight-eyebrow">
                    <AlertTriangle size={12} />
                    <span>{t("Top Collectorate Attention Case")} · {t("Stage:")} {t(priorityCases[0].WORK_STAGE || "Pending Sanction")}</span>
                  </div>
                  <div className="da-spotlight-title-line">
                    <span className="da-spotlight-work-id">#{priorityCases[0].WORK_ID || priorityCases[0].WORK_RECOMMENDATION_DTL_ID}</span>
                    <span className="text-xs text-slate-500 font-semibold">· {t("Hon'ble MP:")} {priorityCases[0].MP_NAME || "—"}</span>
                  </div>
                  <div className="da-spotlight-desc">
                    {priorityCases[0].WORK_DESCRIPTION || "Work Proposal"}
                  </div>
                  <div className="da-spotlight-subline">
                    <span>{t("Category:")} <strong>{priorityCases[0].WORK_CATEGORY || "Civic Infrastructure"}</strong></span>
                    <span>·</span>
                    <span>{t("AI Status:")} <strong>{priorityCases[0].RISK_REASON || priorityCases[0].REVIEW_REASON || t("Scrutiny Flagged")}</strong></span>
                  </div>
                </div>
                <div className="da-spotlight-right">
                  <div className="da-spotlight-amount">
                    <span className="da-spotlight-amount-val">{formatCurrency(priorityCases[0].RECOMMENDED_AMOUNT || 0)}</span>
                    <span className="da-spotlight-amount-label">{t("Recommended (₹)")}</span>
                  </div>
                  <button
                    type="button"
                    className="da-spotlight-inspect-btn btn-warning"
                    onClick={() => handleSelectWork(priorityCases[0], "overview")}
                    title="Open official 78-field work dossier"
                  >
                    <Eye size={13} />
                    <span>{t("View Dossier")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: PENDING SANCTIONS */}
      {currentTab === "pending-sanctions" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <Clock size={13} />
                <span>{t("Pending Administrative & Technical Sanctions (AS/TS)")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("Works Awaiting District Collector Sanction Orders")}</h2>
              <p className="da-module-banner-desc">
                {t("Under Section 3.11 of MPLADS Guidelines, District Authorities must verify feasibility, estimate accuracy, and issue formal administrative sanctions for recommended works.")}
              </p>
            </div>
            <div className="da-module-banner-right">
              <div className="da-intel-stats">
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Pending Works")}</span>
                  <div className="da-intel-stat-val text-amber-700">
                    {formatNumber(sanctionMonitoring.pending_sanction_count || 0)}
                  </div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Avg Delay")}</span>
                  <div className="da-intel-stat-val">
                    {formatDecimal(sanctionMonitoring.avg_sanction_delay_days || 0)} {t("Days")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="da-subfilter-bar">
            <span className="da-subfilter-label">{t("Filter Queue:")}</span>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "all" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("all");
                setWorksPage(1);
              }}
            >
              <span>{t("All Pending Works")}</span>
              <span className="da-subfilter-count">
                {formatNumber(sanctionMonitoring.pending_sanction_count || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "overdue-45" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("overdue-45");
                setWorksPage(1);
              }}
            >
              <span>{t("Delayed Beyond 45 Days")}</span>
              <span className="da-subfilter-count">
                {formatNumber(compliance45d.exceeded_count || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "high-value" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("high-value");
                setWorksPage(1);
              }}
            >
              <span>{t("High Value (> ₹10 Lakh)")}</span>
            </button>
          </div>

          {/* Pending Sanction Spotlight Card */}
          {works.length > 0 && (
            <div className="da-part-spotlight-card warning">
              <div className="da-spotlight-left">
                <div className="da-spotlight-eyebrow">
                  <Clock size={12} />
                  <span>{t("Pending AS/TS Sanction Spotlight · Section 3.11 Feasibility")}</span>
                </div>
                <div className="da-spotlight-title-line">
                  <span className="da-spotlight-work-id">#{works[0].WORK_ID || works[0].WORK_RECOMMENDATION_DTL_ID}</span>
                  <span className="text-xs text-slate-500 font-semibold">· Hon'ble MP: {works[0].MP_NAME || "—"}</span>
                </div>
                <div className="da-spotlight-desc">{works[0].WORK_DESCRIPTION || t("Pending Sanction Proposal")}</div>
                <div className="da-spotlight-subline">
                  <span>Category: <strong>{works[0].WORK_CATEGORY || "Civic Infrastructure"}</strong></span>
                  <span>·</span>
                  <span>Delay: <strong className={works[0].SANCTION_DELAY_DAYS > 45 ? "text-red-700 font-bold" : ""}>{works[0].SANCTION_DELAY_DAYS != null ? `${works[0].SANCTION_DELAY_DAYS} Days` : "Pending Sanction Order"}</strong></span>
                </div>
              </div>
              <div className="da-spotlight-right">
                <div className="da-spotlight-amount">
                  <span className="da-spotlight-amount-val">{formatCurrency(works[0].RECOMMENDED_AMOUNT || 0)}</span>
                  <span className="da-spotlight-amount-label">Proposal Value</span>
                </div>
                <button
                  type="button"
                  className="da-spotlight-inspect-btn btn-warning"
                  onClick={() => handleSelectWork(works[0], "sanction")}
                  title="Inspect Section 3.11 Sanction Dossier"
                >
                  <Eye size={13} />
                  <span>Inspect Sanction Dossier</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 3: 45-DAY COMPLIANCE */}
      {currentTab === "compliance-45d" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <AlertTriangle size={13} />
                <span>{t("Statutory 45-Day Timeline Compliance · Section 3.12 MPLADS")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("Works Approaching or Exceeding 45-Day Sanction Limit")}</h2>
              <p className="da-module-banner-desc">
                {t("Statutory mandate requires the District Authority to accord sanction or communicate rejection within")} <strong>45 {t("Days")}</strong> {t("of receiving recommendation from the Hon'ble MP.")}
              </p>
            </div>
            <div className="da-module-banner-right">
              <div className="da-intel-stats">
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("> 45 Days Exceeded")}</span>
                  <div className="da-intel-stat-val text-red-700">
                    {formatNumber(compliance45d.exceeded_count || 0)}
                  </div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("30-45 Days (Warning)")}</span>
                  <div className="da-intel-stat-val text-amber-700">
                    {formatNumber(compliance45d.approaching_count || 0)}
                  </div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Compliant (<30d)")}</span>
                  <div className="da-intel-stat-val text-emerald-700">
                    {formatNumber(compliance45d.compliant_count || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="da-subfilter-bar">
            <span className="da-subfilter-label">{t("Compliance Status:")}</span>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "all" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("all");
                setWorksPage(1);
              }}
            >
              <span>{t("Exceeded 45 Days (Default)")}</span>
              <span className="da-subfilter-count">
                {formatNumber(compliance45d.exceeded_count || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "approaching" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("approaching");
                setWorksPage(1);
              }}
            >
              <span>{t("Approaching Deadline (30-45d)")}</span>
              <span className="da-subfilter-count">
                {formatNumber(compliance45d.approaching_count || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "compliant" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("compliant");
                setWorksPage(1);
              }}
            >
              <span>{t("Compliant (<30 Days)")}</span>
              <span className="da-subfilter-count">
                {formatNumber(compliance45d.compliant_count || 0)}
              </span>
            </button>
          </div>

          {/* 45-Day Statutory Delay Spotlight Card */}
          {works.length > 0 && (
            <div className="da-part-spotlight-card danger">
              <div className="da-spotlight-left">
                <div className="da-spotlight-eyebrow text-red-700">
                  <AlertTriangle size={12} />
                  <span>{t("Statutory 45-Day Escalation Spotlight · Section 3.12 Non-Compliance")}</span>
                </div>
                <div className="da-spotlight-title-line">
                  <span className="da-spotlight-work-id">#{works[0].WORK_ID || works[0].WORK_RECOMMENDATION_DTL_ID}</span>
                  <span className="text-xs text-red-700 font-bold">
                    {works[0].SANCTION_DELAY_DAYS > 45
                      ? `(+${works[0].SANCTION_DELAY_DAYS - 45} ${t("Days Past Statutory 45-Day Window")})`
                      : `(${works[0].SANCTION_DELAY_DAYS || 0} ${t("Days Elapsed")})`}
                  </span>
                </div>
                <div className="da-spotlight-desc">{works[0].WORK_DESCRIPTION || t("Statutory Delay Proposal")}</div>
                <div className="da-spotlight-subline">
                  <span>{t("Hon'ble MP:")} <strong>{works[0].MP_NAME || "—"}</strong></span>
                  <span>·</span>
                  <span>{t("Peer Median Delay:")} <strong>{works[0].PEER_MEDIAN_SANCTION_DELAY != null ? `${formatDecimal(works[0].PEER_MEDIAN_SANCTION_DELAY)} ${t("Days")}` : `36 ${t("Days")}`}</strong></span>
                </div>
              </div>
              <div className="da-spotlight-right">
                <div className="da-spotlight-amount">
                  <span className="da-spotlight-amount-val">{formatCurrency(works[0].RECOMMENDED_AMOUNT || 0)}</span>
                  <span className="da-spotlight-amount-label">{t("Recommended")}</span>
                </div>
                <button
                  type="button"
                  className="da-spotlight-inspect-btn btn-danger"
                  onClick={() => handleSelectWork(works[0], "compliance-45d")}
                  title={t("Inspect Section 3.12 45-Day Compliance Dossier")}
                >
                  <Eye size={13} />
                  <span>{t("Inspect Delay Dossier")}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 4: COMPLETION MONITORING */}
      {currentTab === "completion" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <CheckCircle2 size={13} />
                <span>{t("1-Year Completion Monitoring · Section 3.14 MPLADS Guidelines")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("Works Approaching or Exceeding 12-Month Execution Window")}</h2>
              <p className="da-module-banner-desc">
                {t("All sanctioned civil works must be physically completed and handed over within 1 year from sanction order date. Overdue works require immediate Collectorate review and contractor audit.")}
              </p>
            </div>
            <div className="da-module-banner-right">
              <div className="da-intel-stats">
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Overdue (> 1 Yr)")}</span>
                  <div className="da-intel-stat-val text-red-700">
                    {formatNumber(completionMonitoring.overdue_count || 0)}
                  </div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Under Construction")}</span>
                  <div className="da-intel-stat-val">
                    {formatNumber(completionMonitoring.under_construction_count || 0)}
                  </div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Completed")}</span>
                  <div className="da-intel-stat-val text-emerald-700">
                    {formatNumber(completionMonitoring.completed_count || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="da-subfilter-bar">
            <span className="da-subfilter-label">{t("Execution Stage:")}</span>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "all" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("all");
                setWorksPage(1);
              }}
            >
              <span>{t("Overdue Uncompleted (>1 Yr)")}</span>
              <span className="da-subfilter-count">
                {formatNumber(completionMonitoring.overdue_count || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "under-construction" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("under-construction");
                setWorksPage(1);
              }}
            >
              <span>{t("Under Construction")}</span>
              <span className="da-subfilter-count">
                {formatNumber(completionMonitoring.under_construction_count || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "inspection" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("inspection");
                setWorksPage(1);
              }}
            >
              <span>{t("Physical Inspection")}</span>
              <span className="da-subfilter-count">
                {formatNumber(completionMonitoring.physical_inspection_count || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "completed" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("completed");
                setWorksPage(1);
              }}
            >
              <span>{t("Completed Assets")}</span>
              <span className="da-subfilter-count">
                {formatNumber(completionMonitoring.completed_count || 0)}
              </span>
            </button>
          </div>

          {/* 1-Year Completion Monitoring Spotlight Card */}
          {works.length > 0 && (
            <div className="da-part-spotlight-card danger">
              <div className="da-spotlight-left">
                <div className="da-spotlight-eyebrow text-red-700">
                  <CheckCircle2 size={12} />
                  <span>{t("1-Year Completion Window Spotlight · Section 3.14 Execution Audit")}</span>
                </div>
                <div className="da-spotlight-title-line">
                  <span className="da-spotlight-work-id">#{works[0].WORK_ID || works[0].WORK_RECOMMENDATION_DTL_ID}</span>
                  <span className="badge-stage stage-inspection">{t(works[0].WORK_STAGE || "In Execution")}</span>
                </div>
                <div className="da-spotlight-desc">{works[0].WORK_DESCRIPTION || t("Civil Construction Work")}</div>
                <div className="da-spotlight-subline">
                  <span>{t("Sanctioned:")} <strong>{formatCurrency(works[0].SANCTION_AMOUNT || 0)}</strong></span>
                  <span>·</span>
                  <span>{t("Sanction Date:")} <strong>{works[0].SANCTION_DATE || t("Recorded")}</strong></span>
                  <span>·</span>
                  <span>{t("Peer Median Completion:")} <strong>{works[0].PEER_MEDIAN_COMPLETION_DAYS != null ? `${formatDecimal(works[0].PEER_MEDIAN_COMPLETION_DAYS)} ${t("Days")}` : `167 ${t("Days")}`}</strong></span>
                </div>
              </div>
              <div className="da-spotlight-right">
                <div className="da-spotlight-amount">
                  <span className="da-spotlight-amount-val">{formatCurrency(works[0].ACTUAL_AMOUNT || 0)}</span>
                  <span className="da-spotlight-amount-label">{t("Disbursed")}</span>
                </div>
                <button
                  type="button"
                  className="da-spotlight-inspect-btn btn-danger"
                  onClick={() => handleSelectWork(works[0], "completion")}
                  title={t("Inspect Section 3.14 Completion Dossier")}
                >
                  <Eye size={13} />
                  <span>{t("Inspect Completion Dossier")}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 5: FINANCIAL MONITORING */}
      {currentTab === "financials" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <Coins size={13} />
                <span>{t("Financial Monitoring & Expenditure Audit")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("Sanctioned vs Payments vs Actual Expenditure Surveillance")}</h2>
              <p className="da-module-banner-desc">
                {t("Surveillance of cost estimation, installment releases, contractor billing, and uncommitted balance under District Authority supervision.")}
              </p>
            </div>
            <div className="da-module-banner-right">
              <div className="da-intel-stats">
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Sanctioned")}</span>
                  <div className="da-intel-stat-val">{formatCrores(financials.sanction_amount || 0)}</div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Disbursed")}</span>
                  <div className="da-intel-stat-val">{formatCrores(financials.actual_amount || 0)}</div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Cost Outliers")}</span>
                  <div className="da-intel-stat-val text-amber-700">
                    {formatNumber(financials.cost_variance_cases || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="da-subfilter-bar">
            <span className="da-subfilter-label">{t("Financial Filter:")}</span>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "all" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("all");
                setWorksPage(1);
              }}
            >
              <span>{t("Cost Anomaly Outliers (>1.2x Peer)")}</span>
              <span className="da-subfilter-count">
                {formatNumber(financials.cost_variance_cases || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "escalation" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("escalation");
                setWorksPage(1);
              }}
            >
              <span>{t("Cost Escalation (Actual > Sanction)")}</span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "sanctioned" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("sanctioned");
                setWorksPage(1);
              }}
            >
              <span>{t("All Sanctioned Works")}</span>
            </button>
          </div>

          {/* Financial Scrutiny Spotlight Card */}
          {works.length > 0 && (
            <div className="da-part-spotlight-card info">
              <div className="da-spotlight-left">
                <div className="da-spotlight-eyebrow text-blue-800">
                  <Coins size={12} />
                  <span>{t("District Financial & Cost Escalation Audit Spotlight")}</span>
                </div>
                <div className="da-spotlight-title-line">
                  <span className="da-spotlight-work-id">#{works[0].WORK_ID || works[0].WORK_RECOMMENDATION_DTL_ID}</span>
                  <span className="text-xs text-slate-600 font-semibold">· {works[0].WORK_CATEGORY || t("Civic Infrastructure")}</span>
                </div>
                <div className="da-spotlight-desc">{works[0].WORK_DESCRIPTION || t("Civil Work Proposal")}</div>
                <div className="da-spotlight-subline">
                  <span>{t("Sanctioned:")} <strong>{formatCurrency(works[0].SANCTION_AMOUNT || 0)}</strong></span>
                  <span>·</span>
                  <span>{t("Disbursed:")} <strong>{formatCurrency(works[0].ACTUAL_AMOUNT || 0)}</strong></span>
                  <span>·</span>
                  <span>{t("Peer Median Cost:")} <strong>{formatCurrency(works[0].PEER_MEDIAN_SANCTION_AMOUNT || 0)}</strong></span>
                </div>
              </div>
              <div className="da-spotlight-right">
                <div className="da-spotlight-amount">
                  <span className="da-spotlight-amount-val">{formatCurrency(works[0].SANCTION_AMOUNT || works[0].RECOMMENDED_AMOUNT || 0)}</span>
                  <span className="da-spotlight-amount-label">{t("Sanction Value")}</span>
                </div>
                <button
                  type="button"
                  className="da-spotlight-inspect-btn"
                  onClick={() => handleSelectWork(works[0], "financials")}
                  title={t("Inspect Financial Scrutiny Dossier")}
                >
                  <Eye size={13} />
                  <span>{t("Inspect Financial Dossier")}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 6: RISK CASES */}
      {currentTab === "risk-cases" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <ShieldAlert size={13} />
                <span>{t("Risk Cases & Anomaly Surveillance")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("High & Medium Risk Civil Works in Jurisdiction")}</h2>
              <p className="da-module-banner-desc">
                {t("AI multi-dimensional risk scoring combining peer cost deviations, historical delay patterns, and execution anomaly flags.")}
              </p>
            </div>
            <div className="da-module-banner-right">
              <div className="da-intel-stats">
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("High Risk")}</span>
                  <div className="da-intel-stat-val text-red-700">{formatNumber(riskSummary.high_risk || 0)}</div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Medium Risk")}</span>
                  <div className="da-intel-stat-val text-amber-700">
                    {formatNumber(riskSummary.medium_risk || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="da-subfilter-bar">
            <span className="da-subfilter-label">{t("Severity Filter:")}</span>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "all" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("all");
                setWorksPage(1);
              }}
            >
              <span>{t("All High & Medium Risk")}</span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "high" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("high");
                setWorksPage(1);
              }}
            >
              <span>{t("High Risk Only")}</span>
              <span className="da-subfilter-count">{formatNumber(riskSummary.high_risk || 0)}</span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "medium" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("medium");
                setWorksPage(1);
              }}
            >
              <span>{t("Medium Risk Only")}</span>
              <span className="da-subfilter-count">{formatNumber(riskSummary.medium_risk || 0)}</span>
            </button>
          </div>

          {/* AI Risk & Anomaly Spotlight Card */}
          {works.length > 0 && (
            <div className="da-part-spotlight-card danger">
              <div className="da-spotlight-left">
                <div className="da-spotlight-eyebrow text-red-700">
                  <ShieldAlert size={12} />
                  <span>{t("Priority Risk Case Spotlight · AI Anomaly Score:")} {formatDecimal(works[0].RISK_SCORE || 0)}/100</span>
                </div>
                <div className="da-spotlight-title-line">
                  <span className="da-spotlight-work-id">#{works[0].WORK_ID || works[0].WORK_RECOMMENDATION_DTL_ID}</span>
                  <span className="badge-review alert-duplicate">{works[0].RISK_LEVEL || "HIGH"} {t("RISK")}</span>
                </div>
                <div className="da-spotlight-desc">{works[0].WORK_DESCRIPTION || t("Work Proposal")}</div>
                <div className="da-spotlight-subline">
                  <span>{t("Anomaly Rationale:")} <strong className="text-red-700">{works[0].RISK_REASON || works[0].REVIEW_REASON || t("AI Risk Anomaly Flagged")}</strong></span>
                </div>
              </div>
              <div className="da-spotlight-right">
                <div className="da-spotlight-amount">
                  <span className="da-spotlight-amount-val">{formatCurrency(works[0].RECOMMENDED_AMOUNT || 0)}</span>
                  <span className="da-spotlight-amount-label">{t("Proposal Value")}</span>
                </div>
                <button
                  type="button"
                  className="da-spotlight-inspect-btn btn-danger"
                  onClick={() => handleSelectWork(works[0], "risk")}
                  title={t("Inspect AI Risk Dossier")}
                >
                  <Eye size={13} />
                  <span>{t("Inspect Risk Dossier")}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 7: DUPLICATE INTELLIGENCE */}
      {currentTab === "duplicates" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <GitBranch size={13} />
                <span>{t("Duplicate Intelligence & Cross-Recommendation Overlaps")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("Similar & Suspicious Works in Jurisdiction")}</h2>
              <p className="da-module-banner-desc">
                {t("Semantic clustering detects overlapping work proposals across parliamentary terms and identical village coordinates to block duplicate fund allocations.")}
              </p>
            </div>
            <div className="da-module-banner-right">
              <div className="da-intel-stats">
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("High Duplicates")}</span>
                  <div className="da-intel-stat-val text-red-700">
                    {formatNumber(riskSummary.high_duplicate_risk || 0)}
                  </div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Active Clusters")}</span>
                  <div className="da-intel-stat-val">
                    {formatNumber(riskSummary.duplicate_clusters_count || 0)}
                  </div>
                </div>
              </div>
              <Link to="/duplicates" className="da-strip-btn">
                <span>{t("Inspect Clusters")}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>


          <div className="da-subfilter-bar">
            <span className="da-subfilter-label">{t("Cluster Risk:")}</span>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "all" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("all");
                setWorksPage(1);
              }}
            >
              <span>{t("All Duplicate Warnings")}</span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "high" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("high");
                setWorksPage(1);
              }}
            >
              <span>{t("High Risk Overlaps")}</span>
              <span className="da-subfilter-count">
                {formatNumber(riskSummary.high_duplicate_risk || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "medium" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("medium");
                setWorksPage(1);
              }}
            >
              <span>{t("Near-Match Proposals")}</span>
              <span className="da-subfilter-count">
                {formatNumber(riskSummary.medium_duplicate_risk || 0)}
              </span>
            </button>
          </div>

          {/* Duplicate Cluster Spotlight Card */}
          {works.length > 0 && (
            <div className="da-part-spotlight-card warning">
              <div className="da-spotlight-left">
                <div className="da-spotlight-eyebrow text-amber-800">
                  <GitBranch size={12} />
                  <span>{t("Duplicate Proposal Cluster Spotlight · Cluster #")}{works[0].CLUSTER_ID || "—"}</span>
                </div>
                <div className="da-spotlight-title-line">
                  <span className="da-spotlight-work-id">#{works[0].WORK_ID || works[0].WORK_RECOMMENDATION_DTL_ID}</span>
                  <span className="badge-review alert-duplicate">{works[0].DUPLICATE_RISK || "HIGH"} {t("DUPLICATE RISK")}</span>
                </div>
                <div className="da-spotlight-desc">{works[0].WORK_DESCRIPTION || t("Duplicate Proposal")}</div>
                <div className="da-spotlight-subline">
                  <span>{t("Evidence:")} <strong className="text-slate-800">{works[0].EVIDENCE || t("Cluster overlap detected in district")}</strong></span>
                </div>
              </div>
              <div className="da-spotlight-right">
                <div className="da-spotlight-amount">
                  <span className="da-spotlight-amount-val">{formatCurrency(works[0].RECOMMENDED_AMOUNT || 0)}</span>
                  <span className="da-spotlight-amount-label">{t("Budget")}</span>
                </div>
                <button
                  type="button"
                  className="da-spotlight-inspect-btn btn-warning"
                  onClick={() => handleSelectWork(works[0], "duplicates")}
                  title={t("Inspect Duplicate Cluster Dossier")}
                >
                  <Eye size={13} />
                  <span>{t("Inspect Duplicate Dossier")}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 8: VENDOR / IA MONITORING */}
      {currentTab === "ia-monitoring" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <Building2 size={13} />
                <span>{t("Vendor & Implementing Agency (IA) Performance")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("Implementing District Authorities & Executing Bodies")}</h2>
              <p className="da-module-banner-desc">
                {t("Surveillance of executing agencies (Zila Parishads, PWD, Rural Works) on milestone reporting, speed of technical sanctions, and completion rates.")}
              </p>
            </div>
          </div>

          {iaPerformance.length > 0 && (
            <div className="da-panel-card">
              <div className="da-panel-header">
                <h3 className="da-panel-title">
                  <Building2 size={15} color="#b45309" />
                  <span>{t("Implementing Agencies in Jurisdiction Scope")}</span>
                </h3>
              </div>
              <div className="da-table-container">
                <table className="da-gov-table">
                  <thead>
                    <tr>
                      <th>{t("Implementing Agency / Collectorate")}</th>
                      <th>{t("Total Works")}</th>
                      <th>{t("Sanctioned")}</th>
                      <th>{t("Completed")}</th>
                      <th>{t("Sanction Amount")}</th>
                      <th>{t("Disbursed")}</th>
                      <th>{t("Completion %")}</th>
                      <th>{t("Delayed (>45d)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iaPerformance.map((ia) => (
                      <tr key={ia.name}>
                        <td className="font-semibold text-slate-800">{ia.clean_name}</td>
                        <td>{formatNumber(ia.total_works)}</td>
                        <td>{formatNumber(ia.sanctioned_works)}</td>
                        <td>{formatNumber(ia.completed_works)}</td>
                        <td className="cell-amount">{formatCrores(ia.sanction_amount)}</td>
                        <td className="cell-amount">{formatCrores(ia.actual_amount)}</td>
                        <td>
                          <span
                            className={`badge-stage ${ia.completion_rate > 50 ? "stage-completed" : "stage-pending"
                              }`}
                          >
                            {ia.completion_rate}%
                          </span>
                        </td>
                        <td>
                          <span className={ia.delayed_count > 0 ? "text-red-700 font-bold" : ""}>
                            {formatNumber(ia.delayed_count)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Implementing Agency Spotlight Card */}
          {works.length > 0 && (
            <div className="da-part-spotlight-card info">
              <div className="da-spotlight-left">
                <div className="da-spotlight-eyebrow text-blue-800">
                  <Building2 size={12} />
                  <span>{t("Implementing Agency Work Spotlight ·")} {works[0].IDA_NAME || t("District Authority")}</span>
                </div>
                <div className="da-spotlight-title-line">
                  <span className="da-spotlight-work-id">#{works[0].WORK_ID || works[0].WORK_RECOMMENDATION_DTL_ID}</span>
                  <span className="badge-stage stage-pending">{t(works[0].WORK_STAGE || "In Execution")}</span>
                </div>
                <div className="da-spotlight-desc">{works[0].WORK_DESCRIPTION || t("Agency Project")}</div>
                <div className="da-spotlight-subline">
                  <span>{t("Hon'ble MP:")} <strong>{works[0].MP_NAME || "—"}</strong></span>
                  <span>·</span>
                  <span>{t("Category:")} <strong>{works[0].WORK_CATEGORY || t("General/Civil")}</strong></span>
                  <span>·</span>
                  <span>{t("Sanctioned:")} <strong>{formatCurrency(works[0].SANCTION_AMOUNT || 0)}</strong></span>
                </div>
              </div>
              <div className="da-spotlight-right">
                <div className="da-spotlight-amount">
                  <span className="da-spotlight-amount-val">{formatCurrency(works[0].ACTUAL_AMOUNT || 0)}</span>
                  <span className="da-spotlight-amount-label">{t("Disbursed")}</span>
                </div>
                <button
                  type="button"
                  className="da-spotlight-inspect-btn"
                  onClick={() => handleSelectWork(works[0], "ia")}
                  title={t("Inspect Implementing Agency Work Dossier")}
                >
                  <Eye size={13} />
                  <span>{t("Inspect Agency Dossier")}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 9: EVIDENCE VERIFICATION */}
      {currentTab === "evidence" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <FileCheck size={13} />
                <span>{t("Ground Evidence & Document Verification")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("Analytical Cluster Evidence & Suspicion Scrutiny")}</h2>
              <p className="da-module-banner-desc">
                {t("Surveillance of candidate relationships, analytical text similarity evidence, and high suspicion cluster alerts requiring physical audit.")}
              </p>
            </div>
            <div className="da-module-banner-right">
              <div className="da-intel-stats">
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Evidence Cases")}</span>
                  <div className="da-intel-stat-val text-amber-700">
                    {formatNumber(evidenceVerification.total_evidence_cases || 0)}
                  </div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("High Suspicion")}</span>
                  <div className="da-intel-stat-val text-red-700">
                    {formatNumber(evidenceVerification.high_suspicion_count || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="da-subfilter-bar">
            <span className="da-subfilter-label">{t("Evidence Scrutiny:")}</span>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "all" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("all");
                setWorksPage(1);
              }}
            >
              <span>{t("All Documented Evidence Cases")}</span>
              <span className="da-subfilter-count">
                {formatNumber(evidenceVerification.total_evidence_cases || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "high-suspicion" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("high-suspicion");
                setWorksPage(1);
              }}
            >
              <span>{t("High Suspicion Clusters")}</span>
              <span className="da-subfilter-count">
                {formatNumber(evidenceVerification.high_suspicion_count || 0)}
              </span>
            </button>
          </div>

          {/* Ground Evidence Scrutiny Spotlight Card */}
          {works.length > 0 && (
            <div className="da-part-spotlight-card warning">
              <div className="da-spotlight-left">
                <div className="da-spotlight-eyebrow text-amber-800">
                  <FileCheck size={12} />
                  <span>{t("Ground & Candidate Evidence Scrutiny Spotlight")}</span>
                </div>
                <div className="da-spotlight-title-line">
                  <span className="da-spotlight-work-id">#{works[0].WORK_ID || works[0].WORK_RECOMMENDATION_DTL_ID}</span>
                  <span className="badge-review verified">{t("Score:")} {works[0].EVIDENCE_SCORE || 85}/100</span>
                  <span className="badge-review alert-duplicate">{t(works[0].SUSPICION_LEVEL || "HIGH SUSPICION")}</span>
                </div>
                <div className="da-spotlight-desc">{works[0].WORK_DESCRIPTION || t("Proposal Evidence")}</div>
                <div className="da-spotlight-subline">
                  <span>{t("Analytical Evidence:")} <strong className="text-slate-800">{works[0].EVIDENCE || works[0].REVIEW_REASON || t("Evidence flagged for physical audit")}</strong></span>
                </div>
              </div>
              <div className="da-spotlight-right">
                <div className="da-spotlight-amount">
                  <span className="da-spotlight-amount-val">{formatCurrency(works[0].RECOMMENDED_AMOUNT || 0)}</span>
                  <span className="da-spotlight-amount-label">{t("Estimate")}</span>
                </div>
                <button
                  type="button"
                  className="da-spotlight-inspect-btn btn-warning"
                  onClick={() => handleSelectWork(works[0], "evidence")}
                  title={t("Inspect Evidence Dossier")}
                >
                  <Eye size={13} />
                  <span>{t("Inspect Evidence Dossier")}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 10: GEO-PHOTO VERIFICATION */}
      {currentTab === "geo-photo" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <Camera size={13} />
                <span>{t("Geo-Photo & Physical Site Inspection Verification")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("Location GPS & Photographic Milestone Inconsistencies")}</h2>
              <p className="da-module-banner-desc">
                {t("Mandatory under MPLADS Section 3.16: physical site inspection and completed asset handover require verified geo-tagged photographs.")}
              </p>
            </div>
            <div className="da-module-banner-right">
              <div className="da-intel-stats">
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Site Inspection")}</span>
                  <div className="da-intel-stat-val">
                    {formatNumber(completionMonitoring.physical_inspection_count || 0)}
                  </div>
                </div>
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Completed Handover")}</span>
                  <div className="da-intel-stat-val text-emerald-700">
                    {formatNumber(completionMonitoring.completed_count || 0)}
                  </div>
                </div>
              </div>
              <Link to="/photo-verifier" className="da-strip-btn">
                <Camera size={13} />
                <span>{t("Launch Geo-Photo Verifier")}</span>
              </Link>
            </div>
          </div>

          <div className="da-subfilter-bar">
            <span className="da-subfilter-label">{t("Milestone Photo Evidence:")}</span>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "all" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("all");
                setWorksPage(1);
              }}
            >
              <span>{t("All Photo Milestone Works")}</span>
              <span className="da-subfilter-count">
                {formatNumber(
                  (completionMonitoring.physical_inspection_count || 0) +
                  (completionMonitoring.completed_count || 0)
                )}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "inspection" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("inspection");
                setWorksPage(1);
              }}
            >
              <span>{t("Physical Inspection Milestone")}</span>
              <span className="da-subfilter-count">
                {formatNumber(completionMonitoring.physical_inspection_count || 0)}
              </span>
            </button>
            <button
              type="button"
              className={`da-subfilter-btn ${subfilter === "completed" ? "active" : ""}`}
              onClick={() => {
                setSubfilter("completed");
                setWorksPage(1);
              }}
            >
              <span>{t("Completed Assets Handover")}</span>
              <span className="da-subfilter-count">
                {formatNumber(completionMonitoring.completed_count || 0)}
              </span>
            </button>
          </div>

          {/* Geo-Photo Milestone Inspection Spotlight Card */}
          {works.length > 0 && (
            <div className="da-part-spotlight-card info">
              <div className="da-spotlight-left">
                <div className="da-spotlight-eyebrow text-blue-800">
                  <Camera size={12} />
                  <span>{t("Geo-Photo & Physical Milestone Inspection Spotlight (Section 3.16)")}</span>
                </div>
                <div className="da-spotlight-title-line">
                  <span className="da-spotlight-work-id">#{works[0].WORK_ID || works[0].WORK_RECOMMENDATION_DTL_ID}</span>
                  <span className="badge-stage stage-inspection">{t(works[0].WORK_STAGE || "Physical Inspection")}</span>
                </div>
                <div className="da-spotlight-desc">{works[0].WORK_DESCRIPTION || t("Milestone Asset")}</div>
                <div className="da-spotlight-subline">
                  <span>{t("Constituency:")} <strong>{works[0].CONSTITUENCY || t("District Bounds")}</strong></span>
                  <span>·</span>
                  <span>{t("Photo Mandate:")} <strong>{t("Geo-Tagged Verification Required for AS/TS & Asset Handover")}</strong></span>
                </div>
              </div>
              <div className="da-spotlight-right">
                <div className="da-spotlight-amount">
                  <span className="da-spotlight-amount-val">{formatCurrency(works[0].SANCTION_AMOUNT || works[0].RECOMMENDED_AMOUNT || 0)}</span>
                  <span className="da-spotlight-amount-label">{t("Sanction Value")}</span>
                </div>
                <button
                  type="button"
                  className="da-spotlight-inspect-btn"
                  onClick={() => handleSelectWork(works[0], "geo-photo")}
                  title={t("Inspect Geo-Photo Milestone Dossier")}
                >
                  <Eye size={13} />
                  <span>{t("Inspect Geo-Photo Dossier")}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 11: ALERTS & QUEUE */}
      {currentTab === "alerts-queue" && (
        <>
          <div className="da-module-banner">
            <div className="da-module-banner-left">
              <div className="da-module-banner-eyebrow">
                <Bell size={13} />
                <span>{t("District Collectorate Priority Action Queue")}</span>
              </div>
              <h2 className="da-module-banner-title">{t("Priority Cases Requiring Administrative Action")}</h2>
              <p className="da-module-banner-desc">
                {t("High-severity proposals flagged for duplicate overlap, cost anomaly, or delay deviations requiring Collector decision.")}
              </p>
            </div>
            <div className="da-module-banner-right">
              <div className="da-intel-stats">
                <div className="da-intel-stat-item">
                  <span className="da-intel-stat-label">{t("Actionable Alerts")}</span>
                  <div className="da-intel-stat-val text-red-700">
                    {formatNumber((kpis.attention_required || 0) + (incomingRequests.filter(r => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW").length))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Centralized Cross-Role Incoming Workflow Requests */}
          <div style={{ marginBottom: "20px" }}>
            <RequestTable
              title={t("District Authority Incoming Requests & Petitions Queue")}
              subtitle={t("Real-time intake of Citizen grievances, IA payment claims/MB records, and MP inquiries routed to this Collectorate")}
              requests={incomingRequests}
              loading={incomingRequestsLoading}
              currentRole="DISTRICT_AUTHORITY"
              onRefresh={fetchIncomingRequests}
              onOpenWork={async (workId) => {
                try {
                  const res = await fetch(`${API_BASE}/api/works/${workId}`);
                  if (res.ok) {
                    const wData = await res.json();
                    handleSelectWork(wData, "actions");
                  } else {
                    alert(`Work #${workId} could not be loaded from registry.`);
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              onStatusUpdated={() => fetchIncomingRequests()}
            />
          </div>

          {priorityCases.length > 0 && (
            <div className="da-priority-card">
              <div className="da-priority-header">
                <div className="da-priority-title-area">
                  <h2>
                    <ShieldAlert size={16} color="#b45309" />
                    <span>{t("Top Priority Scrutiny Cases")} ({priorityCases.length} {t("Highest Severity")})</span>
                  </h2>
                </div>
              </div>

              <div className="da-priority-list">
                {priorityCases.map((c) => {
                  const workId = c.WORK_ID || c.WORK_RECOMMENDATION_DTL_ID;
                  const dupRisk = String(c.DUPLICATE_RISK || "LOW").toUpperCase();
                  return (
                    <div
                      key={c.WORK_RECOMMENDATION_DTL_ID || c.WORK_ID}
                      className="da-priority-row"
                      onClick={() => handleSelectWork(c, "actions")}
                    >
                      <div className="da-priority-left">
                        <div className="da-priority-id-line">
                          <span className="da-priority-work-id">#{workId}</span>
                          <span className="badge-stage stage-pending">
                            {t(c.WORK_STAGE || "Pending Sanction")}
                          </span>
                          {dupRisk === "HIGH" ? (
                            <span className="badge-review alert-duplicate">
                              {t("Duplicate Cluster #")}{c.CLUSTER_ID}
                            </span>
                          ) : dupRisk === "MEDIUM" ? (
                            <span className="badge-review alert-review">{t("Near Match #")}{c.CLUSTER_ID}</span>
                          ) : c.REQUIRES_REVIEW ? (
                            <span className="badge-review alert-review">{t("Scrutiny Flagged")}</span>
                          ) : (
                            <span className="badge-review verified">{t("Operational Review")}</span>
                          )}
                        </div>

                        <div className="da-priority-desc">{c.WORK_DESCRIPTION || t("Work Proposal")}</div>

                        <div className="da-priority-subline">
                          <span>
                            {t("Hon'ble MP:")} <strong>{c.MP_NAME || "—"}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            {t("Category:")} <strong>{c.WORK_CATEGORY || t("Infrastructure")}</strong>
                          </span>
                          {c.SANCTION_DELAY_DAYS !== undefined && c.SANCTION_DELAY_DAYS !== null && (
                            <>
                              <span>·</span>
                              <span>
                                {t("Delay:")} <strong>{c.SANCTION_DELAY_DAYS} {t("days")}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="da-priority-right">
                        <div className="da-priority-amount">
                          <span className="da-spotlight-amount-val">
                            {formatCurrency(c.RECOMMENDED_AMOUNT || 0)}
                          </span>
                          <span className="da-priority-amount-label">{t("Recommended")}</span>
                        </div>

                        <button
                          type="button"
                          className="da-btn-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectWork(c, "actions");
                          }}
                          title={t("Open full 78-field official work dossier")}
                        >
                          <Eye size={13} />
                          <span>{t("Review Dossier")}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 4. Focused Works Register Table (Present in every tab, filtered for that specific view) */}
      <div className="da-register-card">
        <div className="da-register-toolbar">
          <div className="da-register-title-area">
            <h2>
              {t(DA_MODULES.find((m) => m.id === currentTab)?.label || "District Works")} {t("Register")}
            </h2>
            <p>
              {t("Audited live from national repository · Filtered for")} {analytics?.district_name || t("District")} (
              {formatNumber(worksTotal)} {t("Records Total")})
            </p>
          </div>

          <div className="da-register-controls">
            <div className="da-register-search-box">
              <Search size={13} color="#64748b" />
              <input
                type="text"
                placeholder={t("Search by Work ID, title, or IA...")}
                value={workSearchQuery}
                onChange={(e) => setWorkSearchQuery(e.target.value)}
              />
            </div>

            <label className="da-register-filter-check">
              <input
                type="checkbox"
                checked={filterFlaggedOnly}
                onChange={(e) => {
                  setFilterFlaggedOnly(e.target.checked);
                  setActiveKpiFilter(e.target.checked ? "attention" : null);
                  setWorksPage(1);
                }}
              />
              <span>{t("Scrutiny Flagged Only")}</span>
            </label>

            <button
              type="button"
              className="da-pagination-btn"
              onClick={handleExportCSV}
              disabled={!works.length}
              title={t("Export filtered records to CSV")}
            >
              <Download size={13} />
              <span>{t("Export CSV")}</span>
            </button>

            <button
              type="button"
              className="da-pagination-btn"
              onClick={loadDistrictWorks}
              title={t("Refresh register")}
            >
              <RefreshCw size={13} className={worksLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Milestone Stage Filter Tabs */}
        <div className="da-register-stage-tabs">
          {[
            "All",
            "Pending Sanction",
            "Sanction",
            "Physical Inspection",
            "Work partially Completed",
            "Work Completed",
          ].map((stage) => (
            <button
              key={stage}
              type="button"
              className={`da-stage-tab-btn ${selectedStage === stage ? "active" : ""}`}
              onClick={() => {
                setSelectedStage(stage);
                setWorksPage(1);
              }}
            >
              {stage === "All" ? t("All Stages") : t(stage)}
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="da-table-container">
          <table className="da-gov-table">
            <thead>
              <tr>
                <th>{t("Work ID")}</th>
                <th>{t("Work Description")}</th>
                <th>{t("Recommending MP")}</th>
                <th>{t("Recommended (₹)")}</th>
                <th>{t("Sanctioned (₹)")}</th>
                <th>{t("Stage")}</th>
                {currentTab === "compliance-45d" && <th>{t("Sanction Delay")}</th>}
                {currentTab === "completion" && <th>{t("Completion Elapsed")}</th>}
                {currentTab === "financials" && <th>{t("Disbursed (₹)")}</th>}
                {currentTab === "risk-cases" && <th>{t("Risk Level & Reason")}</th>}
                {currentTab === "duplicates" && <th>{t("Duplicate Cluster & Similarity")}</th>}
                {currentTab === "evidence" && <th>{t("Evidence & Suspicion")}</th>}
                {currentTab === "geo-photo" && <th>{t("Site Photo Status")}</th>}
                <th>{t("Scrutiny Status")}</th>
                <th>{t("Action")}</th>
              </tr>
            </thead>
            <tbody>
              {worksLoading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-slate-600" />
                    {t("Querying master database for")} {analytics?.district_name || t("district")}...
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-6">
                    <div className="da-empty-state-box">
                      <CheckCircle2 size={16} />
                      <span>{t("No matching works found for the selected module and filters.")}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                works.map((work) => {
                  const workId = work.WORK_ID || work.WORK_RECOMMENDATION_DTL_ID;
                  const dupRisk = String(work.DUPLICATE_RISK || "LOW").toUpperCase();
                  const stage = work.WORK_STAGE || "Pending Sanction";
                  const delayDays = work.SANCTION_DELAY_DAYS;
                  const riskLevel = String(work.RISK_LEVEL || "LOW").toUpperCase();

                  return (
                    <tr
                      key={work.WORK_RECOMMENDATION_DTL_ID || work.WORK_ID}
                      onClick={() => handleSelectWork(work)}
                    >
                      <td className="cell-work-id">#{workId}</td>
                      <td className="cell-desc">
                        <div className="cell-desc-title" title={work.WORK_DESCRIPTION}>
                          {work.WORK_DESCRIPTION || "—"}
                        </div>
                        <div className="cell-category">{t(work.WORK_CATEGORY || "General/Civil")}</div>
                      </td>
                      <td>
                        <div className="cell-mp-name">{work.MP_NAME || "—"}</div>
                        <div className="cell-mp-sub">{work.CONSTITUENCY || work.STATE_NAME || ""}</div>
                      </td>
                      <td className="cell-amount">{formatCurrency(work.RECOMMENDED_AMOUNT || 0)}</td>
                      <td className="cell-amount">
                        {work.SANCTION_AMOUNT ? formatCurrency(work.SANCTION_AMOUNT) : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge-stage ${stage === "Work Completed"
                            ? "stage-completed"
                            : stage === "Sanction"
                              ? "stage-sanction"
                              : stage === "Pending Sanction"
                                ? "stage-pending"
                                : "stage-inspection"
                            }`}
                        >
                          {t(stage)}
                        </span>
                      </td>

                      {/* Custom column for 45-Day Compliance */}
                      {currentTab === "compliance-45d" && (
                        <td>
                          {delayDays !== undefined && delayDays !== null ? (
                            <span
                              className={`da-compliance-val ${delayDays > 45 ? "alert font-bold" : delayDays >= 30 ? "warn" : ""
                                }`}
                            >
                              {delayDays} {t("Days")} {delayDays > 45 ? t("(+Overdue)") : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}

                      {/* Custom column for Completion */}
                      {currentTab === "completion" && (
                        <td>
                          <span
                            className={`da-compliance-val ${work.COMPLETION_DURATION_DAYS > 365 ? "alert font-bold" : ""
                              }`}
                          >
                            {work.COMPLETION_DURATION_DAYS != null
                              ? `${work.COMPLETION_DURATION_DAYS} ${t("Days")}`
                              : stage === "Work Completed"
                                ? t("Completed")
                                : t("In Execution")}
                            {work.COMPLETION_DURATION_DAYS > 365 ? ` ${t("(+Overdue)")}` : ""}
                          </span>
                        </td>
                      )}

                      {/* Custom column for Financials */}
                      {currentTab === "financials" && (
                        <td className="cell-amount">
                          {work.ACTUAL_AMOUNT ? formatCurrency(work.ACTUAL_AMOUNT) : "—"}
                        </td>
                      )}

                      {/* Custom column for Risk Cases */}
                      {currentTab === "risk-cases" && (
                        <td>
                          <span
                            className={`badge-review ${riskLevel === "HIGH" ? "alert-duplicate" : "alert-review"
                              }`}
                          >
                            {riskLevel} {t("RISK")} ({formatDecimal(work.RISK_SCORE || 0)})
                          </span>
                          {work.RISK_REASON && (
                            <div className="text-xs text-slate-500 truncate max-w-xs" title={work.RISK_REASON}>
                              {work.RISK_REASON}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Custom column for Duplicates */}
                      {currentTab === "duplicates" && (
                        <td>
                          {work.CLUSTER_ID ? (
                            <div>
                              <span className="badge-review alert-duplicate">
                                {t("Duplicate Cluster #")}{Math.round(Number(work.CLUSTER_ID))}
                              </span>
                              <div className="text-xs text-slate-600 font-semibold mt-0.5">
                                {work.AVG_TEXT_SIMILARITY != null
                                  ? `${(Number(work.AVG_TEXT_SIMILARITY) * 100).toFixed(0)}% ${t("Text Sim")}`
                                  : t("100% Match")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{t("Unique")}</span>
                          )}
                        </td>
                      )}

                      {/* Custom column for Evidence */}
                      {currentTab === "evidence" && (
                        <td>
                          {work.EVIDENCE_SCORE ? (
                            <div>
                              <span className="font-semibold text-xs">
                                {t("Score:")} {work.EVIDENCE_SCORE}
                              </span>
                              <span
                                className={`badge-review ml-1 ${work.SUSPICION_LEVEL === "HIGH SUSPICION"
                                  ? "alert-duplicate"
                                  : "verified"
                                  }`}
                              >
                                {t(work.SUSPICION_LEVEL || "NORMAL")}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}

                      {/* Custom column for Geo-Photo */}
                      {currentTab === "geo-photo" && (
                        <td>
                          <span
                            className={`badge-stage ${stage === "Work Completed" ? "stage-completed" : "stage-inspection"
                              }`}
                          >
                            {stage === "Work Completed" ? t("Handover Photo Required") : t("Site Photo Logged")}
                          </span>
                        </td>
                      )}

                      <td>
                        {dupRisk === "HIGH" ? (
                          <span className="badge-review alert-duplicate">
                            {t("Duplicate Flag #")}{work.CLUSTER_ID}
                          </span>
                        ) : dupRisk === "MEDIUM" ? (
                          <span className="badge-review alert-review">{t("Near Match #")}{work.CLUSTER_ID}</span>
                        ) : work.REQUIRES_REVIEW ? (
                          <span className="badge-review alert-review">{t("Review Required")}</span>
                        ) : (
                          <span className="badge-review verified">{t("Verified")}</span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-view-dossier"
                          onClick={() => handleSelectWork(work)}
                          title={t("Open official 78-field work dossier")}
                        >
                          <Eye size={13} />
                          <span>{t("View Dossier")}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="da-register-pagination-bar">
          <span>
            {t("Showing")} {works.length ? (worksPage - 1) * worksLimit + 1 : 0} {t("to")}{" "}
            {Math.min(worksPage * worksLimit, worksTotal)} {t("of")} {formatNumber(worksTotal)} {t("works")}
          </span>
          <div className="da-pagination-controls">
            <button
              type="button"
              className="da-pagination-btn"
              onClick={() => setWorksPage((p) => Math.max(1, p - 1))}
              disabled={worksPage <= 1}
            >
              {t("Previous")}
            </button>
            <span className="px-2 font-semibold">
              {t("Page")} {worksPage} {t("of")} {totalPages}
            </span>
            <button
              type="button"
              className="da-pagination-btn"
              onClick={() => setWorksPage((p) => Math.min(totalPages, p + 1))}
              disabled={worksPage >= totalPages}
            >
              {t("Next")}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Pre-Sanction Proposal Verification Shortcut */}
      <div className="da-precheck-box">
        <div className="da-precheck-text">
          <h3>{t("Pre-Sanction Feasibility & Duplicate Screening")}</h3>
          <p>
            {t("Under Section 3.12 of MPLADS Operational Guidelines, District Authorities must verify feasibility, estimate accuracy, and cross-reference new proposals against existing assets before issuing formal Administrative Sanctions.")}
          </p>
        </div>
        <Link to="/pre-sanction" className="da-precheck-btn">
          <span>{t("Validate New Proposal")}</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* Fallback Dossier Drawer (when not controlled by parent SharedLayout) */}
      {!onSelectWork && localSelectedWork && (
        <WorkDetailDrawer
          work={localSelectedWork}
          initialSection={localSelectedWork.__initialSection || "all"}
          onClose={() => setLocalSelectedWork(null)}
        />
      )}
    </div>
  );
}
