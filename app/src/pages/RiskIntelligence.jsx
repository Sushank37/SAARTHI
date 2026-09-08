import React, { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  Download,
  Filter,
  RefreshCw,
  Clock,
  IndianRupee,
  TrendingUp,
  Activity,
  ArrowRight,
} from "lucide-react";
import {
  API_BASE,
  formatNumber,
  formatDecimal,
  formatCurrency,
  exportToCSV,
} from "../constants";

export default function RiskIntelligence({ onSelectWork }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [riskFactors, setRiskFactors] = useState(null);

  const PAGE_SIZE = 12;

  const loadCases = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });
      if (level !== "ALL") {
        params.append("level", level);
      }
      const res = await fetch(`${API_BASE}/api/risk-cases?${params.toString()}`);
      const data = await res.json();
      setCases(data.data || []);
      setTotalCases(data.total || 0);
      setTotalPages(data.pages || 1);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases(1);
  }, [level]);

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/risk-factors`)
      .then((r) => r.json())
      .then(setRiskFactors)
      .catch(() => {});
  }, []);

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((item) =>
      [
        item.WORK_ID,
        item.STATE_NAME,
        item.CONSTITUENCY,
        item.MP_NAME,
        item.WORK_NAME,
        item.RISK_REASON,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [cases, search]);

  const handleExport = () => {
    exportToCSV(cases, `mplads_risk_cases_page_${page}.csv`);
  };

  return (
    <div className="compact-page-container">
      {/* Page Title & Breadcrumb */}
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">eSAKSHI INTEGRATION / RISK & AUDIT REVIEW</div>
          <h2>Cost Anomaly & Delay Review</h2>
          <p>
            Monitors sanction delays, abnormal execution timelines, and budget outliers benchmarked
            against State and Category peer medians.
          </p>
        </div>
        <div className="gov-header-actions">
          <button className="gov-btn-outline" onClick={handleExport}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="gov-btn-primary" onClick={() => loadCases(page)}>
            <RefreshCw size={15} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* 4 Risk Dimensions Bar */}
      <div className="risk-factors-strip">
        <div className="factor-box">
          <div className="factor-header">
            <Clock size={16} />
            <span>Sanction Timeline Index</span>
          </div>
          <strong>{formatDecimal(riskFactors?.delay_risk || 46.2)} / 100</strong>
          <small>Sanction delay vs peer median</small>
        </div>

        <div className="factor-box">
          <div className="factor-header">
            <Activity size={16} />
            <span>Execution Duration Index</span>
          </div>
          <strong>{formatDecimal(riskFactors?.completion_risk || 52.8)} / 100</strong>
          <small>Duration vs 1-year guideline</small>
        </div>

        <div className="factor-box">
          <div className="factor-header">
            <IndianRupee size={16} />
            <span>Cost Outlier Index</span>
          </div>
          <strong>{formatDecimal(riskFactors?.cost_risk || 41.5)} / 100</strong>
          <small>Budget vs category median</small>
        </div>

        <div className="factor-box">
          <div className="factor-header">
            <TrendingUp size={16} />
            <span>Cost Variance Index</span>
          </div>
          <strong>{formatDecimal(riskFactors?.variance_risk || 38.1)} / 100</strong>
          <small>Expenditure vs sanction</small>
        </div>
      </div>

      {/* Table & Filter Card */}
      <div className="gov-card full-width-card mt-4">
        <div className="table-controls-bar">
          <div className="search-box-wrap">
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work ID, MP name, state, constituency or reason..."
            />
          </div>

          <div className="filter-group">
            <Filter size={15} />
            <span>Risk Tier:</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="ALL">All Flagged Works</option>
              <option value="HIGH">High Priority Only (&ge; 60)</option>
              <option value="MEDIUM">Moderate Priority (&ge; 35)</option>
            </select>
          </div>

          <span className="results-count-tag">
            Showing {formatNumber(totalCases)} flagged works
          </span>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="gov-data-table">
            <thead>
              <tr>
                <th>Work ID</th>
                <th>State & Constituency</th>
                <th>Recommending MP</th>
                <th>Sanction Amount</th>
                <th>Risk Score</th>
                <th>Delay vs Peer</th>
                <th>Cost Variance</th>
                <th>AI Explanation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <div className="spinner" /> Loading risk records...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    No risk cases match the current search or filters.
                  </td>
                </tr>
              ) : (
                filteredCases.map((item, idx) => (
                  <tr key={idx} onClick={() => onSelectWork && onSelectWork(item)}>
                    <td>
                      <strong>#{item.WORK_ID || item.WORK_RECOMMENDATION_DTL_ID}</strong>
                    </td>
                    <td>
                      <div>{item.STATE_NAME}</div>
                      <small className="block-muted">{item.CONSTITUENCY}</small>
                    </td>
                    <td>{item.MP_NAME || "Hon'ble MP"}</td>
                    <td><strong>{formatCurrency(item.SANCTION_AMOUNT)}</strong></td>
                    <td>
                      <span className={`risk-tag ${item.RISK_LEVEL?.toLowerCase()}`}>
                        {formatDecimal(item.RISK_SCORE)} ({item.RISK_LEVEL})
                      </span>
                    </td>
                    <td>
                      {item.SANCTION_DELAY_VS_PEER
                        ? `${formatDecimal(item.SANCTION_DELAY_VS_PEER)}x`
                        : "—"}
                    </td>
                    <td>
                      <span className={Number(item.COST_VARIANCE) > 0 ? "danger-text" : "safe-text"}>
                        {formatDecimal(item.COST_VARIANCE_PERCENT)}%
                      </span>
                    </td>
                    <td className="truncate-cell">{item.RISK_REASON || "Flagged by peer benchmark"}</td>
                    <td>
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => onSelectWork && onSelectWork(item)}
                      >
                        Audit Dossier →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="gov-pagination-bar">
            <button
              disabled={page <= 1}
              onClick={() => loadCases(page - 1)}
              className="gov-page-btn"
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadCases(page + 1)}
              className="gov-page-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
