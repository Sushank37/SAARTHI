import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  ShieldCheck,
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

  return (
    <div className="citizen-portal-container">
      {/* 1. Official Citizen Hero Banner */}
      <div className="citizen-hero-banner">
        <div className="citizen-hero-brand">
          <div className="citizen-emblem-badge" title="National Emblem of India">
            🏛️
          </div>
          <div className="citizen-hero-text">
            <h1>
              <span>Jan Saarthi · Public Transparency & Social Audit</span>
              <span className="citizen-tag-pill">Citizen Oversight</span>
            </h1>
            <p>
              Direct citizen portal for MPLADS developmental works: explore public community assets, verify ground completion against digital records, and participate in participatory democracy.
            </p>
          </div>
        </div>

        <div className="citizen-hero-actions">
          <button
            type="button"
            className="citizen-quick-action-btn"
            onClick={() => handleTabChange("verify")}
          >
            <QrCode size={14} />
            <span>On-Site QR Scan</span>
          </button>

          <button
            type="button"
            className="citizen-quick-action-btn primary"
            onClick={() => handleTabChange("report")}
          >
            <Flag size={14} />
            <span>Report Discrepancy</span>
          </button>
        </div>
      </div>

      {/* 2. Public Tab Navigation Bar */}
      <div className="citizen-tab-bar">
        {CITIZEN_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`citizen-tab-pill ${isActive ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.badge && <span className="citizen-tab-badge">{tab.badge}</span>}
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
