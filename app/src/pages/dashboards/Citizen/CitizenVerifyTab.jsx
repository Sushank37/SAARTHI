import React, { useState } from "react";
import {
  QrCode,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Eye,
  Flag,
  Sparkles,
  Smartphone,
  ArrowRight,
} from "lucide-react";

export default function CitizenVerifyTab({ onSelectWork, onReportWork }) {
  const [scannedWorkId, setScannedWorkId] = useState("W-2026-10291");
  const [verifiedWork, setVerifiedWork] = useState({
    id: "W-2026-10291",
    title: "Construction of Community Hall & Skill Center",
    location: "Ibrahimpatnam, Nizamabad",
    constituency: "Nizamabad",
    mp: "Arvind Dharmapuri",
    cost: "₹15.00 Lakh",
    expenditure: "₹12.40 Lakh",
    agency: "Panchayat Raj Engineering Division",
    status: "Completed",
    gpsDistanceM: 38,
    geofenceValid: true,
  });

  const [confirmed, setConfirmed] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleSimulateScan = (workId) => {
    setScanning(true);
    setConfirmed(false);
    setTimeout(() => {
      setScanning(false);
      setVerifiedWork({
        id: workId,
        title: workId === "W-2026-10442"
          ? "Installation of 25 High Mast Solar LED Lights"
          : "Construction of Community Hall & Skill Center",
        location: workId === "W-2026-10442" ? "Armoor Mandal Crossroads" : "Ibrahimpatnam, Nizamabad",
        constituency: "Nizamabad",
        mp: "Arvind Dharmapuri",
        cost: workId === "W-2026-10442" ? "₹10.50 Lakh" : "₹15.00 Lakh",
        expenditure: workId === "W-2026-10442" ? "₹10.20 Lakh" : "₹12.40 Lakh",
        agency: workId === "W-2026-10442" ? "TSREDCO Energy Corp" : "Panchayat Raj Division",
        status: "Completed",
        gpsDistanceM: Math.floor(18 + Math.random() * 30),
        geofenceValid: true,
      });
    }, 1200);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header Banner */}
      <div className="citizen-card" style={{ padding: "16px 20px" }}>
        <div className="citizen-card-title">
          <QrCode size={18} color="#2563eb" />
          <span>On-Site QR Project Verification: Physical Infrastructure → Digital Record</span>
        </div>
        <div className="citizen-card-subtitle">
          Scan the QR plaque installed on the project site to confirm the physical asset exists, verify GPS geofence, and compare actual progress.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {/* Scanner Simulation Card */}
        <div className="citizen-card" style={{ alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "100%", textAlign: "left", marginBottom: "8px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Physical Site QR Scanner
            </h4>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Simulates device camera reading the official eSAKSHI QR plaque on site
            </span>
          </div>

          <div className="qr-frame-box">
            <QrCode size={120} color="#1e3a8a" />
            <div className="qr-scan-line" />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              className="citizen-quick-action-btn primary"
              onClick={() => handleSimulateScan("W-2026-10291")}
              disabled={scanning}
            >
              <Smartphone size={14} />
              <span>{scanning ? "Scanning QR..." : "Scan Sample Site Plaque 1"}</span>
            </button>

            <button
              type="button"
              className="citizen-quick-action-btn"
              style={{ color: "#1e3a8a", borderColor: "#cbd5e1" }}
              onClick={() => handleSimulateScan("W-2026-10442")}
              disabled={scanning}
            >
              <span>Scan Plaque 2 (Solar Lights)</span>
            </button>
          </div>
        </div>

        {/* Verification Result Card */}
        <div className="citizen-card" style={{ gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Scanned Project Record
              </span>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                {verifiedWork.title}
              </h3>
              <span style={{ fontSize: "12.5px", color: "#475569", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <MapPin size={13} color="#ea580c" />
                {verifiedWork.location} · {verifiedWork.constituency}
              </span>
            </div>

            <span className="qr-distance-badge">
              <ShieldCheck size={14} />
              <span>📍 You are {verifiedWork.gpsDistanceM}m from registered coordinates</span>
            </span>
          </div>

          {/* Project Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Work ID:</span>
              <div style={{ fontFamily: "monospace", fontWeight: "700", color: "#1e3a8a" }}>{verifiedWork.id}</div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Status:</span>
              <div style={{ fontWeight: "700", color: "#16a34a" }}>✓ {verifiedWork.status}</div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Sanctioned Cost:</span>
              <div style={{ fontWeight: "800", color: "#0f172a" }}>{verifiedWork.cost}</div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Executing Agency:</span>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>{verifiedWork.agency}</div>
            </div>
          </div>

          {/* Community Confirmation Action */}
          {confirmed ? (
            <div style={{ background: "#dcfce7", border: "1px solid #86efac", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
              <CheckCircle2 size={24} color="#16a34a" style={{ margin: "0 auto 6px auto" }} />
              <strong style={{ display: "block", color: "#166534", fontSize: "14px" }}>
                Ground Asset Verified by Citizen!
              </strong>
              <span style={{ fontSize: "12px", color: "#15803d" }}>
                Your confirmation has been logged as a citizen social audit endorsement.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#334155" }}>
                Does this physical infrastructure match what you see on site?
              </span>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="citizen-quick-action-btn primary"
                  style={{ background: "#16a34a", borderColor: "#16a34a", flexGrow: 1, justifyContent: "center" }}
                  onClick={() => setConfirmed(true)}
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm Asset Exists on Ground</span>
                </button>

                <button
                  type="button"
                  className="citizen-quick-action-btn"
                  style={{ color: "#b91c1c", borderColor: "#fca5a5", background: "#fef2f2", flexGrow: 1, justifyContent: "center" }}
                  onClick={() => onReportWork && onReportWork({ WORK_ID: verifiedWork.id, WORK_DESCRIPTION: verifiedWork.title, IDA_NAME: verifiedWork.location })}
                >
                  <Flag size={15} />
                  <span>Report Discrepancy / Defect</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
