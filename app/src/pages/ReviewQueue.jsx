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
    <div className="gov-mp-shell">
      {/* Page Title & Breadcrumb Header Card */}
      <div className="gov-mp-header-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <span className="gov-parliament-badge" style={{ background: "#fef2f2", color: "#b91c1c", borderColor: "#fca5a5" }}>
                <ClipboardCheck size={12} />
                <span>District Verification Queue · eSAKSHI Integration</span>
              </span>
            </div>
            <h1 className="gov-mp-page-title" style={{ fontSize: "18px", margin: "2px 0" }}>
              Priority Verification Queue
            </h1>
            <p className="gov-mp-page-subtitle">
              High-priority works requiring immediate administrative review before further fund releases or utilization certificate approvals.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button className="gov-redirect-link-btn" onClick={handleExport}>
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button
              className="gov-redirect-link-btn"
              style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#005A9C" }}
              onClick={() => loadCases(page)}
            >
              <RefreshCw size={13} />
              <span>Refresh List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Card */}
      <div className="gov-mp-card">
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
          <div style={{ position: "relative", flexGrow: 1, maxWidth: "420px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#64748b" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work ID, state, constituency, MP..."
              style={{
                width: "100%",
                height: "32px",
                paddingLeft: "32px",
                paddingRight: "10px",
                fontSize: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                background: "#ffffff",
              }}
            />
          </div>

          <span className="gov-parliament-badge" style={{ marginLeft: "auto" }}>
            <strong>{formatNumber(totalCases)}</strong> priority cases queued for audit
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="gov-mp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
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
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
                    Loading audit review cases...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
                    No cases match the current query.
                  </td>
                </tr>
              ) : (
                filteredCases.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong style={{ fontFamily: "monospace", color: "#005A9C", fontSize: "12px" }}>
                        #{item.WORK_ID || item.WORK_RECOMMENDATION_DTL_ID}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: "600" }}>{item.STATE_NAME}</div>
                      <small style={{ color: "#64748b", fontSize: "11px" }}>{item.CONSTITUENCY}</small>
                    </td>
                    <td>{item.MP_NAME || "Hon'ble MP"}</td>
                    <td><strong>{formatCurrency(item.SANCTION_AMOUNT)}</strong></td>
                    <td>
                      <span
                        className="gov-parliament-badge"
                        style={{
                          background: item.RISK_LEVEL === "HIGH" ? "#fef2f2" : "#fffbeb",
                          color: item.RISK_LEVEL === "HIGH" ? "#b91c1c" : "#b45309",
                          borderColor: item.RISK_LEVEL === "HIGH" ? "#fecaca" : "#fde68a",
                        }}
                      >
                        {formatDecimal(item.RISK_SCORE)} ({item.RISK_LEVEL})
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#005A9C" }}>
                        {formatDecimal(item.EVIDENCE_SCORE || item.CLUSTER_SUSPICION_SCORE)}
                      </strong>
                    </td>
                    <td style={{ maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "11.5px" }}>
                      <span style={{ color: "#b91c1c", fontWeight: "600" }}>
                        {item.REVIEW_REASON || item.RISK_REASON || "Audit Flagged"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="gov-redirect-link-btn"
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

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
            <button
              disabled={page <= 1}
              onClick={() => loadCases(page - 1)}
              className="gov-redirect-link-btn"
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadCases(page + 1)}
              className="gov-redirect-link-btn"
              style={{ opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
