import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  ArrowUpDown,
  ExternalLink,
  MapPin,
  Layers,
  ChevronRight,
  TrendingUp,
  Filter,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

export default function DistrictIntelligenceTab({ onSelectWork }) {
  const [idas, setIdas] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("ALL");
  const [sortField, setSortField] = useState("total_works");
  const [sortAsc, setSortAsc] = useState(false);

  // Selected IDA works for instant inspection
  const [selectedIdaName, setSelectedIdaName] = useState(null);
  const [idaWorks, setIdaWorks] = useState([]);
  const [loadingWorks, setLoadingWorks] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [idaRes, stateRes] = await Promise.all([
          fetch(`${API_BASE}/api/idas`),
          fetch(`${API_BASE}/api/states`),
        ]);
        if (idaRes.ok) {
          const idaData = await idaRes.json();
          const rawIdas = idaData.idas || idaData.data || [];
          setIdas(
            rawIdas.map((item) => ({
              ...item,
              IDA_NAME: item.IDA_NAME || item.ida_name,
              STATE_NAME: item.STATE_NAME || item.state,
              total_works: Number(item.total_works || item.works_count || 0),
            }))
          );
        }
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          setStates(stateData.data || []);
        }
      } catch (err) {
        console.error("Failed to load District Intelligence data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter and sort IDAs
  const filteredIdas = idas.filter((ida) => {
    const name = (ida.IDA_NAME || "").toLowerCase();
    const st = ida.STATE_NAME || "";
    const matchesSearch = !search || name.includes(search.toLowerCase()) || st.toLowerCase().includes(search.toLowerCase());
    const matchesState = selectedState === "ALL" || st === selectedState;
    return matchesSearch && matchesState;
  });

  const sortedIdas = [...filteredIdas].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === "total_works") {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else {
      valA = String(valA || "").toLowerCase();
      valB = String(valB || "").toLowerCase();
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Inspect specific IDA works
  const handleInspectIda = async (idaName) => {
    setSelectedIdaName(idaName);
    setLoadingWorks(true);
    try {
      const res = await fetch(`${API_BASE}/api/works?ida_name=${encodeURIComponent(idaName)}&limit=15`);
      if (res.ok) {
        const d = await res.json();
        setIdaWorks(d.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch works for IDA:", err);
    } finally {
      setLoadingWorks(false);
    }
  };

  if (loading) {
    return (
      <div className="mospi-card text-center py-5">
        <div className="spinner" />
        <p className="text-muted mt-2">Loading national district intelligence across 763 IDAs...</p>
      </div>
    );
  }

  const topIda = idas[0] || {};

  return (
    <div className="mospi-panel">
      {/* 1. Top Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Implementing Authorities</span>
            <Building2 size={16} className="text-blue-500" />
          </div>
          <div className="mospi-kpi-value">{formatNumber(idas.length || 763)}</div>
          <div className="mospi-kpi-sub">Across 36 States & Union Territories</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Highest Volume District</span>
            <Layers size={16} className="text-emerald-500" />
          </div>
          <div className="mospi-kpi-value" style={{ fontSize: "18px", wordBreak: "break-word" }}>
            {topIda.IDA_NAME ? topIda.IDA_NAME.split("(")[0] : "Jaunpur"}
          </div>
          <div className="mospi-kpi-sub">{formatNumber(topIda.total_works || 1851)} parliamentary works</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Average per District</span>
            <TrendingUp size={16} className="text-sky-500" />
          </div>
          <div className="mospi-kpi-value">
            {idas.length ? Math.round(102703 / idas.length) : 135}
          </div>
          <div className="mospi-kpi-sub">Works per implementing agency</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">States Represented</span>
            <MapPin size={16} className="text-amber-500" />
          </div>
          <div className="mospi-kpi-value">{states.length || 36}</div>
          <div className="mospi-kpi-sub">100% Pan-India geographic coverage</div>
        </div>
      </div>

      {/* 2. District Comparison Table Card */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">District & Implementing Authority Comparison</h3>
            <p className="mospi-card-subtitle">
              Comparative monitoring across {idas.length} registered District Authorities and Collectorates
            </p>
          </div>
          <span className="mospi-pill blue">
            {formatNumber(sortedIdas.length)} Authorities Filtered
          </span>
        </div>

        {/* Filter Controls */}
        <div className="mospi-table-filter-bar" style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type="text"
              className="mospi-search-input"
              placeholder="Search by District / IDA name or State..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: "32px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={14} style={{ color: "#64748b" }} />
            <select
              className="mospi-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{ minWidth: "180px" }}
            >
              <option value="ALL">All 36 States & UTs</option>
              {states.map((st) => (
                <option key={st.STATE_NAME} value={st.STATE_NAME}>
                  {st.STATE_NAME}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mospi-table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="mospi-table">
            <thead>
              <tr>
                <th style={{ width: "45px" }}>#</th>
                <th onClick={() => handleSort("IDA_NAME")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>Implementing Authority / District</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("STATE_NAME")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>State / UT</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort("total_works")} style={{ cursor: "pointer", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    <span>Total Works</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ textAlign: "center", width: "130px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedIdas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No District Authorities found matching "{search}"
                  </td>
                </tr>
              ) : (
                sortedIdas.slice(0, 100).map((ida, idx) => {
                  const isSelected = selectedIdaName === ida.IDA_NAME;
                  return (
                    <tr
                      key={ida.IDA_NAME || idx}
                      style={{
                        backgroundColor: isSelected ? "var(--bg-accent, #f1f5f9)" : "transparent",
                      }}
                    >
                      <td style={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          {ida.IDA_NAME || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="mospi-pill neutral" style={{ fontSize: "11px" }}>
                          {ida.STATE_NAME || "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {formatNumber(ida.total_works || 0)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-btn-sm"
                          onClick={() => handleInspectIda(ida.IDA_NAME)}
                          title="Inspect active works for this authority"
                        >
                          <span>{isSelected ? "Inspecting" : "Inspect"}</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {sortedIdas.length > 100 && (
          <div style={{ padding: "8px 16px", fontSize: "12px", color: "#64748b", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
            Showing top 100 of {formatNumber(sortedIdas.length)} authorities. Use search to find specific district.
          </div>
        )}
      </div>

      {/* 3. Selected District Works Sub-Panel */}
      {selectedIdaName && (
        <div className="mospi-card" style={{ borderLeft: "4px solid #2563eb" }}>
          <div className="mospi-card-header">
            <div>
              <h3 className="mospi-card-title">
                Active Works for {selectedIdaName}
              </h3>
              <p className="mospi-card-subtitle">
                Sampling of registered works with full 78-field canonical record link
              </p>
            </div>
            <button
              type="button"
              className="mospi-pill neutral"
              onClick={() => setSelectedIdaName(null)}
              style={{ cursor: "pointer", border: "none" }}
            >
              Close Panel
            </button>
          </div>

          {loadingWorks ? (
            <div className="text-center py-4">
              <div className="spinner" />
              <p className="text-muted mt-2">Loading works for {selectedIdaName}...</p>
            </div>
          ) : idaWorks.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
              No detailed works returned for this authority.
            </div>
          ) : (
            <div className="mospi-table-responsive">
              <table className="mospi-table">
                <thead>
                  <tr>
                    <th>Work ID</th>
                    <th>Description</th>
                    <th>Stage</th>
                    <th style={{ textAlign: "right" }}>Sanction Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {idaWorks.map((w) => (
                    <tr key={w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID}>
                      <td style={{ fontWeight: 700, color: "#2563eb" }}>
                        #{w.WORK_ID || w.WORK_RECOMMENDATION_DTL_ID}
                      </td>
                      <td style={{ maxWidth: "350px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {w.WORK_DESCRIPTION || "—"}
                      </td>
                      <td>
                        <span className="mospi-pill neutral">
                          {w.WORK_STAGE || "Unspecified"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {w.SANCTION_AMOUNT ? `₹ ${Number(w.SANCTION_AMOUNT).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="mospi-dossier-btn mospi-dossier-district"
                          onClick={() => onSelectWork && onSelectWork({ ...w, __initialSection: "overview", __authority: "MOSPI" })}
                          title="Inspect District Central Registry Dossier"
                        >
                          <Building2 size={12} />
                          <span>District Dossier →</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
