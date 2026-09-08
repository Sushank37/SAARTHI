import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  IndianRupee,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

const SUBTABS = [
  { id: "all", label: "All Anomalies", count: 17723 },
  { id: "extreme-delay", label: "Extreme Delays (>180d)", count: 12824 },
  { id: "cost-variance", label: "Spending Overruns", count: 4899 },
  { id: "long-completion", label: "Prolonged Lifecycles (>365d)", count: 3553 },
];

export default function AnomalyDetectionTab({ analytics, onSelectWork }) {
  const anomalies = analytics?.anomaly_summary || {};
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
            setTotalPages(d.total_pages || 1);
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Extreme Sanction Delays</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(anomalies.extreme_delays_over_180 || 12824)}</div>
          <div className="mospi-kpi-sub">&gt; 180 days from MP recommendation</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Spending Discrepancies</span>
            <IndianRupee size={16} className="text-rose-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(anomalies.cost_variance_cases || 4899)}</div>
          <div className="mospi-kpi-sub">Actual disbursement &gt; sanction amount</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Prolonged Lifecycles</span>
            <Calendar size={16} className="text-purple-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(anomalies.prolonged_completion_over_365 || 3553)}</div>
          <div className="mospi-kpi-sub">&gt; 365 days from sanction to completion</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Significant Cost Variances</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(anomalies.significant_variance_cases || 490)}</div>
          <div className="mospi-kpi-sub">&gt; 20% divergence from peer norm</div>
        </div>
      </div>

      {/* 2. Anomaly Table Card */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">National Anomaly Registry</h3>
            <p className="mospi-card-subtitle">
              Systemic outliers, execution delay patterns, and expenditure divergences across 1,02,703 works
            </p>
          </div>
          <span className="mospi-pill amber">
            {formatNumber(totalCount)} Anomalous Works Flagged
          </span>
        </div>

        {/* Subtab Filter Bar */}
        <div className="mospi-subtab-bar" style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "10px", flexWrap: "wrap" }}>
          {SUBTABS.map((st) => {
            const isActive = activeSubtab === st.id;
            return (
              <button
                key={st.id}
                type="button"
                className={`mospi-pill ${isActive ? "blue" : "neutral"}`}
                onClick={() => handleSubtabClick(st.id)}
                style={{
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                }}
              >
                <span>{st.label}</span>
                <span style={{ opacity: 0.8, fontSize: "11px" }}>({formatNumber(st.count)})</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="mospi-table-responsive">
          <table className="mospi-table">
            <thead>
              <tr>
                <th style={{ width: "100px" }}>Work ID</th>
                <th>Description</th>
                <th>State & District</th>
                <th>Sanctioned (₹)</th>
                <th>Disbursed (₹)</th>
                <th>Sanction Delay</th>
                <th>Completion Time</th>
                <th style={{ textAlign: "center", width: "110px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div className="spinner" />
                    <p className="text-muted mt-2">Loading anomalous works records...</p>
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
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
                      <td style={{ fontWeight: 700, color: "#2563eb" }}>
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
                      <td style={{ fontWeight: 600 }}>
                        {sancAmt > 0 ? `₹ ${sancAmt.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ fontWeight: 600, color: isSpendingOverrun ? "#b91c1c" : "inherit" }}>
                        {actAmt > 0 ? `₹ ${actAmt.toLocaleString("en-IN")}` : "—"}
                        {isSpendingOverrun && (
                          <span className="mospi-pill rose" style={{ marginLeft: "4px", fontSize: "10px" }}>
                            Exceeded
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`mospi-pill ${isExtremeDelay ? "warning" : "neutral"}`}>
                          {delayDays > 0 ? `${delayDays}d` : "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`mospi-pill ${compDays > 365 ? "warning" : "neutral"}`}>
                          {compDays > 0 ? `${compDays}d` : "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-btn-sm"
                          onClick={() => onSelectWork && onSelectWork(w)}
                          title="Open full 78-field canonical record dossier"
                        >
                          <ExternalLink size={12} />
                          <span>Dossier</span>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Showing page {page} of {totalPages} ({formatNumber(totalCount)} total works)
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="mospi-btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="mospi-btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
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
