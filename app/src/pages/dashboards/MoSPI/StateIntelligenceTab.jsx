import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  MapPin,
  ArrowUpDown,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores, exportToCSV } from "../../../constants";

export default function StateIntelligenceTab() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("TOTAL_WORKS");
  const [sortAsc, setSortAsc] = useState(false);

  // Drill-down state
  const [expandedState, setExpandedState] = useState(null);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [districts, setDistricts] = useState([]);

  // Load state analytics
  useEffect(() => {
    let isMounted = true;
    async function loadStates() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/analytics/states`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setStates(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load state intelligence:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStates();
    return () => { isMounted = false; };
  }, []);

  // Drill down into state IDAs
  const handleToggleState = async (stateName) => {
    if (expandedState === stateName) {
      setExpandedState(null);
      setDistricts([]);
      return;
    }

    setExpandedState(stateName);
    setDistrictLoading(true);
    setDistricts([]);

    try {
      const res = await fetch(`${API_BASE}/api/idas?state=${encodeURIComponent(stateName)}`);
      if (res.ok) {
        const data = await res.json();
        setDistricts(data.idas || []);
      }
    } catch (err) {
      console.error("Failed to load district IDAs for state:", err);
    } finally {
      setDistrictLoading(false);
    }
  };

  // Sorting handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  // Filter and sort states
  const filteredStates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return states
      .filter((s) => !q || (s.STATE_NAME && s.STATE_NAME.toLowerCase().includes(q)))
      .sort((a, b) => {
        const valA = a[sortBy] != null ? Number(a[sortBy]) : 0;
        const valB = b[sortBy] != null ? Number(b[sortBy]) : 0;
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [states, search, sortBy, sortAsc]);

  // CSV Export
  const handleExport = () => {
    if (!states || states.length === 0) return;
    exportToCSV(states, `MoSPI_State_Intelligence_${Date.now()}.csv`);
  };

  return (
    <div className="mospi-panel">
      <div className="mospi-card">
        {/* Table Toolbar */}
        <div className="mospi-table-toolbar">
          <div>
            <h3 className="mospi-card-title">Pan-India State & Union Territory Intelligence</h3>
            <p className="mospi-card-subtitle">
              {states.length > 0
                ? `Macro comparison of work volume, financial sanction releases, actual spend, and review workloads across all ${states.length} States & UTs`
                : "Macro comparison of work volume, financial sanction releases, actual spend, and review workloads across States & UTs"}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div className="mospi-search-box">
              <Search size={13} color="#64748b" />
              <input
                type="text"
                placeholder="Search State or UT (e.g. Uttar Pradesh, Odisha)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button type="button" className="mospi-redirect-link-btn" onClick={handleExport} title="Export state analytics table">
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* State Table */}
        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("STATE_NAME")}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>State / Union Territory</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort("TOTAL_WORKS")} style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Works</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort("SANCTIONED_WORKS")} style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Sanctioned</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort("ONGOING_WORKS")} style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Ongoing</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort("COMPLETED_WORKS")} style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Completed</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort("SANCTION_AMOUNT")} style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Sanctioned (₹ Cr)</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort("ACTUAL_AMOUNT")} style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Disbursed (₹ Cr)</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort("REVIEW_REQUIRED")} style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span>Review Required</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ textAlign: "center", width: "120px" }}>District Drill-Down</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "36px" }}>
                    <div className="spinner" />
                    <p style={{ color: "#64748b", marginTop: "8px", fontSize: "12px" }}>Loading State Intelligence metrics...</p>
                  </td>
                </tr>
              ) : filteredStates.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No States match your search query.
                  </td>
                </tr>
              ) : (
                filteredStates.map((st) => {
                  const isExpanded = expandedState === st.STATE_NAME;
                  return (
                    <React.Fragment key={st.STATE_NAME}>
                      <tr className={isExpanded ? "expanded-row" : ""}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#0f172a" }}>
                            <MapPin size={12} color="#005A9C" />
                            <span>{st.STATE_NAME}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {st.TOTAL_WORKS != null ? formatNumber(st.TOTAL_WORKS) : "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {st.SANCTIONED_WORKS != null ? formatNumber(st.SANCTIONED_WORKS) : "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="mospi-pill blue">
                            {st.ONGOING_WORKS != null ? formatNumber(st.ONGOING_WORKS) : "—"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="mospi-pill emerald">
                            {st.COMPLETED_WORKS != null ? formatNumber(st.COMPLETED_WORKS) : "—"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {st.SANCTION_AMOUNT != null ? formatCrores(st.SANCTION_AMOUNT) : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {st.ACTUAL_AMOUNT != null ? formatCrores(st.ACTUAL_AMOUNT) : "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {st.REVIEW_REQUIRED != null && st.REVIEW_REQUIRED > 0 ? (
                            <span className="mospi-pill rose">{formatNumber(st.REVIEW_REQUIRED)}</span>
                          ) : st.REVIEW_REQUIRED === 0 ? (
                            <span className="mospi-pill gray">0</span>
                          ) : (
                            <span className="mospi-pill gray">—</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="mospi-page-btn"
                            onClick={() => handleToggleState(st.STATE_NAME)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              fontSize: "11px",
                              padding: "3px 7px",
                            }}
                          >
                            <span>{isExpanded ? "Close" : "Districts"}</span>
                            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                          </button>
                        </td>
                      </tr>

                      {/* State -> District Drill-Down Panel */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} style={{ padding: 0 }}>
                            <div className="mospi-drilldown-box">
                              <div className="mospi-drilldown-header">
                                <span className="mospi-drilldown-title">
                                  {st.STATE_NAME} — Designated District Authorities & Implementing Bodies ({districts.length} Authorities)
                                </span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                  District registry mapping
                                </span>
                              </div>

                              {districtLoading ? (
                                <div style={{ textAlign: "center", padding: "16px" }}>
                                  <div className="spinner" />
                                  <p style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>Loading district authorities for {st.STATE_NAME}...</p>
                                </div>
                              ) : districts.length === 0 ? (
                                <div style={{ fontSize: "11.5px", color: "#64748b", padding: "10px 0" }}>
                                  No district implementing authorities found for {st.STATE_NAME}.
                                </div>
                              ) : (
                                <div className="mospi-district-grid">
                                  {districts.map((d) => (
                                    <div
                                      key={d.ida_name}
                                      className="mospi-district-card"
                                      title={`Official Implementing Body: ${d.ida_name}`}
                                    >
                                      <div>
                                        <div className="mospi-district-name">
                                          {d.district_name || d.ida_name}
                                        </div>
                                        <div className="mospi-district-sub">
                                          {d.constituency ? `Constituency: ${d.constituency}` : "District Authority"}
                                        </div>
                                      </div>
                                      <span className="mospi-pill blue" style={{ fontSize: "10px" }}>
                                        {formatNumber(d.works_count)} Works
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
