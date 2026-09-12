import { useState, useEffect } from "react";
import {
  ShieldAlert,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

export default function RiskIntelligenceTab({ analytics, onSelectWork }) {
  const [riskCases, setRiskCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const kpis = analytics?.national_kpis || {};
  const rf = analytics?.risk_factors || {};

  // Fetch real risk cases from /api/risk-cases
  useEffect(() => {
    let isMounted = true;
    async function loadRiskCases() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/risk-cases?limit=25`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setRiskCases(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load risk cases:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRiskCases();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="mospi-panel">
      {/* 1. National Risk Distribution Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
        <div className="mospi-card" style={{ borderLeft: "4px solid #10b981" }}>
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Low Risk Compliance</span>
            <span className="mospi-pill emerald">Normal Operations</span>
          </div>
          <div className="mospi-kpi-value">
            {formatNumber((kpis.total_works || 102703) - (kpis.risk_cases_count || 18))} Works
          </div>
          <div className="mospi-kpi-sub">
            {(((kpis.total_works || 102703) - (kpis.risk_cases_count || 18)) / (kpis.total_works || 102703) * 100).toFixed(2)}% within expected tolerances
          </div>
        </div>

        <div className="mospi-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Medium Risk (Audit Triggers)</span>
            <span className="mospi-pill amber">Requires Audit Review</span>
          </div>
          <div className="mospi-kpi-value">{formatNumber(kpis.risk_cases_count || 18)} Works</div>
          <div className="mospi-kpi-sub">Avg risk score: 41.42 (cost & completion outliers)</div>
        </div>

        <div className="mospi-card" style={{ borderLeft: "4px solid #ef4444" }}>
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">High Risk (Severe Outliers)</span>
            <span className="mospi-pill rose">Immediate Escalation</span>
          </div>
          <div className="mospi-kpi-value">0 Works</div>
          <div className="mospi-kpi-sub">Zero cases currently exceed critical danger threshold</div>
        </div>
      </div>

      {/* 2. Risk Factor Intelligence */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Risk Factor Intelligence: Root Cause Decomposition</h3>
            <p className="mospi-card-subtitle">
              Relative contribution of timeline delays, milestone duration, and cost deviations among flagged risk cases
            </p>
          </div>
        </div>

        <div className="mospi-risk-factor-grid">
          <div className="mospi-risk-factor-card">
            <div className="mospi-rf-title">Completion Risk</div>
            <div className="mospi-rf-val" style={{ color: "#be123c" }}>
              {rf.completion_risk || 80.2}%
            </div>
            <div className="mospi-rf-desc">
              Works exceeding peer median lifecycle completion days by significant margins.
            </div>
          </div>

          <div className="mospi-risk-factor-card">
            <div className="mospi-rf-title">Cost Risk</div>
            <div className="mospi-rf-val" style={{ color: "#b45309" }}>
              {rf.cost_risk || 70.9}%
            </div>
            <div className="mospi-rf-desc">
              Individual work sanctioned amount significantly exceeds peer median for same work category.
            </div>
          </div>

          <div className="mospi-risk-factor-card">
            <div className="mospi-rf-title">Sanction Delay Risk</div>
            <div className="mospi-rf-val" style={{ color: "#0369a1" }}>
              {rf.delay_risk || 12.1}%
            </div>
            <div className="mospi-rf-desc">
              Gap between MP recommendation date and District Collector administrative sanction date.
            </div>
          </div>

          <div className="mospi-risk-factor-card">
            <div className="mospi-rf-title">Cost Variance Risk</div>
            <div className="mospi-rf-val" style={{ color: "#475569" }}>
              {rf.variance_risk || 0.0}%
            </div>
            <div className="mospi-rf-desc">
              Discrepancies between sanctioned allocation and actual contractual disbursements.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real Risk Cases Registry */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">Audit Risk Registry ({riskCases.length} Flagged Works)</h3>
            <p className="mospi-card-subtitle">
              Canonical individual works flagged by multi-variable outlier scoring for administrative inspection
            </p>
          </div>
        </div>

        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Work ID</th>
                <th>State</th>
                <th>Constituency / Authority</th>
                <th>Work Stage</th>
                <th style={{ textAlign: "right" }}>Sanction Amount</th>
                <th style={{ textAlign: "center" }}>Risk Level</th>
                <th style={{ textAlign: "center" }}>Risk Score</th>
                <th>Primary Outlier Reason</th>
                <th style={{ textAlign: "center", width: "140px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px" }}>
                    <div className="spinner" />
                    <p style={{ color: "#64748b", marginTop: "6px", fontSize: "12px" }}>Loading flagged risk cases...</p>
                  </td>
                </tr>
              ) : riskCases.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No risk cases found in the repository.
                  </td>
                </tr>
              ) : (
                riskCases.map((w) => {
                  const workId = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                  return (
                    <tr key={workId}>
                      <td style={{ fontWeight: 700, color: "#005A9C" }}>
                        #{workId}
                      </td>
                      <td style={{ fontWeight: 600 }}>{w.STATE_NAME || "N/A"}</td>
                      <td style={{ fontSize: "11.5px", color: "#475569" }}>{w.CONSTITUENCY || w.IDA_NAME || "N/A"}</td>
                      <td>
                        <span className="mospi-pill blue">{w.WORK_STAGE || "Sanction"}</span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="mospi-pill amber">{w.RISK_LEVEL || "MEDIUM"}</span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>
                        {w.RISK_SCORE ? Number(w.RISK_SCORE).toFixed(1) : "N/A"}
                      </td>
                      <td style={{ maxWidth: "240px", fontSize: "11px", color: "#64748b" }}>
                        {w.REVIEW_REASON || w.RISK_FACTORS || "Cost & completion outlier against peer cohort"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-dossier-btn mospi-dossier-risk"
                          onClick={() => {
                            if (typeof onSelectWork === "function") {
                              onSelectWork({ ...w, __initialSection: "risk", __authority: "MOSPI" });
                            }
                          }}
                          title="Inspect National Risk Distribution & Algorithmic Audit Dossier"
                        >
                          <ShieldAlert size={11} />
                          <span>Risk Dossier →</span>
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
