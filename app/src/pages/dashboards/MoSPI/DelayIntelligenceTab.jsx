import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

const DELAY_BUCKET_TABS = [
  { id: "all", label: "All Sanctioned Works", count: 77617 },
  { id: "under-45", label: "≤ 45 Days (Compliant)", count: 22856, status: "success" },
  { id: "46-90", label: "46 – 90 Days", count: 20580, status: "neutral" },
  { id: "91-180", label: "91 – 180 Days", count: 21357, status: "warning" },
  { id: "over-180", label: "> 180 Days (Severe)", count: 12824, status: "danger" },
];

export default function DelayIntelligenceTab({ analytics, onSelectWork }) {
  const delayInfo = analytics?.delay_buckets || {};
  const [activeBucket, setActiveBucket] = useState("all");
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchDelayedWorks() {
      setLoading(true);
      try {
        const sub = activeBucket === "all" ? "" : `&subfilter=${activeBucket}`;
        const res = await fetch(`${API_BASE}/api/works?tab=delay-intelligence${sub}&page=${page}&limit=20`);
        if (res.ok) {
          const d = await res.json();
          if (isMounted) {
            setWorks(d.data || []);
            setTotalCount(d.total || 0);
            setTotalPages(d.total_pages || 1);
          }
        }
      } catch (err) {
        console.error("Failed to load delayed works:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDelayedWorks();
    return () => { isMounted = false; };
  }, [activeBucket, page]);

  const handleBucketClick = (bucketId) => {
    setActiveBucket(bucketId);
    setPage(1);
  };

  return (
    <div className="mospi-panel">
      {/* 1. National Delay Benchmarks */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">National Avg Sanction Delay</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mospi-kpi-value">{delayInfo.avg_sanction_delay || 105.7}d</div>
          <div className="mospi-kpi-sub">Prescribed guideline: 45 days</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Avg Execution Duration</span>
            <Calendar size={16} className="text-sky-500" />
          </div>
          <div className="mospi-kpi-value">{delayInfo.avg_completion_duration || 174.5}d</div>
          <div className="mospi-kpi-sub">From administrative sanction to completion</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Over 45-Day Guideline</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(delayInfo.over_statutory_count || 54761)}</div>
          <div className="mospi-kpi-sub">70.6% of sanctioned works took &gt;45d</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Compliant Under 45d</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(delayInfo.under_45 || 22856)}</div>
          <div className="mospi-kpi-sub">29.4% strictly adhered to 45d limit</div>
        </div>
      </div>

      {/* 2. Delay Distribution Breakdown Card */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">National Sanction Delay Distribution</h3>
            <p className="mospi-card-subtitle">
              Breakdown of 77,617 sanctioned works into official duration intervals
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "8px" }}>
          <div style={{ padding: "12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>≤ 45 Days</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#15803d", marginTop: "4px" }}>
              {formatNumber(delayInfo.under_45 || 22856)}
            </div>
            <div style={{ fontSize: "11px", color: "#166534", marginTop: "2px" }}>Compliant with SLA (29.4%)</div>
          </div>

          <div style={{ padding: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>46 – 90 Days</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#334155", marginTop: "4px" }}>
              {formatNumber(delayInfo.from_46_to_90 || 20580)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Moderate Delay (26.5%)</div>
          </div>

          <div style={{ padding: "12px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>91 – 180 Days</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
              {formatNumber(delayInfo.from_91_to_180 || 21357)}
            </div>
            <div style={{ fontSize: "11px", color: "#b45309", marginTop: "2px" }}>Significant Delay (27.5%)</div>
          </div>

          <div style={{ padding: "12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>&gt; 180 Days</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#b91c1c", marginTop: "4px" }}>
              {formatNumber(delayInfo.over_180 || 12824)}
            </div>
            <div style={{ fontSize: "11px", color: "#991b1b", marginTop: "2px" }}>Critical Overrun (16.5%)</div>
          </div>
        </div>
      </div>

      {/* 3. Delayed Works Queue */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Sanction & Completion Delay Intelligence Queue</h3>
            <p className="mospi-card-subtitle">
              Interactive registry of sanctioned works sorted by days elapsed
            </p>
          </div>
          <span className="mospi-pill blue">
            {formatNumber(totalCount)} Works in Bucket
          </span>
        </div>

        {/* Bucket Subtabs */}
        <div className="mospi-subtab-bar" style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {DELAY_BUCKET_TABS.map((tab) => {
            const isActive = activeBucket === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`mospi-pill ${isActive ? "blue" : "neutral"}`}
                onClick={() => handleBucketClick(tab.id)}
                style={{
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "12px",
                  padding: "6px 12px",
                }}
              >
                <span>{tab.label}</span>
                <span style={{ opacity: 0.8, fontSize: "11px", marginLeft: "4px" }}>
                  ({formatNumber(tab.count)})
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="mospi-table-responsive">
          <table className="mospi-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Work ID</th>
                <th>Description</th>
                <th>State & District</th>
                <th>Recommendation Date</th>
                <th>Sanction Date</th>
                <th style={{ textAlign: "right" }}>Sanction Delay</th>
                <th style={{ textAlign: "right" }}>Sanction Amount</th>
                <th style={{ textAlign: "center", width: "100px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div className="spinner" />
                    <p className="text-muted mt-2">Loading delayed works registry...</p>
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No works found matching this delay bucket.
                  </td>
                </tr>
              ) : (
                works.map((w) => {
                  const delayDays = Number(w.SANCTION_DELAY_DAYS) || 0;
                  const isSevere = delayDays > 180;
                  const isCompliant = delayDays <= 45;

                  return (
                    <tr key={w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID}>
                      <td style={{ fontWeight: 700, color: "#2563eb" }}>
                        #{w.WORK_ID || w.WORK_RECOMMENDATION_DTL_ID}
                      </td>
                      <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={w.WORK_DESCRIPTION}>
                        {w.WORK_DESCRIPTION || "—"}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{w.STATE_NAME || "—"}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{w.IDA_NAME || "—"}</div>
                      </td>
                      <td style={{ fontSize: "12px", color: "#64748b" }}>
                        {w.RECOMMENDATION_DATE || "—"}
                      </td>
                      <td style={{ fontSize: "12px", color: "#64748b" }}>
                        {w.SANCTION_DATE || "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`mospi-pill ${isCompliant ? "emerald" : isSevere ? "rose" : "warning"}`}>
                          {delayDays} Days
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {w.SANCTION_AMOUNT ? `₹ ${Number(w.SANCTION_AMOUNT).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-btn-sm"
                          onClick={() => onSelectWork && onSelectWork(w)}
                          title="Inspect canonical 78-field dossier"
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
