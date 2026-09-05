import React, { useEffect, useState, useMemo } from "react";
import {
  ClipboardCheck,
  Search,
  Download,
  Printer,
  ShieldAlert,
  GitBranch,
  FileCheck,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import {
  API_BASE,
  formatNumber,
  formatDecimal,
  formatCurrency,
  exportToCSV,
} from "../constants";

export default function ReviewQueue({ onSelectWork }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);

  const PAGE_SIZE = 12;

  const loadCases = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`${API_BASE}/api/review-cases?${params.toString()}`);
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
  }, []);

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((item) =>
      [
        item.WORK_ID,
        item.WORK_RECOMMENDATION_DTL_ID,
        item.STATE_NAME,
        item.CONSTITUENCY,
        item.MP_NAME,
        item.WORK_DESCRIPTION,
        item.REVIEW_REASON,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [cases, search]);

  const handleExport = () => {
    exportToCSV(cases, `mplads_review_queue_page_${page}.csv`);
  };

  return (
    <div className="compact-page-container">
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">eSAKSHI INTEGRATION / DISTRICT VERIFICATION</div>
          <h2>Priority Verification Queue</h2>
          <p>
            High-priority works requiring immediate administrative review before further fund releases
            or utilization certificate approvals.
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

      <div className="gov-card full-width-card">
        <div className="table-controls-bar">
          <div className="search-box-wrap">
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work ID, state, constituency, MP or review flag..."
            />
          </div>

          <span className="results-count-tag">
            <strong>{formatNumber(totalCases)}</strong> priority cases queued for audit
          </span>
        </div>

        <div className="table-responsive">
          <table className="gov-data-table">
            <thead>
              <tr>
                <th>Work ID</th>
                <th>Location</th>
                <th>Recommending MP</th>
                <th>Sanction Amount</th>
                <th>Risk Score</th>
                <th>Evidence Score</th>
                <th>Prioritized Audit Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="spinner" /> Loading audit review cases...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    No cases match the current query.
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
                    <td>{formatCurrency(item.SANCTION_AMOUNT)}</td>
                    <td>
                      <span className={`risk-tag ${item.RISK_LEVEL?.toLowerCase()}`}>
                        {formatDecimal(item.RISK_SCORE)} ({item.RISK_LEVEL})
                      </span>
                    </td>
                    <td>
                      <strong className="score-highlight">
                        {formatDecimal(item.EVIDENCE_SCORE || item.CLUSTER_SUSPICION_SCORE)}
                      </strong>
                    </td>
                    <td className="truncate-cell">
                      <span className="reason-tag">
                        {item.REVIEW_REASON || item.RISK_REASON || "Audit Flagged"}
                      </span>
                    </td>
                    <td>
                      <button className="table-action-btn">Audit Dossier →</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
