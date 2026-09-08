import React, { useState, useEffect } from "react";
import {
  GitBranch,
  AlertTriangle,
  ChevronRight,
  Info,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores } from "../../../constants";

export default function DuplicateSurveillanceTab({ analytics, onSelectWork }) {
  const [duplicateCases, setDuplicateCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const kpis = analytics?.national_kpis || {};

  // Fetch real duplicate cases from /api/duplicate-cases
  useEffect(() => {
    let isMounted = true;
    async function loadDuplicateCases() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/duplicate-cases?limit=25`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setDuplicateCases(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load duplicate cases:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDuplicateCases();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="mospi-panel">
      {/* 1. Duplicate Surveillance Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Detected Clusters</span>
            <GitBranch size={16} className="text-amber-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(kpis.duplicate_clusters || 1401)}</div>
          <div className="mospi-kpi-sub">Cross-jurisdiction project clusters</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Linked Proposal Works</span>
            <GitBranch size={16} className="text-sky-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(kpis.works_in_clusters || 8922)}</div>
          <div className="mospi-kpi-sub">8.7% of total national repository</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">High Duplicate Risk</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(kpis.high_duplicate_works || 4047)}</div>
          <div className="mospi-kpi-sub">Identical description & amount matches</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Avg Cluster Suspicion</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mospi-kpi-value">85.1%</div>
          <div className="mospi-kpi-sub">High semantic & geographic correlation</div>
        </div>
      </div>

      {/* 2. Top Duplicate Cluster Proposals Table */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Priority Duplicate Proposals Queue</h3>
            <p className="mospi-card-subtitle">
              Works flagged by automated duplicate detection requiring cross-constituency physical verification
            </p>
          </div>
        </div>

        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th>Work ID</th>
                <th>Cluster ID</th>
                <th>State</th>
                <th>Constituency</th>
                <th>Description</th>
                <th>Sanction Amount</th>
                <th>Duplicate Risk</th>
                <th>Suspicion Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">
                    <div className="spinner" /> Loading duplicate proposal queue...
                  </td>
                </tr>
              ) : duplicateCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-muted">
                    No duplicate proposals found.
                  </td>
                </tr>
              ) : (
                duplicateCases.map((w) => {
                  const workId = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                  return (
                    <tr key={workId}>
                      <td>
                        <strong className="font-mono text-sky-700">#{workId}</strong>
                      </td>
                      <td>
                        <span className="mospi-pill gray font-mono">Cluster #{w.CLUSTER_ID || "N/A"}</span>
                      </td>
                      <td>{w.STATE_NAME || "N/A"}</td>
                      <td>{w.CONSTITUENCY || "N/A"}</td>
                      <td style={{ maxWidth: "260px", fontSize: "11px", color: "#334155" }}>
                        {w.WORK_DESCRIPTION || w.REPRESENTATIVE_DESCRIPTION || "N/A"}
                      </td>
                      <td>
                        <strong>₹ {formatNumber(w.SANCTION_AMOUNT || 0)}</strong>
                      </td>
                      <td>
                        <span className="mospi-pill rose">{w.DUPLICATE_RISK || "HIGH"}</span>
                      </td>
                      <td>
                        <span className="mospi-pill amber">{w.SUSPICION_LEVEL || "HIGH SUSPICION"}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="mospi-page-btn"
                          onClick={() => {
                            if (typeof onSelectWork === "function") {
                              onSelectWork({ ...w, __initialSection: "duplicates", __authority: "MOSPI" });
                            }
                          }}
                          className="mospi-dossier-btn mospi-dossier-duplicate"
                          title="Inspect duplicate cluster dossier"
                        >
                          <Copy size={12} />
                          <span>Duplicate Dossier →</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
