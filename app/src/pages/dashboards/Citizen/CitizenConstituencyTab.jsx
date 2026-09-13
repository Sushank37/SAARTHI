import { useState, useEffect } from "react";
import {
  MapPin,
  Building2,
  IndianRupee,
  CheckCircle2,
  Layers,
  User,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { API_BASE, formatNumber } from "../../../constants";

export default function CitizenConstituencyTab() {
  const [constituency, setConstituency] = useState("Nizamabad");
  const [constituencyList, setConstituencyList] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load available parliamentary constituencies from backend
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
        console.error("Failed to load constituencies list:", e);
      }
    }
    loadConstituencies();
  }, []);

  // Fetch real data for selected constituency
  useEffect(() => {
    let cancelled = false;
    async function loadConstituencyData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/public/constituency/${encodeURIComponent(constituency)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        console.error("Constituency load error:", err);
        if (!cancelled) {
          setError(`Unable to load data for constituency '${constituency}'.`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadConstituencyData();
    return () => {
      cancelled = true;
    };
  }, [constituency]);

  const financials = data?.financials;
  const statusDist = data?.status_distribution;
  const total = data?.total_works || 0;

  const compCount = statusDist?.completed || 0;
  const ongoCount = statusDist?.ongoing || 0;
  const sancCount = statusDist?.sanctioned || 0;

  const compPct = total > 0 ? Math.round((compCount / total) * 100) : 0;
  const ongoPct = total > 0 ? Math.round((ongoCount / total) * 100) : 0;
  const sancPct = total > 0 ? Math.max(0, 100 - compPct - ongoPct) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Constituency Selector Header */}
      <div className="gov-mp-card" style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={15} color="#005A9C" />
              <span>Parliamentary Constituency Transparency Scorecard</span>
            </div>
            <div className="card-section-desc">
              Select any parliamentary constituency to inspect live MPLADS allocation, MP recommendations, and asset execution.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#475569" }}>Constituency:</span>
            <select
              className="gov-select citizen-select"
              value={constituency}
              onChange={(e) => setConstituency(e.target.value)}
              style={{ width: "auto", fontWeight: "700", color: "#005A9C", height: "32px", fontSize: "12px", padding: "0 10px" }}
            >
              {constituencyList.length > 0 ? (
                constituencyList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              ) : (
                <>
                  <option value="Nizamabad">Nizamabad</option>
                  <option value="Varanasi">Varanasi</option>
                  <option value="New Delhi">New Delhi</option>
                  <option value="Guntur">Guntur</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="gov-mp-card" style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "13px" }}>
          <RefreshCw size={18} className="spin-icon" style={{ display: "inline-block", marginRight: "8px" }} />
          Loading official records for {constituency}...
        </div>
      ) : error ? (
        <div className="gov-mp-card" style={{ textAlign: "center", padding: "20px", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca" }}>
          <AlertTriangle size={18} style={{ display: "inline-block", marginRight: "6px" }} />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* MP Profile Banner Card */}
          <div
            className="gov-mp-card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              padding: "12px 16px",
              borderLeft: "4px solid #005A9C",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#005A9C",
                  fontSize: "18px",
                }}
              >
                <User size={22} color="#005A9C" />
              </div>
              <div>
                <span className="gov-parliament-badge" style={{ fontSize: "10.5px", padding: "1px 6px" }}>
                  Hon'ble Member of Parliament · {data?.state}
                </span>
                <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "2px 0" }}>
                  {data?.mp_name}
                </h2>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                  Constituency: <strong style={{ color: "#0f172a" }}>{data?.constituency}</strong> · 18th Lok Sabha
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Total Works Sanctioned
                </span>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                  {formatNumber(data?.total_works || 0)} Works
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Fund Utilization Rate
                </span>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#0d9488" }}>
                  {financials?.utilization_rate ?? 0}%
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Gold Standard Financial KPI Grid */}
          <div className="gov-mp-kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="gov-mp-kpi-card kpi-blue">
              <div className="kpi-header">
                <span className="kpi-title">Recommended by MP</span>
                <IndianRupee size={14} color="#0284c7" />
              </div>
              <div className="kpi-value">
                {financials?.recommended_cr != null ? `₹ ${financials.recommended_cr} Cr` : "N/A"}
              </div>
              <div className="kpi-sub">Total developmental works proposed</div>
            </div>

            <div className="gov-mp-kpi-card kpi-indigo">
              <div className="kpi-header">
                <span className="kpi-title">Sanctioned by District Authority</span>
                <Building2 size={14} color="#6366f1" />
              </div>
              <div className="kpi-value">
                {financials?.sanctioned_cr != null ? `₹ ${financials.sanctioned_cr} Cr` : "N/A"}
              </div>
              <div className="kpi-sub">Technically and administratively approved</div>
            </div>

            <div className="gov-mp-kpi-card kpi-teal">
              <div className="kpi-header">
                <span className="kpi-title">Expenditure Incurred</span>
                <CheckCircle2 size={14} color="#0d9488" />
              </div>
              <div className="kpi-value">
                {financials?.expenditure_cr != null ? `₹ ${financials.expenditure_cr} Cr` : "N/A"}
              </div>
              <div className="kpi-sub">Verified disbursement on ground assets</div>
            </div>
          </div>

          {/* Work Status Distribution Progress Bar */}
          <div className="gov-mp-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={15} color="#005A9C" />
                <span>Work Delivery Status Breakdown</span>
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Total {formatNumber(total)} records in official MPLADS registry
              </span>
            </div>

            {/* Segmented Multi-color Bar */}
            <div style={{ display: "flex", height: "12px", borderRadius: "4px", overflow: "hidden", background: "#f1f5f9" }}>
              <div
                style={{ width: `${compPct}%`, background: "#0d9488", transition: "width 0.4s ease" }}
                title={`Completed: ${compCount} works (${compPct}%)`}
              />
              <div
                style={{ width: `${ongoPct}%`, background: "#0284c7", transition: "width 0.4s ease" }}
                title={`Ongoing: ${ongoCount} works (${ongoPct}%)`}
              />
              <div
                style={{ width: `${sancPct}%`, background: "#d97706", transition: "width 0.4s ease" }}
                title={`Sanctioned: ${sancCount} works (${sancPct}%)`}
              />
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "12px", paddingTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#0d9488" }} />
                <span style={{ fontSize: "11.5px", color: "#334155" }}>
                  <strong>{formatNumber(compCount)}</strong> Completed ({compPct}%)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#0284c7" }} />
                <span style={{ fontSize: "11.5px", color: "#334155" }}>
                  <strong>{formatNumber(ongoCount)}</strong> Ongoing ({ongoPct}%)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#d97706" }} />
                <span style={{ fontSize: "11.5px", color: "#334155" }}>
                  <strong>{formatNumber(sancCount)}</strong> Sanctioned ({sancPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Sector Category Breakdown */}
          {data?.category_distribution && Object.keys(data.category_distribution).length > 0 && (
            <div className="gov-mp-card">
              <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Building2 size={15} color="#005A9C" />
                <span>Public Works by Priority Sector</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                {Object.entries(data.category_distribution).map(([cat, cnt]) => (
                  <div
                    key={cat}
                    style={{
                      padding: "8px 12px",
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#334155" }}>{cat}</span>
                    <strong style={{ fontSize: "12px", color: "#005A9C" }}>{formatNumber(cnt)} Works</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
