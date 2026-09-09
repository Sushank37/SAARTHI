import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Map,
  Search,
  Download,
  ShieldAlert,
  ClipboardCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { API_BASE, formatNumber, exportToCSV } from "../constants";

export default function StateIntelligence() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/states`)
      .then((res) => res.json())
      .then((data) => setStates(data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredStates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return states
      .filter((s) => !q || (s.STATE_NAME && s.STATE_NAME.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.REVIEW_REQUIRED || 0) - Number(a.REVIEW_REQUIRED || 0));
  }, [states, search]);

  const handleExport = () => {
    exportToCSV(states, "mplads_state_intelligence_summary.csv");
  };

  return (
    <div className="gov-mp-shell">
      {/* Page Title & Breadcrumb Header Card */}
      <div className="gov-mp-header-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <span className="gov-parliament-badge" style={{ background: "#eff6ff", color: "#005A9C", borderColor: "#bfdbfe" }}>
                <Map size={12} />
                <span>Pan-India Performance · eSAKSHI Integration</span>
              </span>
            </div>
            <h1 className="gov-mp-page-title" style={{ fontSize: "18px", margin: "2px 0" }}>
              State & Union Territory Overview
            </h1>
            <p className="gov-mp-page-subtitle">
              Comparative progress of MPLADS work volume, financial risk exposure, and audit workload across all States and UTs. Click any state to explore its individual works.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button className="gov-redirect-link-btn" onClick={handleExport}>
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="gov-mp-card">
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
          <div style={{ position: "relative", flexGrow: 1, maxWidth: "420px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#64748b" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search State or Union Territory..."
              style={{
                width: "100%",
                height: "32px",
                paddingLeft: "32px",
                paddingRight: "10px",
                fontSize: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                background: "#ffffff",
              }}
            />
          </div>
          <span className="gov-parliament-badge" style={{ marginLeft: "auto" }}>
            {filteredStates.length} States & UTs analyzed
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="gov-mp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>State / Union Territory</th>
                <th>Total Works</th>
                <th>High Risk Works</th>
                <th>Medium Risk</th>
                <th>Duplicate Flags</th>
                <th>Audit Review Cases</th>
                <th>Review Rate</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
                    Loading State metrics...
                  </td>
                </tr>
              ) : (
                filteredStates.map((item, idx) => {
                  const total = Number(item.TOTAL_WORKS || 0);
                  const review = Number(item.REVIEW_REQUIRED || 0);
                  const rate = total ? ((review / total) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={idx}>
                      <td>
                        <strong style={{ color: "#0f172a" }}>{item.STATE_NAME || "State Unknown"}</strong>
                      </td>
                      <td><strong>{formatNumber(total)}</strong></td>
                      <td>
                        <span style={{ color: Number(item.HIGH_RISK) > 0 ? "#dc2626" : "#475569", fontWeight: "700" }}>
                          {formatNumber(item.HIGH_RISK)}
                        </span>
                      </td>
                      <td>{formatNumber(item.MEDIUM_RISK)}</td>
                      <td>{formatNumber(item.HIGH_DUPLICATE)}</td>
                      <td>
                        <strong style={{ color: "#d97706" }}>{formatNumber(review)}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ height: "6px", width: "60px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, Number(rate))}%`,
                                background: Number(rate) > 20 ? "#dc2626" : "#0284c7",
                                borderRadius: "3px",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "11.5px", fontWeight: "600" }}>{rate}%</span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="gov-redirect-link-btn"
                          onClick={() => navigate(`/works?state=${encodeURIComponent(item.STATE_NAME)}`)}
                        >
                          <span>View Works</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
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
