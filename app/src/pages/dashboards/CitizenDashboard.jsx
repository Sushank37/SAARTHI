import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Search,
  Building2,
  TrendingUp,
  Camera,
  Flag,
  CheckCircle2,
  QrCode,
  MapPin,
} from "lucide-react";

import CitizenOverviewTab from "./Citizen/CitizenOverviewTab";
import CitizenMapTab from "./Citizen/CitizenMapTab";
import CitizenExploreTab from "./Citizen/CitizenExploreTab";
import CitizenConstituencyTab from "./Citizen/CitizenConstituencyTab";
import CitizenAnalyticsTab from "./Citizen/CitizenAnalyticsTab";
import CitizenEvidenceTab from "./Citizen/CitizenEvidenceTab";
import CitizenReportIssueTab from "./Citizen/CitizenReportIssueTab";
import CitizenComplaintsTab from "./Citizen/CitizenComplaintsTab";
import CitizenVerifyTab from "./Citizen/CitizenVerifyTab";

import "./Citizen/CitizenDashboard.css";

const CITIZEN_TABS = [
  { id: "overview", label: "Public Overview", icon: LayoutDashboard },
  { id: "map", label: "Public Works Map", icon: Map, badge: "GIS" },
  { id: "explore", label: "Explore Works", icon: Search },
  { id: "constituency", label: "Constituency Transparency", icon: Building2 },
  { id: "analytics", label: "Progress & Analytics", icon: TrendingUp },
  { id: "evidence", label: "Photo Evidence", icon: Camera },
  { id: "report", label: "Report an Issue", icon: Flag, badge: "Audit" },
  { id: "complaints", label: "Track Grievance", icon: CheckCircle2 },
  { id: "verify", label: "On-Site QR Verify", icon: QrCode },
];

export default function CitizenDashboard({ summary, onSelectWork }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  const [targetWorkForReport, setTargetWorkForReport] = useState(null);
  const [trackedComplaintId, setTrackedComplaintId] = useState(null);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    window.dispatchEvent(new CustomEvent("citizen-tab-changed", { detail: tabId }));
  };

  const handleReportWork = (work) => {
    setTargetWorkForReport(work);
    handleTabChange("report");
  };

  const handleTrackComplaint = (complaintId) => {
    setTrackedComplaintId(complaintId);
    handleTabChange("complaints");
  };

  const citizenProfile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("saarthi_citizen_profile") || "null");
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="gov-mp-shell citizen-portal-container">
      {/* 1. Official Header Card */}
      <div className="gov-mp-header-card">
        <div className="gov-mp-header-top">
          <div className="gov-mp-title-unit">
            <div className="gov-mp-sub-row">
              <span className="gov-parliament-badge">
                {citizenProfile?.id ? `CITIZEN ID: ${citizenProfile.id}` : "PUBLIC PORTAL"}
              </span>
              <span className="gov-constituency-tag">
                <MapPin size={11} style={{ marginRight: "3px" }} />
                {citizenProfile?.district
                  ? `${citizenProfile.district}, ${citizenProfile.state || "India"}`
                  : "Nizamabad, Telangana"}
              </span>
            </div>
            <h1 className="gov-mp-page-title">
              {citizenProfile?.fullName
                ? `Saarthi · Welcome, ${citizenProfile.fullName}`
                : "Saarthi · Public Transparency & Social Audit"}
            </h1>
            <p className="gov-mp-page-subtitle">
              Direct citizen portal for MPLADS developmental works: explore public community assets, verify ground completion against digital records, and participate in social audit.
            </p>
          </div>

          <div className="gov-mp-header-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="gov-redirect-link-btn"
              onClick={() => handleTabChange("verify")}
              style={{ cursor: "pointer" }}
            >
              <QrCode size={13} />
              <span>On-Site QR Scan</span>
            </button>

            <button
              type="button"
              className="gov-redirect-link-btn"
              onClick={() => handleTabChange("report")}
              style={{ cursor: "pointer", background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" }}
            >
              <Flag size={13} />
              <span>Report Discrepancy</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Public Tab Navigation Bar */}
      <div className="citizen-pills-list">
        {CITIZEN_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`citizen-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge && <span className="citizen-pill-badge">{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Viewport */}
      {currentTab === "overview" && (
        <CitizenOverviewTab
          summary={summary}
          onSwitchTab={handleTabChange}
          onSelectWork={onSelectWork}
        />
      )}

      {currentTab === "map" && (
        <CitizenMapTab
          onSelectWork={onSelectWork}
          onReportWork={handleReportWork}
        />
      )}

      {currentTab === "explore" && (
        <CitizenExploreTab
          onSelectWork={onSelectWork}
          onReportWork={handleReportWork}
        />
      )}

      {currentTab === "constituency" && (
        <CitizenConstituencyTab
          onSelectWork={onSelectWork}
        />
      )}

      {currentTab === "analytics" && (
        <CitizenAnalyticsTab />
      )}

      {currentTab === "evidence" && (
        <CitizenEvidenceTab
          onSelectWork={onSelectWork}
          onReportWork={handleReportWork}
        />
      )}

      {currentTab === "report" && (
        <CitizenReportIssueTab
          targetWork={targetWorkForReport}
          onTrackComplaint={handleTrackComplaint}
        />
      )}

      {currentTab === "complaints" && (
        <CitizenComplaintsTab
          initialComplaintId={trackedComplaintId}
        />
      )}

      {currentTab === "verify" && (
        <CitizenVerifyTab
          onSelectWork={onSelectWork}
          onReportWork={handleReportWork}
        />
      )}
    </div>
  );
}
