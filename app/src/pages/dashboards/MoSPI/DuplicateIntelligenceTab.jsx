import { useState, useEffect } from "react";
import {
  GitBranch,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

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

  const validScores = duplicateCases
    .map((c) => Number(c.CLUSTER_SUSPICION_SCORE))
    .filter((s) => !isNaN(s) && s > 0);
  const avgClusterSuspicion = validScores.length
    ? (validScores.reduce((a, b) => a + b, 0) / validScores.length * (validScores[0] <= 1 ? 100 : 1)).toFixed(1)
    : null;

  return (
    <div className="mospi-panel">
      {/* 1. Duplicate Intelligence Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Detected Clusters</span>
            <GitBranch size={15} color="#d97706" />
          </div>
          <div className="mospi-kpi-value">
            {kpis.duplicate_clusters != null ? formatNumber(kpis.duplicate_clusters) : "—"}
          </div>
          <div className="mospi-kpi-sub">Cross-district/state similarity clusters</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Linked Proposal Works</span>
            <Layers size={15} color="#0284c7" />
          </div>
          <div className="mospi-kpi-value">
            {kpis.works_in_clusters != null ? formatNumber(kpis.works_in_clusters) : "—"}
          </div>
          <div className="mospi-kpi-sub">
            {kpis.total_works > 0 && kpis.works_in_clusters != null
              ? `${((kpis.works_in_clusters / kpis.total_works) * 100).toFixed(1)}% of total national repository`
              : "Works in flagged clusters"}
          </div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">High Duplicate Risk</span>
            <AlertTriangle size={15} color="#e11d48" />
          </div>
          <div className="mospi-kpi-value">
            {kpis.high_duplicate_works != null ? formatNumber(kpis.high_duplicate_works) : "—"}
          </div>
          <div className="mospi-kpi-sub">Exact description & budget matches</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Avg Cluster Suspicion</span>
            <CheckCircle2 size={15} color="#0d9488" />
          </div>
          <div className="mospi-kpi-value">
            {avgClusterSuspicion ? `${avgClusterSuspicion}%` : "—"}
          </div>
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
        <div className="mospi-table-toolbar">
          <div className="mospi-search-box" style={{ flex: 1, minWidth: "260px" }}>
            <Search size={13} color="#64748b" />
            <input
              type="text"
              placeholder="Search by Work ID, Cluster ID, State, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={13} color="#64748b" />
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
        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Work ID</th>
                <th style={{ width: "95px" }}>Cluster ID</th>
                <th>State & Constituency</th>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Sanction Amount</th>
                <th style={{ textAlign: "center" }}>Duplicate Risk</th>
                <th style={{ textAlign: "center" }}>Cluster Score</th>
                <th style={{ textAlign: "center", width: "135px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>
                    <div className="spinner" />
                    <p style={{ color: "#64748b", marginTop: "6px", fontSize: "12px" }}>Loading duplicate surveillance data...</p>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No duplicate cluster proposals found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((item) => {
                  const isHigh = (item.DUPLICATE_RISK || "").toUpperCase() === "HIGH";
                  const scoreVal = item.CLUSTER_SUSPICION_SCORE != null && !isNaN(Number(item.CLUSTER_SUSPICION_SCORE))
                    ? Math.round(Number(item.CLUSTER_SUSPICION_SCORE) * (Number(item.CLUSTER_SUSPICION_SCORE) <= 1 ? 100 : 1))
                    : null;

                  return (
                    <tr key={item.WORK_RECOMMENDATION_DTL_ID || item.WORK_ID}>
                      <td style={{ fontWeight: 700, color: "#005A9C" }}>
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
                        <span className={`mospi-pill ${isHigh ? "rose" : "amber"}`}>
                          {item.DUPLICATE_RISK || "MEDIUM"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>
                        {scoreVal != null ? `${scoreVal}%` : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-dossier-btn mospi-dossier-duplicate"
                          onClick={() => onSelectWork && onSelectWork({ ...item, __initialSection: "duplicates", __authority: "MOSPI" })}
                          title="Inspect Cross-Jurisdiction Duplicate Cluster Dossier"
                        >
                          <Copy size={11} />
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
