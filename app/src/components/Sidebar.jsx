import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldAlert,
  GitBranch,
  ClipboardCheck,
  Map,
  Database,
  Sparkles,
  Camera,
  IndianRupee,
  Layers,
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { formatNumber } from "../constants";

export default function Sidebar({ summary, roleConfig }) {
  const location = useLocation();

  const isMPMode = roleConfig?.id === "MP" || location.pathname.startsWith("/mp");

  // MP-specific sidebar navigation matching the exact user specification:
  // Section: Entitlement, My Works, Work Progress, Delayed Works, Risk Alerts, Financial View, Evidence, AI Insights, Map
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
      badge: "Delayed",
      badgeType: "warning",
    },
    {
      label: "Risk Alerts",
      path: "/mp/risk-alerts",
      icon: AlertTriangle,
      badge: "High Risk",
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
      badge: "Photos",
      badgeType: "accent",
    },
    {
      label: "AI Insights",
      path: "/mp/ai-insights",
      icon: Sparkles,
      badge: "AI Alert",
      badgeType: "accent",
    },
    {
      label: "Map",
      path: "/mp/map",
      icon: Map,
      badge: "GIS",
      badgeType: "highlight",
    },
  ];

  // Standard non-MP role navigation
  const dashboardLabel = roleConfig ? `${roleConfig.shortName} Dashboard` : "Portal Overview";
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

  const activeNavLinks = isMPMode ? mpNavLinks : standardNavLinks;

  return (
    <aside className="gov-sidebar-compact">
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
            (item.altPath && location.pathname === item.altPath);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item-compact ${isActive ? "active" : ""}`}
            >
              <div className="nav-label-wrap">
                <Icon size={16} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`nav-badge-pill ${item.badgeType}`}>{item.badge}</span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="sidebar-mini-footer">
        <div className="footer-label">Synchronized Works</div>
        <div className="footer-value">{formatNumber(summary?.total_works || 102703)}</div>
      </div>
    </aside>
  );
}
