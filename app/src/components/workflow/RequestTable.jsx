import React, { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
} from "lucide-react";
import RequestStatusBadge from "./RequestStatusBadge";
import RequestPriorityBadge from "./RequestPriorityBadge";
import RequestDetailModal from "./RequestDetailModal";
import { useLanguage } from "../../context/LanguageContext";
import "./workflow.css";

export default function RequestTable({
  title = "Workflow Requests Queue",
  subtitle = "Centralized cross-role request tracking register",
  requests = [],
  loading = false,
  currentRole,
  onRefresh,
  onOpenWork,
  onStatusUpdated,
}) {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchId = String(r.request_id || "").toLowerCase().includes(q);
      const matchWork = String(r.work_id || "").toLowerCase().includes(q);
      const matchTitle = String(r.title || "").toLowerCase().includes(q);
      const matchDesc = String(r.description || "").toLowerCase().includes(q);
      const matchActor = String(r.raised_by_identity || "").toLowerCase().includes(q);
      if (!matchId && !matchWork && !matchTitle && !matchDesc && !matchActor) return false;
    }
    return true;
  });

  return (
    <div className="workflow-card">
      {/* Table Header / Toolbar */}
      <div className="workflow-header-row">
        <div className="workflow-title-area">
          <h3>
            <FileText size={16} color="#005A9C" />
            <span>{t(title)}</span>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
              ({filteredRequests.length} {t("of")} {requests.length} {t("records")})
            </span>
          </h3>
          <p className="workflow-subtitle">{t(subtitle)}</p>
        </div>

        <div className="workflow-toolbar">
          <input
            type="text"
            className="workflow-search-input"
            placeholder={t("Search Request ID, Work #, title...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="workflow-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{t("All Statuses")}</option>
            <option value="SUBMITTED">{t("Submitted")}</option>
            <option value="UNDER_REVIEW">{t("Under Review")}</option>
            <option value="ACTION_TAKEN">{t("Action Taken")}</option>
            <option value="RESOLVED">{t("Resolved")}</option>
            <option value="REJECTED">{t("Rejected")}</option>
          </select>

          {onRefresh && (
            <button
              type="button"
              className="workflow-btn workflow-btn-outline"
              onClick={onRefresh}
              disabled={loading}
              title={t("Refresh queue from server")}
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>{t("Refresh")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="workflow-table-wrap">
        <table className="workflow-table">
          <thead>
            <tr>
              <th>{t("Request ID")}</th>
              <th>{t("Work ID")}</th>
              <th>{t("Type")}</th>
              <th>{t("Subject / Title")}</th>
              <th>{t("Raised By")}</th>
              <th>{t("Target Queue")}</th>
              <th>{t("Priority")}</th>
              <th>{t("Status")}</th>
              <th>{t("Created")}</th>
              <th style={{ textAlign: "right" }}>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="workflow-empty">
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                    <RefreshCw size={16} className="animate-spin text-slate-500" />
                    <span>{t("Synchronizing workflow records from server...")}</span>
                  </div>
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={10} className="workflow-empty">
                  <strong>{t("No Requests in Queue")}</strong>
                  <p>{t("There are no active workflow requests matching the current filters.")}</p>
                </td>
              </tr>
            ) : (
              filteredRequests.map((r) => (
                <tr key={r.request_id}>
                  <td>
                    <strong style={{ color: "#0f172a", fontSize: "12px", fontFamily: "monospace" }}>
                      {r.request_id}
                    </strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="workflow-work-link"
                      onClick={() => onOpenWork && onOpenWork(r.work_id)}
                      title={t("Click to inspect work dossier")}
                    >
                      <span>#{r.work_id}</span>
                      <ExternalLink size={11} />
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#334155" }}>
                      {r.request_type_label || r.request_type}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        maxWidth: "220px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                      title={r.title}
                    >
                      {r.title}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "11px", color: "#475569" }}>
                      {t(r.raised_by_role)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "11px", color: "#475569" }} title={r.target_department}>
                      {t(r.target_role)}
                    </span>
                  </td>
                  <td>
                    <RequestPriorityBadge priority={r.priority} />
                  </td>
                  <td>
                    <RequestStatusBadge status={r.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {r.created_at ? r.created_at.slice(0, 10) : "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="workflow-btn workflow-btn-primary workflow-btn-sm"
                      onClick={() => setSelectedRequest(r)}
                    >
                      <Eye size={12} />
                      <span>{t("Inspect / Action")}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Detail / Action Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          currentRole={currentRole}
          onClose={() => setSelectedRequest(null)}
          onOpenWork={(workId) => {
            setSelectedRequest(null);
            if (onOpenWork) onOpenWork(workId);
          }}
          onStatusUpdated={(updated) => {
            setSelectedRequest(null);
            if (onStatusUpdated) onStatusUpdated(updated);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
