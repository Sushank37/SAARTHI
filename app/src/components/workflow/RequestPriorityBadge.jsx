import "./workflow.css";

export default function RequestPriorityBadge({ priority }) {
  const norm = String(priority || "MEDIUM").toUpperCase();
  const cssClass = `workflow-priority-${norm.toLowerCase()}`;

  return (
    <span className={`workflow-priority-badge ${cssClass}`}>
      {norm}
    </span>
  );
}
