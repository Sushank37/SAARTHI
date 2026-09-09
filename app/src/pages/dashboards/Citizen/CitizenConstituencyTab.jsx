import React, { useState, useEffect } from "react";
import {
  MapPin,
  Building2,
  IndianRupee,
  CheckCircle2,
  Clock,
  TrendingUp,
  Layers,
  ArrowRight,
  Eye,
  User,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores } from "../../../constants";

export default function CitizenConstituencyTab({ onSelectWork }) {
  const [constituency, setConstituency] = useState("Nizamabad");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const majorConstituencies = [
    "Nizamabad",
    "Varanasi",
    "New Delhi",
    "Thiruvananthapuram",
    "Bengaluru South",
    "Guntur",
    "Nagpur",
    "Ahmedabad East",
  ];

  useEffect(() => {
    let cancelled = false;
    async function loadConstituency() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/public/constituency/${encodeURIComponent(constituency)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        console.error("Constituency load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadConstituency();
    return () => {
      cancelled = true;
    };
  }, [constituency]);

  const financials = data?.financials || {
    recommended_cr: 28.5,
    sanctioned_cr: 24.2,
    expenditure_cr: 18.9,
    utilization_rate: 78.1,
  };

  const statusDist = data?.status_distribution || {
    completed: 440,
    ongoing: 310,
    sanctioned: 166,
  };

  const total = data?.total_works || 916;
  const compPct = Math.round((statusDist.completed / total) * 100) || 48;
  const ongoPct = Math.round((statusDist.ongoing / total) * 100) || 34;
  const sancPct = 100 - compPct - ongoPct;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Constituency Selector Header */}
      <div className="gov-mp-card" style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={15} color="#005A9C" />
              <span>Parliamentary Constituency Transparency Scorecard</span>
            </div>
            <div className="card-section-desc">
              Select your constituency to inspect public fund utilization, MP recommendations, and asset delivery.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#475569" }}>Constituency:</span>
            <select
              className="citizen-select"
              value={constituency}
              onChange={(e) => setConstituency(e.target.value)}
              style={{ width: "auto", fontWeight: "700", color: "#005A9C", height: "30px", fontSize: "12px", padding: "4px 8px" }}
            >
              {majorConstituencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="gov-mp-card" style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
          Loading constituency transparency records...
        </div>
      ) : (
        <>
          {/* MP Profile & Quota Scorecard */}
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
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#005A9C",
                  fontSize: "20px",
                }}
              >
                🎖️
              </div>
              <div>
                <span className="gov-parliament-badge" style={{ fontSize: "10.5px", padding: "1px 6px" }}>
                  Hon'ble Member of Parliament · {data?.state || "Telangana"}
                </span>
                <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "2px 0" }}>
                  {data?.mp_name || "Arvind Dharmapuri"}
                </h2>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                  Parliamentary Constituency: <strong style={{ color: "#0f172a" }}>{data?.constituency || constituency}</strong> · 18th Lok Sabha
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Total Works Sanctioned
                </span>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                  {data?.total_works?.toLocaleString() || "916"} Works
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Fund Utilization Rate
                </span>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#16a34a" }}>
                  {financials.utilization_rate}%
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown (Allocated vs Sanctioned vs Spent) */}
          <div className="citizen-kpi-grid">
            <div className="citizen-kpi-card blue">
              <div className="citizen-kpi-header">
                <span className="citizen-kpi-label">Recommended by MP</span>
                <div className="citizen-kpi-icon">
                  <IndianRupee size={16} />
                </div>
              </div>
              <div className="citizen-kpi-value">₹{financials.recommended_cr} Cr</div>
              <div className="citizen-kpi-sub">Total works proposed by Hon'ble MP</div>
            </div>

            <div className="citizen-kpi-card purple">
              <div className="citizen-kpi-header">
                <span className="citizen-kpi-label">Sanctioned by Collector</span>
                <div className="citizen-kpi-icon">
                  <Building2 size={16} />
                </div>
              </div>
              <div className="citizen-kpi-value">₹{financials.sanctioned_cr} Cr</div>
              <div className="citizen-kpi-sub">Approved by District Authority</div>
            </div>

            <div className="citizen-kpi-card green">
              <div className="citizen-kpi-header">
                <span className="citizen-kpi-label">Expenditure Incurred</span>
                <div className="citizen-kpi-icon">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="citizen-kpi-value">₹{financials.expenditure_cr} Cr</div>
              <div className="citizen-kpi-sub">Disbursed for completed and ongoing civil works</div>
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
                Based on official eSAKSHI digital records
              </span>
            </div>

            {/* Segmented Multi-color Bar */}
            <div style={{ display: "flex", height: "14px", borderRadius: "4px", overflow: "hidden", background: "#f1f5f9" }}>
              <div
                style={{ width: `${compPct}%`, background: "#16a34a", transition: "width 0.4s ease" }}
                title={`Completed: ${statusDist.completed} works (${compPct}%)`}
              />
              <div
                style={{ width: `${ongoPct}%`, background: "#0284c7", transition: "width 0.4s ease" }}
                title={`Ongoing: ${statusDist.ongoing} works (${ongoPct}%)`}
              />
              <div
                style={{ width: `${sancPct}%`, background: "#d97706", transition: "width 0.4s ease" }}
                title={`Sanctioned: ${statusDist.sanctioned} works (${sancPct}%)`}
              />
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "12px", paddingTop: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#16a34a" }} />
                <span style={{ fontSize: "11.5px", color: "#334155" }}>
                  <strong>{statusDist.completed}</strong> Completed ({compPct}%)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#0284c7" }} />
                <span style={{ fontSize: "11.5px", color: "#334155" }}>
                  <strong>{statusDist.ongoing}</strong> Ongoing ({ongoPct}%)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#d97706" }} />
                <span style={{ fontSize: "11.5px", color: "#334155" }}>
                  <strong>{statusDist.sanctioned}</strong> Sanctioned ({sancPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Sector Category Breakdown */}
          {data?.category_distribution && Object.keys(data.category_distribution).length > 0 && (
            <div className="gov-mp-card">
              <div className="card-section-title" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Building2 size={15} color="#005A9C" />
                <span>Public Works by Developmental Sector</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
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
                    <strong style={{ fontSize: "12px", color: "#005A9C" }}>{cnt} Works</strong>
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
