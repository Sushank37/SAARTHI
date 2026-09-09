import React from "react";
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
} from "lucide-react";
import { formatNumber, formatCrores } from "../../../constants";

export default function CitizenOverviewTab({
  summary,
  constituencyData,
  onSwitchTab,
  onSelectWork,
}) {
  const totalWorks = summary?.total_works || 102703;
  const completedWorks = summary?.completed_works_count || 48920;
  const ongoingWorks = summary?.in_progress_count || 32410;
  const sanctionedCr = summary?.total_sanctioned_cr || 3418.5;
  const expenditureCr = summary?.total_expenditure_cr || 2894.2;

  // Sample recently delivered works
  const sampleDelivered = [
    {
      id: "W-2026-10291",
      title: "Construction of Community Hall & Skill Center",
      location: "Ibrahimpatnam, Nizamabad",
      category: "Community Infrastructure",
      cost: "₹15.00 Lakh",
      completedDate: "August 2026",
      mp: "Arvind Dharmapuri",
      status: "Completed",
      verified: true,
      image: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "W-2026-10442",
      title: "Solar High-Mast Street Lighting Project (Phase 2)",
      location: "Armoor Mandal, Nizamabad",
      category: "Rural Electrification",
      cost: "₹10.50 Lakh",
      completedDate: "July 2026",
      mp: "Arvind Dharmapuri",
      status: "Completed",
      verified: true,
      image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "W-2026-10885",
      title: "Drinking Water RO Purification Plant & Borewell",
      location: "Bheemgal Gram Panchayat",
      category: "Drinking Water",
      cost: "₹8.00 Lakh",
      completedDate: "June 2026",
      mp: "Arvind Dharmapuri",
      status: "Completed",
      verified: true,
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Transparency KPIs Grid */}
      <div className="citizen-kpi-grid">
        <div className="citizen-kpi-card blue">
          <div className="citizen-kpi-header">
            <span className="citizen-kpi-label">Total MPLADS Works</span>
            <div className="citizen-kpi-icon">
              <Building2 size={18} />
            </div>
          </div>
          <div className="citizen-kpi-value">{formatNumber(totalWorks)}</div>
          <div className="citizen-kpi-sub">Across 543 Parliamentary Constituencies</div>
        </div>

        <div className="citizen-kpi-card green">
          <div className="citizen-kpi-header">
            <span className="citizen-kpi-label">Completed Assets</span>
            <div className="citizen-kpi-icon">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="citizen-kpi-value">{formatNumber(completedWorks)}</div>
          <div className="citizen-kpi-sub">Delivered for public use and verified</div>
        </div>

        <div className="citizen-kpi-card amber">
          <div className="citizen-kpi-header">
            <span className="citizen-kpi-label">Ongoing / Sanctioned</span>
            <div className="citizen-kpi-icon">
              <Clock size={18} />
            </div>
          </div>
          <div className="citizen-kpi-value">{formatNumber(ongoingWorks)}</div>
          <div className="citizen-kpi-sub">Currently under civil execution</div>
        </div>

        <div className="citizen-kpi-card purple">
          <div className="citizen-kpi-header">
            <span className="citizen-kpi-label">Total Sanctioned Fund</span>
            <div className="citizen-kpi-icon">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="citizen-kpi-value">₹{sanctionedCr.toLocaleString()} Cr</div>
          <div className="citizen-kpi-sub">Expenditure: ₹{expenditureCr.toLocaleString()} Cr</div>
        </div>

        <div className="citizen-kpi-card red">
          <div className="citizen-kpi-header">
            <span className="citizen-kpi-label">Citizen Flagged</span>
            <div className="citizen-kpi-icon">
              <Flag size={18} />
            </div>
          </div>
          <div className="citizen-kpi-value">421 Reports</div>
          <div className="citizen-kpi-sub">Social audit discrepancies under review</div>
        </div>
      </div>

      {/* 2-Column Split: Map Preview & Action Hub */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
        {/* Live Map Preview Card */}
        <div className="citizen-card">
          <div className="citizen-card-header">
            <div>
              <div className="citizen-card-title">
                <MapPin size={18} color="#2563eb" />
                <span>Geographic Work Discovery</span>
              </div>
              <div className="citizen-card-subtitle">
                Explore developmental works around your village, town, or constituency.
              </div>
            </div>
            <button
              type="button"
              className="citizen-quick-action-btn primary"
              onClick={() => onSwitchTab("map")}
            >
              <span>Open 2D GIS Map</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div
            style={{
              position: "relative",
              height: "220px",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#e2e8f0",
              cursor: "pointer",
            }}
            onClick={() => onSwitchTab("map")}
          >
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80"
              alt="Constituency Map Preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 39, 68, 0.45)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                gap: "8px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <MapPin size={32} color="#f97316" />
              <strong style={{ fontSize: "16px" }}>Interactive Constituency GIS Map</strong>
              <span style={{ fontSize: "12px", color: "#e2e8f0" }}>
                Click to explore 916+ developmental works in Nizamabad with verified GPS markers
              </span>
            </div>
          </div>
        </div>

        {/* Public Participation / Action Hub */}
        <div className="citizen-card">
          <div className="citizen-card-header">
            <div>
              <div className="citizen-card-title">
                <ShieldCheck size={18} color="#16a34a" />
                <span>Citizen Oversight & Participation</span>
              </div>
              <div className="citizen-card-subtitle">
                How citizens participate in social audit and asset verification
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              onClick={() => onSwitchTab("report")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ padding: "8px", borderRadius: "6px", background: "#fef2f2", color: "#dc2626" }}>
                  <Flag size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>Report an Issue / Discrepancy</strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "#64748b" }}>
                    Flag delayed, abandoned, or substandard work with photos
                  </p>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              onClick={() => onSwitchTab("verify")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ padding: "8px", borderRadius: "6px", background: "#f0fdf4", color: "#16a34a" }}>
                  <QrCode size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>On-Site QR Verification</strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "#64748b" }}>
                    Scan work QR code at project site to check distance & records
                  </p>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              onClick={() => onSwitchTab("explore")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ padding: "8px", borderRadius: "6px", background: "#eff6ff", color: "#2563eb" }}>
                  <Search size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>Explore Public Works Directory</strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "#64748b" }}>
                    Search 102,703 works by MP, sector, cost, and location
                  </p>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>
          </div>
        </div>
      </div>

      {/* Recently Delivered Public Works Carousel/Cards */}
      <div className="citizen-card">
        <div className="citizen-card-header">
          <div>
            <div className="citizen-card-title">
              <CheckCircle2 size={18} color="#16a34a" />
              <span>Recently Delivered Public Infrastructure Assets</span>
            </div>
            <div className="citizen-card-subtitle">
              Physically verified completed projects with geotagged photographic records.
            </div>
          </div>
          <button
            type="button"
            className="citizen-quick-action-btn"
            style={{ color: "#1e3a8a", borderColor: "#cbd5e1" }}
            onClick={() => onSwitchTab("explore")}
          >
            <span>View All Works</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {sampleDelivered.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ height: "140px", position: "relative" }}>
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "rgba(22, 163, 74, 0.9)",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  ✓ {item.status}
                </span>
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(15, 23, 42, 0.75)",
                    color: "#fff",
                    fontSize: "10.5px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                  }}
                >
                  {item.id}
                </span>
              </div>

              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1 }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  {item.category}
                </span>
                <strong style={{ fontSize: "13.5px", color: "#0f172a", lineHeight: "1.3" }}>
                  {item.title}
                </strong>
                <span style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={12} color="#f97316" />
                  {item.location}
                </span>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingTop: "10px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e3a8a" }}>
                    {item.cost}
                  </span>
                  <button
                    type="button"
                    style={{
                      padding: "4px 10px",
                      fontSize: "11.5px",
                      fontWeight: "600",
                      borderRadius: "5px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      color: "#1e293b",
                      cursor: "pointer",
                    }}
                    onClick={() => onSelectWork && onSelectWork({ WORK_ID: item.id, WORK_DESCRIPTION: item.title })}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
