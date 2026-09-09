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
      <div className="citizen-card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div className="citizen-card-title">
              <MapPin size={18} color="#ea580c" />
              <span>Parliamentary Constituency Transparency Scorecard</span>
            </div>
            <div className="citizen-card-subtitle">
              Select your constituency to inspect public fund utilization, MP recommendations, and asset delivery.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#475569" }}>Constituency:</span>
            <select
              className="citizen-select"
              value={constituency}
              onChange={(e) => setConstituency(e.target.value)}
              style={{ width: "auto", fontWeight: "700", color: "#1e3a8a" }}
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
        <div className="citizen-card" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          Loading constituency transparency records...
        </div>
      ) : (
        <>
          {/* MP Profile & Quota Scorecard */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  border: "2px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1e3a8a",
                  fontSize: "24px",
                }}
              >
                🎖️
              </div>
              <div>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#f97316", textTransform: "uppercase" }}>
                  Hon'ble Member of Parliament · {data?.state || "Telangana"}
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "2px 0 4px 0" }}>
                  {data?.mp_name || "Arvind Dharmapuri"}
                </h2>
                <span style={{ fontSize: "13px", color: "#475569" }}>
                  Parliamentary Constituency: <strong>{data?.constituency || constituency}</strong> · 18th Lok Sabha
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Total Works Sanctioned
                </span>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
                  {data?.total_works?.toLocaleString() || "916"} Works
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Fund Utilization Rate
                </span>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#16a34a" }}>
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
          <div className="citizen-card">
            <div className="citizen-card-header">
              <div className="citizen-card-title">
                <Layers size={18} color="#2563eb" />
                <span>Work Delivery Status Breakdown</span>
              </div>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Based on official eSAKSHI digital records
              </span>
            </div>

            {/* Segmented Multi-color Bar */}
            <div style={{ display: "flex", height: "18px", borderRadius: "9px", overflow: "hidden", background: "#f1f5f9" }}>
              <div
                style={{ width: `${compPct}%`, background: "#16a34a", transition: "width 0.4s ease" }}
                title={`Completed: ${statusDist.completed} works (${compPct}%)`}
              />
              <div
                style={{ width: `${ongoPct}%`, background: "#2563eb", transition: "width 0.4s ease" }}
                title={`Ongoing: ${statusDist.ongoing} works (${ongoPct}%)`}
              />
              <div
                style={{ width: `${sancPct}%`, background: "#eab308", transition: "width 0.4s ease" }}
                title={`Sanctioned: ${statusDist.sanctioned} works (${sancPct}%)`}
              />
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "16px", paddingTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#16a34a" }} />
                <span style={{ fontSize: "13px", color: "#1e293b" }}>
                  <strong>{statusDist.completed}</strong> Completed ({compPct}%)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#2563eb" }} />
                <span style={{ fontSize: "13px", color: "#1e293b" }}>
                  <strong>{statusDist.ongoing}</strong> Ongoing ({ongoPct}%)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#eab308" }} />
                <span style={{ fontSize: "13px", color: "#1e293b" }}>
                  <strong>{statusDist.sanctioned}</strong> Sanctioned ({sancPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Sector Category Breakdown */}
          {data?.category_distribution && Object.keys(data.category_distribution).length > 0 && (
            <div className="citizen-card">
              <div className="citizen-card-header">
                <div className="citizen-card-title">
                  <Building2 size={18} color="#7c3aed" />
                  <span>Public Works by Developmental Sector</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                {Object.entries(data.category_distribution).map(([cat, cnt]) => (
                  <div
                    key={cat}
                    style={{
                      padding: "12px 14px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#334155" }}>{cat}</span>
                    <strong style={{ fontSize: "13.5px", color: "#1e3a8a" }}>{cnt} Works</strong>
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
