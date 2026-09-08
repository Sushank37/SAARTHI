import React, { useState } from "react";
import {
  Briefcase,
  Building,
  Building2,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { formatNumber } from "../../../constants";

export default function IAPerformanceTab({ analytics, onSelectWork }) {
  const topIAs = analytics?.ia_performance_top25 || [];
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("total_works");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredIAs = topIAs.filter((ia) => {
    const name = (ia.IDA_NAME || "").toLowerCase();
    const st = (ia.STATE_NAME || "").toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || st.includes(q);
  });

  const sortedIAs = [...filteredIAs].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    valA = String(valA || "").toLowerCase();
    valB = String(valB || "").toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="mospi-panel">
      {/* 1. Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Implementing Agencies</span>
            <Briefcase size={16} className="text-blue-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(analytics?.data_coverage?.total_authorities || 763)}</div>
          <div className="mospi-kpi-sub">763 unique IDAs & Executive Agencies</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Top Workload Agency</span>
            <Building2 size={16} className="text-emerald-500" />
          </div>
          <div className="mospi-kpi-value" style={{ fontSize: "18px" }}>Jaunpur IDA</div>
          <div className="mospi-kpi-sub">1,851 registered works handled</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">National Execution Rate</span>
            <CheckCircle2 size={16} className="text-sky-500" />
          </div>
          <div className="mospi-kpi-value">{analytics?.national_kpis?.utilization_pct || 39.7}%</div>
          <div className="mospi-kpi-sub">Treasury disbursement against sanctions</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Average Sanction Delay</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mospi-kpi-value">{analytics?.timeline_benchmarks?.avg_sanction_delay_days || 105.7}d</div>
          <div className="mospi-kpi-sub">Across all implementing agencies</div>
        </div>
      </div>

      {/* 2. Top 25 IA Comparative Performance Table */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Top Implementing Authorities Performance Matrix</h3>
            <p className="mospi-card-subtitle">
              Comprehensive ranking of leading District Implementing Authorities by workload, sanctions, disbursements, and completion rate
            </p>
          </div>
          <span className="mospi-pill blue">
            Top 25 National Implementing Agencies
          </span>
        </div>

        {/* Search Filter */}
        <div className="mospi-table-filter-bar" style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "380px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type="text"
              className="mospi-search-input"
              placeholder="Search agency name or State..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: "32px" }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="mospi-table-responsive">
          <table className="mospi-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th onClick={() => handleSort("IDA_NAME")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>Implementing Agency / District</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("STATE_NAME")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>State</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("total_works")} style={{ cursor: "pointer", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Total Works</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("sanctioned_works")} style={{ cursor: "pointer", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Sanctioned</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("completed_works")} style={{ cursor: "pointer", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Completed</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("completion_rate")} style={{ cursor: "pointer", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Completion %</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("total_sanction_cr")} style={{ cursor: "pointer", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Sanction (₹ Cr)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("total_actual_cr")} style={{ cursor: "pointer", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Disbursed (₹ Cr)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("avg_delay")} style={{ cursor: "pointer", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Avg Delay</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ textAlign: "center" }}>National Dossier</th>
              </tr>
            </thead>
            <tbody>
              {sortedIAs.map((ia, idx) => (
                <tr key={ia.IDA_NAME || idx}>
                  <td style={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                      {ia.IDA_NAME || "—"}
                    </span>
                  </td>
                  <td>
                    <span className="mospi-pill neutral" style={{ fontSize: "11px" }}>
                      {ia.STATE_NAME || "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {formatNumber(ia.total_works || 0)}
                  </td>
                  <td style={{ textAlign: "right", color: "#10b981", fontWeight: 600 }}>
                    {formatNumber(ia.sanctioned_works || 0)}
                  </td>
                  <td style={{ textAlign: "right", color: "#0ea5e9", fontWeight: 600 }}>
                    {formatNumber(ia.completed_works || 0)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    <span className={`mospi-pill ${(ia.completion_rate || 0) > 20 ? "emerald" : "neutral"}`}>
                      {ia.completion_rate || 0}%
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    ₹ {ia.total_sanction_cr || 0}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    ₹ {ia.total_actual_cr || 0}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`mospi-pill ${(ia.avg_delay || 0) > 100 ? "warning" : "neutral"}`}>
                      {ia.avg_delay || 0}d
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="mospi-dossier-btn mospi-dossier-district"
                      onClick={() => onSelectWork && onSelectWork({
                        IDA_NAME: ia.IDA_NAME,
                        STATE_NAME: ia.STATE_NAME,
                        SANCTION_AMOUNT: (ia.total_sanction_cr || 0) * 10000000,
                        ACTUAL_AMOUNT: (ia.total_actual_cr || 0) * 10000000,
                        WORK_STAGE: "Assigned to IA",
                        WORK_DESCRIPTION: `Executing Agency Portfolio: ${ia.IDA_NAME} (${ia.STATE_NAME}) managing ${ia.total_works} works with ${ia.completed_works} completed.`,
                        __initialSection: "ia",
                        __authority: "MOSPI"
                      })}
                      title="Inspect MoSPI Implementing Agency Benchmarking Dossier"
                    >
                      <Building size={12} />
                      <span>Agency Dossier →</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
