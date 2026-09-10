import React, { useState } from "react";
import {
  Flag,
  AlertCircle,
  CheckCircle2,
  Upload,
  Copy,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
} from "lucide-react";
import { API_BASE } from "../../../constants";

export default function CitizenReportIssueTab({
  targetWork,
  onTrackComplaint,
}) {
  const [workId, setWorkId] = useState(targetWork?.WORK_ID || "");
  const [workTitle, setWorkTitle] = useState(targetWork?.WORK_DESCRIPTION || "");
  const [location, setLocation] = useState(targetWork?.IDA_NAME || "Nizamabad");
  const [constituency, setConstituency] = useState("Nizamabad");
  const [issueType, setIssueType] = useState("Work is incomplete");
  const [description, setDescription] = useState("");
  const [citizenName, setCitizenName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submittedGrievance, setSubmittedGrievance] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [copied, setCopied] = useState(false);

  const issueCategories = [
    "Work has not started",
    "Work is incomplete",
    "Poor quality / Substandard material",
    "Work appears abandoned",
    "Work location is incorrect",
    "Work does not exist on ground",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Please provide a description of the issue.");
      return;
    }

    const cleanWorkId = workId.trim();
    if (!cleanWorkId) {
      setSubmitError("Please enter a valid Work ID from the registry.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        work_id: cleanWorkId,
        work_title: workTitle.trim() || "MPLADS Public Work",
        issue_type: issueType,
        description: description.trim(),
        location: location.trim(),
        constituency: constituency.trim(),
        citizen_name: citizenName.trim() || "Concerned Citizen",
        citizen_phone: citizenPhone.trim(),
        photo_url: photoUrl || "",
      };

      const res = await fetch(`${API_BASE}/api/public/grievances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (HTTP ${res.status})`);
      }
      const data = await res.json();
      setSubmittedGrievance(data.grievance);
    } catch (err) {
      console.error("Grievance submission error:", err);
      setSubmitError(err.message || "Request could not be submitted. Please verify the Work ID and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (submittedGrievance) {
    return (
      <div className="citizen-card" style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center", padding: "36px 24px" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#dcfce7",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <CheckCircle2 size={32} />
        </div>

        <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Official Grievance Registered
        </span>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: "4px 0 10px 0" }}>
          Thank you for Participating in Social Audit
        </h2>
        <p style={{ fontSize: "13.5px", color: "#64748b", maxWidth: "500px", margin: "0 auto 20px auto", lineHeight: "1.4" }}>
          Your report has been logged into the eSAKSHI Public Surveillance System and forwarded to the District Planning Authority for site inspection.
        </p>

        {/* Tracking Code Box */}
        <div
          style={{
            background: "#f8fafc",
            border: "2px dashed #93c5fd",
            borderRadius: "8px",
            padding: "16px 20px",
            display: "inline-flex",
            alignItems: "center",
            gap: "14px",
            margin: "0 auto 24px auto",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Grievance Tracking Code
            </span>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#1e3a8a", fontFamily: "monospace" }}>
              {submittedGrievance.complaint_id}
            </div>
          </div>
          <button
            type="button"
            className="citizen-quick-action-btn"
            style={{ color: "#1e3a8a", borderColor: "#bfdbfe" }}
            onClick={() => copyToClipboard(submittedGrievance.complaint_id)}
          >
            <Copy size={13} />
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="citizen-quick-action-btn primary"
            onClick={() => onTrackComplaint && onTrackComplaint(submittedGrievance.complaint_id)}
          >
            <span>Track Grievance Status</span>
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            className="citizen-quick-action-btn"
            style={{ color: "#1e293b", borderColor: "#cbd5e1" }}
            onClick={() => {
              setSubmittedGrievance(null);
              setDescription("");
            }}
          >
            <span>File Another Report</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Header card */}
      <div className="gov-mp-card">
        <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Flag size={15} color="#dc2626" />
          <span>Report an Issue / Citizen Social Audit Discrepancy</span>
        </div>
        <div className="card-section-desc">
          If you observe stalled progress, substandard material, or discrepancies between digital records and ground reality, report it here for district administrative review.
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="gov-mp-card" style={{ gap: "16px" }}>
        {submitError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #f87171",
              color: "#991b1b",
              padding: "10px 14px",
              borderRadius: "4px",
              fontSize: "12.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Step 1: Work Identity */}
        <div>
          <div className="card-section-title" style={{ fontSize: "12.5px", marginBottom: "8px" }}>
            1. Project Identification
          </div>
          <div className="citizen-form-grid">
            <div className="citizen-input-group">
              <label className="citizen-input-label">Work ID (from official board, map, or registry)</label>
              <input
                type="text"
                className="citizen-input"
                style={{ height: "32px", fontSize: "12px", borderRadius: "4px" }}
                value={workId}
                onChange={(e) => setWorkId(e.target.value)}
                placeholder="e.g. 172106"
              />
            </div>

            <div className="citizen-input-group">
              <label className="citizen-input-label">Work Title / Description</label>
              <input
                type="text"
                className="citizen-input"
                style={{ height: "32px", fontSize: "12px", borderRadius: "4px" }}
                value={workTitle}
                onChange={(e) => setWorkTitle(e.target.value)}
                placeholder="e.g. Construction of Community Hall at Village"
              />
            </div>

            <div className="citizen-input-group">
              <label className="citizen-input-label">Locality / Village / Mandal</label>
              <input
                type="text"
                className="citizen-input"
                style={{ height: "32px", fontSize: "12px", borderRadius: "4px" }}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ibrahimpatnam, Nizamabad"
              />
            </div>

            <div className="citizen-input-group">
              <label className="citizen-input-label">Parliamentary Constituency</label>
              <select
                className="citizen-select"
                style={{ height: "32px", fontSize: "12px", borderRadius: "4px" }}
                value={constituency}
                onChange={(e) => setConstituency(e.target.value)}
              >
                <option value="Nizamabad">Nizamabad (Telangana)</option>
                <option value="Varanasi">Varanasi (Uttar Pradesh)</option>
                <option value="New Delhi">New Delhi (NCT of Delhi)</option>
                <option value="Thiruvananthapuram">Thiruvananthapuram (Kerala)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Discrepancy Nature */}
        <div>
          <div className="card-section-title" style={{ fontSize: "12.5px", marginBottom: "6px" }}>
            2. Nature of Discrepancy Observed <span style={{ color: "#dc2626" }}>*</span>
          </div>
          <div className="citizen-radio-group">
            {issueCategories.map((cat) => (
              <label key={cat} className="citizen-radio-label" style={{ fontSize: "12px" }}>
                <input
                  type="radio"
                  name="issue_type"
                  value={cat}
                  checked={issueType === cat}
                  onChange={(e) => setIssueType(e.target.value)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Step 3: Detailed Description */}
        <div className="citizen-input-group">
          <label className="citizen-input-label">
            Ground Discrepancy Details <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            className="citizen-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what is observed on ground vs what digital eSAKSHI records indicate (e.g., workers absent for 3 months, bad plaster quality, water plant broken, road cracked)..."
            required
          />
        </div>

        {/* Step 4: Photo / Evidence URL */}
        <div className="citizen-input-group">
          <label className="citizen-input-label">Photo Evidence / Image URL (Optional)</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              className="citizen-input"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Paste image link or leave blank to use default geo-photo"
            />
            <button
              type="button"
              className="citizen-quick-action-btn"
              style={{ color: "#1e3a8a", borderColor: "#cbd5e1" }}
              onClick={() => setPhotoUrl("https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&auto=format&fit=crop&q=80")}
            >
              <Upload size={14} />
              <span>Attach Sample</span>
            </button>
          </div>
        </div>

        {/* Step 5: Optional Citizen Contact */}
        <div>
          <div className="card-section-title" style={{ fontSize: "12.5px", marginBottom: "8px" }}>
            3. Citizen Information (Optional · Kept Confidential)
          </div>
          <div className="citizen-form-grid">
            <div className="citizen-input-group">
              <label className="citizen-input-label">Your Name</label>
              <input
                type="text"
                className="citizen-input"
                style={{ height: "32px", fontSize: "12px", borderRadius: "4px" }}
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="Enter your name (or leave anonymous)"
              />
            </div>

            <div className="citizen-input-group">
              <label className="citizen-input-label">Phone / WhatsApp (for SMS status updates)</label>
              <input
                type="text"
                className="citizen-input"
                style={{ height: "32px", fontSize: "12px", borderRadius: "4px" }}
                value={citizenPhone}
                onChange={(e) => setCitizenPhone(e.target.value)}
                placeholder="+91 98490 XXXXX"
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
          <button
            type="submit"
            className="gov-redirect-link-btn"
            disabled={submitting}
            style={{
              padding: "7px 16px",
              fontSize: "12px",
              fontWeight: "700",
              background: "#eff6ff",
              borderColor: "#bfdbfe",
              color: "#005A9C",
            }}
          >
            {submitting ? "Registering Report..." : "Submit Grievance to District Authority"}
          </button>
        </div>
      </form>
    </div>
  );
}
