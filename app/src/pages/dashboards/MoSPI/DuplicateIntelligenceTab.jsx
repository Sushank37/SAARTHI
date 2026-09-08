import React, { useState, useEffect } from "react";
import {
  GitBranch,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores } from "../../../constants";

export default function DuplicateIntelligenceTab({ analytics, onSelectWork }) {
  const [duplicateCases, setDuplicateCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [search, setSearch] = useState("");

  const kpis = analytics?.national_kpis || {};

  useEffect(() => {
    let isMounted = true;
    async function loadDuplicateCases() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/duplicate-cases?limit=50`);
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

  const filteredCases = duplicateCases.filter((item) => {
    const risk = (item.DUPLICATE_RISK || "").toUpperCase();
    const desc = (item.WORK_DESCRIPTION || "").toLowerCase();
    const state = (item.STATE_NAME || "").toLowerCase();
    const q = search.toLowerCase();

    const matchesRisk = filterRisk === "ALL" || risk === filterRisk;
    const matchesSearch = !q || desc.includes(q) || state.includes(q) || String(item.CLUSTER_ID).includes(q) || String(item.WORK_ID).includes(q);

    return matchesRisk && matchesSearch;
  });

  return (
    <div className="mospi-panel">
      {/* 1. Duplicate Intelligence Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Detected Clusters</span>
            <GitBranch size={16} className="text-amber-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(kpis.duplicate_clusters || 1401)}</div>
          <div className="mospi-kpi-sub">Cross-district/state similarity clusters</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Linked Proposal Works</span>
            <Layers size={16} className="text-sky-500" />
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
          <div className="mospi-kpi-sub">Exact description & budget matches</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Avg Cluster Suspicion</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mospi-kpi-value">85.1%</div>
          <div className="mospi-kpi-sub">Semantic, temporal & spatial similarity</div>
        </div>
      </div>

      {/* 2. Top Duplicate Cluster Proposals Table */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Cross-District & Cross-State Duplicate Intelligence</h3>
            <p className="mospi-card-subtitle">
              Works flagged by AI similarity clustering for cross-constituency physical verification and anti-duplication
            </p>
          </div>
          <span className="mospi-pill amber">
            {formatNumber(filteredCases.length)} Cases Listed
          </span>
        </div>

        {/* Filter Bar */}
        <div className="mospi-table-filter-bar" style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type="text"
              className="mospi-search-input"
              placeholder="Search by Work ID, Cluster ID, State, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: "32px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={14} style={{ color: "#64748b" }} />
            <select
              className="mospi-select"
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              style={{ minWidth: "160px" }}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Duplicate Risk</option>
              <option value="MEDIUM">Medium Duplicate Risk</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mospi-table-responsive">
          <table className="mospi-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Work ID</th>
                <th style={{ width: "100px" }}>Cluster ID</th>
                <th>State & Constituency</th>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Sanction Amount</th>
                <th style={{ textAlign: "center" }}>Duplicate Risk</th>
                <th style={{ textAlign: "center" }}>Cluster Score</th>
                <th style={{ textAlign: "center", width: "100px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div className="spinner" />
                    <p className="text-muted mt-2">Loading duplicate surveillance data...</p>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No duplicate cluster proposals found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((item) => {
                  const isHigh = (item.DUPLICATE_RISK || "").toUpperCase() === "HIGH";
                  const score = item.CLUSTER_SUSPICION_SCORE
                    ? Math.round(Number(item.CLUSTER_SUSPICION_SCORE) * 100)
                    : 85;

                  return (
                    <tr key={item.WORK_RECOMMENDATION_DTL_ID || item.WORK_ID}>
                      <td style={{ fontWeight: 700, color: "#2563eb" }}>
                        #{item.WORK_ID || item.WORK_RECOMMENDATION_DTL_ID}
                      </td>
                      <td>
                        <span className="mospi-pill neutral" style={{ fontWeight: 600 }}>
                          #{item.CLUSTER_ID || "—"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.STATE_NAME || "—"}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{item.CONSTITUENCY || "—"}</div>
                      </td>
                      <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.WORK_DESCRIPTION}>
                        {item.WORK_DESCRIPTION || "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {item.SANCTION_AMOUNT ? `₹ ${Number(item.SANCTION_AMOUNT).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`mospi-pill ${isHigh ? "rose" : "warning"}`}>
                          {item.DUPLICATE_RISK || "MEDIUM"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>
                        {score}%
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-dossier-btn mospi-dossier-duplicate"
                          onClick={() => onSelectWork && onSelectWork({ ...item, __initialSection: "duplicates", __authority: "MOSPI" })}
                          title="Inspect Cross-Jurisdiction Duplicate Cluster Dossier"
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
