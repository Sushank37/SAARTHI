import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ExternalLink,
  Plus,
} from "lucide-react";
import {
  createConcern,
  getWorkConcerns,
  submitConcernResponse,
  CONCERN_CATEGORIES,
  CONCERN_PRIORITIES,
  CONCERN_STATUS_META,
} from "../../services/concernService";
import "./WorkConcernSection.css";

export default function WorkConcernSection({
  work,
  activeAuthority = "MP",
  currentMPName = "",
}) {
  const workId = work ? String(work.WORK_ID || work.WORK_RECOMMENDATION_DTL_ID || "").replace(/\.0$/, "") : "";
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState("Work Progress Issue");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestedAction, setRequestedAction] = useState("Immediate Site Inspection");
  const [priority, setPriority] = useState("MEDIUM");
  const [evidenceAttachment, setEvidenceAttachment] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Response form inside card
  const [respondingConcernId, setRespondingConcernId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [responseSubmitting, setResponseSubmitting] = useState(false);

  const loadConcerns = async () => {
    if (!workId) return;
    setLoading(true);
    try {
      const data = await getWorkConcerns(workId);
      setConcerns(data.concerns || []);
    } catch (err) {
      console.error("Failed to fetch concerns for work:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConcerns();
  }, [workId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please provide a concise concern title.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please provide a detailed description of the issue.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await createConcern({
        work_id: workId,
        raised_by_role: activeAuthority || "MP",
        mp_name: currentMPName || work?.MP_NAME || "Hon'ble MP",
        category,
        title: title.trim(),
        description: description.trim(),
        requested_action: requestedAction,
        priority,
        evidence_attachment: evidenceAttachment.trim() || undefined,
        due_at: dueAt || undefined,
      });

      setSuccessMsg(`Concern registered under ${res.concern_id} and dispatched to District Collectorate.`);
      setTitle("");
      setDescription("");
      setEvidenceAttachment("");
      setDueAt("");
      setFormOpen(false);
      await loadConcerns();
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (err) {
      console.error("Submission failed:", err);
      setErrorMsg(err.message || "Failed to submit concern to database.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResponse = async (concernId) => {
    if (!responseText.trim()) return;
    setResponseSubmitting(true);
    try {
      await submitConcernResponse(concernId, {
        role: activeAuthority || "MP",
        response_text: responseText.trim(),
        response_type: "CLARIFICATION",
        responder_user_id: currentMPName || `${activeAuthority} User`,
      });
      setResponseText("");
      setRespondingConcernId(null);
      await loadConcerns();
    } catch (err) {
      console.error("Failed to submit response:", err);
    } finally {
      setResponseSubmitting(false);
    }
  };

  return (
    <div className="work-concern-container">
      {/* Section Header Strip */}
      <div className="work-concern-header-strip">
        <div className="work-concern-header-title">
          <AlertTriangle size={17} color="#dc2626" />
          <span>Work Concerns & Accountability Workflow ({concerns.length})</span>
        </div>
        <button
          type="button"
          className="gov-redirect-link-btn"
          onClick={() => setFormOpen(!formOpen)}
          style={{
            background: formOpen ? "#f1f5f9" : "#005A9C",
            color: formOpen ? "#0f172a" : "#ffffff",
            borderColor: formOpen ? "#cbd5e1" : "#005A9C",
            cursor: "pointer",
          }}
        >
          {formOpen ? (
            <>
              <ChevronUp size={13} />
              <span>Hide Concern Form</span>
            </>
          ) : (
            <>
              <Plus size={13} />
              <span>Raise Concern / Request Action</span>
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "12.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} color="#16a34a" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Raise Concern Form (collapsible) */}
      {formOpen && (
        <div className="work-concern-raise-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                Formal Concern & Action Request
              </h4>
              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#64748b" }}>
                Filed against Canonical Record: <strong>Work #{workId}</strong> · Jurisdiction:{" "}
                <strong>{work?.CONSTITUENCY || "Constituency"}</strong>
              </p>
            </div>
            <span className="gov-parliament-badge" style={{ alignSelf: "flex-start" }}>
              {activeAuthority} Submittal
            </span>
          </div>

          {errorMsg && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                marginBottom: "12px",
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="work-concern-form">
            <div className="work-concern-form-row">
              <div className="work-concern-field">
                <label>Concern Category *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CONCERN_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="work-concern-field">
                <label>Requested Authority Action *</label>
                <select value={requestedAction} onChange={(e) => setRequestedAction(e.target.value)}>
                  <option value="Immediate Site Inspection">Immediate Site Inspection</option>
                  <option value="Explanation from District Authority">Explanation from District Authority</option>
                  <option value="Show-Cause Notice to Implementing Agency">Show-Cause Notice to Implementing Agency</option>
                  <option value="Audit by Technical Committee">Audit by Technical Committee</option>
                  <option value="Stop Fund Disbursement">Stop Fund Disbursement</option>
                  <option value="Expedited Sanction Approval">Expedited Sanction Approval</option>
                  <option value="Rectification of Defect">Rectification of Defect</option>
                  <option value="Other Specific Action">Other Specific Action</option>
                </select>
              </div>
            </div>

            <div className="work-concern-field">
              <label>Concern Title *</label>
              <input
                type="text"
                placeholder="e.g. Unsanctioned delay in CC road execution beyond 45-day statutory limit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="work-concern-field">
              <label>Detailed Description & Factual Grounds *</label>
              <textarea
                rows={3}
                placeholder="Provide complete details including on-ground observation, contractor inaction, or statutory breach..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="work-concern-form-row">
              <div className="work-concern-field">
                <label>Priority Level</label>
                <div className="work-concern-priority-group">
                  {CONCERN_PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`work-concern-priority-btn ${
                        priority === p ? `selected-${p.toLowerCase()}` : ""
                      }`}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="work-concern-field">
                <label>Requested Response Date (Optional)</label>
                <input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
            </div>

            <div className="work-concern-field">
              <label>Supporting Evidence / Reference Document URL (Optional)</label>
              <input
                type="text"
                placeholder="e.g. https://esakshi.gov.in/docs/site-inspection-2026.pdf"
                value={evidenceAttachment}
                onChange={(e) => setEvidenceAttachment(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                className="gov-redirect-link-btn"
                onClick={() => setFormOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="work-concern-submit-btn"
                disabled={submitting}
              >
                <Send size={13} />
                <span>{submitting ? "Submitting to Database..." : "Register Concern with District Authority"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Concerns History List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading ? (
          <div style={{ fontSize: "12px", color: "#64748b", padding: "10px 0" }}>
            Querying SQLite database for registered concerns...
          </div>
        ) : concerns.length === 0 ? (
          <div
            style={{
              padding: "16px",
              background: "#ffffff",
              border: "1px dashed #cbd5e1",
              borderRadius: "6px",
              textAlign: "center",
              fontSize: "12.5px",
              color: "#64748b",
            }}
          >
            No formal concerns or action notices currently logged for Work #{workId}.
          </div>
        ) : (
          concerns.map((c) => {
            const meta = CONCERN_STATUS_META[c.status] || CONCERN_STATUS_META.RAISED;
            const hasActions = c.actions && c.actions.length > 0;
            const hasResponses = c.responses && c.responses.length > 0;

            return (
              <div key={c.concern_id} className="work-concern-item-card">
                <div className="work-concern-item-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="work-concern-item-id">{c.concern_id}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: meta.color,
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                        padding: "2px 7px",
                        borderRadius: "4px",
                      }}
                    >
                      {meta.label}
                    </span>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: c.priority === "CRITICAL" ? "#b91c1c" : c.priority === "HIGH" ? "#c2410c" : "#475569",
                        background: c.priority === "CRITICAL" ? "#fef2f2" : "#f8fafc",
                        border: "1px solid #cbd5e1",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {c.priority} PRIORITY
                    </span>
                  </div>

                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Raised: {new Date(c.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>

                <div className="work-concern-item-title">{c.title}</div>
                <div className="work-concern-item-desc">{c.description}</div>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "11.5px", color: "#475569" }}>
                  <span>
                    <strong>Category:</strong> {c.category}
                  </span>
                  <span>
                    <strong>Requested Action:</strong> {c.requested_action || "Standard Scrutiny"}
                  </span>
                  {c.assigned_officer && (
                    <span>
                      <strong>Assigned IA:</strong> {c.assigned_officer}
                    </span>
                  )}
                </div>

                {/* DA Actions Logged */}
                {hasActions && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "5px", padding: "8px 12px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", marginBottom: "4px" }}>
                      DISTRICT AUTHORITY ACTION & RESOLUTION
                    </div>
                    {c.actions.map((act, idx) => (
                      <div key={idx} style={{ fontSize: "12px", color: "#14532d", marginBottom: "4px" }}>
                        • <strong>{act.action_type.replace(/_/g, " ")}:</strong> {act.action_description}
                        {act.evidence_url && (
                          <a
                            href={act.evidence_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginLeft: "8px", color: "#005A9C", textDecoration: "underline" }}
                          >
                            [View Evidence]
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Responses Thread */}
                {hasResponses && (
                  <div className="work-concern-thread">
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                      STAKEHOLDER COMMUNICATION & CLARIFICATIONS
                    </div>
                    {c.responses.map((resp, idx) => (
                      <div key={idx} className="work-concern-thread-item">
                        <div className="work-concern-thread-header">
                          <span>{resp.responder_role} ({resp.responder_user_id || "Officer"})</span>
                          <span>{new Date(resp.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div>{resp.response_text}</div>
                        {resp.evidence_url && (
                          <div style={{ marginTop: "4px" }}>
                            <a href={resp.evidence_url} target="_blank" rel="noreferrer" style={{ color: "#005A9C" }}>
                              Attached Evidence Link ↗
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply / Clarification input */}
                {respondingConcernId === c.concern_id ? (
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <textarea
                      rows={2}
                      placeholder={`Provide reply or clarification as ${activeAuthority}...`}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      style={{
                        padding: "8px",
                        fontSize: "12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                      <button
                        type="button"
                        className="gov-redirect-link-btn"
                        onClick={() => {
                          setRespondingConcernId(null);
                          setResponseText("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="work-concern-submit-btn"
                        style={{ padding: "5px 12px", fontSize: "12px" }}
                        disabled={responseSubmitting || !responseText.trim()}
                        onClick={() => handleSendResponse(c.concern_id)}
                      >
                        {responseSubmitting ? "Sending..." : "Submit Reply"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <button
                      type="button"
                      className="gov-redirect-link-btn"
                      style={{ fontSize: "11.5px", cursor: "pointer" }}
                      onClick={() => setRespondingConcernId(c.concern_id)}
                    >
                      <MessageSquare size={12} />
                      <span>Reply / Provide Clarification</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
