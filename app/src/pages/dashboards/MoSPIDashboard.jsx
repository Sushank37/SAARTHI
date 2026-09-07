import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import ESakshiOfficialCards from "../../components/ESakshiOfficialCards";
import {
  ShieldAlert,
  GitBranch,
  ClipboardCheck,
  Map,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { formatNumber, formatCrores } from "../../constants";
import "./PlaceholderDashboard.css";

export default function MoSPIDashboard({ summary, house, onSelectWork }) {
  const { roleConfig } = useAuth();

  return (
    <div className="compact-page-container">
      {/* Official Government Page Header */}
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">
            CENTRAL NODAL SURVEILLANCE · MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION
          </div>
          <h2>MoSPI Dashboard</h2>
          <p>
            Central Nodal Authority national surveillance: all-India fund audit, cross-state benchmarking,
            duplicate detection, and macro scheme progress.
          </p>
        </div>
        <div className="gov-header-actions">
          <Link to="/states" className="gov-btn-primary">
            <Map size={15} />
            <span>State-wise Analytics</span>
          </Link>
        </div>
      </div>

      {/* Role Scope & Single Source of Truth Card */}
      <div className="placeholder-scope-card accent-success">
        <div className="scope-header">
          <div className="scope-badge">
            <span className="scope-icon">{roleConfig?.icon || "🏛️"}</span>
            <span className="scope-title">{roleConfig?.displayName || "MoSPI Central Nodal Authority"}</span>
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
              <strong className="meta-val font-mono">/mospi</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">National Surveillance Scope</span>
              <strong className="meta-val">All 36 States & UTs (Unrestricted National Scope)</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Recommended Works Value</span>
              <strong className="meta-val">{formatCrores(summary?.total_recommended_amount || 56144023551)}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Total Repository Size</span>
              <strong className="meta-val">{formatNumber(summary?.total_works || 102703)} Records</strong>
            </div>
          </div>

          <div className="scope-description-box">
            <strong>Scope & Authority Description:</strong>
            <p>
              {roleConfig?.description ||
                "Ministry of Statistics & Programme Implementation (MoSPI) Central Nodal Agency oversight: pan-India surveillance, cross-state benchmarking, duplicate detection, and fund audit."}
            </p>
          </div>
        </div>
      </div>

      {/* Live eSAKSHI KPI Grid */}
      <div className="mt-3">
        <ESakshiOfficialCards summary={summary} house={house} />
      </div>

      {/* Shared Foundation Quick Links */}
      <div className="placeholder-tools-section mt-3">
        <h3 className="section-subtitle">National Surveillance Toolset</h3>
        <div className="shared-tools-grid">
          <Link to="/states" className="tool-card">
            <div className="tool-icon-wrap blue">
              <Map size={20} />
            </div>
            <div className="tool-info">
              <h4>State & UT Comparative Progress</h4>
              <p>Benchmarking across 36 States & UTs for work volume, expenditure, and audit load.</p>
            </div>
          </Link>

          <Link to="/risk-cases" className="tool-card">
            <div className="tool-icon-wrap red">
              <ShieldAlert size={20} />
            </div>
            <div className="tool-info">
              <h4>Cost Anomaly & Delay Intelligence</h4>
              <p>National analysis of cost escalations and lifecycle completion duration bottlenecks.</p>
            </div>
          </Link>

          <Link to="/duplicates" className="tool-card">
            <div className="tool-icon-wrap amber">
              <GitBranch size={20} />
            </div>
            <div className="tool-info">
              <h4>Pan-India Duplicate Clusters</h4>
              <p>Macro view of 1,401 duplicate clusters detected across parliamentary jurisdictions.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Development Roadmap Note */}
      <div className="foundation-notice-strip mt-3">
        <CheckCircle2 size={16} />
        <span>
          <strong>Phase 10 Foundation Active:</strong> Full MoSPI Central Dashboard analytics
          (National macro trend forecasts, multi-year fund release vs. physical asset correlation, and cross-state anomaly matrices) will be expanded in Phase 14.
        </span>
      </div>
    </div>
  );
}
