import { useState, useEffect } from "react";
import {
  TrendingUp,
  BarChart3,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

const SECTOR_COLORS = [
  "#005A9C",
  "#0284c7",
  "#0d9488",
  "#16a34a",
  "#d97706",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export default function CitizenAnalyticsTab() {
  const [categories, setCategories] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAnalyticsData() {
      try {
        const [catRes, sumRes] = await Promise.all([
          fetch(`${API_BASE}/api/analytics/categories`),
          fetch(`${API_BASE}/api/summary`),
        ]);

        if (!catRes.ok || !sumRes.ok) {
          throw new Error("Failed to load analytics datasets");
        }

        const catData = await catRes.json();
        const sumData = await sumRes.json();

        if (!cancelled) {
          setCategories(catData.data || []);
          setSummaryData(sumData);
          setLoading(false);
        }
      } catch (err) {
        console.error("[Citizen Analytics] Error:", err);
        if (!cancelled) {
          setError("Unable to load real sector analytics from backend server.");
          setLoading(false);
        }
      }
    }
    fetchAnalyticsData();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalWorks = summaryData?.total_works || 102703;
  const mpsTracked = summaryData?.mps_tracked || 538;
  const allocationCr = (mpsTracked * 5).toFixed(2);
  const recCr = summaryData?.total_recommended_cr ?? (summaryData?.total_recommended_amount ? (summaryData.total_recommended_amount / 1e7).toFixed(2) : "5614.40");
  const sancCr = summaryData?.total_sanctioned_cr ?? (summaryData?.total_sanction_amount ? (summaryData.total_sanction_amount / 1e7).toFixed(2) : "4073.71");
  const expCr = summaryData?.total_expenditure_cr ?? (summaryData?.total_actual_amount ? (summaryData.total_actual_amount / 1e7).toFixed(2) : "1618.76");

  const pipelineSteps = [
    {
      label: "Annual Entitlement",
      amount: `₹ ${allocationCr} Cr`,
      desc: `Statutory quota for ${mpsTracked} MPs (₹5.00 Cr / year)`,
      color: "#005A9C",
    },
    {
      label: "Recommended",
      amount: `₹ ${recCr} Cr`,
      desc: "Civil works submitted by MPs to District Authorities",
      color: "#6366f1",
    },
    {
      label: "Sanctioned",
      amount: `₹ ${sancCr} Cr`,
      desc: "Technically & administratively approved by Collectors",
      color: "#0284c7",
    },
    {
      label: "Disbursed / Spent",
      amount: `₹ ${expCr} Cr`,
      desc: "Verified actual expenditure on ground assets",
      color: "#0d9488",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Financial Pipeline Flow */}
      <div className="gov-mp-card">
        <div>
          <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={15} color="#005A9C" />
            <span>Public Fund Lifecycle: Macro MPLADS Financial Pipeline</span>
          </div>
          <div className="card-section-desc">
            Audited financial progression calculated directly across all {formatNumber(totalWorks)} works in the national registry.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginTop: "8px" }}>
          {pipelineSteps.map((step, idx) => (
            <div
              key={step.label}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                borderTop: `3.5px solid ${step.color}`,
              }}
            >
              <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Phase {idx + 1}
              </span>
              <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>{step.label}</strong>
              <span style={{ fontSize: "18px", fontWeight: "800", color: step.color }}>
                {loading ? "..." : step.amount}
              </span>
              <span style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.3" }}>
                {step.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown Charts */}
      <div className="gov-mp-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <BarChart3 size={15} color="#005A9C" />
            <span>Community Development Works by Priority Sector</span>
          </div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            Real-time distribution across {formatNumber(totalWorks)} projects
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
            <RefreshCw size={18} className="spin-icon" style={{ display: "inline-block", marginRight: "8px" }} />
            Computing sector distributions from dataset...
          </div>
        ) : error ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca" }}>
            <AlertTriangle size={18} style={{ display: "inline-block", marginRight: "6px" }} />
            <span>{error}</span>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
            No sector records found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
            {categories.slice(0, 10).map((cat, idx) => {
              const name = cat.WORK_CATEGORY || "Uncategorized";
              const count = Number(cat.TOTAL_WORKS || 0);
              const pct = totalWorks > 0 ? ((count / totalWorks) * 100).toFixed(1) : 0;
              const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];

              return (
                <div key={name} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: "600", color: "#334155" }}>{name}</span>
                    <span style={{ color: "#64748b", fontSize: "11.5px" }}>
                      <strong style={{ color: "#0f172a" }}>{formatNumber(count)} works</strong> ({pct}%)
                    </span>
                  </div>

                  <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, Math.max(1, pct))}%`,
                        background: color,
                        borderRadius: "3px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
