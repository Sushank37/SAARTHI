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
    <div className="compact-page-container">
      {/* Title */}
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">eSAKSHI REPOSITORY / ALL CONSTITUENCIES</div>
          <h2>MPLADS Works Explorer</h2>
          <p>
            Search, filter, and audit individual developmental works across 102,703 projects nationwide.
          </p>
        </div>

        {/* Official Export Buttons (Matching Screenshot 1) */}
        <div className="official-export-group">
          <button className="gov-export-btn excel" onClick={handleExportCSV}>
            <FileSpreadsheet size={15} />
            <span>Excel</span>
          </button>
          <button className="gov-export-btn csv" onClick={handleExportCSV}>
            <FileText size={15} />
            <span>CSV</span>
          </button>
          <button className="gov-export-btn pdf" onClick={handlePrint}>
            <Printer size={15} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="gov-card full-width-card">
        <div className="explorer-filters-grid">
          <div className="search-field">
            <label>Search Keyword / ID:</label>
            <div className="search-input-box">
              <Search size={15} />
              <input
                type="text"
                value={q}
                onChange={(e) => setFilter("q", e.target.value)}
                placeholder="Search ID, description, MP, constituency..."
              />
            </div>
          </div>

          <div className="filter-select-field">
            <label>Filter by State / UT:</label>
            <select value={state} onChange={(e) => setFilter("state", e.target.value)}>
              <option value="">All States & UTs</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-field">
            <label>Financial Risk Level:</label>
            <select value={risk} onChange={(e) => setFilter("risk_level", e.target.value)}>
              <option value="">All Risk Tiers</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          <div className="filter-select-field">
            <label>Duplicate Level:</label>
            <select
              value={duplicate}
              onChange={(e) => setFilter("duplicate_risk", e.target.value)}
            >
              <option value="">All Duplicate Tiers</option>
              <option value="HIGH">High Duplicate Risk</option>
              <option value="MEDIUM">Medium Duplicate Risk</option>
              <option value="LOW">Low Duplicate Risk</option>
            </select>
          </div>
        </div>

        {/* Results Metadata */}
        <div className="table-meta-bar">
          <span>
            Showing page <strong>{page}</strong> of <strong>{result.pages || 1}</strong> (
            <strong>{formatNumber(result.total)}</strong> matching MPLADS works)
          </span>
        </div>

        {/* Master Table */}
        <div className="table-responsive">
          <table className="gov-data-table">
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
                  <td colSpan={10} className="text-center py-5">
                    <div className="spinner" /> Loading eSAKSHI work records...
                  </td>
                </tr>
              ) : result.data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-5">
                    No records found matching the applied filters.
                  </td>
                </tr>
              ) : (
                result.data.map((item, idx) => {
                  const srNo = (page - 1) * 50 + idx + 1;
                  const riskLvl = String(item.RISK_LEVEL || "LOW").toUpperCase();
                  const dupLvl = String(item.DUPLICATE_RISK || "NONE").toUpperCase();
                  return (
                    <tr key={idx} onClick={() => onSelectWork && onSelectWork(item)}>
                      <td>{srNo}</td>
                      <td>
                        <strong>#{item.WORK_ID || item.WORK_RECOMMENDATION_DTL_ID}</strong>
                      </td>
                      <td>
                        <div>{item.STATE_NAME}</div>
                        <small className="block-muted">{item.CONSTITUENCY}</small>
                      </td>
                      <td>{item.MP_NAME || "Hon'ble MP"}</td>
                      <td className="truncate-cell">{item.WORK_CATEGORY || "General"}</td>
                      <td>{formatCurrency(item.SANCTION_AMOUNT)}</td>
                      <td>
                        <span className={`risk-tag ${riskLvl.toLowerCase()}`}>
                          {riskLvl} ({formatDecimal(item.RISK_SCORE)})
                        </span>
                      </td>
                      <td>
                        <span className={`risk-tag ${dupLvl === "HIGH" ? "danger" : "neutral"}`}>
                          {dupLvl}
                        </span>
                      </td>
                      <td>{item.WORK_STAGE || "Sanctioned"}</td>
                      <td>
                        <button className="table-action-btn">Inspect Dossier →</button>
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
          <div className="gov-pagination-bar">
            <button
              disabled={page <= 1}
              onClick={() => setFilter("page", String(page - 1))}
              className="gov-page-btn"
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {page} of {result.pages}
            </span>
            <button
              disabled={page >= result.pages}
              onClick={() => setFilter("page", String(page + 1))}
              className="gov-page-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
