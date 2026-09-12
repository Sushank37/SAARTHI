import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck,
  Send,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import ConcernStatusBadge from "./ConcernStatusBadge";
import RequestPriorityBadge from "./RequestPriorityBadge";
import {
  getConcernById,
  getConcernTimeline,
  updateConcernStatus,
  recordConcernAction,
  submitConcernResponse,
} from "../../services/concernService";
import "./ConcernDetailModal.css";

export default function ConcernDetailModal({
  concernId,
  currentRole = "DISTRICT_AUTHORITY",
  currentUser = "Official",
  onClose,
  onActionComplete,
  onOpenWork,
}) {
  const [concern, setConcern] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for role actions
  const [actionType, setActionType] = useState("");
  const [notes, setNotes] = useState("");
  const [assignee, setAssignee] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const loadData = async () => {
    if (!concernId) return;
    setLoading(true);
    setError(null);
    try {
      const [cData, tData] = await Promise.all([
        getConcernById(concernId),
        getConcernTimeline(concernId),
      ]);
      setConcern(cData);
      setTimeline(tData.timeline || []);
      if (cData?.assigned_to) {
        setAssignee(cData.assigned_to);
      }
    } catch (err) {
      console.error("Failed to load concern details:", err);
      setError("Unable to load concern details from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [concernId]);

  // Handler for District Authority Actions
  const handleDAAction = async (type) => {
    setSubmitting(true);
    setActionSuccess("");
    try {
      if (type === "ACKNOWLEDGE") {
        await updateConcernStatus(concernId, {
          status: "RECEIVED",
          actor_role: "DISTRICT_AUTHORITY",
          actor_id: currentUser,
          notes: "District Collectorate acknowledged receipt of Parliamentary Concern.",
        });
      } else if (type === "ASSIGN_IA") {
        if (!assignee) {
          alert("Please select or enter the Implementing Agency name.");
          setSubmitting(false);
          return;
        }
        await recordConcernAction(concernId, {
          action_type: "DIRECTIVE_TO_AGENCY",
          action_description: notes || "Assigned by District Authority for immediate ground verification and execution compliance.",
          directed_to: assignee,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          actor_role: "DISTRICT_AUTHORITY",
          actor_id: currentUser,
        });
      } else if (type === "REQUEST_CLARIFICATION") {
        if (!notes) {
          alert("Please enter the clarification requested from Hon'ble MP.");
          setSubmitting(false);
          return;
        }
        await updateConcernStatus(concernId, {
          status: "CLARIFICATION_REQUESTED",
          actor_role: "DISTRICT_AUTHORITY",
          actor_id: currentUser,
          notes: notes,
        });
      } else if (type === "RECORD_ACTION") {
        if (!notes) {
          alert("Please enter details of the action taken.");
          setSubmitting(false);
          return;
        }
        await recordConcernAction(concernId, {
          action_type: "INSPECTION_ORDERED",
          action_description: notes,
          directed_to: concern.assigned_to || concern.ida_name || "Agency",
          actor_role: "DISTRICT_AUTHORITY",
          actor_id: currentUser,
        });
      } else if (type === "RESOLVE") {
        if (!notes) {
          alert("Please summarize resolution grounds before closing concern.");
          setSubmitting(false);
          return;
        }
        await updateConcernStatus(concernId, {
          status: "RESOLVED",
          actor_role: "DISTRICT_AUTHORITY",
          actor_id: currentUser,
          notes: notes,
        });
      } else if (type === "REOPEN") {
        await updateConcernStatus(concernId, {
          status: "REOPENED",
          actor_role: "DISTRICT_AUTHORITY",
          actor_id: currentUser,
          notes: notes || "Reopened for re-investigation.",
        });
      }

      setActionSuccess("Action successfully recorded in official audit ledger!");
      setNotes("");
      setActionType("");
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error("Action failed:", err);
      alert(`Action recording failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for Implementing Agency Responses
  const handleIAResponse = async (responseType) => {
    setSubmitting(true);
    setActionSuccess("");
    try {
      if (responseType === "ACKNOWLEDGE_TASK") {
        await submitConcernResponse(concernId, {
          response_type: "EXPLANATION",
          response_text: "Implementing Agency acknowledges assigned directive. Action initiated.",
          actor_role: "IMPLEMENTING_AGENCY",
          actor_id: currentUser,
        });
      } else if (responseType === "SUBMIT_PROGRESS") {
        if (!notes) {
          alert("Please enter progress / explanation details.");
          setSubmitting(false);
          return;
        }
        await submitConcernResponse(concernId, {
          response_type: "PROGRESS_REPORT",
          response_text: notes,
          evidence_url: evidenceUrl || null,
          actor_role: "IMPLEMENTING_AGENCY",
          actor_id: currentUser,
        });
      } else if (responseType === "SUBMIT_EVIDENCE") {
        if (!notes) {
          alert("Please summarize rectification / completion details.");
          setSubmitting(false);
          return;
        }
        await submitConcernResponse(concernId, {
          response_type: "RECTIFICATION_SUBMITTED",
          response_text: notes,
          evidence_url: evidenceUrl || null,
          actor_role: "IMPLEMENTING_AGENCY",
          actor_id: currentUser,
        });
      }

      setActionSuccess("Response submitted to District Collectorate successfully!");
      setNotes("");
      setEvidenceUrl("");
      setActionType("");
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error("IA response failed:", err);
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for MP Response / Reopen
  const handleMPAction = async (type) => {
    setSubmitting(true);
    setActionSuccess("");
    try {
      if (type === "SUBMIT_CLARIFICATION") {
        if (!notes) {
          alert("Please enter your clarification response.");
          setSubmitting(false);
          return;
        }
        await submitConcernResponse(concernId, {
          response_type: "MP_CLARIFICATION",
          response_text: notes,
          actor_role: "MP",
          actor_id: currentUser,
        });
      } else if (type === "REOPEN") {
        await updateConcernStatus(concernId, {
          status: "REOPENED",
          actor_role: "MP",
          actor_id: currentUser,
          notes: notes || "Hon'ble MP requested reinvestigation of unverified completion.",
        });
      }
      setActionSuccess("Updated successfully!");
      setNotes("");
      setActionType("");
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error("MP action failed:", err);
      alert(`Action failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for MoSPI Directive
  const handleMoSPIAction = async () => {
    if (!notes) {
      alert("Please enter central directive details.");
      return;
    }
    setSubmitting(true);
    setActionSuccess("");
    try {
      await recordConcernAction(concernId, {
        action_type: "ESCALATION_TO_MINISTRY",
        action_description: notes,
        directed_to: concern.da_id || "District Authority",
        actor_role: "MOSPI",
        actor_id: currentUser,
      });
      setActionSuccess("MoSPI central surveillance directive logged!");
      setNotes("");
      setActionType("");
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error("MoSPI action failed:", err);
      alert(`Directive failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!concernId) return null;

  return (
    <div className="concern-modal-overlay" onClick={onClose}>
      <div className="concern-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="concern-modal-header">
          <div className="concern-modal-title-wrap">
            <span className="concern-modal-id">{concern?.concern_id || concernId}</span>
            {concern && <ConcernStatusBadge status={concern.status} />}
            {concern && <RequestPriorityBadge priority={concern.priority} />}
            {concern && <span className="concern-modal-category">{concern.category}</span>}
          </div>
          <button type="button" className="concern-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="concern-modal-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <Clock size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
              <div>Loading official work concern records...</div>
            </div>
          ) : error ? (
            <div style={{ padding: "20px", color: "#b91c1c", background: "#fef2f2", borderRadius: "6px" }}>
              {error}
            </div>
          ) : !concern ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
              Concern record not found.
            </div>
          ) : (
            <>
              {/* Feedback Alert */}
              {actionSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "10px 14px", borderRadius: "6px", fontSize: "12.5px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={16} />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="concern-summary-grid">
                <div className="concern-summary-item">
                  <span className="concern-summary-label">Canonical Work ID</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="concern-summary-value" style={{ fontFamily: "monospace", color: "#005a9c" }}>
                      #{concern.work_id}
                    </span>
                    {onOpenWork && (
                      <button
                        type="button"
                        className="concern-btn concern-btn-outline"
                        style={{ padding: "2px 6px", fontSize: "11px" }}
                        onClick={() => {
                          onClose();
                          onOpenWork(concern.work_id);
                        }}
                      >
                        <ExternalLink size={11} /> Dossier
                      </button>
                    )}
                  </div>
                </div>

                <div className="concern-summary-item">
                  <span className="concern-summary-label">Raised By</span>
                  <span className="concern-summary-value">Hon'ble MP {concern.mp_name}</span>
                </div>

                <div className="concern-summary-item">
                  <span className="concern-summary-label">Jurisdiction</span>
                  <span className="concern-summary-value">
                    {concern.constituency ? `${concern.constituency} (${concern.state})` : `${concern.district || "District"}, ${concern.state || "State"}`}
                  </span>
                </div>

                <div className="concern-summary-item">
                  <span className="concern-summary-label">Assigned Agency (IA)</span>
                  <span className="concern-summary-value" style={{ color: concern.assigned_to ? "#059669" : "#64748b" }}>
                    {concern.assigned_to || concern.ida_name || "Unassigned"}
                  </span>
                </div>

                <div className="concern-summary-item">
                  <span className="concern-summary-label">Date Raised</span>
                  <span className="concern-summary-value">
                    {concern.created_at ? new Date(concern.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                  </span>
                </div>

                <div className="concern-summary-item">
                  <span className="concern-summary-label">Target Resolution</span>
                  <span className="concern-summary-value" style={{ color: "#d97706" }}>
                    {concern.target_resolution_date ? new Date(concern.target_resolution_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Within 15 Days"}
                  </span>
                </div>
              </div>

              {/* Concern Content Card */}
              <div className="concern-detail-card">
                <div className="concern-detail-title">{concern.title}</div>
                <div className="concern-detail-desc">{concern.description}</div>

                {concern.requested_action && (
                  <div className="concern-highlight-box">
                    <strong>Requested Action:</strong> {concern.requested_action}
                  </div>
                )}

                {concern.justification && (
                  <div className="concern-highlight-box" style={{ borderLeftColor: "#f59e0b", marginTop: "6px" }}>
                    <strong>Constituency Justification:</strong> {concern.justification}
                  </div>
                )}

                {concern.evidence_attachment && (
                  <div style={{ marginTop: "10px", fontSize: "12px" }}>
                    <span style={{ color: "#64748b" }}>Attached Evidence / Document: </span>
                    <a
                      href={concern.evidence_attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0284c7", fontWeight: 600, textDecoration: "underline" }}
                    >
                      {concern.evidence_attachment}
                    </a>
                  </div>
                )}
              </div>

              {/* Official Action & Response Lifecycle Timeline */}
              <div className="concern-timeline-section">
                <div className="concern-timeline-heading">
                  <span>Official Activity & Audit Timeline ({timeline.length} Events)</span>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748b" }}>Immutable WAL Log</span>
                </div>

                {timeline.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#64748b" }}>No follow-up activity logged yet.</div>
                ) : (
                  <div className="concern-timeline-list">
                    {timeline.map((item, idx) => (
                      <div key={idx} className="concern-timeline-item">
                        <div className="concern-timeline-dot" />
                        <div className="concern-timeline-meta">
                          <span className="concern-timeline-actor">[{item.actor_role}]</span>
                          <span>{item.actor_id || "Official"}</span>
                          <span>•</span>
                          <span>{new Date(item.timestamp).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="concern-timeline-action">
                          {item.event_type} {item.new_status ? `→ ${item.new_status}` : ""}
                        </div>
                        {item.description && (
                          <div className="concern-timeline-desc">{item.description}</div>
                        )}
                        {item.evidence_url && (
                          <div style={{ marginTop: "4px", fontSize: "11.5px" }}>
                            <a href={item.evidence_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0284c7" }}>
                              🔗 View Attachment: {item.evidence_url}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Role-Specific Action Panel */}
              {currentRole === "DISTRICT_AUTHORITY" && (
                <div className="concern-action-box da-theme">
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldAlert size={15} color="#005a9c" />
                    <span>District Magistrate & Collectorate Action Directives</span>
                  </div>

                  {concern.status === "SUBMITTED" && (
                    <div style={{ marginBottom: "10px" }}>
                      <button
                        type="button"
                        className="concern-btn concern-btn-primary"
                        disabled={submitting}
                        onClick={() => handleDAAction("ACKNOWLEDGE")}
                      >
                        <CheckCircle2 size={13} />
                        <span>Acknowledge Receipt & Mark Under Review</span>
                      </button>
                    </div>
                  )}

                  <div className="concern-action-btn-row">
                    <button
                      type="button"
                      className={`concern-btn ${actionType === "ASSIGN_IA" ? "concern-btn-primary" : "concern-btn-outline"}`}
                      onClick={() => setActionType(actionType === "ASSIGN_IA" ? "" : "ASSIGN_IA")}
                    >
                      <Building2 size={13} /> Assign Directive to IA
                    </button>

                    <button
                      type="button"
                      className={`concern-btn ${actionType === "RECORD_ACTION" ? "concern-btn-primary" : "concern-btn-outline"}`}
                      onClick={() => setActionType(actionType === "RECORD_ACTION" ? "" : "RECORD_ACTION")}
                    >
                      <FileCheck size={13} /> Record Action Taken
                    </button>

                    <button
                      type="button"
                      className={`concern-btn ${actionType === "REQUEST_CLARIFICATION" ? "concern-btn-warning" : "concern-btn-outline"}`}
                      onClick={() => setActionType(actionType === "REQUEST_CLARIFICATION" ? "" : "REQUEST_CLARIFICATION")}
                    >
                      <HelpCircle size={13} /> Request Clarification from MP
                    </button>

                    {concern.status !== "RESOLVED" && (
                      <button
                        type="button"
                        className={`concern-btn ${actionType === "RESOLVE" ? "concern-btn-success" : "concern-btn-outline"}`}
                        onClick={() => setActionType(actionType === "RESOLVE" ? "" : "RESOLVE")}
                      >
                        <CheckCircle2 size={13} /> Mark Resolved
                      </button>
                    )}

                    {concern.status === "RESOLVED" && (
                      <button
                        type="button"
                        className="concern-btn concern-btn-danger"
                        disabled={submitting}
                        onClick={() => handleDAAction("REOPEN")}
                      >
                        <RotateCcw size={13} /> Reopen Concern
                      </button>
                    )}
                  </div>

                  {actionType === "ASSIGN_IA" && (
                    <div className="concern-action-form">
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Executing Agency (IA)</label>
                        <input
                          type="text"
                          className="concern-action-input"
                          placeholder="e.g. Executive Engineer PWD / Rural Works"
                          value={assignee}
                          onChange={(e) => setAssignee(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Directive Instructions to IA</label>
                        <textarea
                          rows={2}
                          className="concern-action-textarea"
                          placeholder="Specify exact ground verification or rectification instructions..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="concern-btn concern-btn-primary"
                        disabled={submitting}
                        onClick={() => handleDAAction("ASSIGN_IA")}
                      >
                        <Send size={13} /> Issue Formal Directive to Agency
                      </button>
                    </div>
                  )}

                  {actionType === "RECORD_ACTION" && (
                    <div className="concern-action-form">
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Action Taken Details</label>
                      <textarea
                        rows={3}
                        className="concern-action-textarea"
                        placeholder="Detail site visit conducted, inspection findings, contractor penalties, or timeline revisions..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <button
                        type="button"
                        className="concern-btn concern-btn-primary"
                        disabled={submitting}
                        onClick={() => handleDAAction("RECORD_ACTION")}
                      >
                        <CheckCircle2 size={13} /> Save Action to Record
                      </button>
                    </div>
                  )}

                  {actionType === "REQUEST_CLARIFICATION" && (
                    <div className="concern-action-form">
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Clarification Required from Hon'ble MP</label>
                      <textarea
                        rows={2}
                        className="concern-action-textarea"
                        placeholder="e.g., Please provide GPS coordinates or specific sector milestone details..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <button
                        type="button"
                        className="concern-btn concern-btn-warning"
                        disabled={submitting}
                        onClick={() => handleDAAction("REQUEST_CLARIFICATION")}
                      >
                        <Send size={13} /> Send Clarification Request to MP
                      </button>
                    </div>
                  )}

                  {actionType === "RESOLVE" && (
                    <div className="concern-action-form">
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#166534" }}>Resolution Summary & Ground Compliance Verification</label>
                      <textarea
                        rows={3}
                        className="concern-action-textarea"
                        placeholder="Summarize resolution findings, completion proof, or formal verification..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <button
                        type="button"
                        className="concern-btn concern-btn-success"
                        disabled={submitting}
                        onClick={() => handleDAAction("RESOLVE")}
                      >
                        <CheckCircle2 size={13} /> Mark Concern Fully Resolved
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentRole === "IMPLEMENTING_AGENCY" && (
                <div className="concern-action-box ia-theme">
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Building2 size={15} color="#0284c7" />
                    <span>Implementing Agency Execution & Rectification Response</span>
                  </div>

                  <div className="concern-action-btn-row">
                    <button
                      type="button"
                      className="concern-btn concern-btn-outline"
                      disabled={submitting}
                      onClick={() => handleIAResponse("ACKNOWLEDGE_TASK")}
                    >
                      <Clock size={13} /> Acknowledge Assigned Task
                    </button>

                    <button
                      type="button"
                      className={`concern-btn ${actionType === "IA_PROGRESS" ? "concern-btn-primary" : "concern-btn-outline"}`}
                      onClick={() => setActionType(actionType === "IA_PROGRESS" ? "" : "IA_PROGRESS")}
                    >
                      <Send size={13} /> Submit Progress / Explanation
                    </button>

                    <button
                      type="button"
                      className={`concern-btn ${actionType === "IA_EVIDENCE" ? "concern-btn-success" : "concern-btn-outline"}`}
                      onClick={() => setActionType(actionType === "IA_EVIDENCE" ? "" : "IA_EVIDENCE")}
                    >
                      <CheckCircle2 size={13} /> Submit Rectification & Evidence
                    </button>
                  </div>

                  {actionType === "IA_PROGRESS" && (
                    <div className="concern-action-form">
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Progress Report / Explanation</label>
                      <textarea
                        rows={3}
                        className="concern-action-textarea"
                        placeholder="State physical milestone progress, site constraints, or revised timeline..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <input
                        type="text"
                        className="concern-action-input"
                        placeholder="Optional Evidence/Document URL"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        className="concern-btn concern-btn-primary"
                        disabled={submitting}
                        onClick={() => handleIAResponse("SUBMIT_PROGRESS")}
                      >
                        <Send size={13} /> Submit Progress to Collectorate
                      </button>
                    </div>
                  )}

                  {actionType === "IA_EVIDENCE" && (
                    <div className="concern-action-form">
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#166534" }}>Rectification & Completion Report</label>
                      <textarea
                        rows={3}
                        className="concern-action-textarea"
                        placeholder="Document how the concern was addressed on-site..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <input
                        type="text"
                        className="concern-action-input"
                        placeholder="Geo-tagged photo URL or completion certificate link"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        className="concern-btn concern-btn-success"
                        disabled={submitting}
                        onClick={() => handleIAResponse("SUBMIT_EVIDENCE")}
                      >
                        <CheckCircle2 size={13} /> Submit Rectification & Evidence for DA Scrutiny
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentRole === "MP" && (
                <div className="concern-action-box" style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                    Parliamentary Oversight Follow-Up
                  </div>

                  {concern.status === "CLARIFICATION_REQUESTED" && (
                    <div className="concern-action-form" style={{ marginBottom: "10px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#d97706" }}>
                        DA Clarification Request: Please provide additional details
                      </label>
                      <textarea
                        rows={2}
                        className="concern-action-textarea"
                        placeholder="Enter clarification response for District Authority..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <button
                        type="button"
                        className="concern-btn concern-btn-primary"
                        disabled={submitting}
                        onClick={() => handleMPAction("SUBMIT_CLARIFICATION")}
                      >
                        <Send size={13} /> Submit Clarification Response
                      </button>
                    </div>
                  )}

                  {concern.status === "RESOLVED" && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                        This concern has been marked resolved by District Authority.
                      </span>
                      <button
                        type="button"
                        className="concern-btn concern-btn-danger"
                        disabled={submitting}
                        onClick={() => handleMPAction("REOPEN")}
                      >
                        <RotateCcw size={13} /> Reopen if Unsatisfied
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentRole === "MOSPI" && (
                <div className="concern-action-box mospi-theme">
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldAlert size={15} color="#b45309" />
                    <span>MoSPI Central Surveillance Directive / Ministerial Escalation</span>
                  </div>
                  <div className="concern-action-form">
                    <textarea
                      rows={2}
                      className="concern-action-textarea"
                      placeholder="Issue high-level central notice to District Magistrate under MPLADS Revised 2023 Guidelines..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <button
                      type="button"
                      className="concern-btn concern-btn-warning"
                      disabled={submitting}
                      onClick={handleMoSPIAction}
                    >
                      <Send size={13} /> Issue National Central Directive
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
