import React, { useState } from "react";
import {
  Camera,
  MapPin,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Building2,
  Eye,
  Flag,
} from "lucide-react";

export default function CitizenEvidenceTab({ onSelectWork, onReportWork }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const evidenceItems = [
    {
      id: "W-2026-10291",
      title: "Construction of Community Hall & Skill Training Center",
      location: "Ibrahimpatnam, Nizamabad",
      agency: "Panchayat Raj Engineering Division",
      cost: "₹15.00 Lakh",
      inspectionDate: "24 August 2026",
      inspector: "Assistant Executive Engineer (PR)",
      geofenceMatch: "34 meters (Within 50m tolerance)",
      completion: 100,
      photos: [
        {
          stage: "Before Construction",
          date: "Jan 2026",
          url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80",
          note: "Vacant Gram Panchayat plot prior to foundation excavation",
        },
        {
          stage: "Civil Plinth & Roof",
          date: "May 2026",
          url: "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&auto=format&fit=crop&q=80",
          note: "RCC columns and roof slab completed",
        },
        {
          stage: "Final Asset Handover",
          date: "Aug 2026",
          url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80",
          note: "Completed community hall with electrical fittings & solar lighting",
        },
      ],
    },
    {
      id: "W-2026-10442",
      title: "Installation of 25 High Mast Solar LED Lights",
      location: "Armoor Mandal Villages",
      agency: "Telangana State Renewable Energy Dev Corp (TSREDCO)",
      cost: "₹10.50 Lakh",
      inspectionDate: "12 July 2026",
      inspector: "Divisional Engineer (Energy)",
      geofenceMatch: "18 meters (Within 50m tolerance)",
      completion: 100,
      photos: [
        {
          stage: "Site Foundation",
          date: "Mar 2026",
          url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80",
          note: "RCC pole foundation casting at village crossroads",
        },
        {
          stage: "Erection & PV Panel",
          date: "May 2026",
          url: "https://images.unsplash.com/photo-1508873696983-2df57036476b?w=600&auto=format&fit=crop&q=80",
          note: "Mast erected and solar PV modules mounted",
        },
        {
          stage: "Operational Night Test",
          date: "Jul 2026",
          url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80",
          note: "Night illumination test passed with Gram Panchayat acknowledgment",
        },
      ],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Banner */}
      <div className="citizen-card" style={{ padding: "16px 20px" }}>
        <div className="citizen-card-title">
          <Camera size={18} color="#2563eb" />
          <span>Physical Evidence & Geo-tagged Photographic Timeline</span>
        </div>
        <div className="citizen-card-subtitle">
          Social audit transparency: compare pre-commencement sites against delivered infrastructure with GPS validation.
        </div>
      </div>

      {/* Evidence Cards */}
      {evidenceItems.map((item) => (
        <div key={item.id} className="citizen-card" style={{ gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <strong style={{ fontFamily: "monospace", color: "#1e3a8a", fontSize: "14px" }}>
                  {item.id}
                </strong>
                <span className="qr-distance-badge">
                  <ShieldCheck size={13} />
                  <span>GPS Geofence: {item.geofenceMatch}</span>
                </span>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                {item.title}
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                <MapPin size={12} color="#ea580c" />
                {item.location} · Sanctioned: <strong>{item.cost}</strong> · Agency: {item.agency}
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="citizen-quick-action-btn"
                style={{ color: "#1e3a8a", borderColor: "#cbd5e1" }}
                onClick={() => onSelectWork && onSelectWork({ WORK_ID: item.id, WORK_DESCRIPTION: item.title })}
              >
                <Eye size={13} />
                <span>Full Dossier</span>
              </button>

              <button
                type="button"
                className="citizen-quick-action-btn"
                style={{ color: "#b91c1c", borderColor: "#fca5a5", background: "#fef2f2" }}
                onClick={() => onReportWork && onReportWork({ WORK_ID: item.id, WORK_DESCRIPTION: item.title, IDA_NAME: item.location })}
              >
                <Flag size={13} />
                <span>Report Discrepancy</span>
              </button>
            </div>
          </div>

          {/* 3-Stage Photo Timeline */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginTop: "6px" }}>
            {item.photos.map((photo, idx) => (
              <div
                key={photo.stage}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#f8fafc",
                }}
              >
                <div style={{ height: "160px", position: "relative" }}>
                  <img
                    src={photo.url}
                    alt={photo.stage}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      background: "rgba(15, 23, 42, 0.8)",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    Stage {idx + 1}: {photo.stage}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      background: "rgba(30, 58, 138, 0.85)",
                      color: "#fff",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {photo.date}
                  </span>
                </div>
                <div style={{ padding: "10px 12px", fontSize: "11.5px", color: "#475569" }}>
                  {photo.note}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "11.5px", color: "#64748b", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
            <span>Last Field Inspection: <strong>{item.inspectionDate}</strong> by {item.inspector}</span>
            <span style={{ color: "#16a34a", fontWeight: "700" }}>✓ Verification Passed</span>
          </div>
        </div>
      ))}
    </div>
  );
}
