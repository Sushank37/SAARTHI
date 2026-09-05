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
  ChevronRight,
} from "lucide-react";
import { formatNumber } from "../constants";

export default function Sidebar({ summary }) {
  const location = useLocation();

  const navLinks = [
    {
      label: "Portal Overview",
      path: "/",
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

  return (
    <aside className="gov-sidebar-compact">
      <div className="sidebar-nav-list">
        {navLinks.map((item) => {
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

      <div className="sidebar-mini-footer">
        <div className="footer-label">Synchronized Works</div>
        <div className="footer-value">{formatNumber(summary?.total_works || 102703)}</div>
      </div>
    </aside>
  );
}
