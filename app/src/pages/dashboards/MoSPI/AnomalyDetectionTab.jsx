import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  IndianRupee,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

export default function AnomalyDetectionTab({ analytics, onSelectWork }) {
  const anomalies = analytics?.anomaly_summary || {};
  const extremeDelays = anomalies.extreme_delays_over_180 ?? 0;
  const costVariance = anomalies.cost_variance_cases ?? 0;
  const prolonged = anomalies.prolonged_completion_over_365 ?? 0;
  const totalAnomalies = extremeDelays + costVariance + prolonged;

  const subtabs = [
    { id: "all", label: "All Anomalies", count: totalAnomalies },
    { id: "extreme-delay", label: "Extreme Delays (>180d)", count: extremeDelays },
    { id: "cost-variance", label: "Spending Overruns", count: costVariance },
    { id: "long-completion", label: "Prolonged Lifecycles (>365d)", count: prolonged },
  ];

  const [activeSubtab, setActiveSubtab] = useState("all");
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchAnomalousWorks() {
      setLoading(true);
      try {
        const sub = activeSubtab === "all" ? "" : `&subfilter=${activeSubtab}`;
        const res = await fetch(`${API_BASE}/api/works?tab=anomaly-detection${sub}&page=${page}&limit=20`);
        if (res.ok) {
          const d = await res.json();
          if (isMounted) {
            setWorks(d.data || []);
            setTotalCount(d.total || 0);
            setTotalPages(d.total_pages || d.pages || 1);
          }
        }
      } catch (err) {
        console.error("Failed to load anomaly detection works:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAnomalousWorks();
    return () => { isMounted = false; };
  }, [activeSubtab, page]);

  const handleSubtabClick = (tabId) => {
    setActiveSubtab(tabId);
    setPage(1);
  };

  return (
    <div className="mospi-panel">
      {/* 1. Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Extreme Sanction Delays</span>
            <Clock size={15} color="#d97706" />
          </div>
          <div className="mospi-kpi-value">
            {anomalies.extreme_delays_over_180 != null ? formatNumber(anomalies.extreme_delays_over_180) : "—"}
          </div>
          <div className="mospi-kpi-sub">&gt; 180 days from MP recommendation</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Spending Discrepancies</span>
            <IndianRupee size={15} color="#e11d48" />
          </div>
          <div className="mospi-kpi-value">
            {anomalies.cost_variance_cases != null ? formatNumber(anomalies.cost_variance_cases) : "—"}
          </div>
          <div className="mospi-kpi-sub">Actual disbursement &gt; sanction amount</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Prolonged Lifecycles</span>
            <Calendar size={15} color="#7c3aed" />
          </div>
          <div className="mospi-kpi-value">
            {anomalies.prolonged_completion_over_365 != null ? formatNumber(anomalies.prolonged_completion_over_365) : "—"}
          </div>
          <div className="mospi-kpi-sub">&gt; 365 days from sanction to completion</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Significant Cost Variances</span>
            <AlertTriangle size={15} color="#dc2626" />
          </div>
          <div className="mospi-kpi-value">
            {anomalies.significant_variance_cases != null ? formatNumber(anomalies.significant_variance_cases) : "—"}
          </div>
          <div className="mospi-kpi-sub">&gt; 20% divergence from peer norm</div>
        </div>
      </div>

      {/* 2. Anomaly Table Card */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">National Anomaly Registry</h3>
            <p className="mospi-card-subtitle">
              Systemic outliers, execution delay patterns, and expenditure divergences across {analytics?.national_kpis?.total_works != null ? formatNumber(analytics.national_kpis.total_works) : "all"} works
            </p>
          </div>
          <span className="mospi-pill amber">
            {formatNumber(totalCount)} Anomalous Works Flagged
          </span>
        </div>

        {/* Subtab Filter Bar */}
        <div className="mospi-subtab-bar">
          {subtabs.map((st) => {
            const isActive = activeSubtab === st.id;
            return (
              <button
                key={st.id}
                type="button"
                className={`mospi-subtab-btn ${isActive ? "active" : ""}`}
                onClick={() => handleSubtabClick(st.id)}
              >
                <span>{st.label}</span>
                <span style={{ opacity: 0.85, fontSize: "10.5px" }}>({formatNumber(st.count)})</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Work ID</th>
                <th>Description</th>
                <th>State & District</th>
                <th style={{ textAlign: "right" }}>Sanctioned (₹)</th>
                <th style={{ textAlign: "right" }}>Disbursed (₹)</th>
                <th style={{ textAlign: "center" }}>Sanction Delay</th>
                <th style={{ textAlign: "center" }}>Completion Time</th>
                <th style={{ textAlign: "center", width: "130px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>
                    <div className="spinner" />
                    <p style={{ color: "#64748b", marginTop: "6px", fontSize: "12px" }}>Loading anomalous works records...</p>
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No works flagged for this anomaly criterion.
                  </td>
                </tr>
              ) : (
                works.map((w) => {
                  const delayDays = Number(w.SANCTION_DELAY_DAYS) || 0;
                  const compDays = Number(w.COMPLETION_DURATION_DAYS) || 0;
                  const sancAmt = Number(w.SANCTION_AMOUNT) || 0;
                  const actAmt = Number(w.ACTUAL_AMOUNT) || 0;
                  const isSpendingOverrun = actAmt > sancAmt && sancAmt > 0;
                  const isExtremeDelay = delayDays > 180;

                  return (
                    <tr key={w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID}>
                      <td style={{ fontWeight: 700, color: "#005A9C" }}>
                        #{w.WORK_ID || w.WORK_RECOMMENDATION_DTL_ID}
                      </td>
                      <td style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={w.WORK_DESCRIPTION}>
                        {w.WORK_DESCRIPTION || "—"}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{w.STATE_NAME || "—"}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {w.IDA_NAME || "—"}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {sancAmt > 0 ? `₹ ${sancAmt.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: isSpendingOverrun ? "#b91c1c" : "inherit" }}>
                        {actAmt > 0 ? `₹ ${actAmt.toLocaleString("en-IN")}` : "—"}
                        {isSpendingOverrun && (
                          <span className="mospi-pill rose" style={{ marginLeft: "4px", fontSize: "10px" }}>
                            Over
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`mospi-pill ${isExtremeDelay ? "amber" : "neutral"}`}>
                          {delayDays > 0 ? `${delayDays}d` : "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`mospi-pill ${compDays > 365 ? "amber" : "neutral"}`}>
                          {compDays > 0 ? `${compDays}d` : "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-dossier-btn mospi-dossier-anomaly"
                          onClick={() => onSelectWork && onSelectWork({ ...w, __initialSection: "risk", __authority: "MOSPI" })}
                          title="Inspect MoSPI Central Anomaly & Forensic Dossier"
                        >
                          <ShieldAlert size={11} />
                          <span>Anomaly Dossier →</span>
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
        <div className="mospi-pagination-bar">
          <span className="mospi-page-info">
            Showing page {page} of {totalPages} ({formatNumber(totalCount)} total works)
          </span>
          <div className="mospi-page-btn-group">
            <button
              type="button"
              className="mospi-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={12} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="mospi-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <span>Next</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
