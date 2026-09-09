import React, { useState, useEffect } from "react";
import {
  Building2,
  IndianRupee,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Search,
  Camera,
  QrCode,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Flag,
  RefreshCw,
  Eye,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores } from "../../../constants";

export default function CitizenOverviewTab({
  summary,
  constituencyData,
  onSwitchTab,
  onSelectWork,
}) {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/public/overview`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOverviewData(data);
    } catch (err) {
      console.error("[Public Overview] Load error:", err);
      setError("Unable to load public transparency data from national server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Compute values strictly from real backend responses
  const totalWorks = overviewData?.total_works ?? summary?.total_works ?? 0;
  const completedWorks = overviewData?.completed_works_count ?? summary?.completed_works_count ?? 0;
  const ongoingWorks =
    overviewData?.ongoing_works_count ??
    summary?.ongoing_works_count ??
    (summary?.sanctioned_works_count != null && summary?.completed_works_count != null
      ? Math.max(0, summary.sanctioned_works_count - summary.completed_works_count)
      : 0);

  const sanctionedCr =
    overviewData?.total_sanctioned_cr ??
    summary?.total_sanctioned_cr ??
    (summary?.total_sanction_amount ? Math.round((summary.total_sanction_amount / 1e7) * 100) / 100 : 0);

  const expenditureCr =
    overviewData?.total_expenditure_cr ??
    summary?.total_expenditure_cr ??
    (summary?.total_actual_amount ? Math.round((summary.total_actual_amount / 1e7) * 100) / 100 : 0);

  const deliveredWorks = overviewData?.delivered_works || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* 4-Column Gold Standard KPI Grid */}
      <div className="gov-mp-kpi-grid">
        <div className="gov-mp-kpi-card kpi-blue">
          <div className="kpi-header">
            <span className="kpi-title">Total MPLADS Works</span>
            <Building2 size={14} color="#0284c7" />
          </div>
          <div className="kpi-value">{loading && !totalWorks ? "..." : formatNumber(totalWorks)}</div>
          <div className="kpi-sub">
            Across {overviewData?.constituencies_covered || 543} Parliamentary Constituencies
          </div>
        </div>

        <div className="gov-mp-kpi-card kpi-teal">
          <div className="kpi-header">
            <span className="kpi-title">Completed Assets</span>
            <CheckCircle2 size={14} color="#0d9488" />
          </div>
          <div className="kpi-value">{loading && !completedWorks ? "..." : formatNumber(completedWorks)}</div>
          <div className="kpi-sub">Verified delivery for public community use</div>
        </div>

        <div className="gov-mp-kpi-card kpi-amber">
          <div className="kpi-header">
            <span className="kpi-title">Ongoing / Sanctioned</span>
            <Clock size={14} color="#d97706" />
          </div>
          <div className="kpi-value">{loading && !ongoingWorks ? "..." : formatNumber(ongoingWorks)}</div>
          <div className="kpi-sub">Active civil execution & milestone stages</div>
        </div>

        <div className="gov-mp-kpi-card kpi-indigo">
          <div className="kpi-header">
            <span className="kpi-title">Total Sanctioned Fund</span>
            <IndianRupee size={14} color="#6366f1" />
          </div>
          <div className="kpi-value">
            {loading && !sanctionedCr ? "..." : `₹ ${formatCrores(sanctionedCr * 1e7)} Cr`}
          </div>
          <div className="kpi-sub">
            Disbursed: ₹ {formatCrores(expenditureCr * 1e7)} Cr
          </div>
        </div>
      </div>

      {/* 2-Column Split: Geographic Work Discovery & Citizen Action Hub */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "12px" }}>
        {/* Live Map Preview Card */}
        <div className="gov-mp-card">
          <div className="card-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={16} color="#0284c7" />
              <span>Geographic Work Discovery</span>
            </div>
            <button
              type="button"
              className="gov-redirect-link-btn"
              onClick={() => onSwitchTab("map")}
              style={{ cursor: "pointer" }}
            >
              <span>Open 2D GIS Map</span>
              <ArrowRight size={12} />
            </button>
          </div>
          <p className="card-section-desc" style={{ margin: "4px 0 10px 0" }}>
            Explore developmental works across your parliamentary constituency with verified geocoding.
          </p>

          <div
            style={{
              position: "relative",
              height: "220px",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#0f172a",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "8px",
              color: "#ffffff",
              border: "1px solid #334155"
            }}
            onClick={() => onSwitchTab("map")}
          >
            <MapPin size={36} color="#38bdf8" />
            <strong style={{ fontSize: "14px", fontWeight: "700" }}>
              Launch Interactive Spatial Map
            </strong>
            <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
              View clusters, sanction statuses, and verified coordinates
            </span>
            <span
              className="gov-redirect-link-btn"
              style={{ background: "rgba(255, 255, 255, 0.15)", color: "#ffffff", borderColor: "rgba(255, 255, 255, 0.3)", marginTop: "4px" }}
            >
              Enter Map View →
            </span>
          </div>
        </div>

        {/* Public Audit Action Hub */}
        <div className="gov-mp-card">
          <div className="card-section-title">
            <span>Direct Public Participation & Social Audit</span>
          </div>
          <p className="card-section-desc" style={{ margin: "4px 0 10px 0" }}>
            Hold public developmental works accountable via digital reporting, QR plaques, and open registry search.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={() => onSwitchTab("report")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ padding: "6px", borderRadius: "4px", background: "#fef2f2", color: "#dc2626" }}>
                  <Flag size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>Report an Issue / Discrepancy</strong>
                  <p style={{ margin: "1px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                    Flag delayed, abandoned, or substandard work with photo evidence
                  </p>
                </div>
              </div>
              <ArrowRight size={14} color="#94a3b8" />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={() => onSwitchTab("verify")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ padding: "6px", borderRadius: "4px", background: "#f0fdf4", color: "#16a34a" }}>
                  <QrCode size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>On-Site QR Verification</strong>
                  <p style={{ margin: "1px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                    Verify official digital sanction directly from project site plaque
                  </p>
                </div>
              </div>
              <ArrowRight size={14} color="#94a3b8" />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={() => onSwitchTab("explore")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ padding: "6px", borderRadius: "4px", background: "#eff6ff", color: "#2563eb" }}>
                  <Search size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>Explore Public Works Directory</strong>
                  <p style={{ margin: "1px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                    Search 102,703 works by MP, sector, cost, and location
                  </p>
                </div>
              </div>
              <ArrowRight size={14} color="#94a3b8" />
            </div>
          </div>
        </div>
      </div>

      {/* Recently Delivered Public Works Section */}
      <div className="gov-mp-card">
        <div className="card-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={16} color="#0d9488" />
            <span>Delivered Public Infrastructure Assets (Live Dataset)</span>
          </div>
          <button
            type="button"
            className="gov-redirect-link-btn"
            onClick={() => onSwitchTab("explore")}
            style={{ cursor: "pointer" }}
          >
            <span>Explore All 1,02,703 Works</span>
            <ArrowRight size={12} />
          </button>
        </div>
        <p className="card-section-desc" style={{ margin: "2px 0 10px 0" }}>
          Physically completed projects recorded in the central MPLADS registry with audited expenditure.
        </p>

        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
            <RefreshCw size={18} className="spin-icon" style={{ display: "inline-block", marginRight: "8px" }} />
            Loading real delivered assets from official dataset...
          </div>
        ) : error ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#b91c1c", background: "#fef2f2", borderRadius: "6px", border: "1px solid #fecaca" }}>
            <AlertTriangle size={18} style={{ display: "inline-block", marginRight: "6px" }} />
            <span>{error}</span>
            <button
              type="button"
              className="gov-redirect-link-btn"
              onClick={fetchOverview}
              style={{ marginLeft: "12px", cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        ) : deliveredWorks.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12.5px" }}>
            No completed works recorded in current query.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "10px" }}>
            {deliveredWorks.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  background: "#ffffff",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      background: "#f0fdf4",
                      color: "#15803d",
                      border: "1px solid #bbf7d0",
                      fontSize: "10.5px",
                      fontWeight: "700",
                      padding: "2px 7px",
                      borderRadius: "4px",
                    }}
                  >
                    ✓ {item.status}
                  </span>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#64748b" }}>
                    #{item.id}
                  </span>
                </div>

                <strong style={{ fontSize: "13px", color: "#0f172a", lineHeight: "1.3" }}>
                  {item.title}
                </strong>

                <div style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={12} color="#005A9C" />
                  <span>{item.location}</span>
                </div>

                <div style={{ fontSize: "11px", color: "#475569" }}>
                  MP: <strong style={{ color: "#0f172a" }}>{item.mp}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingTop: "8px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#005A9C" }}>
                    {item.cost_formatted}
                  </span>
                  <button
                    type="button"
                    className="gov-redirect-link-btn"
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelectWork && onSelectWork({ WORK_ID: item.id, WORK_DESCRIPTION: item.title, CONSTITUENCY: item.constituency, STATE_NAME: item.state })}
                  >
                    <Eye size={12} />
                    <span>View Dossier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
