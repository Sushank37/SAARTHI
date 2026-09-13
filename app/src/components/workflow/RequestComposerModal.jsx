import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { createRequest, REQUEST_TYPES, REQUEST_TYPE_LABELS } from "../../services/workflowService";
import "./workflow.css";

export default function RequestComposerModal({
  work,
  currentRole,
  allowedTypes,
  defaultType,
  onClose,
  onRequestCreated,
}) {
  const workId = work ? String(work.WORK_ID || work.WORK_RECOMMENDATION_DTL_ID || "") : "";
  const initialType = defaultType || (allowedTypes && allowedTypes[0]) || "GRIEVANCE";

  const [requestType, setRequestType] = useState(initialType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg("Please provide a description of the request.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        work_id: workId,
        raised_by_role: currentRole,
        request_type: requestType,
        title: title.trim() || REQUEST_TYPE_LABELS[requestType] || "Workflow Request",
        description: description.trim(),
        priority: priority,
      };

      const res = await createRequest(payload);
      if (onRequestCreated) {
        onRequestCreated(res.request);
      }
      onClose();
    } catch (err) {
      console.error("Failed to submit request:", err);
      setErrorMsg(err.message || "Failed to submit request to server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="workflow-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="workflow-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="workflow-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Send size={16} color="#005A9C" />
            <h4>Raise Formal Workflow Request</h4>
          </div>
          <button type="button" className="workflow-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

            {/* Target Work Banner */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "10px 14px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                TARGET CANONICAL WORK
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#005A9C", marginTop: "2px" }}>
                Work #{workId}
              </div>
              <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px" }}>
                {work?.WORK_DESCRIPTION || "MPLADS Development Project"}
              </div>
            </div>

            {/* Request Type */}
            <div>
              <label className="workflow-detail-label">Request Type</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="workflow-select"
                style={{ width: "100%", marginTop: "4px" }}
              >
                {(allowedTypes || Object.keys(REQUEST_TYPES)).map((t) => (
                  <option key={t} value={t}>
                    {REQUEST_TYPE_LABELS[t] || t}
                  </option>
                ))}
              </select>
            </div>

            {/* Title / Subject */}
            <div>
              <label className="workflow-detail-label">Subject / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief subject (e.g. Running Bill Milestone 1, Plastering Quality Issue)"
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

            {/* Priority */}
            <div>
              <label className="workflow-detail-label">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="workflow-select"
                style={{ width: "100%", marginTop: "4px" }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="workflow-detail-label">Detailed Notes & Justification</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                placeholder="Enter detailed facts, measurements, site observations, or administrative references..."
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
          </div>

          <div className="workflow-modal-footer">
            <button type="button" className="workflow-btn workflow-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="workflow-btn workflow-btn-primary"
              disabled={submitting}
            >
              <Send size={13} />
              <span>{submitting ? "Submitting to Backend..." : "Submit Formal Request"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
