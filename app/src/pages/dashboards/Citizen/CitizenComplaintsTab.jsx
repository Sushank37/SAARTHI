import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flag,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { API_BASE } from "../../../constants";

export default function CitizenComplaintsTab({ initialComplaintId }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState(initialComplaintId || "");
  const [activeComplaint, setActiveComplaint] = useState(null);

  const steps = [
    { key: "Submitted", label: "Submitted" },
    { key: "Received", label: "Received" },
    { key: "Under Review", label: "Under Review" },
    { key: "Assigned", label: "Assigned" },
    { key: "Action Taken", label: "Action Taken" },
    { key: "Resolved", label: "Resolved" },
  ];

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/grievances`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = data.grievances || [];
      setComplaints(list);

      // If initial complaint ID is supplied or searchId is set, select it
      if (initialComplaintId) {
        const found = list.find((c) => c.complaint_id.toUpperCase() === initialComplaintId.toUpperCase());
        if (found) setActiveComplaint(found);
        else if (list.length > 0) setActiveComplaint(list[0]);
      } else if (list.length > 0 && !activeComplaint) {
        setActiveComplaint(list[0]);
      }
    } catch (err) {
      console.error("Failed to load grievances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    const found = complaints.find(
      (c) => c.complaint_id.toLowerCase().includes(searchId.trim().toLowerCase())
    );
    if (found) {
      setActiveComplaint(found);
    } else {
      alert(`Complaint ID "${searchId}" not found in current local registry.`);
    }
  };

  const getStepIndex = (status) => {
    const sLower = (status || "").toLowerCase();
    if (sLower === "resolved") return 5;
    if (sLower === "action taken") return 4;
    if (sLower === "assigned") return 3;
    if (sLower === "under review") return 2;
    if (sLower === "received") return 1;
    return 0; // Submitted
  };

  const currentStepIdx = getStepIndex(activeComplaint?.status);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Lookup Bar */}
      <div className="gov-mp-card">
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flexGrow: 1, maxWidth: "420px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#64748b" }} />
            <input
              type="text"
              className="citizen-input"
              style={{ paddingLeft: "32px", fontFamily: "monospace", height: "32px", fontSize: "12px", borderRadius: "4px" }}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Complaint ID (e.g. CIT-2026-001283)..."
            />
          </div>
          <button
            type="submit"
            className="gov-redirect-link-btn"
            style={{ height: "32px", background: "#eff6ff", borderColor: "#bfdbfe", color: "#005A9C" }}
          >
            <Search size={13} />
            <span>Track Grievance</span>
          </button>
        </form>
      </div>

      {/* Main 2-Column: Active Complaint Stepper + Community Complaints List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "10px" }}>
        {/* Active Grievance Tracker Card */}
        {activeComplaint ? (
          <div className="gov-mp-card" style={{ gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Tracking Active Grievance
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#005A9C", margin: "1px 0 0 0", fontFamily: "monospace" }}>
                  {activeComplaint.complaint_id}
                </h3>
              </div>

              <span
                className="gov-parliament-badge"
                style={{
                  background: activeComplaint.status === "Resolved" ? "#ecfdf5" : "#eff6ff",
                  color: activeComplaint.status === "Resolved" ? "#047857" : "#005A9C",
                  borderColor: activeComplaint.status === "Resolved" ? "#a7f3d0" : "#bfdbfe",
                  fontSize: "11px",
                }}
              >
                ● {activeComplaint.status}
              </span>
            </div>

            {/* Visual 6-Stage Stepper */}
            <div className="complaint-stepper">
              {steps.map((s, idx) => {
                const isDone = idx < currentStepIdx;
                const isCurr = idx === currentStepIdx;
                return (
                  <div
                    key={s.key}
                    className={`complaint-step-item ${isDone ? "completed" : isCurr ? "active" : ""}`}
                  >
                    <div className="complaint-step-circle">
                      {isDone ? "✓" : idx + 1}
                    </div>
                    <span className="complaint-step-label">{s.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Issue Details Box */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                  {activeComplaint.work_title || "Community Infrastructure"}
                </strong>
                <span style={{ display: "block", fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                  Work ID: {activeComplaint.work_id} · Locality: {activeComplaint.location}
                </span>
              </div>

              <div style={{ fontSize: "12.5px", color: "#b91c1c", fontWeight: "600" }}>
                Discrepancy: {activeComplaint.issue_type}
              </div>

              <p style={{ fontSize: "12.5px", color: "#334155", margin: 0, lineHeight: "1.4" }}>
                "{activeComplaint.description}"
              </p>
            </div>

            {/* Action Timeline Logs */}
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                Official Redressal History
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(activeComplaint.timeline || []).map((tl, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "10px",
                      fontSize: "12px",
                      padding: "8px 10px",
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: "6px",
                    }}
                  >
                    <span style={{ fontWeight: "700", color: "#2563eb", minWidth: "110px" }}>
                      {tl.timestamp}
                    </span>
                    <span style={{ color: "#334155" }}>{tl.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="citizen-card" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            No complaint selected. Click any complaint on the right or search by ID.
          </div>
        )}

        {/* Community Grievances Registry */}
        <div className="citizen-card" style={{ gap: "12px" }}>
          <div className="citizen-card-header">
            <div className="citizen-card-title">
              <Flag size={16} color="#dc2626" />
              <span>Recent Public Grievances ({complaints.length})</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "560px", overflowY: "auto" }}>
            {complaints.map((c) => {
              const isSelected = activeComplaint?.complaint_id === c.complaint_id;
              return (
                <div
                  key={c.complaint_id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: isSelected ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                  onClick={() => setActiveComplaint(c)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontFamily: "monospace", fontSize: "12.5px", color: "#1e3a8a" }}>
                      {c.complaint_id}
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "1px 6px",
                        borderRadius: "8px",
                        background: c.status === "Resolved" ? "#dcfce7" : "#fef3c7",
                        color: c.status === "Resolved" ? "#166534" : "#854d0e",
                      }}
                    >
                      {c.status}
                    </span>
                  </div>

                  <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#0f172a" }}>
                    {c.work_title}
                  </span>

                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    {c.issue_type} · {c.location}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
