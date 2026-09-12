import {
  TrendingUp,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { formatNumber } from "../../../constants";

export default function TrendAnalysisTab({ analytics }) {
  const trends = analytics?.trends_quarterly || [];

  const maxCount = Math.max(...trends.map((t) => Math.max(t.recommended_count || 0, t.sanctioned_count || 0)), 1);

  return (
    <div className="mospi-panel">
      {/* 1. Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Monitoring Horizon</span>
            <Calendar size={15} color="#0284c7" />
          </div>
          <div className="mospi-kpi-value">9 Quarters</div>
          <div className="mospi-kpi-sub">From 2024-Q3 to 2026-Q3</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Peak Intake Quarter</span>
            <Layers size={15} color="#0d9488" />
          </div>
          <div className="mospi-kpi-value" style={{ fontSize: "18px" }}>2025-Q3</div>
          <div className="mospi-kpi-sub">15,110 works recommended</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Peak Sanction Quarter</span>
            <CheckCircle2 size={15} color="#0284c7" />
          </div>
          <div className="mospi-kpi-value" style={{ fontSize: "18px" }}>2025-Q3</div>
          <div className="mospi-kpi-sub">13,810 works sanctioned</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Active Quarter Intake</span>
            <TrendingUp size={15} color="#7c3aed" />
          </div>
          <div className="mospi-kpi-value">12,104</div>
          <div className="mospi-kpi-sub">Works recorded in 2026-Q3</div>
        </div>
      </div>

      {/* 2. Visual Trend Chart Card */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Quarterly Intake vs. Sanction Velocity</h3>
            <p className="mospi-card-subtitle">
              Comparison of Parliamentary recommendations versus Collectorate administrative sanctions over time
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "11.5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "9px", height: "9px", backgroundColor: "#0284c7", borderRadius: "2px" }} />
              <span style={{ color: "#334155", fontWeight: 500 }}>Recommended</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "9px", height: "9px", backgroundColor: "#0d9488", borderRadius: "2px" }} />
              <span style={{ color: "#334155", fontWeight: 500 }}>Sanctioned</span>
            </div>
          </div>
        </div>

        {/* Bar chart representation */}
        <div style={{ display: "flex", alignItems: "flex-end", height: "200px", gap: "12px", padding: "16px 8px 8px", borderBottom: "1px solid #e2e8f0" }}>
          {trends.map((t) => {
            const recHeight = Math.round((t.recommended_count / maxCount) * 140);
            const sancHeight = Math.round((t.sanctioned_count / maxCount) * 140);

            return (
              <div
                key={t.quarter}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", width: "100%", justifyContent: "center" }}>
                  <div
                    style={{
                      width: "14px",
                      height: `${recHeight}px`,
                      backgroundColor: "#0284c7",
                      borderRadius: "2px 2px 0 0",
                    }}
                    title={`${t.quarter} Recommended: ${formatNumber(t.recommended_count)}`}
                  />
                  <div
                    style={{
                      width: "14px",
                      height: `${sancHeight}px`,
                      backgroundColor: "#0d9488",
                      borderRadius: "2px 2px 0 0",
                    }}
                    title={`${t.quarter} Sanctioned: ${formatNumber(t.sanctioned_count)}`}
                  />
                </div>
                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#475569", marginTop: "6px" }}>
                  {t.quarter}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Quarterly Table */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Quarterly Performance Breakdown</h3>
            <p className="mospi-card-subtitle">
              Exact work counts and sanction allocations recorded across national quarters
            </p>
          </div>
        </div>

        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th>Quarter</th>
                <th style={{ textAlign: "right" }}>Recommended Works</th>
                <th style={{ textAlign: "right" }}>Recommended (₹ Cr)</th>
                <th style={{ textAlign: "right" }}>Sanctioned Works</th>
                <th style={{ textAlign: "right" }}>Sanctioned (₹ Cr)</th>
                <th style={{ textAlign: "right" }}>Sanction Rate</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((t) => {
                const rate = t.recommended_count > 0 ? Math.round((t.sanctioned_count / t.recommended_count) * 100) : 0;
                return (
                  <tr key={t.quarter}>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>
                      {t.quarter}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "#0284c7" }}>
                      {formatNumber(t.recommended_count)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      ₹ {t.recommended_amount_cr}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "#0d9488" }}>
                      {formatNumber(t.sanctioned_count)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      ₹ {t.sanctioned_amount_cr}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`mospi-pill ${rate >= 75 ? "emerald" : rate >= 50 ? "neutral" : "amber"}`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
