import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Search,
  ArrowUpDown,
  MapPin,
  Layers,
  TrendingUp,
  Filter,
  Eye,
  X,
  ArrowLeft,
  ShieldAlert,
  Clock,
  IndianRupee,
  FileCheck,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores } from "../../../constants";

// ─── Helpers ─────────────────────────────────────────────────────────────────


function RiskBadge({ level }) {
  const l = String(level || "LOW").toUpperCase();
  const style =
    l === "HIGH"
      ? { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }
      : l === "MEDIUM"
      ? { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }
      : { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" };
  return (
    <span style={{ ...style, padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
      {l}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DistrictIntelligenceTab({ onSelectWork }) {
  const [idas, setIdas] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("ALL");
  const [sortField, setSortField] = useState("total_works");
  const [sortAsc, setSortAsc] = useState(false);

  // ── Single overlay state machine ──────────────────────────────────────────
  // activeOverlay: null | "inspect" | "dossier"
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [inspectIdaName, setInspectIdaName] = useState(null);
  const [idaWorks, setIdaWorks] = useState([]);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [dossierWork, setDossierWork] = useState(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalStage, setModalStage] = useState("ALL");
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(25);

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedAuthority = idas.find((item) => item.IDA_NAME === inspectIdaName);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const closeAll = useCallback(() => {
    setActiveOverlay(null);
    setInspectIdaName(null);
    setIdaWorks([]);
    setDossierWork(null);
    setModalSearch("");
    setModalStage("ALL");
    setModalPage(1);
  }, []);

  // ── Body scroll lock + Esc key (covers both overlays) ─────────────────────
  useEffect(() => {
    if (!activeOverlay) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (activeOverlay === "dossier") {
          // Esc from dossier → return to inspect
          setActiveOverlay("inspect");
          setDossierWork(null);
        } else {
          // Esc from inspect → close everything
          closeAll();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeOverlay, closeAll]);

  // ── Data loading ──────────────────────────────────────────────────────────
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
          const rawStates =
            stateData.data ||
            (stateData.states || []).map((s) => ({ STATE_NAME: s, state: s }));
          setStates(rawStates);
        }
      } catch (err) {
        console.error("Failed to load District Intelligence data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ── Filter and sort ───────────────────────────────────────────────────────
  const filteredIdas = idas.filter((ida) => {
    const name = (ida.IDA_NAME || "").toLowerCase();
    const st = ida.STATE_NAME || "";
    const matchesSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      st.toLowerCase().includes(search.toLowerCase());
    const matchesState =
      selectedState === "ALL" || st === selectedState;
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

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInspectIda = async (idaName) => {
    setInspectIdaName(idaName);
    setActiveOverlay("inspect");
    setDossierWork(null);
    setLoadingWorks(true);
    setModalSearch("");
    setModalStage("ALL");
    setModalPage(1);
    try {
      const res = await fetch(
        `${API_BASE}/api/works?ida_name=${encodeURIComponent(idaName)}&limit=2500`
      );
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

  // ── In-Modal Filter & Pagination Logic ────────────────────────────────────
  const modalFilteredWorks = useMemo(() => {
    return idaWorks.filter((w) => {
      const q = modalSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        String(w.WORK_ID || "").toLowerCase().includes(q) ||
        String(w.WORK_RECOMMENDATION_DTL_ID || "").toLowerCase().includes(q) ||
        String(w.WORK_DESCRIPTION || "").toLowerCase().includes(q) ||
        String(w.CONSTITUENCY || "").toLowerCase().includes(q) ||
        String(w.MP_NAME || "").toLowerCase().includes(q);

      const matchesStage =
        modalStage === "ALL" ||
        String(w.WORK_STAGE || "").toLowerCase() === modalStage.toLowerCase();

      return matchesSearch && matchesStage;
    });
  }, [idaWorks, modalSearch, modalStage]);

  const modalStages = useMemo(() => {
    const set = new Set();
    idaWorks.forEach((w) => {
      if (w.WORK_STAGE) set.add(w.WORK_STAGE);
    });
    return Array.from(set).sort();
  }, [idaWorks]);

  const totalModalPages = Math.max(
    1,
    Math.ceil(modalFilteredWorks.length / modalPageSize)
  );

  const pagedWorks = useMemo(() => {
    const start = (modalPage - 1) * modalPageSize;
    return modalFilteredWorks.slice(start, start + modalPageSize);
  }, [modalFilteredWorks, modalPage, modalPageSize]);

  /**
   * Open District Dossier — REPLACES Inspect in the same modal portal.
   * Does NOT call onSelectWork (that would open the side drawer).
   */
  const handleOpenDossier = (work) => {
    setDossierWork(work);
    setActiveOverlay("dossier");
  };

  /**
   * Back from Dossier → return to Inspect for the same IDA.
   */
  const handleBackToInspect = () => {
    setDossierWork(null);
    setActiveOverlay("inspect");
  };

  /**
   * "Open Full Dossier" — close modal entirely, hand off to SharedLayout drawer.
   * Used only when the user explicitly wants the full 78-field WorkDetailDrawer.
   */
  const handleOpenFullDossier = (work) => {
    closeAll();
    if (typeof onSelectWork === "function") {
      // Small timeout lets the modal unmount cleanly before the drawer mounts
      setTimeout(() => {
        onSelectWork({ ...work, __initialSection: "overview", __authority: "MOSPI" });
      }, 50);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mospi-card" style={{ textAlign: "center", padding: "40px" }}>
        <div className="spinner" />
        <p style={{ color: "#64748b", marginTop: "8px", fontSize: "12px" }}>
          Loading national district intelligence...
        </p>
      </div>
    );
  }

  const topIda = idas[0] || {};
  const totalWorksAcrossIdas = idas.reduce(
    (sum, item) => sum + (Number(item.total_works) || 0),
    0
  );
  const avgPerDistrict =
    idas.length > 0 ? Math.round(totalWorksAcrossIdas / idas.length) : null;

  // ── Dossier work derived values ───────────────────────────────────────────
  const dw = dossierWork || {};
  const dwRiskLevel = String(dw.RISK_LEVEL || "LOW").toUpperCase();
  const dwDelayDays =
    dw.SANCTION_DELAY_DAYS != null ? Math.round(Number(dw.SANCTION_DELAY_DAYS)) : null;
  const dwSancAmount = Number(dw.SANCTION_AMOUNT) || 0;
  const dwActAmount = Number(dw.ACTUAL_AMOUNT) || 0;
  const dwDisbPct =
    dwSancAmount > 0 ? ((dwActAmount / dwSancAmount) * 100).toFixed(1) : "0.0";
  const dwIsOverdue45 = dwDelayDays != null && dwDelayDays > 45;
  const dwStage = dw.WORK_STAGE || "—";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mospi-panel">
      {/* 1. Top Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "10px",
        }}
      >
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Implementing Authorities</span>
            <Building2 size={15} color="#0284c7" />
          </div>
          <div className="mospi-kpi-value">
            {idas.length > 0 ? formatNumber(idas.length) : "—"}
          </div>
          <div className="mospi-kpi-sub">
            {states.length > 0
              ? `Across ${states.length} States & Union Territories`
              : "Across States & Union Territories"}
          </div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Highest Volume District</span>
            <Layers size={15} color="#0d9488" />
          </div>
          <div
            className="mospi-kpi-value"
            style={{ fontSize: "17px", wordBreak: "break-word" }}
          >
            {topIda.IDA_NAME ? topIda.IDA_NAME.split("(")[0] : "—"}
          </div>
          <div className="mospi-kpi-sub">
            {topIda.total_works != null
              ? `${formatNumber(topIda.total_works)} parliamentary works`
              : "—"}
          </div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Average per District</span>
            <TrendingUp size={15} color="#0284c7" />
          </div>
          <div className="mospi-kpi-value">
            {avgPerDistrict != null ? formatNumber(avgPerDistrict) : "—"}
          </div>
          <div className="mospi-kpi-sub">Works per implementing agency</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">States Represented</span>
            <MapPin size={15} color="#d97706" />
          </div>
          <div className="mospi-kpi-value">
            {states.length > 0 ? states.length : "—"}
          </div>
          <div className="mospi-kpi-sub">Pan-India geographic coverage</div>
        </div>
      </div>

      {/* 2. District Comparison Table Card */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">
              District & Implementing Authority Comparison
            </h3>
            <p className="mospi-card-subtitle">
              Comparative monitoring across {idas.length} registered District
              Authorities and Collectorates
            </p>
          </div>
          <span className="mospi-pill blue">
            {formatNumber(sortedIdas.length)} Authorities Filtered
          </span>
        </div>

        {/* Filter Controls */}
        <div className="mospi-table-toolbar">
          <div className="mospi-search-box" style={{ flex: 1, minWidth: "260px" }}>
            <Search size={13} color="#64748b" />
            <input
              type="text"
              placeholder="Search by District / IDA name or State..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={13} color="#64748b" />
            <select
              className="mospi-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{ minWidth: "180px" }}
            >
              <option value="ALL">All States & UTs</option>
              {states.map((st) => (
                <option key={st.STATE_NAME} value={st.STATE_NAME}>
                  {st.STATE_NAME}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div
          className="mospi-table-wrapper"
          style={{ maxHeight: "480px", overflowY: "auto" }}
        >
          <table className="mospi-data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th
                  className="sortable"
                  onClick={() => handleSort("IDA_NAME")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>Implementing Authority / District</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("STATE_NAME")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>State / UT</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("total_works")}
                  style={{ textAlign: "right" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "4px",
                    }}
                  >
                    <span>Total Works</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ textAlign: "center", width: "120px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedIdas.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "#64748b",
                    }}
                  >
                    No District Authorities found matching "{search}"
                  </td>
                </tr>
              ) : (
                sortedIdas.slice(0, 100).map((ida, idx) => {
                  const isSelected = inspectIdaName === ida.IDA_NAME;
                  return (
                    <tr
                      key={ida.IDA_NAME || idx}
                      style={{
                        backgroundColor: isSelected ? "#f0f9ff" : "transparent",
                      }}
                    >
                      <td style={{ color: "#64748b", fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          {ida.IDA_NAME || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="mospi-pill neutral"
                          style={{ fontSize: "10.5px" }}
                        >
                          {ida.STATE_NAME || "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {formatNumber(ida.total_works || 0)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="mospi-page-btn"
                          onClick={() => handleInspectIda(ida.IDA_NAME)}
                          title="Inspect active works for this authority"
                          style={{ fontSize: "11px", padding: "2px 7px" }}
                        >
                          <Eye size={11} />
                          <span>
                            {isSelected && activeOverlay
                              ? "Inspecting"
                              : "Inspect"}
                          </span>
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
          <div
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              color: "#64748b",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            Showing top 100 of {formatNumber(sortedIdas.length)} authorities.
            Use search to find specific district.
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          OVERLAY PORTAL — Single portal, content switches based on activeOverlay
          Never both "inspect" and "dossier" at the same time.
          ═══════════════════════════════════════════════════════════════════ */}
      {activeOverlay &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="mospi-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (activeOverlay === "dossier") {
                  handleBackToInspect();
                } else {
                  closeAll();
                }
              }
            }}
          >
            <div
              className="mospi-modal-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="district-overlay-title"
            >
              {/* ── INSPECT CONTENT ── */}
              {activeOverlay === "inspect" && (
                <>
                  {/* Header */}
                  <div className="mospi-modal-header">
                    <div className="mospi-modal-title-box">
                      <div className="mospi-modal-title-row">
                        <h3
                          id="district-overlay-title"
                          className="mospi-modal-title"
                        >
                          Active Works Inspection: {inspectIdaName}
                        </h3>
                        {selectedAuthority?.STATE_NAME && (
                          <span
                            className="mospi-pill neutral"
                            style={{ fontSize: "11px" }}
                          >
                            {selectedAuthority.STATE_NAME}
                          </span>
                        )}
                        <span
                          className="mospi-pill blue"
                          style={{ fontSize: "11px" }}
                        >
                          {formatNumber(selectedAuthority?.total_works ?? idaWorks.length)} Works Registered
                        </span>
                      </div>
                      <p className="mospi-modal-subtitle">
                        Official Central Registry — verified active works for this District Authority. Click <strong>District Dossier</strong> to inspect a work's central audit record.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="mospi-modal-close-btn"
                      onClick={closeAll}
                      title="Close (Esc)"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="mospi-modal-body">
                    {loadingWorks ? (
                      <div style={{ textAlign: "center", padding: "40px" }}>
                        <div className="spinner" />
                        <p
                          style={{
                            color: "#64748b",
                            marginTop: "10px",
                            fontSize: "12px",
                          }}
                        >
                          Loading central works registry for {inspectIdaName}...
                        </p>
                      </div>
                    ) : idaWorks.length === 0 ? (
                      <div
                        style={{
                          padding: "32px",
                          textAlign: "center",
                          color: "#64748b",
                          fontSize: "13px",
                        }}
                      >
                        No detailed works returned for this authority in central database.
                      </div>
                    ) : (
                      <>
                        {/* Quick In-Modal Search & Stage Filter Toolbar */}
                        <div className="mospi-modal-toolbar">
                          <div className="mospi-modal-search-wrap">
                            <Search size={14} className="search-icon" />
                            <input
                              type="text"
                              className="mospi-modal-search-input"
                              placeholder="Search by Work ID, description, MP..."
                              value={modalSearch}
                              onChange={(e) => {
                                setModalSearch(e.target.value);
                                setModalPage(1);
                              }}
                            />
                            {modalSearch && (
                              <button
                                type="button"
                                onClick={() => {
                                  setModalSearch("");
                                  setModalPage(1);
                                }}
                                style={{
                                  position: "absolute",
                                  right: "8px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#94a3b8",
                                  padding: 0,
                                }}
                                aria-label="Clear search"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>

                          <div className="mospi-modal-filter-group">
                            <select
                              className="mospi-modal-select"
                              value={modalStage}
                              onChange={(e) => {
                                setModalStage(e.target.value);
                                setModalPage(1);
                              }}
                              aria-label="Filter works by stage"
                            >
                              <option value="ALL">All Stages ({idaWorks.length})</option>
                              {modalStages.map((st) => {
                                const count = idaWorks.filter(
                                  (w) =>
                                    String(w.WORK_STAGE || "").toLowerCase() ===
                                    st.toLowerCase()
                                ).length;
                                return (
                                  <option key={st} value={st}>
                                    {st} ({count})
                                  </option>
                                );
                              })}
                            </select>

                            <select
                              className="mospi-modal-select"
                              value={modalPageSize}
                              onChange={(e) => {
                                setModalPageSize(Number(e.target.value));
                                setModalPage(1);
                              }}
                              aria-label="Works per page"
                            >
                              <option value={25}>25 per page</option>
                              <option value={50}>50 per page</option>
                              <option value={100}>100 per page</option>
                              <option value={2500}>View All</option>
                            </select>
                          </div>
                        </div>

                        <div
                          className="mospi-table-wrapper"
                          style={{ margin: 0 }}
                        >
                          <table className="mospi-data-table">
                            <thead>
                              <tr>
                                <th style={{ width: "90px" }}>Work ID</th>
                                <th>Description</th>
                                <th>Constituency & MP</th>
                                <th>Stage</th>
                                <th style={{ textAlign: "right" }}>
                                  Sanction Amount
                                </th>
                                <th
                                  style={{ textAlign: "center", width: "150px" }}
                                >
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedWorks.map((w) => (
                                <tr
                                  key={
                                    w.WORK_RECOMMENDATION_DTL_ID || w.WORK_ID
                                  }
                                >
                                  <td
                                    style={{
                                      fontWeight: 700,
                                      color: "#005A9C",
                                    }}
                                  >
                                    #{w.WORK_ID || w.WORK_RECOMMENDATION_DTL_ID}
                                  </td>
                                  <td
                                    style={{
                                      maxWidth: "260px",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                    title={w.WORK_DESCRIPTION}
                                  >
                                    {w.WORK_DESCRIPTION || "—"}
                                  </td>
                                  <td style={{ fontSize: "11.5px", color: "#334155" }}>
                                    <div>{w.CONSTITUENCY || "—"}</div>
                                    <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                                      {w.MP_NAME || ""}
                                    </div>
                                  </td>
                                  <td>
                                    <span className="mospi-pill neutral">
                                      {w.WORK_STAGE || "Unspecified"}
                                    </span>
                                  </td>
                                  <td
                                    style={{
                                      textAlign: "right",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {w.SANCTION_AMOUNT
                                      ? formatCrores(w.SANCTION_AMOUNT)
                                      : "—"}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    {/* District Dossier → replaces Inspect in THIS portal */}
                                    <button
                                      type="button"
                                      className="mospi-dossier-btn mospi-dossier-district"
                                      onClick={() => handleOpenDossier(w)}
                                      title="View District Central Registry Dossier"
                                    >
                                      <Building2 size={11} />
                                      <span>District Dossier</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer with Real Statistics & Pagination */}
                  <div className="mospi-modal-footer">
                    <span className="mospi-modal-footer-meta">
                      Showing{" "}
                      {modalFilteredWorks.length === 0
                        ? 0
                        : (modalPage - 1) * modalPageSize + 1}
                      –
                      {Math.min(
                        modalPage * modalPageSize,
                        modalFilteredWorks.length
                      )}{" "}
                      of {modalFilteredWorks.length} registered works for{" "}
                      <strong>{inspectIdaName}</strong>
                      {idaWorks.length > modalFilteredWorks.length && (
                        <span> (filtered from {idaWorks.length} total)</span>
                      )}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      {totalModalPages > 1 && (
                        <div className="mospi-modal-pagination">
                          <button
                            type="button"
                            className="mospi-modal-page-btn"
                            disabled={modalPage <= 1}
                            onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                          >
                            Previous
                          </button>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                            Page {modalPage} of {totalModalPages}
                          </span>
                          <button
                            type="button"
                            className="mospi-modal-page-btn"
                            disabled={modalPage >= totalModalPages}
                            onClick={() => setModalPage((p) => Math.min(totalModalPages, p + 1))}
                          >
                            Next
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        className="mospi-action-btn secondary"
                        onClick={closeAll}
                        style={{ fontSize: "12px", padding: "5px 14px" }}
                      >
                        Close Inspection
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── DISTRICT DOSSIER CONTENT ── */}
              {activeOverlay === "dossier" && dossierWork && (
                <>
                  {/* Header */}
                  <div className="mospi-modal-header">
                    <div className="mospi-modal-title-box">
                      {/* Back navigation */}
                      <button
                        type="button"
                        className="mospi-back-btn"
                        onClick={handleBackToInspect}
                        title="Return to inspection list"
                      >
                        <ArrowLeft size={13} />
                        <span>Back to Inspect · {inspectIdaName}</span>
                      </button>
                      <div
                        className="mospi-modal-title-row"
                        style={{ marginTop: "4px" }}
                      >
                        <h3
                          id="district-overlay-title"
                          className="mospi-modal-title"
                        >
                          District Dossier — Work #
                          {dw.WORK_ID || dw.WORK_RECOMMENDATION_DTL_ID}
                        </h3>
                        <RiskBadge level={dwRiskLevel} />
                        <span
                          className="mospi-pill neutral"
                          style={{ fontSize: "11px" }}
                        >
                          {dwStage}
                        </span>
                      </div>
                      <p className="mospi-modal-subtitle">
                        Central Registry Audit Record · MoSPI National
                        Surveillance Desk
                      </p>
                    </div>
                    <button
                      type="button"
                      className="mospi-modal-close-btn"
                      onClick={closeAll}
                      title="Close (Esc)"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body — Work Summary */}
                  <div className="mospi-modal-body">
                    {/* Description */}
                    {dw.WORK_DESCRIPTION && (
                      <div className="mospi-dossier-desc-box">
                        <div className="mospi-dossier-desc-label">
                          Official Work Description
                        </div>
                        <div className="mospi-dossier-desc-body">
                          {dw.WORK_DESCRIPTION}
                        </div>
                      </div>
                    )}

                    {/* Key fields grid */}
                    <div className="mospi-dossier-summary-grid">
                      {/* Location */}
                      <div className="mospi-dossier-work-field">
                        <div className="mospi-dossier-field-label">
                          <MapPin size={12} />
                          State / Constituency
                        </div>
                        <div className="mospi-dossier-field-val">
                          {dw.STATE_NAME || "—"}{" "}
                          {dw.CONSTITUENCY ? `· ${dw.CONSTITUENCY}` : ""}
                        </div>
                      </div>

                      {/* Implementing Agency */}
                      <div className="mospi-dossier-work-field">
                        <div className="mospi-dossier-field-label">
                          <Building2 size={12} />
                          Implementing Agency
                        </div>
                        <div className="mospi-dossier-field-val">
                          {dw.IDA_NAME || inspectIdaName || "—"}
                        </div>
                      </div>

                      {/* Sanction Amount */}
                      <div className="mospi-dossier-work-field highlight-blue">
                        <div className="mospi-dossier-field-label">
                          <IndianRupee size={12} />
                          Sanctioned Amount
                        </div>
                        <div className="mospi-dossier-field-val">
                          {dwSancAmount > 0
                            ? formatCrores(dwSancAmount)
                            : "Pending Sanction"}
                        </div>
                      </div>

                      {/* Disbursed */}
                      <div className="mospi-dossier-work-field highlight-blue">
                        <div className="mospi-dossier-field-label">
                          <FileCheck size={12} />
                          Disbursed ({dwDisbPct}%)
                        </div>
                        <div className="mospi-dossier-field-val">
                          {dwActAmount > 0
                            ? formatCrores(dwActAmount)
                            : "—"}
                        </div>
                      </div>

                      {/* Delay status */}
                      <div
                        className={`mospi-dossier-work-field ${
                          dwIsOverdue45 ? "highlight-danger" : ""
                        }`}
                      >
                        <div className="mospi-dossier-field-label">
                          <Clock size={12} />
                          Sanction Delay
                        </div>
                        <div className="mospi-dossier-field-val">
                          {dwDelayDays != null ? (
                            <>
                              {dwDelayDays}d{" "}
                              {dwIsOverdue45 ? (
                                <span
                                  style={{ color: "#b91c1c", fontSize: "11px" }}
                                >
                                  ⚠ Exceeded 45-day limit
                                </span>
                              ) : (
                                <span
                                  style={{ color: "#166534", fontSize: "11px" }}
                                >
                                  ✓ Compliant
                                </span>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>

                      {/* Risk level */}
                      <div
                        className={`mospi-dossier-work-field ${
                          dwRiskLevel === "HIGH" ? "highlight-danger" : ""
                        }`}
                      >
                        <div className="mospi-dossier-field-label">
                          <ShieldAlert size={12} />
                          AI Risk Level
                        </div>
                        <div className="mospi-dossier-field-val">
                          <RiskBadge level={dwRiskLevel} />
                          {dw.RISK_SCORE != null && (
                            <span
                              style={{
                                marginLeft: "6px",
                                fontSize: "11px",
                                color: "#64748b",
                              }}
                            >
                              Score: {Number(dw.RISK_SCORE).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Risk reason */}
                      {dw.RISK_REASON && (
                        <div
                          className="mospi-dossier-work-field full-span highlight-danger"
                        >
                          <div className="mospi-dossier-field-label">
                            <AlertTriangle size={12} />
                            Risk Rationale
                          </div>
                          <div
                            className="mospi-dossier-field-val"
                            style={{ fontSize: "12px", lineHeight: 1.5 }}
                          >
                            {dw.RISK_REASON}
                          </div>
                        </div>
                      )}

                      {/* Work category */}
                      {dw.WORK_CATEGORY && (
                        <div className="mospi-dossier-work-field">
                          <div className="mospi-dossier-field-label">
                            <Layers size={12} />
                            Category
                          </div>
                          <div className="mospi-dossier-field-val">
                            {dw.WORK_CATEGORY}
                          </div>
                        </div>
                      )}

                      {/* MP */}
                      {dw.MP_NAME && (
                        <div className="mospi-dossier-work-field">
                          <div className="mospi-dossier-field-label">
                            <CheckCircle2 size={12} />
                            Recommending MP
                          </div>
                          <div className="mospi-dossier-field-val">
                            {dw.MP_NAME}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mospi-modal-footer">
                    <button
                      type="button"
                      className="mospi-back-btn"
                      onClick={handleBackToInspect}
                      style={{ fontSize: "12px" }}
                    >
                      <ArrowLeft size={13} />
                      Back to Inspection List
                    </button>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {typeof onSelectWork === "function" && (
                        <button
                          type="button"
                          className="mospi-action-btn primary"
                          onClick={() => handleOpenFullDossier(dossierWork)}
                          style={{ fontSize: "12px", padding: "5px 14px" }}
                          title="Open the complete 78-field audit dossier"
                        >
                          <ExternalLink size={12} />
                          Open Full Dossier
                        </button>
                      )}
                      <button
                        type="button"
                        className="mospi-action-btn secondary"
                        onClick={closeAll}
                        style={{ fontSize: "12px", padding: "5px 14px" }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
