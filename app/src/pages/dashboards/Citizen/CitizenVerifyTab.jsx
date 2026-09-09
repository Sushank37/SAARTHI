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
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Header Banner */}
      <div className="gov-mp-card">
        <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <QrCode size={15} color="#005A9C" />
          <span>On-Site QR Project Verification: Physical Infrastructure → Digital Record</span>
        </div>
        <div className="card-section-desc">
          Scan the QR plaque installed on the project site to confirm the physical asset exists, verify GPS geofence, and compare actual progress.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "10px" }}>
        {/* Scanner Simulation Card */}
        <div className="gov-mp-card" style={{ alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "100%", textAlign: "left", marginBottom: "6px" }}>
            <div className="card-section-title">
              Physical Site QR Scanner
            </div>
            <div className="card-section-desc">
              Simulates device camera reading the official eSAKSHI QR plaque on site
            </div>
          </div>

          <div className="qr-frame-box" style={{ margin: "10px auto" }}>
            <QrCode size={100} color="#005A9C" />
            <div className="qr-scan-line" />
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              className="gov-redirect-link-btn"
              style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#005A9C" }}
              onClick={() => handleSimulateScan("W-2026-10291")}
              disabled={scanning}
            >
              <Smartphone size={13} />
              <span>{scanning ? "Scanning QR..." : "Scan Sample Site Plaque 1"}</span>
            </button>

            <button
              type="button"
              className="gov-redirect-link-btn"
              onClick={() => handleSimulateScan("W-2026-10442")}
              disabled={scanning}
            >
              <span>Scan Plaque 2 (Solar Lights)</span>
            </button>
          </div>
        </div>

        {/* Verification Result Card */}
        <div className="gov-mp-card" style={{ gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Scanned Project Record
              </span>
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                {verifiedWork.title}
              </h3>
              <span style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                <MapPin size={11} color="#005A9C" />
                {verifiedWork.location} · {verifiedWork.constituency}
              </span>
            </div>

            <span className="gov-parliament-badge" style={{ background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0", fontSize: "10.5px" }}>
              <ShieldCheck size={12} />
              <span>📍 GPS: {verifiedWork.gpsDistanceM}m from coordinates</span>
            </span>
          </div>

          {/* Project Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
            <div>
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>Work ID:</span>
              <div style={{ fontFamily: "monospace", fontWeight: "700", color: "#005A9C", fontSize: "12px" }}>{verifiedWork.id}</div>
            </div>
            <div>
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>Status:</span>
              <div style={{ fontWeight: "700", color: "#16a34a", fontSize: "12px" }}>✓ {verifiedWork.status}</div>
            </div>
            <div>
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>Sanctioned Cost:</span>
              <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "12px" }}>{verifiedWork.cost}</div>
            </div>
            <div>
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>Executing Agency:</span>
              <div style={{ fontSize: "11.5px", fontWeight: "600", color: "#334155" }}>{verifiedWork.agency}</div>
            </div>
          </div>

          {/* Community Confirmation Action */}
          {confirmed ? (
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "10px 12px", borderRadius: "6px", textAlign: "center" }}>
              <CheckCircle2 size={20} color="#16a34a" style={{ margin: "0 auto 4px auto" }} />
              <strong style={{ display: "block", color: "#166534", fontSize: "13px" }}>
                Ground Asset Verified by Citizen!
              </strong>
              <span style={{ fontSize: "11.5px", color: "#15803d" }}>
                Your confirmation has been logged as a citizen social audit endorsement.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#334155" }}>
                Does this physical infrastructure match what you see on site?
              </span>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="gov-redirect-link-btn"
                  style={{ background: "#16a34a", borderColor: "#16a34a", color: "#ffffff", flexGrow: 1, justifyContent: "center" }}
                  onClick={() => setConfirmed(true)}
                >
                  <CheckCircle2 size={13} />
                  <span>Confirm Asset Exists on Ground</span>
                </button>

                <button
                  type="button"
                  className="gov-redirect-link-btn"
                  style={{ color: "#b91c1c", borderColor: "#fca5a5", background: "#fef2f2", flexGrow: 1, justifyContent: "center" }}
                  onClick={() => onReportWork && onReportWork({ WORK_ID: verifiedWork.id, WORK_DESCRIPTION: verifiedWork.title, IDA_NAME: verifiedWork.location })}
                >
                  <Flag size={13} />
                  <span>Report Discrepancy</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
