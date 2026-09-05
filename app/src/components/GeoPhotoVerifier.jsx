import React, { useState } from "react";
import {
  Camera,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
  Crosshair,
  Building,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "../constants";

const SAMPLE_CASES = [
  {
    id: "case-authentic",
    title: "1. Authentic On-Site Milestone Photo",
    workId: "#166546",
    workName: "Construction of CC road and side drain in Guntur",
    location: "Guntur, Andhra Pradesh",
    gpsCoordinates: "16.3067° N, 80.4365° E",
    sanctionedCoords: "16.3072° N, 80.4358° E",
    geoDistance: "14 meters (Within 50m site geofence)",
    timestamp: "12 Apr 2024, 11:42 IST",
    device: "Samsung Galaxy S22 (SM-S901E)",
    pHashDuplicate: "No duplicate detected across 102,703 project photos",
    authenticityScore: 98.6,
    verdict: "PASSED",
    badge: "authentic",
    explanation:
      "GPS coordinates precisely match the approved Guntur work site. Timestamp falls within the tender execution period, and image sensor fingerprint indicates an authentic on-site photograph.",
  },
  {
    id: "case-duplicate",
    title: "2. Duplicate Photo Reuse Fraud (Ghost Work)",
    workId: "#144429",
    workName: "Community pathway and culvert construction",
    location: "Peddapalle, Telangana",
    gpsCoordinates: "18.6163° N, 79.3789° E",
    sanctionedCoords: "18.6150° N, 79.3801° E",
    geoDistance: "110 meters",
    timestamp: "28 Feb 2024, 15:10 IST",
    device: "Redmi Note 11",
    pHashDuplicate: "CRITICAL: 99.4% perceptual hash match with Work #122141 (Nalgonda, 2023)",
    authenticityScore: 24.1,
    verdict: "DUPLICATE_FLAG",
    badge: "fraud",
    explanation:
      "Image Perceptual Hash (pHash) analysis revealed that this identical photograph was already submitted and claimed under Work #122141 in Nalgonda 11 months ago. Flagged as duplicate milestone billing fraud.",
  },
  {
    id: "case-location-mismatch",
    title: "3. GPS Coordinates Mismatch (Off-Site Photo)",
    workId: "#158499",
    workName: "Solar High Mast Lighting and Ground Levelling",
    location: "Nagarkurnool, Telangana",
    gpsCoordinates: "19.0760° N, 72.8777° E (Mumbai South, Maharashtra)",
    sanctionedCoords: "16.4842° N, 78.3188° E (Nagarkurnool, Telangana)",
    geoDistance: "648 km deviation from sanctioned site",
    timestamp: "03 May 2024, 09:25 IST",
    device: "iPhone 13 Pro",
    pHashDuplicate: "No previous database hash match",
    authenticityScore: 41.5,
    verdict: "GEOFENCE_FAIL",
    badge: "danger",
    explanation:
      "Photo EXIF GPS metadata indicates it was captured in Mumbai, Maharashtra (648 km away from Nagarkurnool). Vendor submission rejected for geo-fence failure.",
  },
  {
    id: "case-tampered",
    title: "4. Digital Tampering / Stock Image Detection",
    workId: "#181700",
    workName: "Drinking Water Purification Unit & RO Plant",
    location: "Viluppuram, Tamil Nadu",
    gpsCoordinates: "GPS metadata stripped / Missing EXIF header",
    sanctionedCoords: "11.9401° N, 79.4861° E",
    geoDistance: "Unknown (No GPS telemetry)",
    timestamp: "Missing timestamp",
    device: "Adobe Photoshop CS6 / Synthetic artifacts detected",
    pHashDuplicate: "Matched known manufacturer marketing catalog image",
    authenticityScore: 18.2,
    verdict: "TAMPER_DETECTED",
    badge: "danger",
    explanation:
      "The submitted image contains no hardware camera metadata and matches a commercial manufacturer brochure image rather than actual completed field installation. Payment clearance halted.",
  },
];

export default function GeoPhotoVerifier() {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedCase, setAnalyzedCase] = useState(SAMPLE_CASES[0]);

  const handleSelectCase = (idx) => {
    setSelectedCaseIdx(idx);
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalyzedCase(SAMPLE_CASES[idx]);
      setIsAnalyzing(false);
    }, 400);
  };

  return (
    <div className="compact-page-container">
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">eSAKSHI FIELD SURVEILLANCE / VENDOR VERIFICATION</div>
          <h2>Geo-Tagged Milestone Photo AI Verifier</h2>
          <p>
            Automated verification of contractor and implementing agency photo submissions. Extracts
            EXIF GPS coordinates, enforces constituency geo-fencing, and runs Perceptual Hash (pHash)
            scans to catch duplicate photo reuse and ghost work claims.
          </p>
        </div>
      </div>

      <div className="validator-grid">
        {/* Left: Test Cases & Upload Panel */}
        <div className="validator-form-card">
          <div className="section-field-label mb-3">
            <Camera size={16} />
            <span>Select Inspection Submission to Verify:</span>
          </div>

          <div className="sample-cases-selector">
            {SAMPLE_CASES.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                className={`case-select-btn ${selectedCaseIdx === idx ? "active" : ""}`}
                onClick={() => handleSelectCase(idx)}
              >
                <div className="case-title-row">
                  <strong>{c.title}</strong>
                  <span className={`mini-status-badge ${c.badge}`}>{c.verdict}</span>
                </div>
                <div className="case-meta-row">
                  <span>Work: {c.workId}</span>
                  <span>·</span>
                  <span>{c.location}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="photo-preview-box mt-3">
            <div className="preview-top-bar">
              <span>Simulated Vendor Uploaded Photo:</span>
              <span className="file-info">{analyzedCase.device}</span>
            </div>
            <div className="simulated-image-frame">
              <div className="image-watermark-overlay">
                <div className="watermark-tag">
                  <MapPin size={12} />
                  <span>{analyzedCase.gpsCoordinates}</span>
                </div>
                <div className="watermark-tag">
                  <Clock size={12} />
                  <span>{analyzedCase.timestamp}</span>
                </div>
              </div>
              <div className="photo-placeholder-art">
                <ImageIcon size={48} opacity={0.3} />
                <p>Project Milestone Photo: {analyzedCase.workName}</p>
                <small>eSAKSHI Upload ID: {analyzedCase.workId}-M2</small>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Multi-Factor Analysis Results */}
        <div className="validator-results-card">
          {isAnalyzing ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Extracting EXIF GPS coordinates & running perceptual image hash...</p>
            </div>
          ) : (
            <div className="audit-results-content">
              {/* Verdict Header Banner */}
              <div
                className={`verdict-banner ${
                  analyzedCase.verdict === "PASSED" ? "verdict-success" : "verdict-danger"
                }`}
              >
                <div className="verdict-icon">
                  {analyzedCase.verdict === "PASSED" ? (
                    <CheckCircle2 size={26} />
                  ) : (
                    <AlertTriangle size={26} />
                  )}
                </div>
                <div className="verdict-text">
                  <h4>
                    {analyzedCase.verdict === "PASSED"
                      ? "✅ VERIFIED: Geo-Tag & Photo Authenticity Cleared"
                      : analyzedCase.verdict === "DUPLICATE_FLAG"
                      ? "🚨 FRAUD ALERT: Duplicate Photo Reuse Detected"
                      : analyzedCase.verdict === "GEOFENCE_FAIL"
                      ? "⚠️ REJECTED: GPS Location Outside Project Boundary"
                      : "⚠️ AUDIT HOLD: Synthetic / Catalog Image Detected"}
                  </h4>
                  <p>{analyzedCase.explanation}</p>
                </div>
              </div>

              {/* 4 Multi-Factor Inspection Cards */}
              <div className="audit-section-box">
                <div className="box-title">1. GPS Geo-Fence & Location Verification</div>
                <div className="benchmark-stat-row">
                  <div>
                    <span>Photo Coordinates</span>
                    <strong>{analyzedCase.gpsCoordinates}</strong>
                  </div>
                  <div>
                    <span>Sanction Location</span>
                    <strong>{analyzedCase.sanctionedCoords}</strong>
                  </div>
                  <div>
                    <span>Geo-Fence Status</span>
                    <strong
                      className={
                        analyzedCase.verdict === "GEOFENCE_FAIL" ? "danger-text" : "safe-text"
                      }
                    >
                      {analyzedCase.geoDistance}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="audit-section-box">
                <div className="box-title">2. Duplicate Photo / Perceptual Hash (pHash) Scan</div>
                <div className="phash-result-box">
                  <div className="phash-status-line">
                    <Crosshair size={15} />
                    <strong>{analyzedCase.pHashDuplicate}</strong>
                  </div>
                  <small>Scanned across 102,703 project completion albums in eSAKSHI national database</small>
                </div>
              </div>

              <div className="audit-section-box">
                <div className="box-title">3. Hardware EXIF & Tamper Integrity</div>
                <div className="benchmark-stat-row">
                  <div>
                    <span>Camera Device</span>
                    <strong>{analyzedCase.device}</strong>
                  </div>
                  <div>
                    <span>Capture Timestamp</span>
                    <strong>{analyzedCase.timestamp}</strong>
                  </div>
                  <div>
                    <span>AI Authenticity Score</span>
                    <strong
                      className={analyzedCase.authenticityScore >= 70 ? "safe-text" : "danger-text"}
                    >
                      {analyzedCase.authenticityScore}%
                    </strong>
                  </div>
                </div>
              </div>

              <div className="action-recommendation-box">
                <div className="action-title">Administrative Recommendation for District Authority:</div>
                <p>
                  {analyzedCase.verdict === "PASSED"
                    ? "Sanction installment may be released to Implementing Agency. Digital asset record archived."
                    : "Do NOT disburse milestone payment. Forward case to District Vigilance Officer for physical inspection."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
