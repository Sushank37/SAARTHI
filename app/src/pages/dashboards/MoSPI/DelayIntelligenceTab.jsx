import { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

export default function DelayIntelligenceTab({ analytics, onSelectWork }) {
  const delayInfo = analytics?.delay_buckets || {};
  const u45 = delayInfo.under_45 ?? 22856;
  const d46_90 = delayInfo.from_46_to_90 ?? 20580;
  const d91_180 = delayInfo.from_91_to_180 ?? 21357;
  const o180 = delayInfo.over_180 ?? 12824;
  const totalSanctioned = u45 + d46_90 + d91_180 + o180;

  const delayBucketTabs = [
    { id: "all", label: "All Sanctioned Works", count: totalSanctioned },
    { id: "under-45", label: "≤ 45 Days (Compliant)", count: u45, status: "success" },
    { id: "46-90", label: "46 – 90 Days", count: d46_90, status: "neutral" },
    { id: "91-180", label: "91 – 180 Days", count: d91_180, status: "warning" },
    { id: "over-180", label: "> 180 Days (Severe)", count: o180, status: "danger" },
  ];

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
            setTotalPages(d.total_pages || d.pages || 1);
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">National Avg Sanction Delay</span>
            <Clock size={15} color="#d97706" />
          </div>
          <div className="mospi-kpi-value">{delayInfo.avg_sanction_delay || 105.7}d</div>
          <div className="mospi-kpi-sub">Prescribed guideline: 45 days</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Avg Execution Duration</span>
            <Calendar size={15} color="#0284c7" />
          </div>
          <div className="mospi-kpi-value">{delayInfo.avg_completion_duration || 174.5}d</div>
          <div className="mospi-kpi-sub">From administrative sanction to completion</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Over 45-Day Guideline</span>
            <AlertTriangle size={15} color="#e11d48" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(delayInfo.over_statutory_count || 54761)}</div>
          <div className="mospi-kpi-sub">70.6% of sanctioned works took &gt;45d</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Compliant Under 45d</span>
            <CheckCircle2 size={15} color="#0d9488" />
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "4px" }}>
          <div style={{ padding: "10px 12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>≤ 45 Days</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803d", marginTop: "2px" }}>
              {formatNumber(delayInfo.under_45 || 22856)}
            </div>
            <div style={{ fontSize: "10.5px", color: "#166534", marginTop: "1px" }}>Compliant with SLA (29.4%)</div>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>46 – 90 Days</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#334155", marginTop: "2px" }}>
              {formatNumber(delayInfo.from_46_to_90 || 20580)}
            </div>
            <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "1px" }}>Moderate Delay (26.5%)</div>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>91 – 180 Days</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>
              {formatNumber(delayInfo.from_91_to_180 || 21357)}
            </div>
            <div style={{ fontSize: "10.5px", color: "#b45309", marginTop: "1px" }}>Significant Delay (27.5%)</div>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>&gt; 180 Days</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#b91c1c", marginTop: "2px" }}>
              {formatNumber(delayInfo.over_180 || 12824)}
            </div>
            <div style={{ fontSize: "10.5px", color: "#991b1b", marginTop: "1px" }}>Critical Overrun (16.5%)</div>
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
        <div className="mospi-subtab-bar">
          {delayBucketTabs.map((tab) => {
            const isActive = activeBucket === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`mospi-subtab-btn ${isActive ? "active" : ""}`}
                onClick={() => handleBucketClick(tab.id)}
              >
                <span>{tab.label}</span>
                <span style={{ opacity: 0.85, fontSize: "10.5px" }}>
                  ({formatNumber(tab.count)})
                </span>
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
                <th>Recommendation Date</th>
                <th>Sanction Date</th>
                <th style={{ textAlign: "center" }}>Sanction Delay</th>
                <th style={{ textAlign: "right" }}>Sanction Amount</th>
                <th style={{ textAlign: "center", width: "130px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>
                    <div className="spinner" />
                    <p style={{ color: "#64748b", marginTop: "6px", fontSize: "12px" }}>Loading delayed works registry...</p>
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
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
                      <td style={{ fontWeight: 700, color: "#005A9C" }}>
                        #{w.WORK_ID || w.WORK_RECOMMENDATION_DTL_ID}
                      </td>
                      <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={w.WORK_DESCRIPTION}>
                        {w.WORK_DESCRIPTION || "—"}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{w.STATE_NAME || "—"}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{w.IDA_NAME || "—"}</div>
                      </td>
                      <td style={{ fontSize: "11.5px", color: "#64748b" }}>
                        {w.RECOMMENDATION_DATE || "—"}
                      </td>
                      <td style={{ fontSize: "11.5px", color: "#64748b" }}>
                        {w.SANCTION_DATE || "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`mospi-pill ${isCompliant ? "emerald" : isSevere ? "rose" : "amber"}`}>
                          {delayDays} Days
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {w.SANCTION_AMOUNT ? `₹ ${Number(w.SANCTION_AMOUNT).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-dossier-btn mospi-dossier-delay"
                          onClick={() => onSelectWork && onSelectWork({ ...w, __initialSection: "compliance-45d", __authority: "MOSPI" })}
                          title="Inspect MoSPI National Delay Breach & Compliance Dossier"
                        >
                          <Clock size={11} />
                          <span>Delay Dossier →</span>
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
