import React, { useState, useEffect } from "react";
import {
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  Camera,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

export default function EvidenceIntelligenceTab({ analytics, onSelectWork }) {
  const evSummary = analytics?.evidence_summary || {};
  const totalEv = evSummary.total_with_evidence ?? 8922;
  const lowEv = evSummary.low_score_count ?? 3161;
  const medEv = evSummary.medium_score_count ?? 2505;
  const highEv = evSummary.high_score_count ?? 3256;

  const evidenceTabs = [
    { id: "all", label: "All Evidence Records", count: totalEv },
    { id: "low", label: "Evidence Anomalies (<60)", count: lowEv, status: "danger" },
    { id: "moderate", label: "Moderate Score (60–79)", count: medEv, status: "warning" },
    { id: "verified", label: "Fully Verified (≥80)", count: highEv, status: "success" },
  ];

  const [activeTab, setActiveTab] = useState("all");
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchEvidenceWorks() {
      setLoading(true);
      try {
        const sub = activeTab === "all" ? "" : `&subfilter=${activeTab}`;
        const res = await fetch(`${API_BASE}/api/works?tab=evidence-intelligence${sub}&page=${page}&limit=20`);
        if (res.ok) {
          const d = await res.json();
          if (isMounted) {
            setWorks(d.data || []);
            setTotalCount(d.total || 0);
            setTotalPages(d.total_pages || d.pages || 1);
          }
        }
      } catch (err) {
        console.error("Failed to load evidence works:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchEvidenceWorks();
    return () => { isMounted = false; };
  }, [activeTab, page]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  return (
    <div className="mospi-panel">
      {/* 1. Evidence Intelligence Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Works with Evidence Data</span>
            <FileCheck size={16} className="text-blue-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(evSummary.total_with_evidence || 8922)}</div>
          <div className="mospi-kpi-sub">Uploaded geo-photos & documentation</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">National Average Score</span>
            <ShieldCheck size={16} className="text-sky-500" />
          </div>
          <div className="mospi-kpi-value">{evSummary.avg_evidence_score || 67.1} / 100</div>
          <div className="mospi-kpi-sub">Across 8,922 candidate evidence items</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Evidence Anomalies (&lt;60)</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(evSummary.low_score_count || 3161)}</div>
          <div className="mospi-kpi-sub">Deficient geotagging / documentation</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">High Confidence (≥80)</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(evSummary.high_score_count || 3256)}</div>
          <div className="mospi-kpi-sub">Fully validated physical evidence</div>
        </div>
      </div>

      {/* 2. Evidence Score Distribution Bar */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">National Evidence Confidence Distribution</h3>
            <p className="mospi-card-subtitle">
              Quality and integrity of evidence uploaded to eSAKSHI for photographic audit
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "8px" }}>
          <div style={{ padding: "12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>Deficient / Anomalies (&lt; 60)</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#b91c1c", marginTop: "4px" }}>
              {formatNumber(evSummary.low_score_count || 3161)}
            </div>
            <div style={{ fontSize: "11px", color: "#991b1b", marginTop: "2px" }}>35.4% of evidence works</div>
          </div>

          <div style={{ padding: "12px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>Moderate (60 – 79)</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
              {formatNumber(evSummary.medium_score_count || 2505)}
            </div>
            <div style={{ fontSize: "11px", color: "#b45309", marginTop: "2px" }}>28.1% of evidence works</div>
          </div>

          <div style={{ padding: "12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>High Quality (≥ 80)</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#15803d", marginTop: "4px" }}>
              {formatNumber(evSummary.high_score_count || 3256)}
            </div>
            <div style={{ fontSize: "11px", color: "#166534", marginTop: "2px" }}>36.5% of evidence works</div>
          </div>
        </div>
      </div>

      {/* 3. Evidence Works Queue */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Evidence Intelligence Queue</h3>
            <p className="mospi-card-subtitle">
              Works with uploaded evidence metadata, photographic audit status, and verification scores
            </p>
          </div>
          <span className="mospi-pill blue">
            {formatNumber(totalCount)} Works
          </span>
        </div>

        {/* Subtabs */}
        <div className="mospi-subtab-bar" style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {evidenceTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`mospi-pill ${isActive ? "blue" : "neutral"}`}
                onClick={() => handleTabClick(tab.id)}
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
                <th>Stage</th>
                <th style={{ textAlign: "right" }}>Sanction Amount</th>
                <th style={{ textAlign: "center" }}>Evidence Score</th>
                <th style={{ textAlign: "center", width: "100px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div className="spinner" />
                    <p className="text-muted mt-2">Loading evidence records...</p>
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No works found for this evidence classification.
                  </td>
                </tr>
              ) : (
                works.map((w) => {
                  const evScore = Number(w.EVIDENCE_SCORE) || 0;
                  const isLow = evScore < 60;
                  const isHigh = evScore >= 80;

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
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{w.IDA_NAME || "—"}</div>
                      </td>
                      <td>
                        <span className="mospi-pill neutral">
                          {w.WORK_STAGE || "Unspecified"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {w.SANCTION_AMOUNT ? `₹ ${Number(w.SANCTION_AMOUNT).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`mospi-pill ${isHigh ? "emerald" : isLow ? "rose" : "warning"}`}>
                          {evScore > 0 ? `${evScore} / 100` : "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-dossier-btn mospi-dossier-evidence"
                          onClick={() => onSelectWork && onSelectWork({ ...w, __initialSection: "evidence", __authority: "MOSPI" })}
                          title="Inspect MoSPI Digital Forensic & EXIF Evidence Dossier"
                        >
                          <Camera size={12} />
                          <span>Forensic Dossier →</span>
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
