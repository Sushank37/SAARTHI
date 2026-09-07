import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  Scale,
  ShieldCheck,
  ClipboardCheck,
  GitBranch,
  Database,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { formatNumber } from "../../constants";
import "./PlaceholderDashboard.css";

export default function DADashboard({ summary, onSelectWork }) {
  const { roleConfig } = useAuth();

  return (
    <div className="compact-page-container">
      {/* Official Government Page Header */}
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">
            DISTRICT NODAL SURVEILLANCE · NODAL DISTRICT AUTHORITY (NDA / COLLECTOR)
          </div>
          <h2>District Authority Dashboard</h2>
          <p>
            District administration scrutiny, feasibility clearance, duplicate proposal blocking, and
            sanction issuance for designated civil works.
          </p>
        </div>
        <div className="gov-header-actions">
          <Link to="/review" className="gov-btn-primary">
            <ClipboardCheck size={15} />
            <span>Open Verification Queue</span>
          </Link>
        </div>
      </div>

      {/* Role Scope & Single Source of Truth Card */}
      <div className="placeholder-scope-card accent-warning">
        <div className="scope-header">
          <div className="scope-badge">
            <span className="scope-icon">{roleConfig?.icon || "⚖️"}</span>
            <span className="scope-title">{roleConfig?.displayName || "District Authority"}</span>
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
              <strong className="meta-val font-mono">/da</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Data Scope Boundary</span>
              <strong className="meta-val">District Planning Scope (`IDA_NAME` / `CONSTITUENCY`)</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Audit Review Queue</span>
              <strong className="meta-val">
                {summary?.review_required !== undefined
                  ? `${formatNumber(summary.review_required)} Priority Cases`
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
                "District Collector / District Magistrate authority portal for administrative scrutiny, pre-sanction feasibility clearance, duplicate blocking, and fund release."}
            </p>
          </div>
        </div>
      </div>

      {/* Shared Foundation Quick Links */}
      <div className="placeholder-tools-section mt-3">
        <h3 className="section-subtitle">Shared Tools Available for District Authority View</h3>
        <div className="shared-tools-grid">
          <Link to="/review" className="tool-card">
            <div className="tool-icon-wrap amber">
              <ClipboardCheck size={20} />
            </div>
            <div className="tool-info">
              <h4>District Audit & Review Queue</h4>
              <p>Verify flagged projects requiring District Authority scrutiny and inspection.</p>
            </div>
          </Link>

          <Link to="/duplicates" className="tool-card">
            <div className="tool-icon-wrap red">
              <GitBranch size={20} />
            </div>
            <div className="tool-info">
              <h4>Duplicate Work Detection</h4>
              <p>Inspect AI-identified duplicate clusters and cross-recommendation overlaps.</p>
            </div>
          </Link>

          <Link to="/pre-sanction" className="tool-card">
            <div className="tool-icon-wrap blue">
              <Sparkles size={20} />
            </div>
            <div className="tool-info">
              <h4>Pre-Sanction AI Check</h4>
              <p>Simulate new proposal submissions against the 102,703 project register.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Development Roadmap Note */}
      <div className="foundation-notice-strip mt-3">
        <CheckCircle2 size={16} />
        <span>
          <strong>Phase 10 Foundation Active:</strong> Full District Authority Dashboard analytics
          (District sanction clearance workflow, feasibility checklist, and contractor allocation) will be
          expanded in Phase 12.
        </span>
      </div>
    </div>
  );
}
