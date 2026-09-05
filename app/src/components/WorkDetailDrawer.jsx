import React from "react";
import {
  X,
  ShieldAlert,
  AlertTriangle,
  GitBranch,
  Clock,
  IndianRupee,
  TrendingUp,
  FileCheck,
  Building,
  MapPin,
  User,
  Printer,
} from "lucide-react";
import { formatNumber, formatDecimal, formatCurrency } from "../constants";

export default function WorkDetailDrawer({ work, onClose }) {
  if (!work) return null;

  const riskLevel = String(work.RISK_LEVEL || "LOW").toUpperCase();
  const dupRisk = String(work.DUPLICATE_RISK || "NONE").toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="gov-detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="header-meta">
            <span className="doc-category">OFFICIAL MPLADS WORK DOSSIER</span>
            <h2 className="work-id-title">
              Work #{work.WORK_ID || work.WORK_RECOMMENDATION_DTL_ID}
            </h2>
            <div className="location-crumb">
              <MapPin size={13} />
              <span>
                {work.STATE_NAME || "State not specified"} · {work.CONSTITUENCY || "Constituency"}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button className="gov-btn-outline" onClick={handlePrint} title="Print Dossier">
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button className="drawer-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Audit Badges */}
        <div className="drawer-badges-strip">
          <span className={`status-pill risk-${riskLevel.toLowerCase()}`}>
            <ShieldAlert size={13} />
            FINANCIAL RISK: {riskLevel} ({formatDecimal(work.RISK_SCORE || 0)})
          </span>
          {dupRisk !== "NONE" && dupRisk !== "NOT IN CLUSTER" && (
            <span className={`status-pill dup-${dupRisk.toLowerCase()}`}>
              <GitBranch size={13} />
              DUPLICATE RISK: {dupRisk}
            </span>
          )}
          {work.WORK_STAGE && (
            <span className="status-pill stage-pill">
              STAGE: {work.WORK_STAGE}
            </span>
          )}
        </div>

        <div className="drawer-body-scroll">
          {/* Work Description Section */}
          <section className="dossier-section">
            <h3 className="section-title">Work Description</h3>
            <div className="description-box">
              {work.WORK_DESCRIPTION || "No detailed work description recorded in eSAKSHI entry."}
            </div>
          </section>

          {/* Administrative Metadata */}
          <section className="dossier-section">
            <h3 className="section-title">Administrative & Constituency Details</h3>
            <div className="audit-grid-2">
              <div className="grid-cell">
                <span className="cell-label"><User size={13} /> Recommending MP</span>
                <strong className="cell-val">{work.MP_NAME || "Hon'ble MP Not Specified"}</strong>
              </div>
              <div className="grid-cell">
                <span className="cell-label"><Building size={13} /> Work Category</span>
                <strong className="cell-val">{work.WORK_CATEGORY || "General Community Works"}</strong>
              </div>
              <div className="grid-cell">
                <span className="cell-label">Activity Name</span>
                <strong className="cell-val">{work.ACTIVITY_NAME || "Standard Civic Infrastructure"}</strong>
              </div>
              <div className="grid-cell">
                <span className="cell-label">Implementing Agency (IDA)</span>
                <strong className="cell-val">{work.IDA_NAME || "District Planning Office / ZP"}</strong>
              </div>
            </div>
          </section>

          {/* Financial Breakdown & Cost Variance */}
          <section className="dossier-section">
            <h3 className="section-title">Financial Audit & Peer Comparison</h3>
            <div className="audit-grid-3">
              <div className="grid-cell highlight-blue">
                <span className="cell-label">Recommended Amount</span>
                <strong className="cell-val">{formatCurrency(work.RECOMMENDED_AMOUNT)}</strong>
              </div>
              <div className="grid-cell highlight-blue">
                <span className="cell-label">Sanctioned Amount</span>
                <strong className="cell-val">{formatCurrency(work.SANCTION_AMOUNT)}</strong>
              </div>
              <div className="grid-cell highlight-blue">
                <span className="cell-label">Actual Expenditure</span>
                <strong className="cell-val">{formatCurrency(work.ACTUAL_AMOUNT)}</strong>
              </div>
            </div>

            <div className="audit-subgrid mt-2">
              <div className="subgrid-row">
                <span>Cost Escalation vs Sanction:</span>
                <strong className={Number(work.COST_VARIANCE) > 0 ? "danger-text" : "safe-text"}>
                  {formatCurrency(work.COST_VARIANCE)} ({formatDecimal(work.COST_VARIANCE_PERCENT)}%)
                </strong>
              </div>
              <div className="subgrid-row">
                <span>State/Category Peer Median Cost:</span>
                <strong>{formatCurrency(work.PEER_MEDIAN_SANCTION_AMOUNT)}</strong>
              </div>
              <div className="subgrid-row">
                <span>Cost Ratio vs Peer Median:</span>
                <strong className={Number(work.COST_VS_PEER) > 2 ? "danger-text" : "safe-text"}>
                  {work.COST_VS_PEER ? `${formatDecimal(work.COST_VS_PEER)}x` : "—"}
                </strong>
              </div>
            </div>
          </section>

          {/* Lifecycle Delays vs Guidelines */}
          <section className="dossier-section">
            <h3 className="section-title">Timeline & Execution Delays (eSAKSHI Guidelines)</h3>
            <div className="timeline-grid">
              <div className="timeline-card">
                <Clock size={15} />
                <div>
                  <span className="t-label">Sanction Delay</span>
                  <strong>{work.SANCTION_DELAY_DAYS != null ? `${work.SANCTION_DELAY_DAYS} days` : "—"}</strong>
                  <small>Peer Median: {work.PEER_MEDIAN_SANCTION_DELAY || "—"} days</small>
                </div>
              </div>
              <div className="timeline-card">
                <Clock size={15} />
                <div>
                  <span className="t-label">Completion Duration</span>
                  <strong>{work.COMPLETION_DURATION_DAYS != null ? `${work.COMPLETION_DURATION_DAYS} days` : "—"}</strong>
                  <small>Peer Median: {work.PEER_MEDIAN_COMPLETION_DAYS || "—"} days</small>
                </div>
              </div>
            </div>
          </section>

          {/* AI Risk Rationale */}
          {work.RISK_REASON && (
            <section className="dossier-section">
              <h3 className="section-title danger-header">AI Risk & Anomaly Rationale</h3>
              <div className="alert-rationale-box">
                {work.RISK_REASON}
              </div>
            </section>
          )}

          {/* AI Duplicate Cluster Evidence */}
          {work.EVIDENCE && (
            <section className="dossier-section">
              <h3 className="section-title warning-header">Duplicate Detection Evidence</h3>
              <div className="warning-evidence-box">
                {work.EVIDENCE}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
