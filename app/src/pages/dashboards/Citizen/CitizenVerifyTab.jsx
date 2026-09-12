import React, { useState, useEffect } from "react";
import {
  QrCode,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Eye,
  Flag,
  Smartphone,
  Search,
  RefreshCw,
} from "lucide-react";
import { API_BASE } from "../../../constants";

export default function CitizenVerifyTab({ onSelectWork, onReportWork }) {
  const [inputWorkId, setInputWorkId] = useState("70853");
  const [verifiedWork, setVerifiedWork] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // Suggested canonical work IDs present in dataset
  const samplePlaques = [
    { id: "70853", label: "Work #70853 (Rajgarh)" },
    { id: "155432", label: "Work #155432 (Eluru)" },
    { id: "144429", label: "Work #144429 (Peddapalle)" },
    { id: "158499", label: "Work #158499 (Nagarkurnool)" },
  ];

  const handleVerify = async (idToVerify) => {
    const targetId = (idToVerify || inputWorkId || "").trim();
    if (!targetId) return;

    setLoading(true);
    setError(null);
    setConfirmed(false);

    try {
      const res = await fetch(`${API_BASE}/api/public/verify/${encodeURIComponent(targetId)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Work ID '${targetId}' not found in official MPLADS registry.`);
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setVerifiedWork(data);
    } catch (err) {
      console.error("[Verify] Verification error:", err);
      setError(err.message || "Unable to verify work ID.");
      setVerifiedWork(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleVerify("70853");
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Header Banner */}
      <div className="gov-mp-card">
        <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <QrCode size={15} color="#005A9C" />
          <span>On-Site QR Project Verification: Physical Infrastructure → Digital Record</span>
        </div>
        <div className="card-section-desc">
          Scan or search the official Work ID displayed on the on-site MPLADS plaque to verify digital sanction authenticity, approved budget, executing agency, and GPS telemetry.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "10px" }}>
        {/* Scanner / ID Search Card */}
        <div className="gov-mp-card" style={{ alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "100%", textAlign: "left", marginBottom: "6px" }}>
            <div className="card-section-title">
              Physical Site Plaque Scanner
            </div>
            <div className="card-section-desc">
              Enter official Work ID or simulate scanning an on-site eSAKSHI plaque
            </div>
          </div>

          <div className="qr-frame-box" style={{ margin: "10px auto" }}>
            <QrCode size={90} color="#005A9C" />
            <div className="qr-scan-line" />
          </div>

          {/* Search Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(inputWorkId);
            }}
            style={{ width: "100%", display: "flex", gap: "6px", margin: "10px 0" }}
          >
            <input
              type="text"
              className="gov-input citizen-input"
              value={inputWorkId}
              onChange={(e) => setInputWorkId(e.target.value)}
              placeholder="Enter official Work ID (e.g. 70853)..."
              style={{ flexGrow: 1, height: "32px", fontSize: "12px", padding: "0 10px" }}
            />
            <button
              type="submit"
              className="gov-redirect-link-btn"
              style={{ background: "#005A9C", color: "#ffffff", borderColor: "#005A9C", cursor: "pointer", height: "32px", padding: "0 12px" }}
              disabled={loading}
            >
              {loading ? <RefreshCw size={13} className="spin-icon" /> : <Search size={13} />}
              <span>Verify</span>
            </button>
          </form>

          {/* Quick Real Work ID Buttons */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
            {samplePlaques.map((p) => (
              <button
                key={p.id}
                type="button"
                className="gov-redirect-link-btn"
                style={{
                  background: inputWorkId === p.id ? "#eff6ff" : "#f8fafc",
                  borderColor: inputWorkId === p.id ? "#bfdbfe" : "#cbd5e1",
                  color: inputWorkId === p.id ? "#005A9C" : "#334155",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setInputWorkId(p.id);
                  handleVerify(p.id);
                }}
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Verification Result Card */}
        <div className="gov-mp-card" style={{ gap: "10px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              <RefreshCw size={18} className="spin-icon" style={{ display: "inline-block", marginRight: "8px" }} />
              Verifying record against 102,703 central MPLADS works...
            </div>
          ) : error ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#b91c1c", background: "#fef2f2", borderRadius: "6px", border: "1px solid #fecaca" }}>
              <AlertTriangle size={18} style={{ display: "inline-block", marginRight: "6px" }} />
              <span>{error}</span>
            </div>
          ) : verifiedWork ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Verified Digital Record
                  </span>
                  <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0", lineHeight: "1.3" }}>
                    {verifiedWork.title}
                  </h3>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    Work ID: <strong style={{ color: "#005A9C", fontFamily: "monospace" }}>#{verifiedWork.work_id}</strong> · {verifiedWork.constituency}, {verifiedWork.state}
                  </span>
                </div>

                <span
                  style={{
                    background: "#f0fdf4",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>OFFICIALLY VERIFIED</span>
                </span>
              </div>

              {/* Data Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Sanctioned Budget</span>
                  <strong style={{ fontSize: "13px", color: "#005A9C" }}>{verifiedWork.sanction_formatted}</strong>
                </div>

                <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Actual Disbursed</span>
                  <strong style={{ fontSize: "13px", color: "#0d9488" }}>{verifiedWork.expenditure_formatted}</strong>
                </div>

                <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Member of Parliament</span>
                  <strong style={{ fontSize: "12px", color: "#0f172a" }}>{verifiedWork.mp}</strong>
                </div>

                <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Execution Stage</span>
                  <strong style={{ fontSize: "12px", color: "#0f172a" }}>{verifiedWork.stage}</strong>
                </div>
              </div>

              {/* GPS Geofence Check - Honest Telemetry */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: verifiedWork.has_gps_coordinates ? "1px solid #bbf7d0" : "1px solid #fed7aa",
                  background: verifiedWork.has_gps_coordinates ? "#f0fdf4" : "#fff7ed",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                {verifiedWork.has_gps_coordinates ? (
                  <CheckCircle2 size={16} color="#16a34a" style={{ marginTop: "2px", flexShrink: 0 }} />
                ) : (
                  <MapPin size={16} color="#ea580c" style={{ marginTop: "2px", flexShrink: 0 }} />
                )}
                <div>
                  <strong style={{ fontSize: "12px", color: verifiedWork.has_gps_coordinates ? "#15803d" : "#9a3412" }}>
                    Location Telemetry: {verifiedWork.location_status}
                  </strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                    Coordinates: <span style={{ fontFamily: "monospace" }}>{verifiedWork.gps_coordinates}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  className="gov-redirect-link-btn"
                  onClick={() =>
                    onSelectWork &&
                    onSelectWork({
                      WORK_ID: verifiedWork.work_id,
                      WORK_DESCRIPTION: verifiedWork.title,
                      CONSTITUENCY: verifiedWork.constituency,
                      STATE_NAME: verifiedWork.state,
                      __initialSection: "actions",
                      __authority: "CITIZEN",
                    })
                  }
                  title="Inspect Social Audit & Community Verification Dossier"
                  style={{ flexGrow: 1, justifyContent: "center", cursor: "pointer" }}
                >
                  <Eye size={12} />
                  <span>Social Audit Dossier →</span>
                </button>

                <button
                  type="button"
                  className="gov-redirect-link-btn"
                  style={{ color: "#b91c1c", borderColor: "#fca5a5", background: "#fef2f2", cursor: "pointer" }}
                  onClick={() => onReportWork && onReportWork({ WORK_ID: verifiedWork.work_id, WORK_DESCRIPTION: verifiedWork.title, IDA_NAME: verifiedWork.agency })}
                >
                  <Flag size={12} />
                  <span>Report Discrepancy</span>
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
