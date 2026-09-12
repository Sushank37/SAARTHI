import {
  IndianRupee,
  ShieldAlert,
  Info,
} from "lucide-react";
import { formatNumber, formatCrores } from "../../../constants";

const STAGE_COLORS = {
  "Physical Inspection": "#0284c7",
  "Sanction": "#10b981",
  "Vendor Identification": "#6366f1",
  "Work partially Completed": "#f59e0b",
  "Work Completed": "#16a34a",
  "Time Estimation": "#8b5cf6",
  "Unknown/Unspecified": "#94a3b8",
};

export default function NationalOverviewTab({ analytics, loading }) {
  if (loading) {
    return (
      <div className="mospi-card" style={{ textAlign: "center", padding: "40px" }}>
        <div className="spinner" />
        <p style={{ color: "#64748b", marginTop: "8px", fontSize: "12px" }}>Loading national surveillance overview...</p>
      </div>
    );
  }

  const kpis = analytics?.national_kpis || {};
  const lifecycle = analytics?.lifecycle_distribution || [];
  const timelines = analytics?.timeline_benchmarks || {};
  const coverage = analytics?.data_coverage || {};

  return (
    <div className="mospi-panel">
      {/* 1. National Work Lifecycle Distribution */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">National Work Lifecycle Distribution</h3>
            <p className="mospi-card-subtitle">
              Concentration of {kpis.total_works != null ? formatNumber(kpis.total_works) : "all"} Parliamentary works across official eSAKSHI execution stages
            </p>
          </div>
          <span className="mospi-pill blue">
            {kpis.total_works != null ? `${formatNumber(kpis.total_works)} Works Tracked` : "—"}
          </span>
        </div>

        {/* Horizontal Stacked Bar */}
        <div className="mospi-lifecycle-bar">
          {lifecycle.map((item) => {
            const color = STAGE_COLORS[item.stage] || "#64748b";
            return (
              <div
                key={item.stage}
                className="mospi-lifecycle-seg"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: color,
                }}
                title={`${item.stage}: ${formatNumber(item.count)} (${item.percentage}%)`}
              />
            );
          })}
        </div>

        {/* Legend Grid */}
        <div className="mospi-lifecycle-legend">
          {lifecycle.map((item) => {
            const color = STAGE_COLORS[item.stage] || "#64748b";
            return (
              <div key={item.stage} className="mospi-legend-item">
                <span className="mospi-legend-dot" style={{ backgroundColor: color }} />
                <span>{item.stage}</span>
                <span className="mospi-legend-count">
                  {formatNumber(item.count)} ({item.percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. National Financial Snapshot & Anomaly Indicators */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "10px" }}>
        {/* Financial Flow Lifecycle */}
        <div className="mospi-card">
          <div className="mospi-card-header">
            <div>
              <h3 className="mospi-card-title">National Financial Flow Status</h3>
              <p className="mospi-card-subtitle">
                Parliamentary recommendations vs. Collectorate sanctions vs. disbursed funds
              </p>
            </div>
            <IndianRupee size={15} color="#0284c7" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Total Recommended Amount</span>
              <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>
                {kpis.total_recommended_amount != null ? formatCrores(kpis.total_recommended_amount) : "—"}
              </strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Total Sanctioned Value</span>
              <strong style={{ fontSize: "12.5px", color: "#0d9488" }}>
                {kpis.total_sanction_amount != null ? formatCrores(kpis.total_sanction_amount) : "—"}
              </strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Actual Expenditure Disbursed</span>
              <strong style={{ fontSize: "12.5px", color: "#0284c7" }}>
                {kpis.total_actual_amount != null ? formatCrores(kpis.total_actual_amount) : "—"}
              </strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Pending Sanction Gap</span>
              <strong style={{ fontSize: "12.5px", color: "#d97706" }}>
                {kpis.sanction_gap != null ? formatCrores(kpis.sanction_gap) : "—"}
              </strong>
            </div>
          </div>
        </div>

        {/* Systemic Anomaly Signals */}
        <div className="mospi-card">
          <div className="mospi-card-header">
            <div>
              <h3 className="mospi-card-title">Systemic Anomaly Surveillance</h3>
              <p className="mospi-card-subtitle">
                Automated detection of duplicate proposals and timeline variance
              </p>
            </div>
            <ShieldAlert size={15} color="#d97706" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Duplicate Proposal Clusters</span>
              <span className="mospi-pill amber">
                {kpis.duplicate_clusters != null ? `${formatNumber(kpis.duplicate_clusters)} Clusters (${formatNumber(kpis.works_in_clusters ?? 0)} Works)` : "—"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Works Requiring Audit Scrutiny</span>
              <span className="mospi-pill rose">
                {kpis.attention_required != null ? `${formatNumber(kpis.attention_required)} Works` : "—"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Medium-Risk Inconsistencies</span>
              <span className="mospi-pill amber">
                {kpis.risk_cases_count != null ? `${formatNumber(kpis.risk_cases_count)} Detected Cases` : "—"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>National Average Sanction Delay</span>
              <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>
                {timelines.avg_sanction_delay_days != null ? `${timelines.avg_sanction_delay_days} Days` : "—"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official Data Coverage Advisory */}
      <div className="mospi-notice-banner">
        <Info size={16} color="#0284c7" style={{ marginTop: "1px", flexShrink: 0 }} />
        <div>
          <strong>National Data Coverage & Integrity Note:</strong> The national surveillance repository aggregates{" "}
          <strong>{coverage.total_states != null ? `${formatNumber(coverage.total_states)} States & Union Territories` : "States & Union Territories"}</strong> and{" "}
          <strong>{coverage.total_authorities != null ? `${formatNumber(coverage.total_authorities)} Designated Implementing Authorities` : "Designated Implementing Authorities"}</strong>. Historical records
          vary in reporting completeness; unrecorded fields reflect historical data gaps rather than zero field progress.
        </div>
      </div>
    </div>
  );
}
