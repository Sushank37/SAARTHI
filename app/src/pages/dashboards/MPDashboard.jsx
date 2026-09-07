import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  ShieldCheck,
  AlertTriangle,
  Building,
  CheckCircle2,
  Search,
  ChevronDown,
  Download,
  Eye,
  RefreshCw,
  ExternalLink,
  MapPin,
  FileText,
  Clock,
} from "lucide-react";
import {
  API_BASE,
  formatNumber,
  formatCrores,
  formatCurrency,
  formatDecimal,
  exportToCSV,
} from "../../constants";
import "./MPDashboard.css";

export default function MPDashboard({ summary, onSelectWork }) {
  const { roleConfig } = useAuth();

  // Active MP selection state (Default: Arvind Dharmapuri from master dataset)
  const [selectedMP, setSelectedMP] = useState("Arvind Dharmapuri");
  const [mpDropdownOpen, setMpDropdownOpen] = useState(false);
  const [mpSearchText, setMpSearchText] = useState("");
  const [mpsList, setMpsList] = useState([]);

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

  // Load master list of MPs from dataset
  useEffect(() => {
    async function fetchMPs() {
      try {
        const res = await fetch(`${API_BASE}/api/mps?include_stats=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.details && data.details.length > 0) {
            setMpsList(data.details);
          } else if (data.mps) {
            setMpsList(data.mps.map((name) => ({ mp_name: name, constituency: "", works_count: 0 })));
          }
        }
      } catch (err) {
        console.error("Failed to load MPs from master dataset:", err);
      }
    }
    fetchMPs();
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(workSearchQuery);
      setWorksPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [workSearchQuery]);

  // Load MP Analytics
  const loadMPAnalytics = async (mpName) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/mp?mp_name=${encodeURIComponent(mpName)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching MP analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadMPAnalytics(selectedMP);
    setWorksPage(1);
  }, [selectedMP]);

  // Load Constituency Works from canonical backend
  const loadConstituencyWorks = async () => {
    setWorksLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", worksPage);
      params.set("limit", worksLimit);
      params.set("mp_name", selectedMP);

      if (selectedStage && selectedStage !== "All") {
        params.set("stage", selectedStage);
      }

      if (filterFlaggedOnly) {
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
      console.error("Error loading works registry:", err);
      setWorks([]);
      setWorksTotal(0);
    } finally {
      setWorksLoading(false);
    }
  };

  useEffect(() => {
    loadConstituencyWorks();
  }, [selectedMP, worksPage, selectedStage, filterFlaggedOnly, debouncedSearch]);

  // Filtered MP list for selector
  const filteredMps = useMemo(() => {
    if (!mpSearchText.trim()) return mpsList.slice(0, 40);
    const q = mpSearchText.toLowerCase();
    return mpsList
      .filter(
        (m) =>
          m.mp_name.toLowerCase().includes(q) ||
          (m.constituency && m.constituency.toLowerCase().includes(q)) ||
          (m.state && m.state.toLowerCase().includes(q))
      )
      .slice(0, 40);
  }, [mpsList, mpSearchText]);

  // Derived factual values from backend analytics
  const financials = analytics?.financials || {};
  const stages = analytics?.stages || {};
  const riskSummary = analytics?.risk_summary || {};
  const totalWorks = analytics?.total_works || 0;

  const completedWorksCount = stages["Work Completed"] || 0;
  const sanctionWorksCount = stages["Sanction"] || 0;
  const totalAnomalies =
    (riskSummary.high_duplicate_risk || 0) +
    (riskSummary.medium_duplicate_risk || 0) +
    (riskSummary.delayed_sanctions || 0);

  const totalPages = Math.max(1, Math.ceil(worksTotal / worksLimit));

  // CSV Export handler
  const handleExportCSV = () => {
    if (!works.length) return;
    const filename = `MPLADS_Constituency_Works_${selectedMP.replace(/\s+/g, "_")}.csv`;
    exportToCSV(works, filename);
  };

  return (
    <div className="mp-dashboard-container">
      {/* 1. Official Persona Identity & Constituency Header */}
      <div className="mp-official-header-card">
        <div className="mp-header-inner">
          <div className="mp-identity-block">
            <div className="mp-ministry-badge">
              <span>Member of Parliament Portal · Lok Sabha</span>
            </div>
            <h1 className="mp-name-heading">{analytics?.mp_name || selectedMP}</h1>
            <p className="mp-constituency-crumb">
              <MapPin size={14} color="#64748b" />
              <span>
                Constituency: <strong>{analytics?.constituency || "NIZAMABAD"}</strong> · State:{" "}
                <strong>{analytics?.state || "Telangana"}</strong> · Quota Limit:{" "}
                <strong>₹ 5.00 Cr / Financial Year</strong>
              </span>
            </p>
          </div>

          {/* Official MP Selector Dropdown */}
          <div className="mp-selector-wrapper">
            <button
              type="button"
              className="mp-selector-btn"
              onClick={() => setMpDropdownOpen(!mpDropdownOpen)}
              title="Select Member of Parliament from dataset"
            >
              <div>
                <span className="mp-selector-caption">Select Hon'ble MP (538 in Dataset)</span>
                <span className="mp-selector-active-name">{selectedMP}</span>
              </div>
              <ChevronDown size={16} color="#64748b" />
            </button>

            {mpDropdownOpen && (
              <div className="mp-dropdown-menu">
                <div className="mp-dropdown-search">
                  <Search size={13} color="#64748b" />
                  <input
                    type="text"
                    className="mp-dropdown-input"
                    placeholder="Search MP or Constituency..."
                    value={mpSearchText}
                    onChange={(e) => setMpSearchText(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="mp-dropdown-scroll">
                  {filteredMps.map((mp) => (
                    <div
                      key={mp.mp_name}
                      className={`mp-dropdown-row ${mp.mp_name === selectedMP ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedMP(mp.mp_name);
                        setMpDropdownOpen(false);
                      }}
                    >
                      <div>
                        <div>{mp.mp_name}</div>
                        {mp.constituency && (
                          <div className="text-xs text-slate-500">
                            {mp.constituency} {mp.state ? `(${mp.state})` : ""}
                          </div>
                        )}
                      </div>
                      {mp.works_count > 0 && (
                        <span className="mp-row-works-count">{formatNumber(mp.works_count)}</span>
                      )}
                    </div>
                  ))}
                  {filteredMps.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500">No matching MP found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Primary 4-Metric Summary Bar (Rule 12: Visual Priority) */}
      <div className="mp-metrics-bar">
        {/* Metric 1: Total Recommendations */}
        <div className="mp-metric-card">
          <span className="mp-metric-caption">Total Recommended Works</span>
          <span className="mp-metric-figure">{formatNumber(totalWorks)}</span>
          <span className="mp-metric-subtext">
            Recommended Value: <strong>{formatCrores(financials.recommended_amount || 0)}</strong>
          </span>
        </div>

        {/* Metric 2: Sanctions Issued by District Authority */}
        <div className="mp-metric-card">
          <span className="mp-metric-caption">Sanctions Approved (AS/TS)</span>
          <span className="mp-metric-figure">{formatCrores(financials.sanction_amount || 0)}</span>
          <span className="mp-metric-subtext">
            Conversion: <strong>{financials.sanction_rate_percent || 0}%</strong> of recommended
          </span>
        </div>

        {/* Metric 3: Statutory Entitlement Quota Balance */}
        <div className="mp-metric-card">
          <span className="mp-metric-caption">Annual Quota Balance</span>
          <span className="mp-metric-figure">
            {formatCrores(financials.uncommitted_quota !== undefined ? financials.uncommitted_quota : 0)}
          </span>
          <span className="mp-metric-subtext">
            Statutory baseline: ₹ 5.00 Cr / FY
          </span>
        </div>

        {/* Metric 4: Completed Assets */}
        <div className="mp-metric-card">
          <span className="mp-metric-caption">Assets Handed Over</span>
          <span className="mp-metric-figure">{formatNumber(completedWorksCount)}</span>
          <span className="mp-metric-subtext">
            Expenditure: <strong>{formatCrores(financials.actual_amount || 0)}</strong>
          </span>
        </div>
      </div>

      {/* 3. Primary Insight / Action Strip (Rule 2: Progressive Disclosure) */}
      <div className={`mp-insight-strip ${totalAnomalies > 0 ? "has-alerts" : ""}`}>
        <div className="strip-info-left">
          {totalAnomalies > 0 ? (
            <>
              <AlertTriangle size={18} color="#b45309" />
              <span>
                <strong>Constituency Oversight Alert:</strong> {riskSummary.high_duplicate_risk || 0} duplicate proposal warnings and{" "}
                {riskSummary.delayed_sanctions || 0} sanction delay cases require administrative review.
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} color="#15803d" />
              <span>
                <strong>Constituency Status:</strong> All recommended works progressing normally with no outstanding anomaly flags.
              </span>
            </>
          )}
        </div>
        {totalAnomalies > 0 && (
          <button
            type="button"
            className="strip-action-link"
            onClick={() => {
              setFilterFlaggedOnly(!filterFlaggedOnly);
              setWorksPage(1);
            }}
          >
            {filterFlaggedOnly ? "Clear Review Filter" : "Filter Priority Review Cases"}
          </button>
        )}
      </div>

      {/* 4. Focused Constituency Works Register Table (Rule 14: Tables Over Decorative Cards) */}
      <div className="mp-register-card">
        <div className="register-toolbar">
          <div className="register-title-area">
            <h2>Constituency Works Register</h2>
            <p>
              Audited live from national repository · Filtered for MP {selectedMP} ({formatNumber(worksTotal)} Records Total)
            </p>
          </div>

          <div className="register-controls">
            <div className="register-search-box">
              <Search size={13} color="#64748b" />
              <input
                type="text"
                placeholder="Search by Work ID, title, category..."
                value={workSearchQuery}
                onChange={(e) => setWorkSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="pagination-btn"
              onClick={handleExportCSV}
              disabled={!works.length}
              title="Export filtered records to CSV"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              className="pagination-btn"
              onClick={loadConstituencyWorks}
              title="Refresh register"
            >
              <RefreshCw size={13} className={worksLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Milestone Stage Filter Tabs */}
        <div className="register-stage-tabs">
          {["All", "Pending Sanction", "Sanction", "Physical Inspection", "Work partially Completed", "Work Completed"].map(
            (stage) => (
              <button
                key={stage}
                type="button"
                className={`stage-tab-btn ${selectedStage === stage ? "active" : ""}`}
                onClick={() => {
                  setSelectedStage(stage);
                  setWorksPage(1);
                }}
              >
                {stage === "All" ? "All Works" : stage}
              </button>
            )
          )}
        </div>

        {/* Data Table */}
        <div className="mp-table-container">
          <table className="mp-gov-table">
            <thead>
              <tr>
                <th>Work ID</th>
                <th>Work Description</th>
                <th>Implementing Agency</th>
                <th>Recommended (₹)</th>
                <th>Sanctioned (₹)</th>
                <th>Stage</th>
                <th>Audit Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {worksLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-slate-600" />
                    Querying master database for {selectedMP}...
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No matching works found for the selected criteria.
                  </td>
                </tr>
              ) : (
                works.map((work) => {
                  const workId = work.WORK_ID || work.WORK_RECOMMENDATION_DTL_ID;
                  const dupRisk = String(work.DUPLICATE_RISK || "LOW").toUpperCase();
                  const stage = work.WORK_STAGE || "Pending Sanction";

                  return (
                    <tr
                      key={work.WORK_RECOMMENDATION_DTL_ID || work.WORK_ID}
                      onClick={() => onSelectWork && onSelectWork(work)}
                    >
                      <td className="cell-work-id">#{workId}</td>
                      <td className="cell-desc">
                        <div className="cell-desc-title">{work.WORK_DESCRIPTION || "—"}</div>
                        <div className="cell-category">{work.WORK_CATEGORY || "General/Civil"}</div>
                      </td>
                      <td className="cell-agency" title={work.IDA_NAME || "Unassigned"}>
                        {work.IDA_NAME || "—"}
                      </td>
                      <td className="cell-amount">{formatCurrency(work.RECOMMENDED_AMOUNT || 0)}</td>
                      <td className="cell-amount">
                        {work.SANCTION_AMOUNT ? formatCurrency(work.SANCTION_AMOUNT) : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge-stage ${
                            stage === "Work Completed"
                              ? "stage-completed"
                              : stage === "Sanction"
                              ? "stage-sanction"
                              : "stage-inspection"
                          }`}
                        >
                          {stage}
                        </span>
                      </td>
                      <td>
                        {dupRisk === "HIGH" ? (
                          <span className="badge-review alert-duplicate">Duplicate Flag #{work.CLUSTER_ID}</span>
                        ) : dupRisk === "MEDIUM" ? (
                          <span className="badge-review alert-review">Near Match #{work.CLUSTER_ID}</span>
                        ) : work.REQUIRES_REVIEW ? (
                          <span className="badge-review alert-review">Review Required</span>
                        ) : (
                          <span className="badge-review verified">Verified</span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-view-dossier"
                          onClick={() => onSelectWork && onSelectWork(work)}
                          title="Open official 78-field work dossier"
                        >
                          <Eye size={12} />
                          <span>View Dossier</span>
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
        <div className="register-pagination-bar">
          <span>
            Showing {works.length ? (worksPage - 1) * worksLimit + 1 : 0} to{" "}
            {Math.min(worksPage * worksLimit, worksTotal)} of {formatNumber(worksTotal)} works
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setWorksPage((p) => Math.max(1, p - 1))}
              disabled={worksPage <= 1}
            >
              Previous
            </button>
            <span className="px-2 font-semibold">
              Page {worksPage} of {totalPages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setWorksPage((p) => Math.min(totalPages, p + 1))}
              disabled={worksPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 5. Pre-Sanction Proposal Verification Shortcut (Rule 12: Action Area) */}
      <div className="mp-precheck-box">
        <div className="precheck-text">
          <h3>Pre-Sanction Proposal Verification</h3>
          <p>
            Screen new proposals against existing constituency assets to prevent duplicate recommendations prior to official submission to the District Collector.
          </p>
        </div>
        <Link to="/pre-sanction" className="precheck-btn">
          <span>Verify New Proposal</span>
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
}
