import React, { useState, useEffect } from "react";
import {
  Camera,
  MapPin,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Building2,
  Eye,
  Flag,
  RefreshCw,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores } from "../../../constants";

export default function CitizenEvidenceTab({ onSelectWork, onReportWork }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvidence = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/public/evidence?limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("[Evidence] Error loading inspection records:", err);
      setError("Unable to load verified physical inspection records from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Header Banner */}
      <div className="gov-mp-card">
        <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Camera size={15} color="#005A9C" />
          <span>Physical Evidence & Milestone Inspection Registry</span>
        </div>
        <div className="card-section-desc">
          Official social audit tracking: developmental works recorded under physical inspection, partial completion, and final delivery in the central MPLADS registry.
        </div>
      </div>

      {loading ? (
        <div className="gov-mp-card" style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
          <RefreshCw size={18} className="spin-icon" style={{ display: "inline-block", marginRight: "8px" }} />
          Retrieving real physical inspection records from national dataset...
        </div>
      ) : error ? (
        <div className="gov-mp-card" style={{ padding: "20px", textAlign: "center", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca" }}>
          <AlertTriangle size={18} style={{ display: "inline-block", marginRight: "6px" }} />
          <span>{error}</span>
          <button
            type="button"
            className="gov-redirect-link-btn"
            onClick={fetchEvidence}
            style={{ marginLeft: "12px", cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="gov-mp-card" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
          No inspection records found in dataset.
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="gov-mp-card" style={{ gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <strong style={{ fontFamily: "monospace", color: "#005A9C", fontSize: "13px" }}>
                    #{item.id}
                  </strong>
                  <span
                    className="gov-parliament-badge"
                    style={{
                      background: item.has_gps ? "#ecfdf5" : "#f1f5f9",
                      color: item.has_gps ? "#047857" : "#475569",
                      borderColor: item.has_gps ? "#a7f3d0" : "#cbd5e1",
                      fontSize: "10.5px",
                    }}
                  >
                    <ShieldCheck size={12} />
                    <span>{item.geofence_status}</span>
                  </span>
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: "700",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      background: "#eff6ff",
                      color: "#005A9C",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: 0, lineHeight: "1.3" }}>
                  {item.title}
                </h3>

                <span style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                  <MapPin size={11} color="#005A9C" />
                  {item.location} · Sanction: <strong style={{ color: "#0f172a" }}>{item.cost}</strong> · Disbursed: <strong style={{ color: "#0d9488" }}>{item.actual_cost}</strong> · Agency: {item.agency}
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className="gov-redirect-link-btn"
                  onClick={() =>
                    onSelectWork &&
                    onSelectWork({
                      WORK_ID: item.id,
                      WORK_DESCRIPTION: item.title,
                      CONSTITUENCY: item.constituency,
                      STATE_NAME: item.state,
                      __initialSection: "geo-photo",
                      __authority: "CITIZEN",
                    })
                  }
                  title="Inspect Public Site Evidence & Photo Gallery Dossier"
                  style={{ cursor: "pointer" }}
                >
                  <Eye size={12} />
                  <span>Public Evidence Dossier →</span>
                </button>

                <button
                  type="button"
                  className="gov-redirect-link-btn"
                  style={{ color: "#b91c1c", borderColor: "#fca5a5", background: "#fef2f2", cursor: "pointer" }}
                  onClick={() => onReportWork && onReportWork({ WORK_ID: item.id, WORK_DESCRIPTION: item.title, IDA_NAME: item.location })}
                >
                  <Flag size={12} />
                  <span>Report Discrepancy</span>
                </button>
              </div>
            </div>

            {/* 3-Stage Milestone Progression Card Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginTop: "6px" }}>
              <div
                style={{
                  padding: "8px 12px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  1. Recommendation
                </span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>Official Submission</strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Date: {item.recommendation_date}</span>
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  2. Administrative Sanction
                </span>
                <strong style={{ fontSize: "12px", color: "#005A9C" }}>Collectorate Approval</strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Date: {item.sanction_date}</span>
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  borderLeft: "3.5px solid #0d9488",
                }}
              >
                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#0d9488", textTransform: "uppercase" }}>
                  3. Execution & Verification
                </span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>{item.status}</strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Milestone Completed ({item.completion}%)
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
