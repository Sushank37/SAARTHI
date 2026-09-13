import { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  RefreshCw,
  Clock,
  IndianRupee,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  API_BASE,
  formatNumber,
  formatDecimal,
  formatCurrency,
  exportToCSV,
} from "../constants";
import { useAuth } from "../context/useAuth";

export default function RiskIntelligence({ onSelectWork }) {
  const { role, roleConfig } = useAuth() || {};
  const currentAuthority = (roleConfig?.id || role || "DISTRICT_AUTHORITY").toUpperCase();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [riskFactors, setRiskFactors] = useState(null);

  const PAGE_SIZE = 12;

  const loadCases = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });
      if (level !== "ALL") {
        params.append("level", level);
      }
      const res = await fetch(`${API_BASE}/api/risk-cases?${params.toString()}`);
      const data = await res.json();
      setCases(data.data || []);
      setTotalCases(data.total || 0);
      setTotalPages(data.pages || 1);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCases = async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: String(PAGE_SIZE),
        });
        if (level !== "ALL") {
          params.append("level", level);
        }
        const res = await fetch(`${API_BASE}/api/risk-cases?${params.toString()}`);
        const data = await res.json();
        if (isMounted) {
          setCases(data.data || []);
          setTotalCases(data.total || 0);
          setTotalPages(data.pages || 1);
          setPage(1);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };
    fetchCases();
    return () => {
      isMounted = false;
    };
  }, [level]);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/api/analytics/risk-factors`)
      .then((r) => r.json())
      .then((data) => {
        if (isMounted) setRiskFactors(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((item) =>
      [
        item.WORK_ID,
        item.STATE_NAME,
        item.CONSTITUENCY,
        item.MP_NAME,
        item.WORK_NAME,
        item.RISK_REASON,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [cases, search]);

  const handleExport = () => {
    exportToCSV(cases, `mplads_risk_cases_page_${page}.csv`);
  };

  return (
    <div className="gov-mp-shell">
      {/* Page Title & Breadcrumb Header Card */}
      <div className="gov-mp-header-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <span className="gov-parliament-badge" style={{ background: "#fef2f2", color: "#b91c1c", borderColor: "#fca5a5" }}>
                <ShieldAlert size={12} />
                <span>AI Risk Surveillance · eSAKSHI Integration</span>
              </span>
            </div>
            <h1 className="gov-mp-page-title" style={{ fontSize: "18px", margin: "2px 0" }}>
              Cost Anomaly & Delay Review
            </h1>
            <p className="gov-mp-page-subtitle">
              Monitors sanction delays, abnormal execution timelines, and budget outliers benchmarked against State and Category peer medians.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button className="gov-redirect-link-btn" onClick={handleExport}>
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button
              className="gov-redirect-link-btn"
              style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#005A9C" }}
              onClick={() => loadCases(page)}
            >
              <RefreshCw size={13} />
              <span>Refresh List</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Risk Dimensions Bar */}
      <div className="gov-mp-kpi-grid">
        <div className="gov-mp-kpi-card kpi-amber">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#475569" }}>
              Sanction Timeline Index
            </span>
            <Clock size={15} color="#d97706" />
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
            {formatDecimal(riskFactors?.delay_risk || 46.2)} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>/ 100</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Sanction delay vs peer median</div>
        </div>

        <div className="gov-mp-kpi-card kpi-rose">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#475569" }}>
              Execution Duration Index
            </span>
            <Activity size={15} color="#e11d48" />
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
            {formatDecimal(riskFactors?.completion_risk || 52.8)} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>/ 100</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Duration vs 1-year guideline</div>
        </div>

        <div className="gov-mp-kpi-card kpi-blue">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#475569" }}>
              Cost Outlier Index
            </span>
            <IndianRupee size={15} color="#0284c7" />
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
            {formatDecimal(riskFactors?.cost_risk || 41.5)} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>/ 100</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Budget vs category median</div>
        </div>

        <div className="gov-mp-kpi-card kpi-teal">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#475569" }}>
              Cost Variance Index
            </span>
            <TrendingUp size={15} color="#0d9488" />
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
            {formatDecimal(riskFactors?.variance_risk || 38.1)} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>/ 100</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Expenditure vs sanction</div>
        </div>
      </div>

      {/* Table & Filter Card */}
      <div className="gov-mp-card">
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
          <div style={{ position: "relative", flexGrow: 1, maxWidth: "420px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#64748b" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work ID, MP name, state, constituency..."
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

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#64748b" />
            <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#475569" }}>Risk Tier:</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{
                height: "32px",
                fontSize: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                padding: "0 8px",
                background: "#ffffff",
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              <option value="ALL">All Flagged Works</option>
              <option value="HIGH">High Priority Only (&ge; 60)</option>
              <option value="MEDIUM">Moderate Priority (&ge; 35)</option>
            </select>
          </div>

          <span className="gov-parliament-badge" style={{ marginLeft: "auto" }}>
            Showing {formatNumber(totalCases)} flagged works
          </span>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="gov-mp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Work ID</th>
                <th>State & Constituency</th>
                <th>Recommending MP</th>
                <th>Sanction Amount</th>
                <th>Risk Score</th>
                <th>Delay vs Peer</th>
                <th>Cost Variance</th>
                <th>AI Explanation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
                    Loading risk records...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
                    No risk cases match the current search or filters.
                  </td>
                </tr>
              ) : (
                filteredCases.map((item, idx) => (
                  <tr key={idx}>
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
                    <td><strong>{formatCurrency(item.SANCTION_AMOUNT)}</strong></td>
                    <td>
                      <span
                        className="gov-parliament-badge"
                        style={{
                          background: item.RISK_LEVEL === "HIGH" ? "#fef2f2" : "#fffbeb",
                          color: item.RISK_LEVEL === "HIGH" ? "#b91c1c" : "#b45309",
                          borderColor: item.RISK_LEVEL === "HIGH" ? "#fecaca" : "#fde68a",
                        }}
                      >
                        {formatDecimal(item.RISK_SCORE)} ({item.RISK_LEVEL})
                      </span>
                    </td>
                    <td>
                      {item.SANCTION_DELAY_VS_PEER
                        ? `${formatDecimal(item.SANCTION_DELAY_VS_PEER)}x`
                        : "—"}
                    </td>
                    <td>
                      <span style={{ color: Number(item.COST_VARIANCE) > 0 ? "#dc2626" : "#16a34a", fontWeight: "700" }}>
                        {formatDecimal(item.COST_VARIANCE_PERCENT)}%
                      </span>
                    </td>
                    <td style={{ maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "11.5px" }}>
                      {item.RISK_REASON || "Flagged by peer benchmark"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="gov-redirect-link-btn"
                        title="Inspect AI Risk Anomalies & Forensic Scoring Dossier"
                        onClick={() =>
                          onSelectWork &&
                          onSelectWork({
                            ...item,
                            __initialSection: "risk",
                            __authority: currentAuthority,
                          })
                        }
                      >
                        Inspect Risk Audit Dossier →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
            <button
              disabled={page <= 1}
              onClick={() => loadCases(page - 1)}
              className="gov-redirect-link-btn"
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadCases(page + 1)}
              className="gov-redirect-link-btn"
              style={{ opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
