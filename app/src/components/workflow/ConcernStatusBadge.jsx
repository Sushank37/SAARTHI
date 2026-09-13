import React from "react";

const STATUS_CONFIG = {
  SUBMITTED: { label: "Submitted", bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  RECEIVED: { label: "DA Received", bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  UNDER_REVIEW: { label: "Under Review", bg: "#e0e7ff", color: "#3730a3", border: "#c7d2fe" },
  ACTION_ASSIGNED: { label: "Action Assigned to IA", bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff" },
  ACTION_IN_PROGRESS: { label: "Action In Progress", bg: "#cffafe", color: "#155e75", border: "#a5f3fc" },
  CLARIFICATION_REQUESTED: { label: "Clarification Needed", bg: "#ffedd5", color: "#9a3412", border: "#fed7aa" },
  EVIDENCE_SUBMITTED: { label: "Evidence Submitted", bg: "#ccfbf1", color: "#115e59", border: "#99f6e4" },
  ACTION_TAKEN: { label: "Action Taken", bg: "#ecfccb", color: "#3f6212", border: "#d9f99d" },
  RESOLVED: { label: "Resolved ✓", bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  REOPENED: { label: "Reopened ⚠️", bg: "#ffe4e6", color: "#9f1239", border: "#fecdd3" },
  CLOSED: { label: "Closed", bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
};

export default function ConcernStatusBadge({ status }) {
  const norm = (status || "SUBMITTED").toUpperCase();
  const cfg = STATUS_CONFIG[norm] || { label: norm, bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.3px",
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: cfg.color,
        }}
      />
      {cfg.label}
    </span>
  );
}
