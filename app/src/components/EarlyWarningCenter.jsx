import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ROLE_IDS } from "../data/roles";
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  TrendingUp,
  Copy,
  ShieldAlert,
  Search,
  X,
  RefreshCw,
  Download,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  MapPin,
  User,
  CheckCircle2,
  FileSearch,
} from "lucide-react";
import { API_BASE } from "../constants";
import "./EarlyWarningCenter.css";

const CATEGORY_CONFIG = {
  all: {
    key: "all",
    title: "All Early Warnings",
    icon: ShieldAlert,
    badgeColor: "blue",
    slaInfo: "Unified MoSPI National Early Warning & Real-Time Integrity Surveillance Console.",
  },
  unusual_patterns: {
    key: "unusual_patterns",
    title: "Unusual Patterns & Anomalies",
    icon: AlertTriangle,
    badgeColor: "rose",
    slaInfo: "Algorithmic lifecycle anomalies, synthetic completion timelines, and peer variance outliers.",
    guideline: "Statutory Guideline: Requisition IA physical verification and audit lifecycle milestone logs.",
  },
  delays: {
    key: "delays",
    title: "Sanction & Execution Delays",
    icon: Clock,
    badgeColor: "amber",
    slaInfo: "Works pending sanction >45 days (Section 3.12 statutory SLA breach) or execution >365 days.",
    guideline: "Statutory Guideline: Issue Section 3.12 explanation notice to District Authority.",
  },
  cost_overruns: {
    key: "cost_overruns",
    title: "Cost Overruns & Peer Escalation",
    icon: TrendingUp,
    badgeColor: "purple",
    slaInfo: "Sanctions or actual expenditures exceeding peer district median project cost by >2.0x.",
    guideline: "Statutory Guideline: Withhold subsequent installment disbursement pending engineering rate re-scrutiny.",
  },
  duplicate_works: {
    key: "duplicate_works",
    title: "Duplicate Works & Clusters",
    icon: Copy,
    badgeColor: "indigo",
    slaInfo: "Cross-district and inter-constituency duplicate cluster proposals with high text/location match.",
    guideline: "Statutory Guideline: Cross-reference site GPS coordinates and freeze duplicate sanction disbursements.",
  },
  fund_misuse: {
    key: "fund_misuse",
    title: "Potential Misuse of Funds",
    icon: AlertOctagon,
    badgeColor: "red",
    slaInfo: "High financial risk score, mandatory audit review flags, or large disbursements with substandard evidence.",
    guideline: "Statutory Guideline: Refer to District Collectorate Vigilance Desk and mandate CAG special audit.",
  },
};

export default function EarlyWarningCenter({
  isOpen,
  onClose,
  onSelectWork,
  initialCategory = "all",
  roleConfig: propRoleConfig,
}) {
  const location = useLocation();
  const auth = useAuth() || {};
  const authRole = auth.role;
  const roleConfig = propRoleConfig || auth.roleConfig;

  // Early warning surveillance is strictly restricted to MP, DA, and MoSPI only (citizen and IA restricted)
  const isAuthorized = useMemo(() => {
    const activeId = roleConfig?.id || authRole;
    if (activeId) {
      return (
        activeId !== ROLE_IDS.CITIZEN &&
        activeId !== ROLE_IDS.IMPLEMENTING_AGENCY
      );
    }
    const path = location?.pathname || "";
    return !path.startsWith("/citizen") && !path.startsWith("/ia");
  }, [roleConfig?.id, authRole, location?.pathname]);

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    total: 0,
    page: 1,
    pages: 1,
    summary: null,
    alerts: [],
  });
  const [copiedId, setCopiedId] = useState(null);

  // Sync initialCategory if changed externally
  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Fetch alerts from backend
  const fetchAlerts = useCallback(async () => {
    if (!isOpen || !isAuthorized) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: activeCategory,
        page: page.toString(),
        limit: "25",
      });
      if (severityFilter !== "ALL") {
        params.append("severity", severityFilter);
      }
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }

      const res = await fetch(`${API_BASE}/api/alerts/early-warning?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch early warning alerts:", err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, isAuthorized, activeCategory, severityFilter, searchQuery, page]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Conditional return after all hooks have executed unconditionally
  if (!isOpen || !isAuthorized) return null;

  const handleCopyWorkId = (id, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText?.(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInspectWork = (work) => {
    if (onSelectWork) {
      // Pass the audit section so WorkDetailDrawer can pre-select the appropriate tab
      const enrichedWork = {
        ...work,
        __initialSection: work.audit_section || "overview",
      };
      onSelectWork(enrichedWork);
      onClose();
    }
  };

  const handleExportCSV = () => {
    if (!data.alerts || data.alerts.length === 0) return;
    const headers = [
      "Work ID",
      "Title",
      "Category",
      "Severity",
      "State",
      "Constituency",
      "MP Name",
      "Sanction Amount (Rs)",
      "Actual Amount (Rs)",
      "Alert Metric",
      "Reason",
    ];
    const rows = data.alerts.map((a) => [
      `"${a.WORK_ID || a.WORK_RECOMMENDATION_DTL_ID || ""}"`,
      `"${(a.WORK_DESCRIPTION || "").replace(/"/g, '""')}"`,
      `"${a.alert_category || ""}"`,
      `"${a.severity || ""}"`,
      `"${a.STATE_NAME || ""}"`,
      `"${a.CONSTITUENCY || ""}"`,
      `"${a.MP_NAME || ""}"`,
      a.SANCTION_AMOUNT || 0,
      a.ACTUAL_AMOUNT || 0,
      `"${a.metric_value || ""}"`,
      `"${(a.alert_reason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MoSPI_Early_Warning_Alerts_${activeCategory}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data.summary;
  const currentCategoryConfig = CATEGORY_CONFIG[activeCategory] || CATEGORY_CONFIG.all;

  if (!isOpen) return null;

  return (
    <div className="early-warning-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="early-warning-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="early-warning-header">
          <div className="ew-header-left">
            <div className="ew-header-shield">
              <ShieldAlert size={22} className="ew-shield-icon" />
              <span className="ew-pulse-beacon" />
            </div>
            <div>
              <div className="ew-header-title-row">
                <h2>Authorities Early Warning & Risk Intelligence Center</h2>
                <span className="ew-live-badge">LIVE SURVEILLANCE</span>
              </div>
              <p className="ew-header-subtitle">
                Continuous ML surveillance of 102,703 canonical MPLADS works for unusual patterns, delays, cost overruns, duplicates, and fund misuse.
              </p>
            </div>
          </div>

          <div className="ew-header-actions">
            <button
              className="ew-btn-outline"
              onClick={fetchAlerts}
              title="Refresh telemetry"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              className="ew-btn-outline"
              onClick={handleExportCSV}
              title="Export current page to CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              className="ew-btn-close"
              onClick={onClose}
              title="Close Early Warning Center (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 5 Pillar Category Tabs Ribbon */}
        <div className="ew-pills-bar">
          <button
            className={`ew-pillar-pill ${activeCategory === "all" ? "active all" : ""}`}
            onClick={() => {
              setActiveCategory("all");
              setPage(1);
            }}
          >
            <div className="pillar-pill-top">
              <span className="pillar-label">All Warnings</span>
              <span className="pillar-badge all">
                {summary
                  ? (
                      (summary.unusual_patterns?.count || 0) +
                      (summary.delays?.count || 0) +
                      (summary.cost_overruns?.count || 0) +
                      (summary.duplicate_works?.count || 0) +
                      (summary.fund_misuse?.count || 0)
                    ).toLocaleString("en-IN")
                  : "..."}
              </span>
            </div>
            <div className="pillar-subtext">Unified View</div>
          </button>

          <button
            className={`ew-pillar-pill ${activeCategory === "unusual_patterns" ? "active rose" : ""}`}
            onClick={() => {
              setActiveCategory("unusual_patterns");
              setPage(1);
            }}
          >
            <div className="pillar-pill-top">
              <span className="pillar-label">
                <AlertTriangle size={13} className="text-rose-500" />
                Unusual Patterns
              </span>
              <span className="pillar-badge rose">
                {summary?.unusual_patterns?.count?.toLocaleString("en-IN") || "4,432"}
              </span>
            </div>
            <div className="pillar-subtext">Erratic & Synthetic Timelines</div>
          </button>

          <button
            className={`ew-pillar-pill ${activeCategory === "delays" ? "active amber" : ""}`}
            onClick={() => {
              setActiveCategory("delays");
              setPage(1);
            }}
          >
            <div className="pillar-pill-top">
              <span className="pillar-label">
                <Clock size={13} className="text-amber-500" />
                Delays (45d+ SLA)
              </span>
              <span className="pillar-badge amber">
                {summary?.delays?.count?.toLocaleString("en-IN") || "54,761"}
              </span>
            </div>
            <div className="pillar-subtext">Section 3.12 Statutory Breach</div>
          </button>

          <button
            className={`ew-pillar-pill ${activeCategory === "cost_overruns" ? "active purple" : ""}`}
            onClick={() => {
              setActiveCategory("cost_overruns");
              setPage(1);
            }}
          >
            <div className="pillar-pill-top">
              <span className="pillar-label">
                <TrendingUp size={13} className="text-purple-500" />
                Cost Overruns
              </span>
              <span className="pillar-badge purple">
                {summary?.cost_overruns?.count?.toLocaleString("en-IN") || "13,745"}
              </span>
            </div>
            <div className="pillar-subtext">&gt;2.0x Peer Escalation</div>
          </button>

          <button
            className={`ew-pillar-pill ${activeCategory === "duplicate_works" ? "active indigo" : ""}`}
            onClick={() => {
              setActiveCategory("duplicate_works");
              setPage(1);
            }}
          >
            <div className="pillar-pill-top">
              <span className="pillar-label">
                <Copy size={13} className="text-indigo-500" />
                Duplicate Works
              </span>
              <span className="pillar-badge indigo">
                {summary?.duplicate_works?.count?.toLocaleString("en-IN") || "8,922"}
              </span>
            </div>
            <div className="pillar-subtext">Multi-District Clusters</div>
          </button>

          <button
            className={`ew-pillar-pill ${activeCategory === "fund_misuse" ? "active red" : ""}`}
            onClick={() => {
              setActiveCategory("fund_misuse");
              setPage(1);
            }}
          >
            <div className="pillar-pill-top">
              <span className="pillar-label">
                <AlertOctagon size={13} className="text-red-500" />
                Potential Misuse
              </span>
              <span className="pillar-badge red">
                {summary?.fund_misuse?.count?.toLocaleString("en-IN") || "4,425"}
              </span>
            </div>
            <div className="pillar-subtext">High Risk & Zero Evidence</div>
          </button>
        </div>

        {/* Category Context & Statutory Guidance Bar */}
        <div className="ew-category-banner">
          <div className="ew-category-banner-icon">
            <Info size={16} />
          </div>
          <div className="ew-category-banner-body">
            <div className="ew-banner-sla">{currentCategoryConfig.slaInfo}</div>
            {currentCategoryConfig.guideline && (
              <div className="ew-banner-guideline">
                <strong>Enforcement Action:</strong> {currentCategoryConfig.guideline}
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="ew-controls-row">
          <div className="ew-search-box">
            <Search size={15} className="ew-search-icon" />
            <input
              type="text"
              placeholder="Search Work ID, MP Name, District, Implementing Agency, Description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            {searchQuery && (
              <button className="ew-search-clear" onClick={() => setSearchQuery("")}>
                <X size={13} />
              </button>
            )}
          </div>

          <div className="ew-filter-group">
            <span className="ew-filter-label">Severity:</span>
            {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
              <button
                key={sev}
                className={`ew-filter-btn ${severityFilter === sev ? "active" : ""}`}
                onClick={() => {
                  setSeverityFilter(sev);
                  setPage(1);
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="ew-record-count">
            Showing <strong>{data.alerts?.length || 0}</strong> of{" "}
            <strong>{(data.total || 0).toLocaleString("en-IN")}</strong> flagged works
          </div>
        </div>

        {/* Alert Cards Feed */}
        <div className="ew-alerts-viewport">
          {loading ? (
            <div className="ew-state-loading">
              <div className="ew-spinner" />
              <span>Querying canonical telemetry across 102,703 works...</span>
            </div>
          ) : data.alerts?.length === 0 ? (
            <div className="ew-state-empty">
              <CheckCircle2 size={40} className="text-green-500" />
              <h3>No matching early warnings found</h3>
              <p>No works matched your search query or severity filter in this category.</p>
              <button
                className="ew-btn-reset"
                onClick={() => {
                  setSearchQuery("");
                  setSeverityFilter("ALL");
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="ew-alerts-list">
              {data.alerts.map((alert, idx) => {
                const isMisuse = alert.alert_category === "fund_misuse";
                const isDup = alert.alert_category === "duplicate_works";
                const isCost = alert.alert_category === "cost_overruns";
                const isDelay = alert.alert_category === "delays";

                const categoryClass = isMisuse
                  ? "cat-misuse"
                  : isDup
                  ? "cat-dup"
                  : isCost
                  ? "cat-cost"
                  : isDelay
                  ? "cat-delay"
                  : "cat-unusual";

                const sancAmt = Number(alert.SANCTION_AMOUNT || 0);
                const actAmt = Number(alert.ACTUAL_AMOUNT || 0);
                const workId = alert.WORK_ID || alert.WORK_RECOMMENDATION_DTL_ID || `WK-${idx}`;

                return (
                  <div
                    key={workId}
                    className={`ew-alert-card ${categoryClass}`}
                    onClick={() => handleInspectWork(alert)}
                  >
                    {/* Card Top: Badges + Work ID */}
                    <div className="ew-card-header">
                      <div className="ew-card-badges">
                        <span className={`ew-cat-tag ${categoryClass}`}>
                          {alert.alert_category === "unusual_patterns" && "🚨 UNUSUAL PATTERN"}
                          {alert.alert_category === "delays" && "⏳ DELAY SLA BREACH"}
                          {alert.alert_category === "cost_overruns" && "📈 COST OVERRUN"}
                          {alert.alert_category === "duplicate_works" && "👥 DUPLICATE WORK"}
                          {alert.alert_category === "fund_misuse" && "⚖️ FUND MISUSE RISK"}
                        </span>
                        <span className={`ew-sev-tag ${alert.severity?.toLowerCase()}`}>
                          {alert.severity}
                        </span>
                        <span className="ew-metric-pill" title="Telemetry Value">
                          {alert.metric_value}
                        </span>
                      </div>

                      <div className="ew-card-id-group">
                        <span className="ew-work-id" title="Canonical Work ID">
                          ID: #{workId}
                        </span>
                        <button
                          className="ew-copy-btn"
                          title="Copy Work ID"
                          onClick={(e) => handleCopyWorkId(workId, e)}
                        >
                          {copiedId === workId ? (
                            <CheckCircle2 size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Card Title & Telemetry Reason */}
                    <h4 className="ew-card-title">{alert.alert_title}</h4>
                    <div className="ew-card-reason">
                      <span className="ew-reason-lead">Flagged Reason:</span> {alert.alert_reason}
                    </div>

                    {/* Work Description */}
                    <p className="ew-work-description" title={alert.WORK_DESCRIPTION}>
                      {alert.WORK_DESCRIPTION || "No detailed description recorded in eSAKSHI."}
                    </p>

                    {/* Location & Stakeholder Meta */}
                    <div className="ew-card-meta-grid">
                      <div className="ew-meta-item">
                        <MapPin size={12} />
                        <span>
                          {alert.CONSTITUENCY || "Unknown Constituency"} ·{" "}
                          <strong>{alert.STATE_NAME || "State N/A"}</strong>
                        </span>
                      </div>
                      <div className="ew-meta-item">
                        <User size={12} />
                        <span>MP: {alert.MP_NAME || "Hon'ble MP"}</span>
                      </div>
                      <div className="ew-meta-item">
                        <Building2 size={12} />
                        <span>Agency: {alert.IDA_NAME || "District Authority"}</span>
                      </div>
                      <div className="ew-meta-item financial">
                        <span>
                          Sanction: ₹ {(sancAmt / 1e5).toFixed(2)}L · Disbursed: ₹{" "}
                          {(actAmt / 1e5).toFixed(2)}L
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom: Authority Action Button */}
                    <div className="ew-card-footer">
                      <div className="ew-card-footer-tip">
                        Clicking card opens full 78-field canonical record &amp; authority resolution dossier.
                      </div>
                      <button
                        className="ew-inspect-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectWork(alert);
                        }}
                      >
                        <FileSearch size={14} />
                        <span>Inspect Dossier</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Pagination Footer */}
        <div className="ew-pagination-footer">
          <div className="ew-page-info">
            Page <strong>{data.page || 1}</strong> of <strong>{data.pages || 1}</strong> (
            {(data.total || 0).toLocaleString("en-IN")} total flagged works)
          </div>

          <div className="ew-page-buttons">
            <button
              className="ew-page-btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span className="ew-page-current">{page}</span>
            <button
              className="ew-page-btn"
              disabled={page >= (data.pages || 1) || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
