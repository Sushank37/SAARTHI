import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Database,
  FileCheck,
  GitBranch,
  IndianRupee,
  Layers,
  LayoutDashboard,
  Map,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";

import { API_BASE, formatNumber } from "../constants";
import { ROLE_IDS } from "../data/roles";

export default function Sidebar({ summary, roleConfig }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [daBadges, setDaBadges] = useState(null);

  const isDARole =
    roleConfig?.id === ROLE_IDS.DISTRICT_AUTHORITY ||
    roleConfig?.id === "district_authority" ||
    location.pathname.startsWith("/da");

  const isMPMode =
    roleConfig?.id === ROLE_IDS.MP ||
    roleConfig?.id === "MP" ||
    location.pathname.startsWith("/mp");

  const currentTab = searchParams.get("tab") || "overview";

  /* =========================================================
     DA TELEMETRY / BADGES
     ========================================================= */

  useEffect(() => {
    if (!isDARole) {
      setDaBadges(null);
      return;
    }

    let cancelled = false;

    async function fetchDABadges() {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/da`);

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        if (!cancelled && data?.sidebar_badges) {
          setDaBadges(data.sidebar_badges);
        }
      } catch (err) {
        console.error("Failed to load DA sidebar badges:", err);
      }
    }

    fetchDABadges();

    return () => {
      cancelled = true;
    };
  }, [isDARole]);

  /* =========================================================
     DISTRICT AUTHORITY NAVIGATION
     ========================================================= */

  const daNavLinks = [
    {
      id: "overview",
      label: "District Overview",
      subtitle: "Total works, sanctioned, ongoing, completed",
      tab: "overview",
      icon: LayoutDashboard,
      badge:
        daBadges?.overview !== undefined &&
          daBadges?.overview !== null
          ? formatNumber(daBadges.overview)
          : summary?.total_works !== undefined &&
            summary?.total_works !== null
            ? formatNumber(summary.total_works)
            : null,
      badgeType: "neutral",
    },
    {
      id: "pending-sanctions",
      label: "Pending Sanctions",
      subtitle: "Works awaiting action",
      tab: "pending-sanctions",
      icon: Clock,
      badge:
        daBadges?.pending_sanctions !== undefined &&
          daBadges?.pending_sanctions !== null
          ? formatNumber(daBadges.pending_sanctions)
          : null,
      badgeType: "warning",
    },
    {
      id: "compliance-45d",
      label: "45-Day Compliance",
      subtitle: "Works approaching/exceeding sanction timeline",
      tab: "compliance-45d",
      icon: AlertTriangle,
      badge:
        daBadges?.compliance_45d !== undefined &&
          daBadges?.compliance_45d !== null
          ? formatNumber(daBadges.compliance_45d)
          : null,
      badgeType: "danger",
    },
    {
      id: "completion",
      label: "Completion Monitoring",
      subtitle: "Works approaching/exceeding one year",
      tab: "completion",
      icon: CheckCircle2,
      badge:
        daBadges?.completion !== undefined &&
          daBadges?.completion !== null
          ? formatNumber(daBadges.completion)
          : null,
      badgeType: "warning",
    },
    {
      id: "financials",
      label: "Financial Monitoring",
      subtitle: "Sanctioned vs payments vs expenditure",
      tab: "financials",
      icon: Coins,
      badge:
        daBadges?.financials !== undefined &&
          daBadges?.financials !== null
          ? formatNumber(daBadges.financials)
          : null,
      badgeType: "accent",
    },
    {
      id: "risk-cases",
      label: "Risk Cases",
      subtitle: "HIGH/MEDIUM risk works",
      tab: "risk-cases",
      icon: ShieldAlert,
      badge:
        daBadges?.risk_cases !== undefined &&
          daBadges?.risk_cases !== null
          ? formatNumber(daBadges.risk_cases)
          : summary?.high_risk !== undefined &&
            summary?.high_risk !== null
            ? formatNumber(summary.high_risk)
            : null,
      badgeType: "danger",
    },
    {
      id: "duplicates",
      label: "Duplicate Intelligence",
      subtitle: "Similar/suspicious works",
      tab: "duplicates",
      icon: GitBranch,
      badge:
        daBadges?.duplicates !== undefined &&
          daBadges?.duplicates !== null
          ? formatNumber(daBadges.duplicates)
          : summary?.duplicate_clusters !== undefined &&
            summary?.duplicate_clusters !== null
            ? formatNumber(summary.duplicate_clusters)
            : null,
      badgeType: "warning",
    },
    {
      id: "ia-monitoring",
      label: "IA Monitoring",
      subtitle: "IA-wise implementation performance",
      tab: "ia-monitoring",
      icon: Building2,
      badge:
        daBadges?.ia_monitoring !== undefined &&
          daBadges?.ia_monitoring !== null
          ? formatNumber(daBadges.ia_monitoring)
          : null,
      badgeType: "neutral",
    },
    {
      id: "evidence",
      label: "Evidence Verification",
      subtitle: "Photos/documents requiring review",
      tab: "evidence",
      icon: FileCheck,
      badge:
        daBadges?.evidence !== undefined &&
          daBadges?.evidence !== null
          ? formatNumber(daBadges.evidence)
          : null,
      badgeType: "warning",
    },
    {
      id: "geo-photo",
      label: "Geo-Photo Verification",
      subtitle: "Location/photo inconsistencies",
      tab: "geo-photo",
      icon: Camera,
      badge:
        daBadges?.geo_photo !== undefined &&
          daBadges?.geo_photo !== null
          ? formatNumber(daBadges.geo_photo)
          : null,
      badgeType: "accent",
    },
    {
      id: "alerts-queue",
      label: "Alerts & Queue",
      subtitle: "Priority cases requiring action",
      tab: "alerts-queue",
      icon: Bell,
      badge:
        daBadges?.alerts_queue !== undefined &&
          daBadges?.alerts_queue !== null
          ? formatNumber(daBadges.alerts_queue)
          : summary?.review_required !== undefined &&
            summary?.review_required !== null
            ? formatNumber(summary.review_required)
            : null,
      badgeType: "danger",
    },
  ];

  /* =========================================================
     MP NAVIGATION
     ========================================================= */

  const mpNavLinks = [
    {
      label: "Entitlement",
      path: "/mp/entitlement",
      altPath: "/mp",
      icon: IndianRupee,
      badge: "₹5 Cr",
      badgeType: "accent",
    },
    {
      label: "My Works",
      path: "/mp/my-works",
      icon: Layers,
      badge: null,
    },
    {
      label: "Work Progress",
      path: "/mp/work-progress",
      icon: Activity,
      badge: null,
    },
    {
      label: "Delayed Works",
      path: "/mp/delayed-works",
      icon: Clock,
      badge: null,
      badgeType: "warning",
    },
    {
      label: "Risk Alerts",
      path: "/mp/risk-alerts",
      icon: AlertTriangle,
      badge: null,
      badgeType: "danger",
    },
    {
      label: "Financial View",
      path: "/mp/financial-view",
      icon: TrendingUp,
      badge: null,
    },
    {
      label: "Evidence",
      path: "/mp/evidence",
      icon: Camera,
      badge: null,
      badgeType: "accent",
    },
    {
      label: "AI Insights",
      path: "/mp/ai-insights",
      icon: Sparkles,
      badge: null,
      badgeType: "accent",
    },
    {
      label: "Map",
      path: "/mp/map",
      icon: Map,
      badge: null,
      badgeType: "highlight",
    },
  ];

  /* =========================================================
     STANDARD NAVIGATION
     ========================================================= */

  const dashboardLabel = roleConfig
    ? `${roleConfig.shortName} Dashboard`
    : "Portal Overview";

  const dashboardPath = roleConfig?.path || "/";

  const standardNavLinks = [
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
      badge:
        summary?.high_risk !== undefined &&
          summary?.high_risk !== null
          ? formatNumber(summary.high_risk)
          : null,
      badgeType: "danger",
    },
    {
      label: "Duplicate Proposals",
      path: "/duplicates",
      icon: GitBranch,
      badge:
        summary?.duplicate_clusters !== undefined &&
          summary?.duplicate_clusters !== null
          ? formatNumber(summary.duplicate_clusters)
          : null,
      badgeType: "warning",
    },
    {
      label: "Verification Queue",
      path: "/review",
      icon: ClipboardCheck,
      badge:
        summary?.review_required !== undefined &&
          summary?.review_required !== null
          ? formatNumber(summary.review_required)
          : null,
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

  /* =========================================================
     ACTIVE NAVIGATION
     ========================================================= */

  const activeNavLinks = isMPMode
    ? mpNavLinks
    : standardNavLinks;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <aside
      className={`gov-sidebar-compact ${isDARole ? "da-mode" : ""
        }`}
    >
      {isDARole ? (
        /* =====================================================
           DISTRICT AUTHORITY NAVIGATION
           ===================================================== */
        <div className="sidebar-nav-list">
          <div className="da-sidebar-role-header">
            <Scale size={13} className="da-role-icon" />
            <span className="da-role-text">
              District Authority Nodal
            </span>
          </div>

          {daNavLinks.map((item) => {
            const Icon = item.icon;

            const isTabActive =
              location.pathname === "/da" &&
              currentTab === item.tab;

            return (
              <NavLink
                key={item.id}
                to={`/da?tab=${item.tab}`}
                className={`da-nav-item ${isTabActive ? "active" : ""
                  }`}
                title={`${item.label} — ${item.subtitle}`}
              >
                <div className="da-nav-left">
                  <Icon size={16} className="da-nav-icon" />

                  <div className="da-nav-texts">
                    <span className="da-nav-title">
                      {item.label}
                    </span>

                    <span className="da-nav-subtext">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {item.badge !== null &&
                  item.badge !== undefined && (
                    <span
                      className={`nav-badge-pill ${item.badgeType}`}
                    >
                      {item.badge}
                    </span>
                  )}
              </NavLink>
            );
          })}
        </div>
      ) : (
        /* =====================================================
           MP / STANDARD NAVIGATION
           ===================================================== */
        <div className="sidebar-nav-list">
          {isMPMode && (
            <div className="sidebar-section-title">
              Section
            </div>
          )}

          {activeNavLinks.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.path ||
              (item.altPath &&
                location.pathname === item.altPath);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item-compact ${isActive ? "active" : ""
                  }`}
              >
                <div className="nav-label-wrap">
                  <Icon size={16} className="nav-icon" />
                  <span className="nav-label">
                    {item.label}
                  </span>
                </div>

                {item.badge !== null &&
                  item.badge !== undefined && (
                    <span
                      className={`nav-badge-pill ${item.badgeType}`}
                    >
                      {item.badge}
                    </span>
                  )}
              </NavLink>
            );
          })}
        </div>
      )}

      <div className="sidebar-mini-footer">
        <div className="footer-label">
          Synchronized Works
        </div>

        <div className="footer-value">
          {summary?.total_works !== undefined &&
            summary?.total_works !== null
            ? formatNumber(summary.total_works)
            : "—"}
        </div>
      </div>
    </aside>
  );
}