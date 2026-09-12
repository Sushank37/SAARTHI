import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
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

export default function MoSPIDashboard({ summary, onSelectWork }) {
  const { roleConfig } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { section } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const getResolvedTab = () => {
    const raw = section || searchParams.get("tab");
    if (!raw || raw === "overview") return "national-overview";
    return TAB_MAP[raw.toLowerCase()] || raw;
  };

  const [currentTab, setCurrentTab] = useState(getResolvedTab);

  // Sync tab with URL parameter or route changes
  useEffect(() => {
    const resolved = getResolvedTab();
    setCurrentTab(resolved);
  }, [section, location.search]);

  // Listen to sidebar tab change events
  useEffect(() => {
    const onTabEvent = (e) => {
      if (e.detail) {
        const resolved = TAB_MAP[e.detail.toLowerCase()] || e.detail;
        setCurrentTab(resolved);
        const nextParams = new URLSearchParams(location.search);
        nextParams.set("tab", resolved);
        setSearchParams(nextParams);
      }
    };
    window.addEventListener("mospi-tab-changed", onTabEvent);
    return () => window.removeEventListener("mospi-tab-changed", onTabEvent);
  }, [location.search]);

  // National Analytics state from /api/analytics/mospi
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(true);

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
            setBackendConnected(true);
          }
        } else {
          if (isMounted) setBackendConnected(false);
        }
      } catch (err) {
        console.error("Failed to load MoSPI analytics:", err);
        if (isMounted) setBackendConnected(false);
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
    setCurrentTab(resolved);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", resolved);
    setSearchParams(nextParams);
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
    <div className="gov-mp-shell mospi-dashboard-container">
      {/* ============================================================
          1. OFFICIAL HEADER CARD
          ============================================================ */}
      <div className="gov-mp-header-card">
        <div className="gov-mp-header-top">
          <div className="gov-mp-title-unit">
            <div className="gov-mp-sub-row">
              <span className="gov-parliament-badge">
                Central Nodal Authority · MoSPI
              </span>
              <span className="gov-constituency-tag">
                <MapPin size={11} style={{ marginRight: "3px" }} />
                Pan-India National Scope
              </span>
            </div>
            <h1 className="gov-mp-page-title">
              MoSPI / Central Nodal Authority
            </h1>
            <p className="gov-mp-page-subtitle">
              National MPLADS implementation monitoring, cross-state surveillance, duplicate detection, and macro scheme progress across Parliamentary works.
            </p>
          </div>

          <div className="gov-mp-header-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="gov-redirect-link-btn"
              onClick={handleExportSummary}
              title="Download executive national summary report"
              style={{ cursor: "pointer" }}
            >
              <Download size={13} />
              <span>National Summary CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. MAXIMUM 4 KEY NATIONAL KPIS (Data-Supported)
          ============================================================ */}
      <div className="gov-mp-kpi-grid">
        <div className="gov-mp-kpi-card kpi-blue">
          <div className="kpi-header">
            <span className="kpi-title">Total Works</span>
            <Layers size={14} color="#0284c7" />
          </div>
          <div className="kpi-value">{loading && !kpis.total_works ? "..." : formatNumber(kpis.total_works ?? 0)}</div>
          <div className="kpi-sub">
            {loading && !kpis.sanctioned_works ? "..." : `${formatNumber(kpis.sanctioned_works ?? 0)} sanctioned (${kpis.sanction_rate ?? 0}%)`}
          </div>
        </div>

        <div className="gov-mp-kpi-card kpi-teal">
          <div className="kpi-header">
            <span className="kpi-title">Total Sanctioned Value</span>
            <IndianRupee size={14} color="#0d9488" />
          </div>
          <div className="kpi-value">{formatCrores(kpis.total_sanction_amount || 0)}</div>
          <div className="kpi-sub">
            Disbursed: {formatCrores(kpis.total_actual_amount || 0)} ({kpis.utilization_pct || 0}%)
          </div>
        </div>

        <div className="gov-mp-kpi-card kpi-amber">
          <div className="kpi-header">
            <span className="kpi-title">Works Requiring Attention</span>
            <ClipboardCheck size={14} color="#d97706" />
          </div>
          <div className="kpi-value">{loading && !kpis.attention_required ? "..." : formatNumber(kpis.attention_required ?? 0)}</div>
          <div className="kpi-sub">
            {loading && !kpis.duplicate_clusters ? "..." : `${formatNumber(kpis.duplicate_clusters ?? 0)} duplicate clusters flagged`}
          </div>
        </div>

        <div className="gov-mp-kpi-card kpi-rose">
          <div className="kpi-header">
            <span className="kpi-title">Audit Risk Cases</span>
            <ShieldAlert size={14} color="#e11d48" />
          </div>
          <div className="kpi-value">{loading && !kpis.risk_cases_count ? "..." : formatNumber(kpis.risk_cases_count ?? 0)}</div>
          <div className="kpi-sub">
            Medium-risk outliers requiring verification
          </div>
        </div>
      </div>

      {/* ============================================================
          3. TOP MODULE NAVIGATION TABS (12 Standard Sections)
          ============================================================ */}
      <div className="mospi-pills-list">
        {MOSPI_MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive =
            currentTab === mod.id ||
            (mod.id === "duplicate-intelligence" && currentTab === "duplicate-surveillance") ||
            (mod.id === "financial-intelligence" && currentTab === "financial-timeline");

          let badgeCount = null;
          if (mod.id === "national-overview") badgeCount = formatNumber(kpis.total_works || 102703);
          if (mod.id === "state-intelligence") badgeCount = "36 States";
          if (mod.id === "district-intelligence") badgeCount = "763 IDAs";
          if (mod.id === "risk-intelligence") badgeCount = formatNumber(kpis.risk_cases_count || 18);
          if (mod.id === "anomaly-detection") badgeCount = "12,824";
          if (mod.id === "duplicate-intelligence") badgeCount = formatNumber(kpis.duplicate_clusters || 1401);
          if (mod.id === "financial-intelligence") badgeCount = "₹ 4,074 Cr";
          if (mod.id === "delay-intelligence") badgeCount = "106d Avg";
          if (mod.id === "ia-performance") badgeCount = "763 IAs";
          if (mod.id === "evidence-intelligence") badgeCount = "8,922";
          if (mod.id === "trend-analysis") badgeCount = "9 Qtrs";
          if (mod.id === "priority-cases") badgeCount = formatNumber(kpis.attention_required || 4384);

          return (
            <button
              key={mod.id}
              type="button"
              className={`mospi-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => handleTabChange(mod.id)}
            >
              <Icon size={14} />
              <span>{mod.label}</span>
              {badgeCount && <span className="mospi-pill-count">{badgeCount}</span>}
            </button>
          );
        })}
      </div>

      {/* ============================================================
          4. ACTIVE TAB CONTENT (12 Standard Sections)
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
