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
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores, exportToCSV } from "../../../constants";

export default function CitizenExploreTab({ onSelectWork, onReportWork }) {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchWorks = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/works?page=${page}&page_size=15&constituency=Nizamabad`;
      if (selectedSector !== "all") url += `&sector=${encodeURIComponent(selectedSector)}`;
      if (selectedStatus !== "all") url += `&status=${encodeURIComponent(selectedStatus)}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorks(data.works || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error("Failed to load public works:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, [page, selectedSector, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchWorks();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Search & Filter Header */}
      <div className="citizen-card" style={{ padding: "16px 20px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flexGrow: 1, minWidth: "260px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#64748b" }} />
              <input
                type="text"
                className="citizen-input"
                style={{ paddingLeft: "36px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search works by ID, village, contractor or description..."
              />
            </div>

            <button type="submit" className="citizen-quick-action-btn primary">
              <Search size={14} />
              <span>Search Works</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Category:</span>
              <select
                className="citizen-select"
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setPage(1);
                }}
                style={{ width: "auto" }}
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
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Status:</span>
              <select
                className="citizen-select"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                style={{ width: "auto" }}
              >
                <option value="all">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Sanctioned">Sanctioned</option>
                <option value="Proposed">Proposed</option>
              </select>
            </div>

            <span style={{ fontSize: "12.5px", color: "#64748b", marginLeft: "auto" }}>
              Showing {works.length} of {totalCount.toLocaleString()} works in <strong>Nizamabad</strong>
            </span>
          </div>
        </form>
      </div>

      {/* Works Table / List */}
      <div className="citizen-card" style={{ padding: "0", overflow: "hidden" }}>
        <div className="citizen-table-wrapper">
          <table className="citizen-table">
            <thead>
              <tr>
                <th>Work ID & Sector</th>
                <th>Public Description & Locality</th>
                <th>Hon'ble MP</th>
                <th>Sanctioned (₹)</th>
                <th>Expenditure (₹)</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Citizen Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Loading public work records from master repository...
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No works found matching the chosen search and filter criteria.
                  </td>
                </tr>
              ) : (
                works.map((w) => {
                  const statusLower = (w.WORK_STATUS || "").toLowerCase();
                  const pillClass = statusLower.includes("complete")
                    ? "completed"
                    : statusLower.includes("progress") || statusLower.includes("ongoing")
                    ? "ongoing"
                    : "sanctioned";

                  return (
                    <tr key={w.WORK_ID}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <strong style={{ fontFamily: "monospace", fontSize: "12.5px", color: "#1e3a8a" }}>
                            {w.WORK_ID}
                          </strong>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {w.SECTOR || "Community Asset"}
                          </span>
                        </div>
                      </td>

                      <td style={{ maxWidth: "340px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span style={{ fontWeight: "600", color: "#0f172a", lineHeight: "1.3" }}>
                            {w.WORK_DESCRIPTION || "MPLADS Development Project"}
                          </span>
                          <span style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={11} color="#ea580c" />
                            {w.IDA_NAME || w.CONSTITUENCY || "Local Site"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", color: "#334155" }}>
                          {w.MP_NAME || "Arvind Dharmapuri"}
                        </span>
                      </td>

                      <td>
                        <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>
                          ₹{w.SANCTION_AMOUNT ? Number(w.SANCTION_AMOUNT).toLocaleString("en-IN") : "0"}
                        </strong>
                      </td>

                      <td>
                        <span style={{ fontSize: "12.5px", color: "#16a34a", fontWeight: "600" }}>
                          ₹{w.ACTUAL_AMOUNT ? Number(w.ACTUAL_AMOUNT).toLocaleString("en-IN") : "0"}
                        </span>
                      </td>

                      <td>
                        <span className={`status-pill-public ${pillClass}`}>
                          {w.WORK_STATUS || "Sanctioned"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 9px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              borderRadius: "5px",
                              border: "1px solid #cbd5e1",
                              background: "#f8fafc",
                              color: "#1e293b",
                              cursor: "pointer",
                            }}
                            onClick={() => onSelectWork && onSelectWork(w)}
                            title="Inspect complete public dossier"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 9px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              borderRadius: "5px",
                              border: "1px solid #fca5a5",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              cursor: "pointer",
                            }}
                            onClick={() => onReportWork && onReportWork(w)}
                            title="Report discrepancy or defect for this work"
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

        {/* Pagination Bar */}
        <div style={{ padding: "12px 18px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Page {page} of {Math.ceil(totalCount / 15) || 1}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="citizen-quick-action-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ color: "#1e293b", borderColor: "#cbd5e1", opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              type="button"
              className="citizen-quick-action-btn"
              disabled={page * 15 >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              style={{ color: "#1e293b", borderColor: "#cbd5e1", opacity: page * 15 >= totalCount ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
