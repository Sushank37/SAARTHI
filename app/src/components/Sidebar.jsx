import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
  LogOut,
  Map,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";
import { API_BASE, formatNumber } from "../constants";
import { ROLE_IDS } from "../data/roles";
import { useAuth } from "../context/useAuth";

export default function Sidebar({ summary, roleConfig, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchParams] = useSearchParams();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate("/login");
    }
  };

  const [daBadges, setDaBadges] = useState(null);
  const [iaBadges, setIaBadges] = useState(null);
  const [currentIA, setCurrentIA] = useState(() => {
    return searchParams.get("ia") || localStorage.getItem("mplads_selected_ia") || "PURI(DISTRICT COLLECTOR PURI_IDA)";
  });

  const isDARole =
    roleConfig?.id === ROLE_IDS.DISTRICT_AUTHORITY ||
    roleConfig?.id === "district_authority" ||
    location.pathname.startsWith("/da");

  const isIARole =
    roleConfig?.id === ROLE_IDS.IMPLEMENTING_AGENCY ||
    roleConfig?.id === "implementing_agency" ||
    roleConfig?.id === "IA" ||
    location.pathname.startsWith("/ia");

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
     IA TELEMETRY / BADGES (Scoped to selected IA)
     ========================================================= */

  useEffect(() => {
    const handleIAChange = (e) => {
      if (e.detail) {
        setCurrentIA(e.detail);
      }
    };
    window.addEventListener("ia-changed", handleIAChange);
    return () => window.removeEventListener("ia-changed", handleIAChange);
  }, []);

  useEffect(() => {
    const paramIA = searchParams.get("ia");
    if (paramIA && paramIA !== currentIA) {
      setCurrentIA(paramIA);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isIARole) {
      setIaBadges(null);
      return;
    }

    let cancelled = false;

    async function fetchIABadges() {
      try {
        const idaParam = currentIA ? `?ida_name=${encodeURIComponent(currentIA)}` : "";
        const res = await fetch(`${API_BASE}/api/analytics/ia${idaParam}`);

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        if (!cancelled && data?.sidebar_badges) {
          setIaBadges(data.sidebar_badges);
        }
      } catch (err) {
        console.error("Failed to load IA sidebar badges:", err);
      }
    }

    fetchIABadges();

    return () => {
      cancelled = true;
    };
  }, [isIARole, currentIA]);

  /* =========================================================
     DISTRICT AUTHORITY NAVIGATION (11 Modules)
     ========================================================= */

  const daNavLinks = [
    {
      id: "overview",
      label: "District Overview",
      subtitle: "Total works, sanctioned, ongoing, completed",
      tab: "overview",
      icon: LayoutDashboard,
      badge:
        daBadges?.overview !== undefined && daBadges?.overview !== null
          ? formatNumber(daBadges.overview)
          : summary?.total_works !== undefined && summary?.total_works !== null
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
        daBadges?.pending_sanctions !== undefined && daBadges?.pending_sanctions !== null
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
        daBadges?.compliance_45d !== undefined && daBadges?.compliance_45d !== null
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
        daBadges?.completion !== undefined && daBadges?.completion !== null
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
        daBadges?.financials !== undefined && daBadges?.financials !== null
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
        daBadges?.risk_cases !== undefined && daBadges?.risk_cases !== null
          ? formatNumber(daBadges.risk_cases)
          : summary?.high_risk !== undefined && summary?.high_risk !== null
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
        daBadges?.duplicates !== undefined && daBadges?.duplicates !== null
          ? formatNumber(daBadges.duplicates)
          : summary?.duplicate_clusters !== undefined && summary?.duplicate_clusters !== null
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
        daBadges?.ia_monitoring !== undefined && daBadges?.ia_monitoring !== null
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
        daBadges?.evidence !== undefined && daBadges?.evidence !== null
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
        daBadges?.geo_photo !== undefined && daBadges?.geo_photo !== null
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
        daBadges?.alerts_queue !== undefined && daBadges?.alerts_queue !== null
          ? formatNumber(daBadges.alerts_queue)
          : summary?.review_required !== undefined && summary?.review_required !== null
          ? formatNumber(summary.review_required)
          : null,
      badgeType: "danger",
    },
  ];

  /* =========================================================
     IMPLEMENTING AGENCY NAVIGATION (10 Standard Sections)
     ========================================================= */

  const iaNavLinks = [
    {
      id: "assigned-works",
      label: "Assigned Works",
      tab: "assigned-works",
      icon: Layers,
      badge: iaBadges?.assigned_works ? formatNumber(iaBadges.assigned_works) : null,
      badgeType: "accent",
    },
    {
      id: "execution-progress",
      label: "Execution Progress",
      tab: "execution-progress",
      icon: Activity,
      badge: iaBadges?.execution_progress ? formatNumber(iaBadges.execution_progress) : null,
      badgeType: "accent",
    },
    {
      id: "upcoming-deadlines",
      label: "Upcoming Deadlines",
      tab: "upcoming-deadlines",
      icon: Clock,
      badge: iaBadges?.upcoming_deadlines ? formatNumber(iaBadges.upcoming_deadlines) : null,
      badgeType: "warning",
    },
    {
      id: "payment-requests",
      label: "Payment Requests",
      tab: "payment-requests",
      icon: IndianRupee,
      badge: iaBadges?.payment_requests ? formatNumber(iaBadges.payment_requests) : null,
      badgeType: "accent",
    },
    {
      id: "vendor-activity",
      label: "Vendor Activity",
      tab: "vendor-activity",
      icon: Building2,
      badge: iaBadges?.vendor_activity ? formatNumber(iaBadges.vendor_activity) : null,
      badgeType: "neutral",
    },
    {
      id: "evidence-upload",
      label: "Evidence Upload",
      tab: "evidence-upload",
      icon: FileCheck,
      badge: iaBadges?.evidence_upload ? formatNumber(iaBadges.evidence_upload) : null,
      badgeType: "accent",
    },
    {
      id: "geo-photo-verification",
      label: "Geo-Photo Verification",
      tab: "geo-photo-verification",
      icon: Camera,
      badge: iaBadges?.geo_photo_verification ? formatNumber(iaBadges.geo_photo_verification) : null,
      badgeType: "accent",
    },
    {
      id: "missing-evidence",
      label: "Missing Evidence",
      tab: "missing-evidence",
      icon: AlertTriangle,
      badge: iaBadges?.missing_evidence ? formatNumber(iaBadges.missing_evidence) : null,
      badgeType: "danger",
    },
    {
      id: "completion",
      label: "Completion",
      tab: "completion",
      icon: CheckCircle2,
      badge: iaBadges?.completion ? formatNumber(iaBadges.completion) : null,
      badgeType: "highlight",
    },
    {
      id: "ai-alerts",
      label: "AI Alerts",
      tab: "ai-alerts",
      icon: Sparkles,
      badge: iaBadges?.ai_alerts ? formatNumber(iaBadges.ai_alerts) : null,
      badgeType: "danger",
    },
  ];

  /* =========================================================
     MP NAVIGATION (9 Modules with Status Badges)
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

  /* =========================================================
     STANDARD NAVIGATION (Other Personas)
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
        summary?.high_risk !== undefined && summary?.high_risk !== null
          ? formatNumber(summary.high_risk)
          : null,
      badgeType: "danger",
    },
    {
      label: "Duplicate Proposals",
      path: "/duplicates",
      icon: GitBranch,
      badge:
        summary?.duplicate_clusters !== undefined && summary?.duplicate_clusters !== null
          ? formatNumber(summary.duplicate_clusters)
          : null,
      badgeType: "warning",
    },
    {
      label: "Verification Queue",
      path: "/review",
      icon: ClipboardCheck,
      badge:
        summary?.review_required !== undefined && summary?.review_required !== null
          ? formatNumber(summary.review_required)
          : null,
      badgeType: "highlight",
    },
    {
      label: "State Intelligence",
      path: "/state",
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

  const activeNavLinks = isMPMode ? mpNavLinks : standardNavLinks;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <aside className="gov-sidebar-compact">
      {isIARole ? (
        /* =====================================================
           IMPLEMENTING AGENCY NAVIGATION (10 Standard Sections)
           ===================================================== */
        <div className="sidebar-nav-list">
          <div className="sidebar-section-title">
            Section
          </div>

          {iaNavLinks.map((item) => {
            const Icon = item.icon;
            const isTabActive =
              location.pathname === "/ia" &&
              (currentTab === item.tab ||
                ((!searchParams.get("tab") || searchParams.get("tab") === "overview") && item.tab === "assigned-works"));

            return (
              <NavLink
                key={item.id}
                to={`/ia?tab=${item.tab}${currentIA ? `&ia=${encodeURIComponent(currentIA)}` : ""}`}
                className={`nav-item-compact ${isTabActive ? "active" : ""}`}
                title={item.label}
              >
                <div className="nav-label-wrap">
                  <Icon size={16} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span className={`nav-badge-pill ${item.badgeType || "neutral"}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      ) : isDARole ? (
        /* =====================================================
           DISTRICT AUTHORITY NAVIGATION (Matching MP UI)
           ===================================================== */
        <div className="sidebar-nav-list">
          <div className="sidebar-section-title">
            Section
          </div>

          {daNavLinks.map((item) => {
            const Icon = item.icon;
            const isTabActive = location.pathname === "/da" && currentTab === item.tab;

            return (
              <NavLink
                key={item.id}
                to={`/da?tab=${item.tab}`}
                className={`nav-item-compact ${isTabActive ? "active" : ""}`}
                title={item.label}
              >
                <div className="nav-label-wrap">
                  <Icon size={16} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span className={`nav-badge-pill ${item.badgeType}`}>
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

                {item.badge !== null && item.badge !== undefined && (
                  <span className={`nav-badge-pill ${item.badgeType}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      )}

      <div className="sidebar-bottom-section">
        <div className="sidebar-mini-footer">
          <div className="footer-label">Synchronized Works</div>
          <div className="footer-value">
            {summary?.total_works !== undefined && summary?.total_works !== null
              ? formatNumber(summary.total_works)
              : "—"}
          </div>
        </div>

        <button
          type="button"
          id="sidebar-logout-btn"
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title="Sign out of current session"
        >
          <LogOut size={15} className="sidebar-logout-icon" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}