import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  ShieldAlert,
  GitBranch,
  TrendingUp,
  ClipboardCheck,
  Building2,
  MapPin,
  Download,
  IndianRupee,
  Layers,
  AlertTriangle,
  Clock,
  Briefcase,
  FileCheck,
} from "lucide-react";
import { API_BASE, formatNumber, formatCrores, exportToCSV } from "../../../constants";

import NationalOverviewTab from "./NationalOverviewTab";
import StateIntelligenceTab from "./StateIntelligenceTab";
import DistrictIntelligenceTab from "./DistrictIntelligenceTab";
import RiskIntelligenceTab from "./RiskIntelligenceTab";
import AnomalyDetectionTab from "./AnomalyDetectionTab";
import DuplicateIntelligenceTab from "./DuplicateIntelligenceTab";
import FinancialIntelligenceTab from "./FinancialIntelligenceTab";
import DelayIntelligenceTab from "./DelayIntelligenceTab";
import IAPerformanceTab from "./IAPerformanceTab";
import EvidenceIntelligenceTab from "./EvidenceIntelligenceTab";
import TrendAnalysisTab from "./TrendAnalysisTab";
import PriorityCasesTab from "./PriorityCasesTab";

import "./MoSPIDashboard.css";

const TAB_MAP = {
  overview: "national-overview",
  national: "national-overview",
  "national-overview": "national-overview",
  state: "state-intelligence",
  states: "state-intelligence",
  "state-intelligence": "state-intelligence",
  district: "district-intelligence",
  districts: "district-intelligence",
  "district-intelligence": "district-intelligence",
  risk: "risk-intelligence",
  "risk-cases": "risk-intelligence",
  "risk-intelligence": "risk-intelligence",
  anomaly: "anomaly-detection",
  anomalies: "anomaly-detection",
  "anomaly-detection": "anomaly-detection",
  duplicate: "duplicate-intelligence",
  duplicates: "duplicate-intelligence",
  "duplicate-surveillance": "duplicate-intelligence",
  "duplicate-intelligence": "duplicate-intelligence",
  financial: "financial-intelligence",
  financials: "financial-intelligence",
  "financial-timeline": "financial-intelligence",
  "financial-intelligence": "financial-intelligence",
  delay: "delay-intelligence",
  delays: "delay-intelligence",
  "delay-intelligence": "delay-intelligence",
  ia: "ia-performance",
  "ia-performance": "ia-performance",
  "ia-monitoring": "ia-performance",
  evidence: "evidence-intelligence",
  "evidence-intelligence": "evidence-intelligence",
  trend: "trend-analysis",
  trends: "trend-analysis",
  "trend-analysis": "trend-analysis",
  priority: "priority-cases",
  "priority-cases": "priority-cases",
  review: "priority-cases",
  "review-cases": "priority-cases",
};

const MOSPI_MODULES = [
  { id: "national-overview", label: "National Overview", icon: LayoutDashboard },
  { id: "state-intelligence", label: "State Intelligence", icon: Map },
  { id: "district-intelligence", label: "District Intelligence", icon: Building2 },
  { id: "risk-intelligence", label: "Risk Intelligence", icon: ShieldAlert },
  { id: "anomaly-detection", label: "Anomaly Detection", icon: AlertTriangle },
  { id: "duplicate-intelligence", label: "Duplicate Intelligence", icon: GitBranch },
  { id: "financial-intelligence", label: "Financial Intelligence", icon: IndianRupee },
  { id: "delay-intelligence", label: "Delay Intelligence", icon: Clock },
  { id: "ia-performance", label: "IA Performance", icon: Briefcase },
  { id: "evidence-intelligence", label: "Evidence Intelligence", icon: FileCheck },
  { id: "trend-analysis", label: "Trend Analysis", icon: TrendingUp },
  { id: "priority-cases", label: "Priority Cases", icon: ClipboardCheck },
];

export default function MoSPIDashboard({ onSelectWork }) {
  const { section } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive resolved tab directly from URL
  const rawTab = section || searchParams.get("tab");
  const currentTab = (!rawTab || rawTab === "overview")
    ? "national-overview"
    : (TAB_MAP[rawTab.toLowerCase()] || rawTab);

  // Listen to sidebar tab change events
  useEffect(() => {
    const onTabEvent = (e) => {
      if (e.detail) {
        const resolved = TAB_MAP[e.detail.toLowerCase()] || e.detail;
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", resolved);
          return next;
        });
      }
    };
    window.addEventListener("mospi-tab-changed", onTabEvent);
    return () => window.removeEventListener("mospi-tab-changed", onTabEvent);
  }, [setSearchParams]);

  // National Analytics state from /api/analytics/mospi
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch unified national analytics
  useEffect(() => {
    let isMounted = true;
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/analytics/mospi`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAnalytics(data);
          }
        }
      } catch (err) {
        console.error("Failed to load MoSPI analytics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAnalytics();
    return () => { isMounted = false; };
  }, []);

  // Handle Tab Switch
  const handleTabChange = (tabId) => {
    const resolved = TAB_MAP[tabId.toLowerCase()] || tabId;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", resolved);
      return next;
    });
    window.dispatchEvent(new CustomEvent("mospi-tab-changed", { detail: resolved }));
  };

  const kpis = analytics?.national_kpis || {};

  // Export summary report
  const handleExportSummary = () => {
    if (!analytics) return;
    const exportData = [
      {
        "Total National Works": kpis.total_works ?? 0,
        "Total Recommended (₹)": kpis.total_recommended_amount ?? 0,
        "Total Sanctioned (₹)": kpis.total_sanction_amount ?? 0,
        "Total Disbursed (₹)": kpis.total_actual_amount ?? 0,
        "Sanction Rate (%)": kpis.sanction_rate ?? 0,
        "Disbursement Rate (%)": kpis.utilization_pct ?? 0,
        "Works Requiring Attention": kpis.attention_required ?? 0,
        "Medium-Risk Cases": kpis.risk_cases_count ?? 0,
        "Duplicate Clusters": kpis.duplicate_clusters ?? 0,
        "Works in Clusters": kpis.works_in_clusters ?? 0,
        "Extreme Delays (>180d)": analytics?.anomaly_summary?.extreme_delays_over_180 ?? 0,
        "Total IDAs": analytics?.data_coverage?.total_authorities ?? 0,
      },
    ];
    exportToCSV(exportData, `MoSPI_National_Executive_Summary_${Date.now()}.csv`);
  };

  return (
    <div className="mospi-shell">
      {/* ============================================================
          1. OFFICIAL HEADER CARD
          ============================================================ */}
      <div className="mospi-header-card">
        <div className="mospi-header-top">
          <div className="mospi-title-unit">
            <div className="mospi-sub-row">
              <span className="mospi-parliament-badge">
                Central Nodal Authority · MoSPI
              </span>
              <span className="mospi-scope-tag">
                <MapPin size={11} />
                Pan-India National Scope
              </span>
            </div>
            <h1 className="mospi-page-title">
              MoSPI / Central Nodal Authority
            </h1>
            <p className="mospi-page-subtitle">
              National MPLADS implementation monitoring, cross-state surveillance, duplicate detection, and macro scheme progress across Parliamentary works.
            </p>
          </div>

          <div className="mospi-header-actions">
            <button
              type="button"
              className="mospi-redirect-link-btn"
              onClick={handleExportSummary}
              title="Download executive national summary report"
            >
              <Download size={13} />
              <span>National Summary CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. EXACTLY 4 PRIMARY NATIONAL KPIS (First Viewport)
          ============================================================ */}
      <div className="mospi-kpi-grid">
        <div className="mospi-kpi-card kpi-blue">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Works</span>
            <Layers size={15} color="#0284c7" />
          </div>
          <div className="mospi-kpi-value">
            {loading ? "Loading…" : kpis.total_works != null ? formatNumber(kpis.total_works) : "—"}
          </div>
          <div className="mospi-kpi-sub">
            {loading
              ? "Loading…"
              : kpis.sanctioned_works != null
              ? `${formatNumber(kpis.sanctioned_works)} sanctioned (${kpis.sanction_rate ?? 0}%)`
              : "—"}
          </div>
        </div>

        <div className="mospi-kpi-card kpi-teal">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Sanctioned Value</span>
            <IndianRupee size={15} color="#0d9488" />
          </div>
          <div className="mospi-kpi-value">
            {loading ? "Loading…" : kpis.total_sanction_amount != null ? formatCrores(kpis.total_sanction_amount) : "—"}
          </div>
          <div className="mospi-kpi-sub">
            {loading
              ? "Loading…"
              : kpis.total_actual_amount != null
              ? `Disbursed: ${formatCrores(kpis.total_actual_amount)} (${kpis.utilization_pct ?? 0}%)`
              : "—"}
          </div>
        </div>

        <div className="mospi-kpi-card kpi-amber">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Works Requiring Attention</span>
            <ClipboardCheck size={15} color="#d97706" />
          </div>
          <div className="mospi-kpi-value">
            {loading ? "Loading…" : kpis.attention_required != null ? formatNumber(kpis.attention_required) : "—"}
          </div>
          <div className="mospi-kpi-sub">
            {loading
              ? "Loading…"
              : kpis.duplicate_clusters != null
              ? `${formatNumber(kpis.duplicate_clusters)} duplicate clusters flagged`
              : "—"}
          </div>
        </div>

        <div className="mospi-kpi-card kpi-rose">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Audit Risk Cases</span>
            <ShieldAlert size={15} color="#e11d48" />
          </div>
          <div className="mospi-kpi-value">
            {loading ? "Loading…" : kpis.risk_cases_count != null ? formatNumber(kpis.risk_cases_count) : "—"}
          </div>
          <div className="mospi-kpi-sub">
            Medium-risk outliers requiring verification
          </div>
        </div>
      </div>

      {/* ============================================================
          3. TOP MODULE NAVIGATION TABS (12 Modules)
          ============================================================ */}
      <div className="mospi-pills-list">
        {MOSPI_MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive =
            currentTab === mod.id ||
            (mod.id === "duplicate-intelligence" && currentTab === "duplicate-surveillance") ||
            (mod.id === "financial-intelligence" && currentTab === "financial-timeline");

          let badgeCount = null;
          if (analytics) {
            if (mod.id === "national-overview" && kpis.total_works != null) {
              badgeCount = formatNumber(kpis.total_works);
            }
            if (mod.id === "state-intelligence" && analytics?.data_coverage?.total_states != null) {
              badgeCount = `${analytics.data_coverage.total_states} States`;
            }
            if (mod.id === "district-intelligence" && analytics?.data_coverage?.total_authorities != null) {
              badgeCount = `${analytics.data_coverage.total_authorities} IDAs`;
            }
            if (mod.id === "risk-intelligence" && kpis.risk_cases_count != null) {
              badgeCount = formatNumber(kpis.risk_cases_count);
            }
            if (mod.id === "anomaly-detection") {
              const count = analytics?.anomaly_summary?.total_anomalies ?? analytics?.anomaly_summary?.extreme_delays_over_180;
              if (count != null) badgeCount = formatNumber(count);
            }
            if (mod.id === "duplicate-intelligence" && kpis.duplicate_clusters != null) {
              badgeCount = formatNumber(kpis.duplicate_clusters);
            }
            if (mod.id === "financial-intelligence" && kpis.total_sanction_amount != null) {
              badgeCount = formatCrores(kpis.total_sanction_amount);
            }
            if (mod.id === "delay-intelligence") {
              const avgDelay = analytics?.timeline_benchmarks?.avg_sanction_delay_days ?? analytics?.delay_buckets?.avg_sanction_delay;
              if (avgDelay != null) badgeCount = `${avgDelay}d Avg`;
            }
            if (mod.id === "ia-performance") {
              const authCount = analytics?.data_coverage?.total_authorities ?? analytics?.ia_performance_top25?.length;
              if (authCount != null) badgeCount = `${authCount} IAs`;
            }
            if (mod.id === "evidence-intelligence" && analytics?.evidence_summary?.total_with_evidence != null) {
              badgeCount = formatNumber(analytics.evidence_summary.total_with_evidence);
            }
            if (mod.id === "trend-analysis" && analytics?.trends_quarterly?.length) {
              badgeCount = `${analytics.trends_quarterly.length} Qtrs`;
            }
            if (mod.id === "priority-cases" && kpis.attention_required != null) {
              badgeCount = formatNumber(kpis.attention_required);
            }
          }

          return (
            <button
              key={mod.id}
              type="button"
              className={`mospi-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => handleTabChange(mod.id)}
            >
              <Icon size={13} />
              <span>{mod.label}</span>
              {badgeCount && <span className="mospi-pill-count">{badgeCount}</span>}
            </button>
          );
        })}
      </div>

      {/* ============================================================
          4. ACTIVE TAB CONTENT (12 Modules)
          ============================================================ */}
      {currentTab === "national-overview" && (
        <NationalOverviewTab analytics={analytics} loading={loading} />
      )}

      {currentTab === "state-intelligence" && (
        <StateIntelligenceTab onSelectWork={onSelectWork} />
      )}

      {currentTab === "district-intelligence" && (
        <DistrictIntelligenceTab onSelectWork={onSelectWork} />
      )}

      {currentTab === "risk-intelligence" && (
        <RiskIntelligenceTab analytics={analytics} onSelectWork={onSelectWork} />
      )}

      {currentTab === "anomaly-detection" && (
        <AnomalyDetectionTab analytics={analytics} onSelectWork={onSelectWork} />
      )}

      {(currentTab === "duplicate-intelligence" || currentTab === "duplicate-surveillance") && (
        <DuplicateIntelligenceTab analytics={analytics} onSelectWork={onSelectWork} />
      )}

      {(currentTab === "financial-intelligence" || currentTab === "financial-timeline") && (
        <FinancialIntelligenceTab analytics={analytics} onSelectWork={onSelectWork} />
      )}

      {currentTab === "delay-intelligence" && (
        <DelayIntelligenceTab analytics={analytics} onSelectWork={onSelectWork} />
      )}

      {currentTab === "ia-performance" && (
        <IAPerformanceTab analytics={analytics} onSelectWork={onSelectWork} />
      )}

      {currentTab === "evidence-intelligence" && (
        <EvidenceIntelligenceTab analytics={analytics} onSelectWork={onSelectWork} />
      )}

      {currentTab === "trend-analysis" && (
        <TrendAnalysisTab analytics={analytics} />
      )}

      {currentTab === "priority-cases" && (
        <PriorityCasesTab onSelectWork={onSelectWork} />
      )}
    </div>
  );
}
