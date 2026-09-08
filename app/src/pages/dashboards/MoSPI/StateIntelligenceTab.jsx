import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  MapPin,
  Building2,
  ExternalLink,
  Layers,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores, exportToCSV } from "../../../constants";

export default function StateIntelligenceTab({ onSelectWork }) {
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
        const valA = Number(a[sortBy] || 0);
        const valB = Number(b[sortBy] || 0);
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
              Macro comparison of work volume, financial sanction releases, actual spend, and review workloads across all 36 States & UTs
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="mospi-search-box">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search State or UT (e.g. Uttar Pradesh, Odisha)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button type="button" className="mospi-export-btn" onClick={handleExport} title="Export state analytics table">
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* State Table */}
        <div className="mospi-table-wrapper">
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("STATE_NAME")}>
                  State / Union Territory <ArrowUpDown size={11} style={{ display: "inline" }} />
                </th>
                <th onClick={() => handleSort("TOTAL_WORKS")}>
                  Works <ArrowUpDown size={11} style={{ display: "inline" }} />
                </th>
                <th onClick={() => handleSort("SANCTIONED_WORKS")}>
                  Sanctioned <ArrowUpDown size={11} style={{ display: "inline" }} />
                </th>
                <th onClick={() => handleSort("ONGOING_WORKS")}>
                  Ongoing <ArrowUpDown size={11} style={{ display: "inline" }} />
                </th>
                <th onClick={() => handleSort("COMPLETED_WORKS")}>
                  Completed <ArrowUpDown size={11} style={{ display: "inline" }} />
                </th>
                <th onClick={() => handleSort("SANCTION_AMOUNT")}>
                  Sanctioned (₹ Cr) <ArrowUpDown size={11} style={{ display: "inline" }} />
                </th>
                <th onClick={() => handleSort("ACTUAL_AMOUNT")}>
                  Disbursed (₹ Cr) <ArrowUpDown size={11} style={{ display: "inline" }} />
                </th>
                <th onClick={() => handleSort("REVIEW_REQUIRED")}>
                  Review Required <ArrowUpDown size={11} style={{ display: "inline" }} />
                </th>
                <th>District Drill-Down</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <div className="spinner" /> Loading 36 State Intelligence metrics...
                  </td>
                </tr>
              ) : filteredStates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-muted">
                    No States match your search query.
                  </td>
                </tr>
              ) : (
                filteredStates.map((st) => {
                  const isExpanded = expandedState === st.STATE_NAME;
                  return (
                    <React.Fragment key={st.STATE_NAME}>
                      <tr className={isExpanded ? "expanded-row" : ""}>
                        <td className="mospi-state-name">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin size={13} className="text-slate-400" />
                            <span>{st.STATE_NAME}</span>
                          </div>
                        </td>
                        <td>
                          <strong>{formatNumber(st.TOTAL_WORKS)}</strong>
                        </td>
                        <td>{formatNumber(st.SANCTIONED_WORKS || 0)}</td>
                        <td>
                          <span className="mospi-pill blue">{formatNumber(st.ONGOING_WORKS || 0)}</span>
                        </td>
                        <td>
                          <span className="mospi-pill emerald">{formatNumber(st.COMPLETED_WORKS || 0)}</span>
                        </td>
                        <td>₹ {formatCrores(st.SANCTION_AMOUNT || 0)}</td>
                        <td>₹ {formatCrores(st.ACTUAL_AMOUNT || 0)}</td>
                        <td>
                          {st.REVIEW_REQUIRED > 0 ? (
                            <span className="mospi-pill rose">{formatNumber(st.REVIEW_REQUIRED)}</span>
                          ) : (
                            <span className="mospi-pill gray">0</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="mospi-page-btn"
                            onClick={() => handleToggleState(st.STATE_NAME)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              padding: "3px 8px",
                            }}
                          >
                            <span>{isExpanded ? "Close" : "Districts"}</span>
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
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
                                  Click any authority to explore its works in the repository
                                </span>
                              </div>

                              {districtLoading ? (
                                <div className="text-center py-3">
                                  <div className="spinner" /> Loading district authorities for {st.STATE_NAME}...
                                </div>
                              ) : districts.length === 0 ? (
                                <div className="text-muted py-2" style={{ fontSize: "12px" }}>
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
                                      <span className="mospi-pill blue" style={{ fontSize: "10.5px" }}>
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
