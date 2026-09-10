import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  ChevronRight,
  ClipboardCheck,
  AlertTriangle,
  AlertOctagon,
  FileCheck,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores, exportToCSV } from "../../../constants";

export default function PriorityCasesTab({ onSelectWork }) {
  const [cases, setCases] = useState([]);
  const [totalCases, setTotalCases] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedState, setSelectedState] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState("ALL");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load review-cases from backend
  useEffect(() => {
    let isMounted = true;
    async function loadCases() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page);
        params.set("limit", limit);

        if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
        if (selectedState !== "ALL") params.set("state", selectedState);
        if (selectedRisk !== "ALL") params.set("risk_level", selectedRisk);

        const res = await fetch(`${API_BASE}/api/review-cases?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCases(data.data || []);
            setTotalCases(data.total || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load priority review cases:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCases();
    return () => { isMounted = false; };
  }, [page, limit, debouncedSearch, selectedState, selectedRisk]);

  const totalPages = Math.ceil(totalCases / limit) || 1;

  const handleExport = () => {
    if (!cases || cases.length === 0) return;
    exportToCSV(cases, `MoSPI_Priority_Cases_${Date.now()}.csv`);
  };

  return (
    <div className="mospi-panel">
      <div className="mospi-card">
        {/* Table Toolbar */}
        <div className="mospi-table-toolbar">
          <div>
            <h3 className="mospi-card-title">National Priority Review Queue</h3>
            <p className="mospi-card-subtitle">
              Prioritized case list of {formatNumber(totalCases)} works requiring verification due to duplicate cluster linkage or audit risk triggers
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div className="mospi-search-box">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search Work ID or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="mospi-select"
              value={selectedRisk}
              onChange={(e) => { setSelectedRisk(e.target.value); setPage(1); }}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>

            <button type="button" className="mospi-export-btn" onClick={handleExport} title="Export current review queue">
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Priority Works Table */}
        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th>Work ID</th>
                <th>State</th>
                <th>Implementing Authority</th>
                <th>Work Stage</th>
                <th>Sanction Amount</th>
                <th>Risk Level</th>
                <th>Reason for Review</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <div className="spinner" /> Loading priority review works...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    No priority works match your filter criteria.
                  </td>
                </tr>
              ) : (
                cases.map((w) => {
                  const workId = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                  return (
                    <tr key={workId}>
                      <td>
                        <strong className="font-mono text-sky-700">#{workId}</strong>
                      </td>
                      <td>{w.STATE_NAME || "N/A"}</td>
                      <td style={{ maxWidth: "220px", fontSize: "11px", color: "#475569" }}>
                        {w.IDA_NAME || "N/A"}
                      </td>
                      <td>
                        <span className="mospi-pill blue">{w.WORK_STAGE || "Sanction"}</span>
                      </td>
                      <td>
                        <strong>₹ {formatNumber(w.SANCTION_AMOUNT || 0)}</strong>
                      </td>
                      <td>
                        <span className={`mospi-pill ${w.RISK_LEVEL === "HIGH" ? "rose" : w.RISK_LEVEL === "MEDIUM" ? "amber" : "gray"}`}>
                          {w.RISK_LEVEL || "LOW"}
                        </span>
                      </td>
                      <td style={{ maxWidth: "260px", fontSize: "11px", color: "#64748b" }}>
                        {w.REVIEW_REASON || "Flagged for administrative verification"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="mospi-dossier-btn mospi-dossier-vigilance"
                          onClick={() => {
                            if (typeof onSelectWork === "function") {
                              onSelectWork({ ...w, __initialSection: "actions", __authority: "MOSPI" });
                            }
                          }}
                          title="Open Central MoSPI Vigilance Directives Dossier"
                        >
                          <AlertOctagon size={12} />
                          <span>Vigilance Dossier →</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="mospi-pagination-bar">
          <span className="mospi-page-info">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({formatNumber(totalCases)} total cases)
          </span>

          <div className="mospi-page-btn-group">
            <button
              type="button"
              className="mospi-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="mospi-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
