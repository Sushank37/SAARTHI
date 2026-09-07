import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Coins,
  ShieldAlert,
  GitBranch,
  Building2,
  FileCheck,
  Camera,
  Bell,
  Scale,
  Sparkles,
  Map,
  Database,
  ClipboardCheck,
} from "lucide-react";
import { API_BASE, formatNumber } from "../constants";
import { ROLE_IDS } from "../data/roles";

export default function Sidebar({ summary, roleConfig }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isDARole =
    roleConfig?.id === ROLE_IDS.DISTRICT_AUTHORITY ||
    roleConfig?.id === "district_authority" ||
    location.pathname.startsWith("/da");

  // Telemetry state for District Authority sidebar badges
  const [daBadges, setDaBadges] = useState(null);

  useEffect(() => {
    if (isDARole) {
      async function fetchDABadges() {
        try {
          const res = await fetch(`${API_BASE}/api/analytics/da`);
          if (res.ok) {
            const data = await res.json();
            if (data.sidebar_badges) {
              setDaBadges(data.sidebar_badges);
            }
          }
        } catch (err) {
          console.error("Failed to load DA sidebar badges:", err);
        }
      }
      fetchDABadges();
    }
  }, [isDARole]);

  // 11 Specific District Authority Navigation Modules
  const daNavLinks = [
    {
      id: "overview",
      label: "District Overview",
      subtitle: "Total works, sanctioned, ongoing, completed",
      tab: "overview",
      icon: LayoutDashboard,
      badge: daBadges?.overview
        ? formatNumber(daBadges.overview)
        : summary?.total_works
        ? formatNumber(summary.total_works)
        : "102k",
      badgeType: "neutral",
    },
    {
      id: "pending-sanctions",
      label: "Pending Sanctions",
      subtitle: "Works awaiting action",
      tab: "pending-sanctions",
      icon: Clock,
      badge:
        daBadges?.pending_sanctions !== undefined
          ? formatNumber(daBadges.pending_sanctions)
          : "46",
      badgeType: "warning",
    },
    {
      id: "compliance-45d",
      label: "45-Day Compliance",
      subtitle: "Works approaching/exceeding sanction timeline",
      tab: "compliance-45d",
      icon: AlertTriangle,
      badge:
        daBadges?.compliance_45d !== undefined
          ? formatNumber(daBadges.compliance_45d)
          : "1.2k",
      badgeType: "danger",
    },
    {
      id: "completion",
      label: "Completion Monitoring",
      subtitle: "Works approaching/exceeding one year",
      tab: "completion",
      icon: CheckCircle2,
      badge:
        daBadges?.completion !== undefined
          ? formatNumber(daBadges.completion)
          : "1.3k",
      badgeType: "warning",
    },
    {
      id: "financials",
      label: "Financial Monitoring",
      subtitle: "Sanctioned vs payments vs expenditure",
      tab: "financials",
      icon: Coins,
      badge:
        daBadges?.financials !== undefined
          ? formatNumber(daBadges.financials)
          : "112",
      badgeType: "accent",
    },
    {
      id: "risk-cases",
      label: "Risk Cases",
      subtitle: "HIGH/MEDIUM risk works",
      tab: "risk-cases",
      icon: ShieldAlert,
      badge:
        daBadges?.risk_cases !== undefined
          ? formatNumber(daBadges.risk_cases)
          : summary?.high_risk
          ? formatNumber(summary.high_risk)
          : "14k",
      badgeType: "danger",
    },
    {
      id: "duplicates",
      label: "Duplicate Intelligence",
      subtitle: "Similar/suspicious works",
      tab: "duplicates",
      icon: GitBranch,
      badge:
        daBadges?.duplicates !== undefined
          ? formatNumber(daBadges.duplicates)
          : summary?.duplicate_clusters
          ? formatNumber(summary.duplicate_clusters)
          : "2.9k",
      badgeType: "warning",
    },
    {
      id: "ia-monitoring",
      label: "Vendor/IA Monitoring",
      subtitle: "IA-wise performance",
      tab: "ia-monitoring",
      icon: Building2,
      badge:
        daBadges?.ia_monitoring !== undefined
          ? formatNumber(daBadges.ia_monitoring)
          : "1",
      badgeType: "neutral",
    },
    {
      id: "evidence",
      label: "Evidence Verification",
      subtitle: "Photos/documents requiring review",
      tab: "evidence",
      icon: FileCheck,
      badge:
        daBadges?.evidence !== undefined
          ? formatNumber(daBadges.evidence)
          : "89",
      badgeType: "warning",
    },
    {
      id: "geo-photo",
      label: "Geo-Photo Verification",
      subtitle: "Location/photo inconsistencies",
      tab: "geo-photo",
      icon: Camera,
      badge:
        daBadges?.geo_photo !== undefined
          ? formatNumber(daBadges.geo_photo)
          : "GPS",
      badgeType: "accent",
    },
    {
      id: "alerts-queue",
      label: "Alerts & Queue",
      subtitle: "Priority cases requiring action",
      tab: "alerts-queue",
      icon: Bell,
      badge:
        daBadges?.alerts_queue !== undefined
          ? formatNumber(daBadges.alerts_queue)
          : summary?.review_required
          ? formatNumber(summary.review_required)
          : "46",
      badgeType: "danger",
    },
  ];

  // Default shared navigation links for other roles (MP, IA, MoSPI, Citizen)
  const dashboardLabel = roleConfig ? `${roleConfig.shortName} Dashboard` : "Portal Overview";
  const dashboardPath = roleConfig?.path || "/";

  const defaultNavLinks = [
    {
      label: dashboardLabel,
      path: dashboardPath,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: "Cost Anomaly & Delay",
      path: "/risk-cases",
      icon: ShieldAlert,
      badge: summary?.high_risk ? formatNumber(summary.high_risk) : "14k",
      badgeType: "danger",
    },
    {
      label: "Duplicate Proposals",
      path: "/duplicates",
      icon: GitBranch,
      badge: summary?.duplicate_clusters ? formatNumber(summary.duplicate_clusters) : "2.9k",
      badgeType: "warning",
    },
    {
      label: "Verification Queue",
      path: "/review",
      icon: ClipboardCheck,
      badge: summary?.review_required ? formatNumber(summary.review_required) : "19k",
      badgeType: "highlight",
    },
    {
      label: "Pre-Sanction Check",
      path: "/pre-sanction",
      icon: Sparkles,
      badge: "Verify",
      badgeType: "accent",
    },
    {
      label: "Geo Photo AI Verifier",
      path: "/photo-verifier",
      icon: Camera,
      badge: "GPS AI",
      badgeType: "accent",
    },
    {
      label: "State-wise Progress",
      path: "/states",
      icon: Map,
      badge: null,
    },
    {
      label: "Works Explorer",
      path: "/works",
      icon: Database,
      badge: null,
    },
  ];

  const currentTab = searchParams.get("tab") || "overview";

  return (
    <aside className={`gov-sidebar-compact ${isDARole ? "da-mode" : ""}`}>
      {isDARole ? (
        /* District Authority Operational Navigation */
        <div className="sidebar-nav-list">
          <div className="da-sidebar-role-header">
            <Scale size={13} className="da-role-icon" />
            <span className="da-role-text">District Authority Nodal</span>
          </div>

          {daNavLinks.map((item) => {
            const Icon = item.icon;
            const isTabActive = location.pathname === "/da" && currentTab === item.tab;
            return (
              <NavLink
                key={item.id}
                to={`/da?tab=${item.tab}`}
                className={`da-nav-item ${isTabActive ? "active" : ""}`}
                title={`${item.label} — ${item.subtitle}`}
              >
                <div className="da-nav-left">
                  <Icon size={16} className="da-nav-icon" />
                  <div className="da-nav-texts">
                    <span className="da-nav-title">{item.label}</span>
                    <span className="da-nav-subtext">{item.subtitle}</span>
                  </div>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`nav-badge-pill ${item.badgeType}`}>{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      ) : (
        /* Standard Navigation for other personas */
        <div className="sidebar-nav-list">
          {defaultNavLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item-compact ${isActive ? "active" : ""}`}
              >
                <div className="nav-label-wrap">
                  <Icon size={17} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`nav-badge-pill ${item.badgeType}`}>{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      )}

      <div className="sidebar-mini-footer">
        <div className="footer-label">Synchronized Works</div>
        <div className="footer-value">{formatNumber(summary?.total_works || 102703)}</div>
      </div>
    </aside>
  );
}
