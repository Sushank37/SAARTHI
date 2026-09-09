import React from "react";
import {
  TrendingUp,
  ArrowRight,
  IndianRupee,
  Building2,
  CheckCircle2,
  Clock,
  PieChart,
  BarChart3,
} from "lucide-react";

export default function CitizenAnalyticsTab() {
  const pipelineSteps = [
    { label: "Annual Allocation", amount: "₹5.00 Cr", desc: "Annual Quota per MP by Govt of India", color: "#2563eb" },
    { label: "Recommended", amount: "₹4.85 Cr", desc: "Civil works submitted by MP to District Authority", color: "#7c3aed" },
    { label: "Sanctioned", amount: "₹4.20 Cr", desc: "Technically and administratively approved", color: "#059669" },
    { label: "Funds Released", amount: "₹3.80 Cr", desc: "Installments disbursed to Executing Agencies", color: "#d97706" },
    { label: "Utilized / Spent", amount: "₹3.15 Cr", desc: "Verified expenditure on ground assets", color: "#16a34a" },
  ];

  const categories = [
    { name: "Roads, Culverts & Pathways", count: 342, pct: 37, color: "#2563eb" },
    { name: "Drinking Water & Borewells", count: 215, pct: 23, color: "#06b6d4" },
    { name: "Community Halls & Anganwadis", count: 148, pct: 16, color: "#10b981" },
    { name: "Education & Govt Schools", count: 112, pct: 12, color: "#8b5cf6" },
    { name: "Healthcare & Sub-centers", count: 65, pct: 7, color: "#f59e0b" },
    { name: "Solar Lights & Electrification", count: 34, pct: 5, color: "#ec4899" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Financial Pipeline Flow */}
      <div className="citizen-card">
        <div className="citizen-card-header">
          <div>
            <div className="citizen-card-title">
              <TrendingUp size={18} color="#2563eb" />
              <span>Public Fund Pipeline: How MPLADS Money Flows</span>
            </div>
            <div className="citizen-card-subtitle">
              From annual parliamentary sanction to verified physical expenditure on community assets.
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px", alignItems: "center" }}>
          {pipelineSteps.map((step, idx) => (
            <div
              key={step.label}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                position: "relative",
                borderTop: `4px solid ${step.color}`,
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Step {idx + 1}
              </span>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>{step.label}</strong>
              <span style={{ fontSize: "20px", fontWeight: "800", color: step.color }}>
                {step.amount}
              </span>
              <span style={{ fontSize: "11.5px", color: "#64748b", lineHeight: "1.3" }}>
                {step.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown Charts */}
      <div className="citizen-card">
        <div className="citizen-card-header">
          <div className="citizen-card-title">
            <BarChart3 size={18} color="#7c3aed" />
            <span>Community Development Works by Sector</span>
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Total 916 works classified by priority sector
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {categories.map((cat) => (
            <div key={cat.name} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ fontWeight: "600", color: "#1e293b" }}>{cat.name}</span>
                <span style={{ color: "#64748b" }}>
                  <strong>{cat.count} works</strong> ({cat.pct}%)
                </span>
              </div>

              <div style={{ height: "9px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${cat.pct}%`,
                    background: cat.color,
                    borderRadius: "5px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
