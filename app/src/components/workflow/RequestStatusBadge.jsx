import "./workflow.css";

export default function RequestStatusBadge({ status }) {
  const norm = String(status || "SUBMITTED").toUpperCase();

  const labels = {
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    ACTION_TAKEN: "Action Taken",
    RESOLVED: "Resolved",
    REJECTED: "Rejected",
  };

  const cssClass = `workflow-status-${norm.toLowerCase()}`;

  return (
    <span className={`workflow-status-badge ${cssClass}`}>
      {labels[norm] || norm}
    </span>
  );
}
