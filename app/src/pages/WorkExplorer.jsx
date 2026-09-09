import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Database,
  Search,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronRight,
} from "lucide-react";
import {
  API_BASE,
  formatNumber,
  formatDecimal,
  formatCurrency,
  exportToCSV,
} from "../constants";

export default function WorkExplorer({ onSelectWork }) {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState({ data: [], total: 0, pages: 0 });
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  const q = params.get("q") || "";
  const state = params.get("state") || "";
  const mpName = params.get("mp_name") || "";
  const risk = params.get("risk_level") || "";
  const duplicate = params.get("duplicate_risk") || "";
  const review = params.get("requires_review") || "";
  const page = Number(params.get("page") || 1);

  useEffect(() => {
    fetch(`${API_BASE}/api/states`)
      .then((r) => r.json())
      .then((d) => setStates(d.states || []))
      .catch(() => {});
  }, []);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (q) query.set("q", q);
      if (state) query.set("state", state);
      if (mpName) query.set("mp_name", mpName);
      if (risk) query.set("risk_level", risk);
      if (duplicate) query.set("duplicate_risk", duplicate);
      if (review) query.set("requires_review", review);

      const res = await fetch(`${API_BASE}/api/works?${query}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorks();
  }, [q, state, risk, duplicate, review, page]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set("page", "1");
    setParams(next);
  };

  const handleExportCSV = () => {
    exportToCSV(result.data, `esakshi_works_filtered_p${page}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="gov-mp-shell">
      {/* Title Header Card */}
      <div className="gov-mp-header-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <span className="gov-parliament-badge" style={{ background: "#eff6ff", color: "#005A9C", borderColor: "#bfdbfe" }}>
                <Database size={12} />
                <span>Pan-India Repository · eSAKSHI Integration</span>
              </span>
            </div>
            <h1 className="gov-mp-page-title" style={{ fontSize: "18px", margin: "2px 0" }}>
              MPLADS Works Explorer
            </h1>
            <p className="gov-mp-page-subtitle">
              Search, filter, and audit individual developmental works across 102,703 projects nationwide.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button className="gov-redirect-link-btn" onClick={handleExportCSV}>
              <FileSpreadsheet size={13} />
              <span>Excel</span>
            </button>
            <button className="gov-redirect-link-btn" onClick={handleExportCSV}>
              <FileText size={13} />
              <span>CSV</span>
            </button>
            <button className="gov-redirect-link-btn" onClick={handlePrint}>
              <Printer size={13} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Table Card */}
      <div className="gov-mp-card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>Search Keyword / ID:</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#64748b" }} />
              <input
                type="text"
                value={q}
                onChange={(e) => setFilter("q", e.target.value)}
                placeholder="Search ID, MP, description..."
                style={{
                  width: "100%",
                  height: "32px",
                  paddingLeft: "32px",
                  paddingRight: "8px",
                  fontSize: "12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>Filter by State / UT:</label>
            <select
              value={state}
              onChange={(e) => setFilter("state", e.target.value)}
              style={{
                width: "100%",
                height: "32px",
                fontSize: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                padding: "0 8px",
                background: "#ffffff",
              }}
            >
              <option value="">All States & UTs</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>Financial Risk Level:</label>
            <select
              value={risk}
              onChange={(e) => setFilter("risk_level", e.target.value)}
              style={{
                width: "100%",
                height: "32px",
                fontSize: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                padding: "0 8px",
                background: "#ffffff",
              }}
            >
              <option value="">All Risk Tiers</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>Duplicate Level:</label>
            <select
              value={duplicate}
              onChange={(e) => setFilter("duplicate_risk", e.target.value)}
              style={{
                width: "100%",
                height: "32px",
                fontSize: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                padding: "0 8px",
                background: "#ffffff",
              }}
            >
              <option value="">All Duplicate Tiers</option>
              <option value="HIGH">High Duplicate Risk</option>
              <option value="MEDIUM">Medium Duplicate Risk</option>
              <option value="LOW">Low Duplicate Risk</option>
            </select>
          </div>
        </div>

        {/* Results Metadata */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", padding: "6px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", marginBottom: "8px" }}>
          <span style={{ fontSize: "11.5px", color: "#475569" }}>
            Showing page <strong>{page}</strong> of <strong>{result.pages || 1}</strong> (
            <strong style={{ color: "#005A9C" }}>{formatNumber(result.total)}</strong> matching MPLADS works)
          </span>
          {mpName && (
            <span className="gov-parliament-badge" style={{ background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }}>
              Filtered for Hon'ble MP: {mpName}
              <button 
                type="button"
                onClick={() => setFilter("mp_name", "")} 
                style={{ background: "none", border: "none", cursor: "pointer", color: "#0369a1", fontWeight: 800, fontSize: "13px", marginLeft: "4px", lineHeight: 1 }}
                title="Clear MP filter"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {/* Master Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="gov-mp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Work ID</th>
                <th>State & Constituency</th>
                <th>Recommending MP</th>
                <th>Category</th>
                <th>Sanction Amount</th>
                <th>Risk Tier</th>
                <th>Duplicate Status</th>
                <th>Work Stage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
                    Loading eSAKSHI work records...
                  </td>
                </tr>
              ) : result.data.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
                    No records found matching the applied filters.
                  </td>
                </tr>
              ) : (
                result.data.map((item, idx) => {
                  const srNo = (page - 1) * 15 + idx + 1;
                  const riskLvl = String(item.RISK_LEVEL || "LOW").toUpperCase();
                  const dupLvl = String(item.DUPLICATE_RISK || "NONE").toUpperCase();
                  return (
                    <tr key={idx}>
                      <td>{srNo}</td>
                      <td>
                        <strong style={{ fontFamily: "monospace", color: "#005A9C", fontSize: "12px" }}>
                          #{item.WORK_ID || item.WORK_RECOMMENDATION_DTL_ID}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: "600" }}>{item.STATE_NAME}</div>
                        <small style={{ color: "#64748b", fontSize: "11px" }}>{item.CONSTITUENCY}</small>
                      </td>
                      <td>{item.MP_NAME || "Hon'ble MP"}</td>
                      <td style={{ maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "11.5px" }}>
                        {item.WORK_CATEGORY || "General"}
                      </td>
                      <td><strong>{formatCurrency(item.SANCTION_AMOUNT)}</strong></td>
                      <td>
                        <span
                          className="gov-parliament-badge"
                          style={{
                            background: riskLvl === "HIGH" ? "#fef2f2" : "#fffbeb",
                            color: riskLvl === "HIGH" ? "#b91c1c" : "#b45309",
                            borderColor: riskLvl === "HIGH" ? "#fecaca" : "#fde68a",
                          }}
                        >
                          {riskLvl} ({formatDecimal(item.RISK_SCORE)})
                        </span>
                      </td>
                      <td>
                        <span
                          className="gov-parliament-badge"
                          style={{
                            background: dupLvl === "HIGH" ? "#fef2f2" : "#f8fafc",
                            color: dupLvl === "HIGH" ? "#b91c1c" : "#64748b",
                            borderColor: dupLvl === "HIGH" ? "#fecaca" : "#cbd5e1",
                          }}
                        >
                          {dupLvl}
                        </span>
                      </td>
                      <td style={{ fontSize: "11.5px", fontWeight: "600", color: "#334155" }}>
                        {item.WORK_STAGE || "Sanctioned"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="gov-redirect-link-btn"
                          onClick={() => onSelectWork && onSelectWork(item)}
                        >
                          Inspect Dossier →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {result.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
            <button
              disabled={page <= 1}
              onClick={() => setFilter("page", String(page - 1))}
              className="gov-redirect-link-btn"
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
              Page {page} of {result.pages}
            </span>
            <button
              disabled={page >= result.pages}
              onClick={() => setFilter("page", String(page + 1))}
              className="gov-redirect-link-btn"
              style={{ opacity: page >= result.pages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
