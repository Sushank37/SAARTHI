import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  ExternalLink,
  Eye,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import ConcernStatusBadge from "./ConcernStatusBadge";
import RequestPriorityBadge from "./RequestPriorityBadge";
import { exportToCSV } from "../../constants";
import "./ConcernListTable.css";

export default function ConcernListTable({
  concerns = [],
  loading = false,
  title = "Work Concerns & Action Records",
  subtitle = "Official cross-stakeholder tracking register",
  role = "DISTRICT_AUTHORITY",
  onSelectConcern,
  onOpenWork,
  emptyMessage = "No concerns currently recorded.",
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredConcerns = useMemo(() => {
    let list = concerns || [];

    if (statusFilter !== "ALL") {
      if (statusFilter === "OPEN") {
        list = list.filter((c) => !["RESOLVED", "CLOSED"].includes((c.status || "").toUpperCase()));
      } else if (statusFilter === "RESOLVED") {
        list = list.filter((c) => ["RESOLVED", "CLOSED"].includes((c.status || "").toUpperCase()));
      } else {
        list = list.filter((c) => (c.status || "").toUpperCase() === statusFilter);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          String(c.concern_id || "").toLowerCase().includes(q) ||
          String(c.work_id || "").toLowerCase().includes(q) ||
          String(c.title || "").toLowerCase().includes(q) ||
          String(c.mp_name || "").toLowerCase().includes(q) ||
          String(c.category || "").toLowerCase().includes(q) ||
          String(c.assigned_to || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [concerns, statusFilter, search]);

  const handleExport = () => {
    if (!filteredConcerns.length) return;
    const exportData = filteredConcerns.map((c) => ({
      "Concern ID": c.concern_id,
      "Work ID": c.work_id,
      "Title": c.title,
      "Category": c.category,
      "Priority": c.priority,
      "Status": c.status,
      "MP Name": c.mp_name,
      "State": c.state,
      "District": c.district,
      "Assigned IA": c.assigned_to || c.ida_name || "",
      "Target Resolution": c.target_resolution_date || "",
      "Created At": c.created_at || "",
    }));
    exportToCSV(exportData, `work_concerns_${role.toLowerCase()}_${new Date().toISOString().split("T")[0]}`);
  };

  const counts = useMemo(() => {
    const all = (concerns || []).length;
    const open = (concerns || []).filter((c) => !["RESOLVED", "CLOSED"].includes((c.status || "").toUpperCase())).length;
    const resolved = (concerns || []).filter((c) => ["RESOLVED", "CLOSED"].includes((c.status || "").toUpperCase())).length;
    return { all, open, resolved };
  }, [concerns]);

  return (
    <div className="concern-table-card">
      {/* Header Strip */}
      <div className="concern-table-header-strip">
        <div>
          <div className="concern-table-title">{title}</div>
          <div className="concern-table-subtitle">
            {subtitle} · <strong style={{ color: "#005a9c" }}>{filteredConcerns.length} Concerns</strong>
          </div>
        </div>

        <button
          type="button"
          className="concern-btn concern-btn-outline"
          onClick={handleExport}
          disabled={!filteredConcerns.length}
        >
          <Download size={13} />
          <span>Export Register (CSV)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="concern-filter-strip">
        <div className="concern-search-box">
          <Search size={13} color="#64748b" />
          <input
            type="text"
            placeholder="Search Concern ID, Work ID, title, or agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="concern-status-pills">
          <button
            type="button"
            className={`concern-status-pill-btn ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            <span>All</span>
            <span className="concern-pill-count">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`concern-status-pill-btn ${statusFilter === "OPEN" ? "active" : ""}`}
            onClick={() => setStatusFilter("OPEN")}
          >
            <span>Active / Open</span>
            <span className="concern-pill-count">{counts.open}</span>
          </button>
          <button
            type="button"
            className={`concern-status-pill-btn ${statusFilter === "RESOLVED" ? "active" : ""}`}
            onClick={() => setStatusFilter("RESOLVED")}
          >
            <span>Resolved</span>
            <span className="concern-pill-count">{counts.resolved}</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="concern-table-responsive">
        <table className="concern-data-table">
          <thead>
            <tr>
              <th style={{ width: "115px" }}>CONCERN ID</th>
              <th style={{ width: "105px" }}>WORK ID</th>
              <th>SUBJECT & CONCERN SCOPE</th>
              <th style={{ width: "95px" }}>PRIORITY</th>
              <th style={{ width: "135px" }}>STATUS</th>
              <th style={{ width: "160px" }}>AUTHORITIES</th>
              <th style={{ width: "105px" }}>DATE RAISED</th>
              <th style={{ width: "100px", textAlign: "center" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                  <Clock size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  <div>Loading live concern ledger records...</div>
                </td>
              </tr>
            ) : filteredConcerns.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                  <AlertCircle size={20} style={{ margin: "0 auto 8px", color: "#94a3b8" }} />
                  <div>{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              filteredConcerns.map((c) => (
                <tr key={c.concern_id}>
                  <td>
                    <span
                      className="concern-id-cell"
                      onClick={() => onSelectConcern && onSelectConcern(c.concern_id)}
                      title="Click to view details & audit timeline"
                    >
                      {c.concern_id}
                    </span>
                  </td>

                  <td>
                    <span
                      className="concern-work-badge"
                      onClick={() => onOpenWork && onOpenWork(c.work_id)}
                      title="Inspect Official Work Dossier"
                    >
                      #{c.work_id} <ExternalLink size={10} />
                    </span>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>
                      {c.title}
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          background: "#e2e8f0",
                          color: "#334155",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          textTransform: "uppercase",
                        }}
                      >
                        {c.category}
                      </span>
                      {c.requested_action && (
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          Action: {c.requested_action}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <RequestPriorityBadge priority={c.priority} />
                  </td>

                  <td>
                    <ConcernStatusBadge status={c.status} />
                  </td>

                  <td>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
                      MP: {c.mp_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      IA: {c.assigned_to || c.ida_name || "Pending Assignment"}
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: "12px", color: "#334155" }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                    </span>
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="concern-btn concern-btn-outline"
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                      onClick={() => onSelectConcern && onSelectConcern(c.concern_id)}
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
