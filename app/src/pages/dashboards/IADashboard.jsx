import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  ShieldCheck,
  Camera,
  Layers,
  Database,
  CheckCircle2,
  Clock,
  Wrench,
} from "lucide-react";
import { formatNumber } from "../../constants";
import "./PlaceholderDashboard.css";

export default function IADashboard({ summary, onSelectWork }) {
  const { roleConfig } = useAuth();

  return (
    <div className="compact-page-container">
      {/* Official Government Page Header */}
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">
            PROJECT EXECUTION SURVEILLANCE · IMPLEMENTING AGENCY (IA / VENDOR)
          </div>
          <h2>Implementing Agency Dashboard</h2>
          <p>
            Civil infrastructure execution, contractor milestone progress, Measurement Book (MB)
            verification, and geo-tagged site photographic compliance.
          </p>
        </div>
        <div className="gov-header-actions">
          <Link to="/photo-verifier" className="gov-btn-primary">
            <Camera size={15} />
            <span>Open Geo-Photo Verifier</span>
          </Link>
        </div>
      </div>

      {/* Role Scope & Single Source of Truth Card */}
      <div className="placeholder-scope-card accent-accent">
        <div className="scope-header">
          <div className="scope-badge">
            <span className="scope-icon">{roleConfig?.icon || "👷"}</span>
            <span className="scope-title">{roleConfig?.displayName || "Implementing Agency"}</span>
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
              <strong className="meta-val font-mono">/ia</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Execution Scope Boundary</span>
              <strong className="meta-val">Designated IA Entities (`IDA_NAME` / Contractors)</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Completed Asset Deliveries</span>
              <strong className="meta-val">
                {summary?.completed_works_count !== undefined
                  ? `${formatNumber(summary.completed_works_count)} Projects (${summary.completion_rate}%)`
                  : "Connecting to master repository..."}
              </strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Total Repository Size</span>
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
                "Execution tracking for designated implementing bodies (PWD, Rural Engineering, Zila Parishad) and civil infrastructure contractors."}
            </p>
          </div>
        </div>
      </div>

      {/* Shared Foundation Quick Links */}
      <div className="placeholder-tools-section mt-3">
        <h3 className="section-subtitle">Shared Tools Available for Implementing Agency View</h3>
        <div className="shared-tools-grid">
          <Link to="/photo-verifier" className="tool-card">
            <div className="tool-icon-wrap green">
              <Camera size={20} />
            </div>
            <div className="tool-info">
              <h4>Geo-Photo AI Verifier</h4>
              <p>Upload site photos to test GPS geofence matching and perceptual duplicate detection.</p>
            </div>
          </Link>

          <Link to="/works" className="tool-card">
            <div className="tool-icon-wrap blue">
              <Database size={20} />
            </div>
            <div className="tool-info">
              <h4>Execution Work Registry</h4>
              <p>Search active sanctioned projects across all execution stages and vendor assignments.</p>
            </div>
          </Link>

          <Link to="/risk-cases" className="tool-card">
            <div className="tool-icon-wrap red">
              <Clock size={20} />
            </div>
            <div className="tool-info">
              <h4>Execution Delay Alerts</h4>
              <p>Review projects experiencing completion duration delays vs. state peer medians.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Development Roadmap Note */}
      <div className="foundation-notice-strip mt-3">
        <CheckCircle2 size={16} />
        <span>
          <strong>Phase 10 Foundation Active:</strong> Full Implementing Agency Dashboard analytics
          (Milestone stage management, contractor MB records, and billing claims) will be expanded in Phase 13.
        </span>
      </div>
    </div>
  );
}
