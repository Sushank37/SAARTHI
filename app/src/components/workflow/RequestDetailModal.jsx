import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldAlert,
  FileText,
  User,
} from "lucide-react";
import RequestStatusBadge from "./RequestStatusBadge";
import RequestPriorityBadge from "./RequestPriorityBadge";
import { updateRequestStatus } from "../../services/workflowService";
import { formatCrores } from "../../constants";
import "./workflow.css";

export default function RequestDetailModal({
  request,
  currentRole,
  onClose,
  onStatusUpdated,
  onOpenWork,
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!request) return null;

  const roleUpper = String(currentRole || "").toUpperCase();
  const targetRole = String(request.target_role || "").toUpperCase();
  const isAuthorizedToAct =
    roleUpper === targetRole ||
    roleUpper === "MOSPI" ||
    (roleUpper === "DISTRICT_AUTHORITY" && targetRole === "DISTRICT_AUTHORITY");

  const handleAction = async (newStatus, defaultNote = "") => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const finalNote = note.trim() || defaultNote || `Status updated to ${newStatus}`;
      const res = await updateRequestStatus(request.request_id, {
        role: roleUpper,
        status: newStatus,
        note: finalNote,
        actorIdentity: `${roleUpper} Nodal Officer`,
      });
      setNote("");
      if (onStatusUpdated) onStatusUpdated(res.request);
      onClose();
    } catch (err) {
      console.error("Failed to update status:", err);
      setErrorMsg(err.message || "Failed to update request status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenWorkClick = () => {
    if (onOpenWork) {
      onOpenWork(request.work_id);
    }
  };

  return (
    <div className="workflow-modal-overlay" onClick={onClose}>
      <div
        className="workflow-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="workflow-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={18} color="#005A9C" />
            <div>
              <h4>{request.title || request.request_type_label}</h4>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                  {request.request_id}
                </span>
                <RequestStatusBadge status={request.status} />
                <RequestPriorityBadge priority={request.priority} />
              </div>
            </div>
          </div>
          <button
            type="button"
            className="workflow-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="workflow-modal-body">
          {errorMsg && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #f87171",
                color: "#991b1b",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Key Work Metadata */}
          <div className="workflow-detail-grid">
            <div className="workflow-detail-item">
              <span className="workflow-detail-label">Canonical Work ID</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="workflow-detail-val" style={{ color: "#005A9C", fontWeight: 800 }}>
                  #{request.work_id}
                </span>
                <button
                  type="button"
                  className="workflow-btn workflow-btn-outline workflow-btn-sm"
                  onClick={handleOpenWorkClick}
                  title="Open official Work Detail Dossier"
                >
                  <ExternalLink size={12} />
                  <span>Open Work Dossier</span>
                </button>
              </div>
            </div>

            <div className="workflow-detail-item">
              <span className="workflow-detail-label">Project Stage</span>
              <span className="workflow-detail-val">{request.work_stage || "In Progress"}</span>
            </div>

            <div className="workflow-detail-item">
              <span className="workflow-detail-label">Jurisdiction</span>
              <span className="workflow-detail-val">
                {request.constituency || "—"}, {request.state_name || "—"}
              </span>
            </div>

            <div className="workflow-detail-item">
              <span className="workflow-detail-label">Sanction Amount</span>
              <span className="workflow-detail-val" style={{ color: "#059669" }}>
                {formatCrores(request.sanction_amount)}
              </span>
            </div>

            <div className="workflow-detail-item">
              <span className="workflow-detail-label">Raised By</span>
              <span className="workflow-detail-val">
                {request.raised_by_role} ({request.raised_by_identity || "Requester"})
              </span>
            </div>

            <div className="workflow-detail-item">
              <span className="workflow-detail-label">Target Queue</span>
              <span className="workflow-detail-val">{request.target_department}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="workflow-detail-label">Work Description & Context</span>
            <div
              style={{
                fontSize: "13px",
                color: "#1e293b",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
                padding: "8px 12px",
                marginTop: "4px",
              }}
            >
              {request.work_title}
            </div>
          </div>

          <div>
            <span className="workflow-detail-label">Request Details</span>
            <div
              style={{
                fontSize: "13px",
                color: "#334155",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                padding: "10px 12px",
                marginTop: "4px",
                lineHeight: "1.5",
              }}
            >
              {request.description || "No additional description provided."}
            </div>
          </div>

          {/* Audit Timeline */}
          <div>
            <span className="workflow-detail-label" style={{ marginBottom: "8px", display: "block" }}>
              Official Audit Timeline & Progression History
            </span>
            <div className="workflow-timeline">
              {(request.timeline || []).map((node, i) => (
                <div key={i} className="workflow-timeline-node">
                  <div className="workflow-timeline-header">
                    <RequestStatusBadge status={node.status} />
                    <span className="workflow-timeline-actor">{node.actor || node.role}</span>
                    <span className="workflow-timeline-time">{node.timestamp}</span>
                  </div>
                  {node.note && (
                    <div className="workflow-timeline-note">{node.note}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Note Input (If Authorized) */}
          {isAuthorizedToAct && request.status !== "RESOLVED" && request.status !== "REJECTED" && (
            <div style={{ marginTop: "4px" }}>
              <span className="workflow-detail-label">Administrative Action Note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter official action note, field inspection instruction, or resolution remarks..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  marginTop: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="workflow-modal-footer">
          <div>
            <button
              type="button"
              className="workflow-btn workflow-btn-outline"
              onClick={handleOpenWorkClick}
            >
              <ExternalLink size={13} />
              <span>Inspect Canonical Work Dossier</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {isAuthorizedToAct && request.status !== "RESOLVED" && request.status !== "REJECTED" && (
              <>
                {request.status === "SUBMITTED" && (
                  <button
                    type="button"
                    className="workflow-btn workflow-btn-outline"
                    disabled={submitting}
                    onClick={() => handleAction("UNDER_REVIEW", "Acknowledged and taken up for official scrutiny.")}
                  >
                    <Clock size={13} />
                    <span>Mark Under Review</span>
                  </button>
                )}

                {request.status !== "ACTION_TAKEN" && (
                  <button
                    type="button"
                    className="workflow-btn workflow-btn-outline"
                    disabled={submitting}
                    onClick={() => handleAction("ACTION_TAKEN", "Executive action directive issued.")}
                  >
                    <Send size={13} />
                    <span>Record Action Taken</span>
                  </button>
                )}

                <button
                  type="button"
                  className="workflow-btn workflow-btn-primary"
                  disabled={submitting}
                  onClick={() => handleAction("RESOLVED", "Issue verified and formally closed.")}
                >
                  <CheckCircle2 size={13} />
                  <span>Mark Resolved</span>
                </button>

                <button
                  type="button"
                  className="workflow-btn workflow-btn-outline"
                  style={{ color: "#b91c1c", borderColor: "#fecaca" }}
                  disabled={submitting}
                  onClick={() => handleAction("REJECTED", "Request rejected after review.")}
                >
                  <AlertTriangle size={13} />
                  <span>Reject</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="workflow-btn workflow-btn-outline"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
