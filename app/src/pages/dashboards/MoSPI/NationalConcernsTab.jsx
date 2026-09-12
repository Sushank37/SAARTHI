import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  RefreshCw,
} from "lucide-react";
import { getConcerns, getConcernMetrics } from "../../../services/concernService";
import ConcernListTable from "../../../components/workflow/ConcernListTable";
import ConcernDetailModal from "../../../components/workflow/ConcernDetailModal";
import { formatNumber } from "../../../constants";

export default function NationalConcernsTab({ onSelectWork }) {
  const [concerns, setConcerns] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedConcernId, setSelectedConcernId] = useState(null);
  const [stateFilter, setStateFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, mData] = await Promise.all([
        getConcerns(stateFilter !== "ALL" ? { state: stateFilter } : {}),
        getConcernMetrics(),
      ]);
      setConcerns(cData.concerns || []);
      setMetrics(mData);
    } catch (err) {
      console.error("Failed to load national concerns data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stateFilter]);

  const uniqueStates = Array.from(new Set((concerns || []).map((c) => c.state).filter(Boolean))).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Banner */}
      <div className="mospi-tab-banner">
        <div className="mospi-tab-banner-left">
          <div className="mospi-tab-banner-eyebrow">
            <ShieldAlert size={13} color="#b45309" />
            <span>CENTRAL SURVEILLANCE & PARLIAMENTARY CONCERNS OVERSIGHT</span>
          </div>
          <h2 className="mospi-tab-banner-title">Pan-India Work Concern, Action & Response Ledger</h2>
          <p className="mospi-tab-banner-desc">
            National audit monitoring of MP-flagged concerns across all States and Union Territories.
            Track District Authority statutory response compliance, IA corrective actions, and issue central ministerial directives.
          </p>
        </div>

        <div className="mospi-tab-banner-right">
          <button
            type="button"
            className="mospi-refresh-btn"
            onClick={loadData}
            title="Refresh National Concern Ledger"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* National KPI Summary Cards */}
      <div className="mospi-kpi-grid">
        <div className="mospi-kpi-card" style={{ borderTop: "3.5px solid #005a9c" }}>
          <span className="mospi-kpi-label">TOTAL NATIONAL CONCERNS</span>
          <div className="mospi-kpi-val" style={{ color: "#005a9c" }}>
            {formatNumber(metrics?.total || concerns.length)}
          </div>
          <span className="mospi-kpi-sub">Logged across parliamentary constituencies</span>
        </div>

        <div className="mospi-kpi-card" style={{ borderTop: "3.5px solid #dc2626" }}>
          <span className="mospi-kpi-label">ACTIVE / OPEN ISSUES</span>
          <div className="mospi-kpi-val text-red-600">
            {formatNumber(metrics?.open || 0)}
          </div>
          <span className="mospi-kpi-sub">Under review or ground execution</span>
        </div>

        <div className="mospi-kpi-card" style={{ borderTop: "3.5px solid #d97706" }}>
          <span className="mospi-kpi-label">HIGH / CRITICAL SEVERITY</span>
          <div className="mospi-kpi-val text-amber-600">
            {formatNumber((metrics?.by_priority?.CRITICAL || 0) + (metrics?.by_priority?.HIGH || 0))}
          </div>
          <span className="mospi-kpi-sub">Requiring immediate priority clearance</span>
        </div>

        <div className="mospi-kpi-card" style={{ borderTop: "3.5px solid #16a34a" }}>
          <span className="mospi-kpi-label">RESOLVED & VERIFIED</span>
          <div className="mospi-kpi-val text-emerald-600">
            {formatNumber(metrics?.resolved || 0)}
          </div>
          <span className="mospi-kpi-sub">DA verified & closed</span>
        </div>
      </div>

      {/* State Filter Bar */}
      {uniqueStates.length > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Filter by State:</span>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              background: "#ffffff",
              color: "#0f172a",
            }}
          >
            <option value="ALL">All States ({concerns.length})</option>
            {uniqueStates.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      )}

      {/* Pan-India Concerns Table */}
      <ConcernListTable
        concerns={concerns}
        loading={loading}
        title="Pan-India Work Concerns & Accountability Register"
        subtitle="Cross-stakeholder MP, District Authority, and IA execution ledger"
        role="MOSPI"
        onSelectConcern={(id) => setSelectedConcernId(id)}
        onOpenWork={(workId) => onSelectWork && onSelectWork(workId, "actions")}
        emptyMessage="No parliamentary concerns currently recorded in the national ledger."
      />

      {/* MoSPI Modal */}
      {selectedConcernId && (
        <ConcernDetailModal
          concernId={selectedConcernId}
          currentRole="MOSPI"
          currentUser="MoSPI Central Surveillance Officer"
          onClose={() => setSelectedConcernId(null)}
          onActionComplete={loadData}
          onOpenWork={(workId) => onSelectWork && onSelectWork(workId, "actions")}
        />
      )}
    </div>
  );
}
