import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Flag,
  MapPin,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores, exportToCSV } from "../../../constants";

export default function CitizenExploreTab({ onSelectWork, onReportWork }) {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("all");
  const [constituencyList, setConstituencyList] = useState([]);
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load constituencies for dropdown
  useEffect(() => {
    async function loadConstituencies() {
      try {
        const res = await fetch(`${API_BASE}/api/constituencies`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setConstituencyList(list);
          }
        }
      } catch (e) {
        console.error("Failed to load constituencies for explore:", e);
      }
    }
    loadConstituencies();
  }, []);

  const fetchWorks = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/api/works?page=${page}&limit=15`;
      if (selectedConstituency && selectedConstituency !== "all") {
        url += `&constituency=${encodeURIComponent(selectedConstituency)}`;
      }
      if (selectedSector !== "all") {
        url += `&category=${encodeURIComponent(selectedSector)}`;
      }
      if (selectedStatus !== "all") {
        url += `&stage=${encodeURIComponent(selectedStatus)}`;
      }
      if (searchQuery.trim()) {
        url += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = data.data || data.works || [];
      setWorks(list);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error("Failed to load public works:", err);
      setError("Unable to load public works records from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, [page, selectedConstituency, selectedSector, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchWorks();
  };

  const handleExportCSV = () => {
    if (works.length > 0) {
      exportToCSV(works, `mplads_public_works_page_${page}.csv`);
    }
  };

  const totalPages = Math.ceil(totalCount / 15) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Search & Filter Header */}
      <div className="gov-mp-card" style={{ padding: "10px 14px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flexGrow: 1, minWidth: "260px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#64748b" }} />
              <input
                type="text"
                className="gov-input citizen-input"
                style={{ paddingLeft: "30px", width: "100%", height: "32px", fontSize: "12px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search works by ID, description, MP, or locality..."
              />
            </div>

            <button
              type="submit"
              className="gov-redirect-link-btn"
              style={{ background: "#005A9C", color: "#ffffff", borderColor: "#005A9C", cursor: "pointer", height: "32px", padding: "0 14px" }}
            >
              <Search size={13} />
              <span>Search Works</span>
            </button>

            <button
              type="button"
              className="gov-redirect-link-btn"
              onClick={handleExportCSV}
              style={{ cursor: "pointer", height: "32px" }}
              disabled={works.length === 0}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Constituency:</span>
              <select
                className="gov-select citizen-select"
                value={selectedConstituency}
                onChange={(e) => {
                  setSelectedConstituency(e.target.value);
                  setPage(1);
                }}
                style={{ width: "auto", height: "32px", fontSize: "12px", color: "#005A9C", fontWeight: "700" }}
              >
                <option value="all">All Parliamentary Constituencies</option>
                {constituencyList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Category:</span>
              <select
                className="gov-select citizen-select"
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setPage(1);
                }}
                style={{ width: "auto", height: "32px", fontSize: "12px" }}
              >
                <option value="all">All Categories</option>
                <option value="Roads and Bridges">Roads and Bridges</option>
                <option value="Drinking Water">Drinking Water Facility</option>
                <option value="Education">Education & Schools</option>
                <option value="Health and Family Welfare">Healthcare & Dispensaries</option>
                <option value="Community Infrastructure">Community Infrastructure</option>
                <option value="Electricity">Rural Electrification</option>
                <option value="Sanitation">Sanitation & Drainage</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Stage:</span>
              <select
                className="gov-select citizen-select"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                style={{ width: "auto", height: "32px", fontSize: "12px" }}
              >
                <option value="all">All Stages</option>
                <option value="Work Completed">Work Completed</option>
                <option value="Physical Inspection">Physical Inspection</option>
                <option value="Sanction">Sanction Approved</option>
                <option value="Work partially Completed">Partially Completed</option>
                <option value="Vendor Identification">Vendor Identification</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results Table Card */}
      <div className="gov-mp-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Building2 size={15} color="#005A9C" />
              <span>Public Works Registry</span>
            </div>
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>
              Total <strong style={{ color: "#0f172a" }}>{formatNumber(totalCount)}</strong> works matching chosen criteria
            </span>
          </div>
          <span style={{ fontSize: "11.5px", color: "#64748b" }}>
            Page {page} of {totalPages}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="gov-mp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Work ID & Sector</th>
                <th style={{ textAlign: "left" }}>Public Description & Locality</th>
                <th style={{ textAlign: "left" }}>Hon'ble MP</th>
                <th style={{ textAlign: "right" }}>Sanctioned</th>
                <th style={{ textAlign: "right" }}>Disbursed</th>
                <th style={{ textAlign: "center" }}>Execution Stage</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "13px" }}>
                    <RefreshCw size={16} className="spin-icon" style={{ display: "inline-block", marginRight: "6px" }} />
                    Loading official records from dataset...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#b91c1c" }}>
                    <AlertTriangle size={16} style={{ display: "inline-block", marginRight: "6px" }} />
                    {error}
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No works found matching the chosen search and filter criteria.
                  </td>
                </tr>
              ) : (
                works.map((w) => {
                  const stageStr = (w.WORK_STAGE || w.WORK_STATUS || "Sanction").toString();
                  const isCompleted = stageStr.toLowerCase().includes("completed");
                  const isInspection = stageStr.toLowerCase().includes("inspection");

                  const wid = w.WORK_ID || w.WORK_RECOMMENDATION_DTL_ID;
                  const sanc = Number(w.SANCTION_AMOUNT || 0);
                  const exp = Number(w.ACTUAL_AMOUNT || 0);

                  return (
                    <tr key={wid}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <strong style={{ fontFamily: "monospace", fontSize: "12px", color: "#005A9C" }}>
                            #{wid}
                          </strong>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {w.WORK_CATEGORY || w.SECTOR || "Community Infrastructure"}
                          </span>
                        </div>
                      </td>

                      <td style={{ maxWidth: "340px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: "600", color: "#0f172a", fontSize: "12px", lineHeight: "1.3" }}>
                            {w.WORK_DESCRIPTION || "MPLADS Developmental Work"}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={11} color="#005A9C" />
                            {w.CONSTITUENCY || w.IDA_NAME || "Local Site"}, {w.STATE_NAME || ""}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", color: "#334155" }}>
                          {w.MP_NAME || "Hon'ble MP"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                          {sanc > 0 ? (sanc >= 1e7 ? `₹${(sanc / 1e7).toFixed(2)} Cr` : `₹${(sanc / 1e5).toFixed(2)} L`) : "₹0"}
                        </strong>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "12px", color: exp > 0 ? "#0d9488" : "#64748b", fontWeight: "600" }}>
                          {exp > 0 ? (exp >= 1e7 ? `₹${(exp / 1e7).toFixed(2)} Cr` : `₹${(exp / 1e5).toFixed(2)} L`) : "₹0"}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: "700",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: isCompleted ? "#f0fdf4" : isInspection ? "#eff6ff" : "#fff7ed",
                            color: isCompleted ? "#15803d" : isInspection ? "#005A9C" : "#c2410c",
                            border: `1px solid ${isCompleted ? "#bbf7d0" : isInspection ? "#bfdbfe" : "#fed7aa"}`,
                          }}
                        >
                          {stageStr}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="gov-redirect-link-btn"
                            onClick={() => onSelectWork && onSelectWork(w)}
                            style={{ cursor: "pointer" }}
                            title="Inspect complete work dossier"
                          >
                            <Eye size={12} />
                            <span>Dossier</span>
                          </button>

                          <button
                            type="button"
                            className="gov-redirect-link-btn"
                            style={{ color: "#b91c1c", borderColor: "#fca5a5", background: "#fef2f2", cursor: "pointer" }}
                            onClick={() => onReportWork && onReportWork(w)}
                            title="Flag grievance or discrepancy"
                          >
                            <Flag size={12} />
                            <span>Report</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>
              Showing {works.length} of {formatNumber(totalCount)} records
            </span>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="gov-redirect-link-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}
              >
                Previous
              </button>

              <span style={{ fontSize: "12px", fontWeight: "600", padding: "5px 8px", color: "#0f172a" }}>
                {page} / {totalPages}
              </span>

              <button
                type="button"
                className="gov-redirect-link-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{ cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
