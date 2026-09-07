import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  Users,
  ShieldCheck,
  Search,
  CheckCircle2,
  FileCheck,
  Eye,
  MapPin,
} from "lucide-react";
import { formatNumber, formatCrores } from "../../constants";
import "./PlaceholderDashboard.css";

export default function CitizenDashboard({ summary, onSelectWork }) {
  const { roleConfig } = useAuth();

  return (
    <div className="compact-page-container">
      {/* Official Government Page Header */}
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">
            PUBLIC TRANSPARENCY & CITIZEN OVERSIGHT · JAN SAARTHI
          </div>
          <h2>Citizen Dashboard</h2>
          <p>
            Public transparency and social audit portal: track community development works in your constituency,
            verify completed infrastructure, and inspect public fund utilization.
          </p>
        </div>
        <div className="gov-header-actions">
          <Link to="/works" className="gov-btn-primary">
            <Search size={15} />
            <span>Search Your Constituency Works</span>
          </Link>
        </div>
      </div>

      {/* Role Scope & Single Source of Truth Card */}
      <div className="placeholder-scope-card accent-info">
        <div className="scope-header">
          <div className="scope-badge">
            <span className="scope-icon">{roleConfig?.icon || "👥"}</span>
            <span className="scope-title">{roleConfig?.displayName || "Citizen Transparency Portal"}</span>
          </div>
          <div className="truth-indicator">
            <ShieldCheck size={16} />
            <span>Single Source of Truth: Active (FastAPI / 102,703 Works)</span>
          </div>
        </div>

        <div className="scope-body">
          <div className="scope-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Assigned Persona Path</span>
              <strong className="meta-val font-mono">/citizen</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Public Access Scope</span>
              <strong className="meta-val">Sanctioned & Completed Works (Public Transparency)</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Completed Public Assets</span>
              <strong className="meta-val">
                {summary?.completed_works_count !== undefined
                  ? `${formatNumber(summary.completed_works_count)} Assets Delivered`
                  : "Connecting to master repository..."}
              </strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Total Public Database</span>
              <strong className="meta-val">
                {summary?.total_works !== undefined
                  ? `${formatNumber(summary.total_works)} Records`
                  : "Connecting to master repository..."}
              </strong>
            </div>
          </div>

          <div className="scope-description-box">
            <strong>Scope & Authority Description:</strong>
            <p>
              {roleConfig?.description ||
                "Open public transparency dashboard for citizens to view sanctioned development projects in their constituency, verify physical completion, and participate in social audit."}
            </p>
          </div>
        </div>
      </div>

      {/* Shared Foundation Quick Links */}
      <div className="placeholder-tools-section mt-3">
        <h3 className="section-subtitle">Public Verification Tools</h3>
        <div className="shared-tools-grid">
          <Link to="/works" className="tool-card">
            <div className="tool-icon-wrap blue">
              <Search size={20} />
            </div>
            <div className="tool-info">
              <h4>Constituency Work Search</h4>
              <p>Find roads, solar lighting, schools, and drinking water facilities in your village or town.</p>
            </div>
          </Link>

          <Link to="/photo-verifier" className="tool-card">
            <div className="tool-icon-wrap green">
              <FileCheck size={20} />
            </div>
            <div className="tool-info">
              <h4>Geo-Tagged Photo Inspection</h4>
              <p>View verified site photographs and GPS geofence matching for completed assets.</p>
            </div>
          </Link>

          <Link to="/states" className="tool-card">
            <div className="tool-icon-wrap amber">
              <MapPin size={20} />
            </div>
            <div className="tool-info">
              <h4>State & UT Progress Summary</h4>
              <p>Compare project delivery numbers and fund utilization across all 36 States and UTs.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Development Roadmap Note */}
      <div className="foundation-notice-strip mt-3">
        <CheckCircle2 size={16} />
        <span>
          <strong>Phase 10 Foundation Active:</strong> Full Citizen Transparency Dashboard analytics
          (Geo-spatial constituency map, community grievance/feedback module, and social audit report card) will be
          expanded in Phase 15.
        </span>
      </div>
    </div>
  );
}
