import { useState, useEffect } from "react";
import {
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import { API_BASE, formatCrores } from "../../../constants";

export default function FinancialIntelligenceTab({ analytics, onSelectWork }) {
  const kpis = analytics?.national_kpis || {};
  const [anomalyWorks, setAnomalyWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSpendingAnomalies() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/works?tab=financial-intelligence&subfilter=anomalies&limit=25`);
        if (res.ok) {
          const d = await res.json();
          if (isMounted) setAnomalyWorks(d.data || []);
        }
      } catch (err) {
        console.error("Failed to load spending anomalies:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSpendingAnomalies();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="mospi-panel">
      {/* 1. Macro Financial Flow Lifecycle Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Recommended</span>
            <IndianRupee size={15} color="#0284c7" />
          </div>
          <div className="mospi-kpi-value">{formatCrores(kpis.total_recommended_amount || 0)}</div>
          <div className="mospi-kpi-sub">100% of MP recommendations</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Sanctioned</span>
            <IndianRupee size={15} color="#0d9488" />
          </div>
          <div className="mospi-kpi-value">{formatCrores(kpis.total_sanction_amount || 0)}</div>
          <div className="mospi-kpi-sub">{kpis.sanction_rate || 72.6}% Sanction Conversion Rate</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Disbursed</span>
            <IndianRupee size={15} color="#0284c7" />
          </div>
          <div className="mospi-kpi-value">{formatCrores(kpis.total_actual_amount || 0)}</div>
          <div className="mospi-kpi-sub">{kpis.utilization_pct || 39.7}% Utilization of Sanctioned</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Unutilized Balance</span>
            <AlertCircle size={15} color="#d97706" />
          </div>
          <div className="mospi-kpi-value">
            {formatCrores((kpis.total_sanction_amount || 0) - (kpis.total_actual_amount || 0))}
          </div>
          <div className="mospi-kpi-sub">Committed but undisbursed funds</div>
        </div>
      </div>

      {/* 2. Sanction-to-Disbursement Funnel Progress */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">National Fund Utilization Funnel</h3>
            <p className="mospi-card-subtitle">
              Cumulative financial conversion across 1,02,703 Parliamentary works nationally
            </p>
          </div>
          <span className="mospi-pill emerald">
            {formatCrores(kpis.total_sanction_amount || 0)} Committed
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600, color: "#334155" }}>Recommended Amount</span>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatCrores(kpis.total_recommended_amount || 0)} (100%)</span>
            </div>
            <div style={{ height: "8px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "100%", backgroundColor: "#0284c7" }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600, color: "#334155" }}>Administrative Sanctions Issued</span>
              <span style={{ fontWeight: 700, color: "#0d9488" }}>{formatCrores(kpis.total_sanction_amount || 0)} ({kpis.sanction_rate || 72.6}%)</span>
            </div>
            <div style={{ height: "8px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${kpis.sanction_rate || 72.6}%`, backgroundColor: "#0d9488" }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
              <span style={{ fontWeight: 600, color: "#334155" }}>Actual Treasury Disbursements</span>
              <span style={{ fontWeight: 700, color: "#0284c7" }}>{formatCrores(kpis.total_actual_amount || 0)} ({kpis.utilization_pct || 39.7}%)</span>
            </div>
            <div style={{ height: "8px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round(((kpis.total_actual_amount || 0) / (kpis.total_recommended_amount || 1)) * 100)}%`, backgroundColor: "#0284c7" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Spending & Payment Anomalies Table */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Spending & Payment Anomalies</h3>
            <p className="mospi-card-subtitle">
              Works exhibiting cost variances, expenditure exceeding sanctions, or negative variance indicators
            </p>
          </div>
          <span className="mospi-pill rose">
            {formatCrores(analytics?.anomaly_summary?.cost_variance_cases || 4899)} Spending Anomalies
          </span>
        </div>

        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Work ID</th>
                <th>Description</th>
                <th>State & District</th>
                <th style={{ textAlign: "right" }}>Sanction Amount</th>
                <th style={{ textAlign: "right" }}>Actual Disbursement</th>
                <th style={{ textAlign: "right" }}>Cost Variance</th>
                <th>Stage</th>
                <th style={{ textAlign: "center", width: "140px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>
                    <div className="spinner" />
                    <p style={{ color: "#64748b", marginTop: "6px", fontSize: "12px" }}>Loading spending anomalies...</p>
                  </td>
                </tr>
              ) : anomalyWorks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No spending anomalies detected under current filters.
                  </td>
                </tr>
              ) : (
                anomalyWorks.map((w) => {
                  const sancAmt = Number(w.SANCTION_AMOUNT) || 0;
                  const actAmt = Number(w.ACTUAL_AMOUNT) || 0;
                  const costVar = Number(w.COST_VARIANCE) || 0;

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
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {sancAmt > 0 ? `₹ ${sancAmt.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: actAmt > sancAmt ? "#b91c1c" : "inherit" }}>
                        {actAmt > 0 ? `₹ ${actAmt.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: costVar < 0 ? "#b91c1c" : "#0d9488" }}>
                        {costVar !== 0 ? `₹ ${Math.abs(costVar).toLocaleString("en-IN")}` : "—"}
                        {costVar < 0 && <span style={{ fontSize: "10px", marginLeft: "2px" }}>(Over)</span>}
                      </td>
                      <td>
                        <span className="mospi-pill neutral">
                          {w.WORK_STAGE || "Unspecified"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-dossier-btn mospi-dossier-financial"
                          onClick={() => onSelectWork && onSelectWork({ ...w, __initialSection: "financials", __authority: "MOSPI" })}
                          title="Inspect Central SNA Fund Flow & Spending Dossier"
                        >
                          <IndianRupee size={11} />
                          <span>Treasury Dossier →</span>
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
