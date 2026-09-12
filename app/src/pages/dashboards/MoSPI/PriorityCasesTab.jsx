import { useState, useEffect } from "react";
import {
  Search,
  Download,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_BASE, formatNumber, exportToCSV } from "../../../constants";
import { getRequests } from "../../../services/workflowService";
import RequestTable from "../../../components/workflow/RequestTable";

export default function PriorityCasesTab({ onSelectWork }) {
  const [cases, setCases] = useState([]);
  const [totalCases, setTotalCases] = useState(0);
  const [loading, setLoading] = useState(true);

  // MoSPI National Escalations state
  const [nationalEscalations, setNationalEscalations] = useState([]);
  const [escalationsLoading, setEscalationsLoading] = useState(false);

  const fetchEscalations = async () => {
    setEscalationsLoading(true);
    try {
      const data = await getRequests({ targetRole: "MOSPI" });
      setNationalEscalations(data.requests || []);
    } catch (err) {
      console.error("Failed to load national escalations:", err);
    } finally {
      setEscalationsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitialEscalations() {
      setEscalationsLoading(true);
      try {
        const data = await getRequests({ targetRole: "MOSPI" });
        if (isMounted) setNationalEscalations(data.requests || []);
      } catch (err) {
        console.error("Failed to load initial escalations:", err);
      } finally {
        if (isMounted) setEscalationsLoading(false);
      }
    }
    loadInitialEscalations();
    return () => { isMounted = false; };
  }, []);

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  }, [page, limit, debouncedSearch, selectedRisk]);

  const totalPages = Math.ceil(totalCases / limit) || 1;

  const handleExport = () => {
    if (!cases || cases.length === 0) return;
    exportToCSV(cases, `MoSPI_Priority_Cases_${Date.now()}.csv`);
  };

  return (
    <div className="mospi-panel">
      {/* Centralized National Administrative Escalations Queue */}
      <div style={{ marginBottom: "10px" }}>
        <RequestTable
          title="MoSPI Central National Escalations Queue"
          subtitle="Direct escalation referrals and inter-state disputes transmitted by District Collectors to Central Nodal Ministry"
          requests={nationalEscalations}
          loading={escalationsLoading}
          currentRole="MOSPI"
          onRefresh={fetchEscalations}
          onOpenWork={async (workId) => {
            try {
              const res = await fetch(`${API_BASE}/api/works/${workId}`);
              if (res.ok) {
                const wData = await res.json();
                if (onSelectWork) onSelectWork(wData, "actions");
              } else {
                alert(`Work #${workId} could not be retrieved from registry.`);
              }
            } catch (e) {
              console.error(e);
            }
          }}
          onStatusUpdated={() => fetchEscalations()}
        />
      </div>

      <div className="mospi-card">
        {/* Table Toolbar */}
        <div className="mospi-table-toolbar">
          <div>
            <h3 className="mospi-card-title">National Priority Review Queue</h3>
            <p className="mospi-card-subtitle">
              Prioritized case list of {formatNumber(totalCases)} works requiring verification due to duplicate cluster linkage or audit risk triggers
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div className="mospi-search-box">
              <Search size={13} color="#64748b" />
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

            <button type="button" className="mospi-redirect-link-btn" onClick={handleExport} title="Export current review queue">
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Priority Works Table */}
        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Work ID</th>
                <th>State</th>
                <th>Implementing Authority</th>
                <th>Work Stage</th>
                <th style={{ textAlign: "right" }}>Sanction Amount</th>
                <th style={{ textAlign: "center" }}>Risk Level</th>
                <th>Reason for Review</th>
                <th style={{ textAlign: "center", width: "145px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>
                    <div className="spinner" />
                    <p style={{ color: "#64748b", marginTop: "6px", fontSize: "12px" }}>Loading priority review works...</p>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No priority works match your filter criteria.
                  </td>
                </tr>
              ) : (
                cases.map((w) => {
                  const workId = w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID;
                  return (
                    <tr key={workId}>
                      <td style={{ fontWeight: 700, color: "#005A9C" }}>
                        #{workId}
                      </td>
                      <td style={{ fontWeight: 600 }}>{w.STATE_NAME || "N/A"}</td>
                      <td style={{ maxWidth: "200px", fontSize: "11px", color: "#475569" }}>
                        {w.IDA_NAME || "N/A"}
                      </td>
                      <td>
                        <span className="mospi-pill blue">{w.WORK_STAGE || "Sanction"}</span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        ₹ {formatNumber(w.SANCTION_AMOUNT || 0)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`mospi-pill ${w.RISK_LEVEL === "HIGH" ? "rose" : w.RISK_LEVEL === "MEDIUM" ? "amber" : "neutral"}`}>
                          {w.RISK_LEVEL || "LOW"}
                        </span>
                      </td>
                      <td style={{ maxWidth: "260px", fontSize: "11px", color: "#64748b" }}>
                        {w.REVIEW_REASON || "Flagged for administrative verification"}
                      </td>
                      <td style={{ textAlign: "center" }}>
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
                          <AlertOctagon size={11} />
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
              <ChevronLeft size={12} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="mospi-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <span>Next</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
