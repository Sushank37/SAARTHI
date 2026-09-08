import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores } from "../../../constants";

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Recommended</span>
            <IndianRupee size={16} className="text-blue-500" />
          </div>
          <div className="mospi-kpi-value">₹ {formatCrores(kpis.total_recommended_amount || 0)} Cr</div>
          <div className="mospi-kpi-sub">100% of MP recommendations</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Sanctioned</span>
            <IndianRupee size={16} className="text-emerald-500" />
          </div>
          <div className="mospi-kpi-value">₹ {formatCrores(kpis.total_sanction_amount || 0)} Cr</div>
          <div className="mospi-kpi-sub">{kpis.sanction_rate || 72.6}% Sanction Conversion Rate</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Disbursed</span>
            <IndianRupee size={16} className="text-sky-500" />
          </div>
          <div className="mospi-kpi-value">₹ {formatCrores(kpis.total_actual_amount || 0)} Cr</div>
          <div className="mospi-kpi-sub">{kpis.utilization_pct || 39.7}% Utilization of Sanctioned</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Unutilized Balance</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="mospi-kpi-value">
            ₹ {formatCrores((kpis.total_sanction_amount || 0) - (kpis.total_actual_amount || 0))} Cr
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
            ₹ {formatCrores(kpis.total_sanction_amount || 0)} Cr Committed
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
              <span style={{ fontWeight: 600 }}>Recommended Amount</span>
              <span style={{ fontWeight: 700 }}>₹ {formatCrores(kpis.total_recommended_amount || 0)} Cr (100%)</span>
            </div>
            <div style={{ height: "10px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "100%", backgroundColor: "#2563eb" }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
              <span style={{ fontWeight: 600 }}>Administrative Sanctions Issued</span>
              <span style={{ fontWeight: 700, color: "#10b981" }}>₹ {formatCrores(kpis.total_sanction_amount || 0)} Cr ({kpis.sanction_rate || 72.6}%)</span>
            </div>
            <div style={{ height: "10px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${kpis.sanction_rate || 72.6}%`, backgroundColor: "#10b981" }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
              <span style={{ fontWeight: 600 }}>Actual Treasury Disbursements</span>
              <span style={{ fontWeight: 700, color: "#0ea5e9" }}>₹ {formatCrores(kpis.total_actual_amount || 0)} Cr ({kpis.utilization_pct || 39.7}%)</span>
            </div>
            <div style={{ height: "10px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round(((kpis.total_actual_amount || 0) / (kpis.total_recommended_amount || 1)) * 100)}%`, backgroundColor: "#0ea5e9" }} />
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
            {formatNumber(analytics?.anomaly_summary?.cost_variance_cases || 4899)} Spending Anomalies
          </span>
        </div>

        <div className="mospi-table-responsive">
          <table className="mospi-table">
            <thead>
              <tr>
                <th>Work ID</th>
                <th>Description</th>
                <th>State & District</th>
                <th style={{ textAlign: "right" }}>Sanction Amount</th>
                <th style={{ textAlign: "right" }}>Actual Disbursement</th>
                <th style={{ textAlign: "right" }}>Cost Variance</th>
                <th>Stage</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div className="spinner" />
                    <p className="text-muted mt-2">Loading spending anomalies...</p>
                  </td>
                </tr>
              ) : anomalyWorks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
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
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {sancAmt > 0 ? `₹ ${sancAmt.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: actAmt > sancAmt ? "#b91c1c" : "inherit" }}>
                        {actAmt > 0 ? `₹ ${actAmt.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: costVar < 0 ? "#b91c1c" : "#10b981" }}>
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
                          className="mospi-btn-sm"
                          onClick={() => onSelectWork && onSelectWork(w)}
                          title="Open canonical 78-field work dossier"
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
      </div>
    </div>
  );
}
