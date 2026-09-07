import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Building2,
  MapPin,
  User,
  Printer,
  Calendar,
  Layers,
  Camera,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Bell,
  AlertOctagon,
  Filter,
} from "lucide-react";
import { formatNumber, formatDecimal, formatCurrency } from "../constants";
import "./WorkDetailDrawer.css";

// 11 Specific Audit Navigation Modules inside the Dossier
const DOSSIER_AUDIT_TABS = [
  { id: "all", label: "Full Audit (All Sections)" },
  { id: "overview", label: "1. Overview & Sponsorship" },
  { id: "sanction", label: "2. Sanction Feasibility (Sec 3.11)" },
  { id: "compliance-45d", label: "3. 45-Day Limit (Sec 3.12)" },
  { id: "completion", label: "4. 1-Yr Completion (Sec 3.14)" },
  { id: "financials", label: "5. Financials & Escalation" },
  { id: "risk", label: "6. AI Risk & Anomalies" },
  { id: "duplicates", label: "7. Duplicate Clusters" },
  { id: "ia", label: "8. Executing Agency (IA)" },
  { id: "evidence", label: "9. Ground Evidence" },
  { id: "geo-photo", label: "10. Geo-Photo & Site (Sec 3.16)" },
  { id: "actions", label: "11. Collector Clearance" },
];

export default function WorkDetailDrawer({ work, onClose, initialSection = "all" }) {
  if (!work) return null;

  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [verifiedLocally, setVerifiedLocally] = useState(false);
  const [noticeIssued, setNoticeIssued] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection || "all");

  // Synchronize initial section if prop updates
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection, work]);

  // Clean IDs
  const workId = work.WORK_ID != null ? String(Math.round(Number(work.WORK_ID))) : null;
  const recId = work.WORK_RECOMMENDATION_DTL_ID != null ? String(Math.round(Number(work.WORK_RECOMMENDATION_DTL_ID))) : null;
  const primaryId = workId ? `Work #${workId}` : `Proposal #${recId || "—"}`;
  const clusterId = work.CLUSTER_ID != null ? String(Math.round(Number(work.CLUSTER_ID))) : null;
  const clusterSize = work.CLUSTER_SIZE != null ? Math.round(Number(work.CLUSTER_SIZE)) : (clusterId ? 2 : null);
  const pairCount = work.PAIR_COUNT != null ? Math.round(Number(work.PAIR_COUNT)) : null;

  // Audit Status Indicators
  const riskLevel = String(work.RISK_LEVEL || "LOW").toUpperCase();
  const dupRisk = String(work.DUPLICATE_RISK || "NONE").toUpperCase();
  const suspicionLevel = String(work.SUSPICION_LEVEL || "NORMAL").toUpperCase();
  const stage = work.WORK_STAGE || "Pending Sanction";
  const delayDays = work.SANCTION_DELAY_DAYS != null ? Math.round(Number(work.SANCTION_DELAY_DAYS)) : null;
  const isOverdue45 = delayDays != null && delayDays > 45;
  const isApproaching45 = delayDays != null && delayDays >= 30 && delayDays <= 45;

  // Elapsed execution duration from sanction date for uncompleted works
  let elapsedDaysFromSanction = null;
  if (work.SANCTION_DATE) {
    const sDate = new Date(work.SANCTION_DATE);
    if (!isNaN(sDate.getTime())) {
      const refDate = new Date("2026-09-01");
      elapsedDaysFromSanction = Math.max(0, Math.floor((refDate - sDate) / (1000 * 60 * 60 * 24)));
    }
  }

  const effectiveCompletionDays = work.COMPLETION_DURATION_DAYS != null
    ? Math.round(Number(work.COMPLETION_DURATION_DAYS))
    : (stage !== "Work Completed" ? elapsedDaysFromSanction : null);
  const isOverdue1Yr = stage !== "Work Completed" && effectiveCompletionDays != null && effectiveCompletionDays > 365;

  // Financial amounts
  const recAmount = Number(work.RECOMMENDED_AMOUNT) || 0;
  const sancAmount = Number(work.SANCTION_AMOUNT) || 0;
  const actAmount = Number(work.ACTUAL_AMOUNT) || 0;
  const remainingBalance = Math.max(0, sancAmount - actAmount);
  const costVariance = Number(work.COST_VARIANCE) || (sancAmount > 0 ? actAmount - sancAmount : 0);
  const costVariancePct = work.COST_VARIANCE_PERCENT != null
    ? Number(work.COST_VARIANCE_PERCENT)
    : (sancAmount > 0 ? ((actAmount - sancAmount) / sancAmount) * 100 : 0);
  const peerMedianCost = Number(work.PEER_MEDIAN_SANCTION_AMOUNT) || null;
  const costVsPeer = Number(work.COST_VS_PEER) || null;
  const disbursementRate = sancAmount > 0 ? ((actAmount / sancAmount) * 100).toFixed(1) : "0.0";

  // Duplicate similarity percentages
  const textSimPct = work.AVG_TEXT_SIMILARITY != null
    ? (Number(work.AVG_TEXT_SIMILARITY) <= 1 ? (Number(work.AVG_TEXT_SIMILARITY) * 100).toFixed(1) : Number(work.AVG_TEXT_SIMILARITY).toFixed(1))
    : null;
  const maxTextSimPct = work.MAX_TEXT_SIMILARITY != null
    ? (Number(work.MAX_TEXT_SIMILARITY) <= 1 ? (Number(work.MAX_TEXT_SIMILARITY) * 100).toFixed(1) : Number(work.MAX_TEXT_SIMILARITY).toFixed(1))
    : null;
  const amountSimPct = work.AVG_AMOUNT_SIMILARITY != null
    ? (Number(work.AVG_AMOUNT_SIMILARITY) <= 1 ? (Number(work.AVG_AMOUNT_SIMILARITY) * 100).toFixed(1) : Number(work.AVG_AMOUNT_SIMILARITY).toFixed(1))
    : null;

  // House formatting
  const houseRaw = String(work.HOUSE_OF_PARLIAMENT || "").trim();
  const displayHouse = houseRaw === "2" || houseRaw === "2.0"
    ? "Lok Sabha (18th Session)"
    : houseRaw === "1" || houseRaw === "1.0"
    ? "Rajya Sabha"
    : (houseRaw || "Lok Sabha");

  const handlePrint = () => {
    window.print();
  };

  const handleCopyDescription = () => {
    if (work.WORK_DESCRIPTION) {
      navigator.clipboard.writeText(work.WORK_DESCRIPTION);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyId = () => {
    const textToCopy = workId || recId || "";
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const shouldShow = (sectionId) => {
    return activeSection === "all" || activeSection === sectionId;
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="gov-detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* 1. Official Government Dossier Header */}
        <div className="drawer-header">
          <div className="header-meta">
            <div className="doc-category-line">
              <span className="doc-category">OFFICIAL MPLADS eSAKSHI WORK INSPECTION DOSSIER</span>
              <span className="doc-confidential-tag">STATUTORY RECORD · FORM 78-A</span>
            </div>
            <h2 className="work-id-title">
              {primaryId}
              {workId && recId && (
                <span className="rec-id-subtext"> (Recommendation #{recId})</span>
              )}
            </h2>
            <div className="location-crumb">
              <MapPin size={13} />
              <span>
                State: <strong>{work.STATE_NAME || "Not Specified"}</strong> · Constituency:{" "}
                <strong>{work.CONSTITUENCY || "District Constituency"}</strong> · House:{" "}
                <strong>{displayHouse}</strong>
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="gov-btn-outline"
              onClick={handleCopyId}
              title="Copy Record ID"
            >
              {copiedId ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
              <span>{copiedId ? "Copied" : "Copy ID"}</span>
            </button>
            <button
              type="button"
              className="gov-btn-outline"
              onClick={handlePrint}
              title="Print Official 78-Field Dossier"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Close Dossier"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. Official Audit Status Badges Strip */}
        <div className="drawer-badges-strip">
          <span className="status-pill stage-pill">
            <Layers size={12} />
            STAGE: {stage}
          </span>

          <span
            className={`status-pill ${
              riskLevel === "HIGH"
                ? "risk-high"
                : riskLevel === "MEDIUM"
                ? "risk-medium"
                : "risk-low"
            }`}
          >
            <ShieldAlert size={12} />
            FINANCIAL RISK: {riskLevel} ({formatDecimal(work.RISK_SCORE || 0)})
          </span>

          {dupRisk !== "NONE" && dupRisk !== "NOT IN CLUSTER" && (
            <span
              className={`status-pill ${
                dupRisk === "HIGH" ? "dup-high" : "dup-medium"
              }`}
            >
              <GitBranch size={12} />
              DUPLICATE RISK: {dupRisk} {clusterId ? `(Cluster #${clusterId})` : ""}
            </span>
          )}

          {isOverdue45 ? (
            <span className="status-pill compliance-pill">
              <Clock size={12} />
              45-DAY LIMIT EXCEEDED (+{delayDays - 45}d)
            </span>
          ) : isApproaching45 ? (
            <span className="status-pill review-pill">
              <Clock size={12} />
              30-45D WARNING ({delayDays}d)
            </span>
          ) : delayDays != null ? (
            <span className="status-pill risk-low">
              <CheckCircle2 size={12} />
              SANCTION COMPLIANT ({delayDays}d)
            </span>
          ) : null}

          {isOverdue1Yr ? (
            <span className="status-pill compliance-pill">
              <AlertTriangle size={12} />
              12-MO COMPLETION OVERDUE ({effectiveCompletionDays}d)
            </span>
          ) : stage === "Work Completed" ? (
            <span className="status-pill risk-low">
              <CheckCircle2 size={12} />
              COMPLETED ASSET
            </span>
          ) : null}

          {work.REQUIRES_REVIEW && (
            <span className="status-pill review-pill">
              <AlertCircle size={12} />
              SCRUTINY FLAGGED
            </span>
          )}

          {verifiedLocally && (
            <span className="status-pill risk-low">
              <CheckCircle2 size={12} />
              COLLECTORATE VERIFIED ✓
            </span>
          )}

          {noticeIssued && (
            <span className="status-pill review-pill">
              <AlertOctagon size={12} />
              7-DAY EXPLANATION NOTICE ISSUED
            </span>
          )}
        </div>

        {/* 3. Section Navigation Filter Pills (Quick-jump across all 11 DA parts) */}
        <div className="dossier-nav-tabs-bar">
          <div className="dossier-nav-tabs-scroll">
            {DOSSIER_AUDIT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`dossier-nav-tab ${activeSection === tab.id ? "active" : ""}`}
                onClick={() => setActiveSection(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeSection !== "all" && (
            <button
              type="button"
              className="dossier-reset-filter-btn"
              onClick={() => setActiveSection("all")}
              title="Show all sections"
            >
              Reset to All
            </button>
          )}
        </div>

        {/* 4. Scrollable Dossier Body with All 11 Sections */}
        <div className="drawer-body-scroll">
          {/* SECTION 1: DISTRICT OVERVIEW & SPONSORSHIP */}
          {shouldShow("overview") && (
            <section className="dossier-section" id="dossier-sec-overview">
              <div className="section-header-row">
                <h3 className="section-title">
                  <span className="sec-num-badge">1</span>
                  <span>District Overview & Parliamentary Sponsorship</span>
                </h3>
                <button
                  type="button"
                  className="gov-btn-outline text-xs py-1 px-2 flex items-center gap-1"
                  onClick={handleCopyDescription}
                  title="Copy work description"
                >
                  {copied ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy Description"}</span>
                </button>
              </div>

              <div className="description-box mb-3">
                <div className="desc-label">Official Work Description (eSAKSHI Entry):</div>
                <div className="desc-body">
                  {work.WORK_DESCRIPTION || "No detailed work description recorded in eSAKSHI entry."}
                </div>
              </div>

              {work.REPRESENTATIVE_DESCRIPTION && work.REPRESENTATIVE_DESCRIPTION !== work.WORK_DESCRIPTION && (
                <div className="description-box mb-3 representative-desc">
                  <div className="desc-label">Cluster Representative Description:</div>
                  <div className="desc-body text-slate-700">
                    {work.REPRESENTATIVE_DESCRIPTION}
                  </div>
                </div>
              )}

              <div className="audit-grid-2">
                <div className="grid-cell">
                  <span className="cell-label">
                    <User size={13} /> Recommending Hon'ble MP
                  </span>
                  <strong className="cell-val">{work.MP_NAME || "Hon'ble MP Not Specified"}</strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">
                    <Building size={13} /> Work Category
                  </span>
                  <strong className="cell-val">{work.WORK_CATEGORY || "General/Civil Works"}</strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">Activity Designation</span>
                  <strong className="cell-val">
                    {work.ACTIVITY_NAME || "Standard Civic Infrastructure"}
                  </strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">
                    <Calendar size={13} /> Recommendation Date
                  </span>
                  <strong className="cell-val">{work.RECOMMENDATION_DATE || "Recorded"}</strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">Parliamentary Term & House</span>
                  <strong className="cell-val">{displayHouse}</strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">Master Recommendation Detail ID</span>
                  <strong className="cell-val font-mono">{recId || "—"}</strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: SANCTION & AS/TS FEASIBILITY (SECTION 3.11 MPLADS) */}
          {shouldShow("sanction") && (
            <section className="dossier-section" id="dossier-sec-sanction">
              <div className="section-header-row">
                <h3 className="section-title">
                  <span className="sec-num-badge">2</span>
                  <span>Administrative & Technical Sanction (Sec 3.11 MPLADS)</span>
                </h3>
                <span className={`status-pill ${stage === "Pending Sanction" ? "dup-medium" : "risk-low"}`}>
                  {stage}
                </span>
              </div>

              <div className="dossier-guideline-note">
                <strong>Statutory Mandate (Section 3.11):</strong> The District Authority shall examine the feasibility
                of proposed works, verify site eligibility, obtain detailed cost estimates from the Implementing Agency,
                and accord Administrative Sanction (AS) or formal rejection.
              </div>

              <div className="audit-grid-3 mt-2">
                <div className="grid-cell highlight-blue">
                  <span className="cell-label">Sanction Order Status</span>
                  <strong className="cell-val">
                    {sancAmount > 0 ? "AS/TS Order Issued" : "Awaiting Collector Order"}
                  </strong>
                </div>
                <div className="grid-cell highlight-blue">
                  <span className="cell-label">Formal Sanction Date</span>
                  <strong className="cell-val">{work.SANCTION_DATE || "Pending Issuance"}</strong>
                </div>
                <div className="grid-cell highlight-blue">
                  <span className="cell-label">Sanctioned Cost (₹)</span>
                  <strong className="cell-val">
                    {sancAmount > 0 ? formatCurrency(sancAmount) : "Awaiting Approval"}
                  </strong>
                </div>
              </div>

              <div className="audit-subgrid">
                <div className="subgrid-row">
                  <span>Feasibility Verification Status:</span>
                  <strong className={sancAmount > 0 ? "text-emerald-700" : "text-amber-700"}>
                    {sancAmount > 0 ? "Feasibility Established & Sanctioned" : "Feasibility Scrutiny in Progress"}
                  </strong>
                </div>
                <div className="subgrid-row">
                  <span>Work Order / Technical Sanction ID:</span>
                  <strong className="font-mono">{workId ? `WO-${workId}` : "Pending AS/TS"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Recommended vs Sanction Ratio:</span>
                  <strong>
                    {sancAmount > 0 && recAmount > 0
                      ? `${((sancAmount / recAmount) * 100).toFixed(1)}% of proposal estimate`
                      : "Pending"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3: STATUTORY 45-DAY TIMELINE COMPLIANCE (SECTION 3.12 MPLADS) */}
          {shouldShow("compliance-45d") && (
            <section className="dossier-section" id="dossier-sec-compliance-45d">
              <div className="section-header-row">
                <h3 className="section-title">
                  <span className="sec-num-badge">3</span>
                  <span>Statutory 45-Day Sanction Limit Compliance (Sec 3.12)</span>
                </h3>
                {isOverdue45 ? (
                  <span className="status-pill compliance-pill">NON-COMPLIANT (+{delayDays - 45}d)</span>
                ) : delayDays != null ? (
                  <span className="status-pill risk-low">COMPLIANT</span>
                ) : (
                  <span className="status-pill review-pill">PENDING</span>
                )}
              </div>

              <div className={`alert-compliance-box ${isOverdue45 ? "danger" : isApproaching45 ? "warning" : "success"}`}>
                <Clock size={16} />
                <div>
                  <strong>
                    {isOverdue45
                      ? `Statutory 45-Day Sanction Window Exceeded by ${delayDays - 45} Days`
                      : isApproaching45
                      ? `Approaching Statutory 45-Day Limit (${delayDays} Days Elapsed, ${45 - delayDays} Days Left)`
                      : delayDays != null
                      ? `Compliant with Section 3.12 (Sanctioned in ${delayDays} Days)`
                      : "Pending Sanction Review under Section 3.12"}
                  </strong>
                  <p className="mt-1 text-xs">
                    Under MPLADS Guidelines Section 3.12, the District Authority is mandated to accord sanction or
                    communicate reasons for rejection to the Hon'ble MP within 45 days of receipt of recommendation.
                  </p>
                </div>
              </div>

              <div className="timeline-grid mt-3">
                <div className="timeline-card">
                  <Clock size={16} />
                  <div>
                    <span className="t-label">Actual Sanction Elapsed Days</span>
                    <strong className={isOverdue45 ? "danger-text" : ""}>
                      {delayDays != null ? `${delayDays} Days` : "Awaiting Sanction"}
                    </strong>
                    <small>MPLADS Statutory Limit: 45 Days Maximum</small>
                  </div>
                </div>

                <div className="timeline-card">
                  <Calendar size={16} />
                  <div>
                    <span className="t-label">District Peer Median Sanction Delay</span>
                    <strong>{work.PEER_MEDIAN_SANCTION_DELAY != null ? `${formatDecimal(work.PEER_MEDIAN_SANCTION_DELAY)} Days` : "—"}</strong>
                    <small>Across peer civil works in jurisdiction</small>
                  </div>
                </div>
              </div>

              <div className="audit-subgrid">
                <div className="subgrid-row">
                  <span>Sanction Delay Ratio vs Peer Median:</span>
                  <strong className={Number(work.SANCTION_DELAY_VS_PEER) > 1.5 ? "danger-text" : "safe-text"}>
                    {work.SANCTION_DELAY_VS_PEER ? `${formatDecimal(work.SANCTION_DELAY_VS_PEER)}x peer median delay` : "—"}
                  </strong>
                </div>
                <div className="subgrid-row">
                  <span>Recommendation Inward Date:</span>
                  <strong>{work.RECOMMENDATION_DATE || "—"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Mandatory Statutory 45-Day Deadline:</span>
                  <strong>
                    {work.RECOMMENDATION_DATE
                      ? new Date(new Date(work.RECOMMENDATION_DATE).getTime() + 45 * 86400000).toISOString().split("T")[0]
                      : "—"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 4: 1-YEAR COMPLETION MONITORING (SECTION 3.14 MPLADS) */}
          {shouldShow("completion") && (
            <section className="dossier-section" id="dossier-sec-completion">
              <div className="section-header-row">
                <h3 className="section-title">
                  <span className="sec-num-badge">4</span>
                  <span>1-Year Completion & Asset Handover Window (Sec 3.14)</span>
                </h3>
                {isOverdue1Yr ? (
                  <span className="status-pill compliance-pill">OVERDUE &gt; 12 MONTHS</span>
                ) : stage === "Work Completed" ? (
                  <span className="status-pill risk-low">COMPLETED</span>
                ) : (
                  <span className="status-pill stage-pill">IN EXECUTION</span>
                )}
              </div>

              <div className={`alert-compliance-box ${isOverdue1Yr ? "danger" : stage === "Work Completed" ? "success" : "info"}`}>
                <Calendar size={16} />
                <div>
                  <strong>
                    {isOverdue1Yr
                      ? `Execution Window Overdue: Exceeded 1-Year Limit by ${effectiveCompletionDays - 365} Days`
                      : stage === "Work Completed"
                      ? `Work Completed & Asset Handed Over (${effectiveCompletionDays || 0} Days Total Lifecycle)`
                      : `Currently Under Construction (${effectiveCompletionDays || 0} Days Elapsed since Sanction)`}
                  </strong>
                  <p className="mt-1 text-xs">
                    MPLADS Guidelines Section 3.14 stipulates that all sanctioned civil works should be completed
                    within 1 year from the date of sanction order issuance. Overdue works require immediate agency audit.
                  </p>
                </div>
              </div>

              <div className="timeline-grid mt-3">
                <div className="timeline-card">
                  <Clock size={16} />
                  <div>
                    <span className="t-label">Execution Duration / Elapsed</span>
                    <strong className={isOverdue1Yr ? "danger-text" : ""}>
                      {effectiveCompletionDays != null ? `${effectiveCompletionDays} Days` : "Pending Sanction"}
                    </strong>
                    <small>Statutory Limit: 365 Days (1 Year)</small>
                  </div>
                </div>

                <div className="timeline-card">
                  <Calendar size={16} />
                  <div>
                    <span className="t-label">District Peer Median Completion</span>
                    <strong>{work.PEER_MEDIAN_COMPLETION_DAYS != null ? `${formatDecimal(work.PEER_MEDIAN_COMPLETION_DAYS)} Days` : "—"}</strong>
                    <small>Peer civil works in state/district</small>
                  </div>
                </div>
              </div>

              <div className="audit-subgrid">
                <div className="subgrid-row">
                  <span>Sanction Order Date:</span>
                  <strong>{work.SANCTION_DATE || "Pending Sanction Order"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Actual End / Handover Date:</span>
                  <strong>{work.ACTUAL_END_DATE || "In Execution"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Total Lifecycle Duration:</span>
                  <strong>{work.TOTAL_LIFECYCLE_DAYS ? `${work.TOTAL_LIFECYCLE_DAYS} Days` : "—"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Completion Duration vs Peer:</span>
                  <strong className={Number(work.COMPLETION_VS_PEER) > 1.5 ? "danger-text" : "safe-text"}>
                    {work.COMPLETION_VS_PEER ? `${formatDecimal(work.COMPLETION_VS_PEER)}x peer completion` : "—"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 5: FINANCIAL SCRUTINY & COST ESCALATION */}
          {shouldShow("financials") && (
            <section className="dossier-section" id="dossier-sec-financials">
              <div className="section-header-row">
                <h3 className="section-title">
                  <span className="sec-num-badge">5</span>
                  <span>District Financial Scrutiny & Cost Variance Audit</span>
                </h3>
                <span className="status-pill risk-low">
                  Disbursed: {disbursementRate}%
                </span>
              </div>

              <div className="audit-grid-3">
                <div className="grid-cell highlight-blue">
                  <span className="cell-label">Recommended (₹)</span>
                  <strong className="cell-val">{formatCurrency(recAmount)}</strong>
                </div>
                <div className="grid-cell highlight-blue">
                  <span className="cell-label">Sanctioned AS/TS (₹)</span>
                  <strong className="cell-val">{sancAmount > 0 ? formatCurrency(sancAmount) : "Awaiting AS/TS"}</strong>
                </div>
                <div className="grid-cell highlight-blue">
                  <span className="cell-label">Actual Disbursed (₹)</span>
                  <strong className="cell-val">{formatCurrency(actAmount)}</strong>
                </div>
              </div>

              <div className="audit-subgrid">
                <div className="subgrid-row">
                  <span>Uncommitted Sanction Balance:</span>
                  <strong className="text-emerald-700 font-semibold">{formatCurrency(remainingBalance)}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Cost Escalation vs Sanction:</span>
                  <strong className={costVariance > 0 ? "danger-text" : "safe-text"}>
                    {formatCurrency(costVariance)} ({formatDecimal(costVariancePct)}%)
                  </strong>
                </div>
                <div className="subgrid-row">
                  <span>State & Category Peer Median Sanction:</span>
                  <strong>{peerMedianCost ? formatCurrency(peerMedianCost) : "—"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Cost Ratio vs Peer Median:</span>
                  <strong className={costVsPeer && costVsPeer > 1.2 ? "danger-text" : "safe-text"}>
                    {costVsPeer ? `${formatDecimal(costVsPeer)}x peer cost` : "—"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 6: AI RISK & ANOMALY INTELLIGENCE */}
          {shouldShow("risk") && (
            <section className="dossier-section" id="dossier-sec-risk">
              <div className="section-header-row">
                <h3 className="section-title danger-header">
                  <span className="sec-num-badge">6</span>
                  <span>AI Risk & Anomaly Intelligence Engine</span>
                </h3>
                <span className={`status-pill ${riskLevel === "HIGH" ? "risk-high" : riskLevel === "MEDIUM" ? "risk-medium" : "risk-low"}`}>
                  RISK: {riskLevel} ({formatDecimal(work.RISK_SCORE || 0)}/100)
                </span>
              </div>

              {(work.RISK_REASON || work.REVIEW_REASON) ? (
                <div className="alert-rationale-box">
                  <strong>AI Audit Rationale:</strong> {work.RISK_REASON || work.REVIEW_REASON}
                </div>
              ) : (
                <div className="alert-compliance-box success">
                  <CheckCircle2 size={16} />
                  <span>No severe financial or procedural risk flags triggered on this proposal.</span>
                </div>
              )}

              <div className="audit-grid-2 mt-3">
                <div className="grid-cell">
                  <span className="cell-label">Delay Risk Index</span>
                  <strong className={Number(work.DELAY_RISK) > 0 ? "danger-text" : "cell-val"}>
                    {work.DELAY_RISK != null && Number(work.DELAY_RISK) > 0 ? `${formatDecimal(work.DELAY_RISK)}x Anomaly` : "Normal (0.0)"}
                  </strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">Cost Risk Index</span>
                  <strong className={Number(work.COST_RISK) > 0 ? "danger-text" : "cell-val"}>
                    {work.COST_RISK != null && Number(work.COST_RISK) > 0 ? `${formatDecimal(work.COST_RISK)}x Anomaly` : "Normal (0.0)"}
                  </strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">Variance Risk</span>
                  <strong className="cell-val">
                    {work.VARIANCE_RISK != null && Number(work.VARIANCE_RISK) > 0 ? `${formatDecimal(work.VARIANCE_RISK)}` : "Normal"}
                  </strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">Completion Risk Flag</span>
                  <strong className="cell-val">
                    {work.COMPLETION_RISK != null && Number(work.COMPLETION_RISK) > 0 ? `${formatDecimal(work.COMPLETION_RISK)}` : "Normal"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 7: DUPLICATE PROPOSAL CLUSTER EVIDENCE */}
          {shouldShow("duplicates") && (
            <section className="dossier-section" id="dossier-sec-duplicates">
              <div className="section-header-row">
                <h3 className="section-title warning-header">
                  <span className="sec-num-badge">7</span>
                  <span>Duplicate Proposal Intelligence & Cluster Evidence</span>
                </h3>
                {clusterId && (
                  <Link
                    to={`/duplicates?cluster=${clusterId}`}
                    className="gov-btn-outline text-xs py-1 px-2 flex items-center gap-1"
                  >
                    <span>Inspect Cluster #{clusterId}</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              {work.EVIDENCE ? (
                <div className="warning-evidence-box mb-3">{work.EVIDENCE}</div>
              ) : clusterId ? (
                <div className="warning-evidence-box mb-3">
                  This work proposal belongs to duplicate cluster #{clusterId} with {clusterSize || 2} linked proposals in the district database.
                </div>
              ) : (
                <div className="alert-compliance-box success mb-3">
                  <CheckCircle2 size={16} />
                  <span>Unique Work: No duplicate proposals or semantic clusters detected for this entry.</span>
                </div>
              )}

              <div className="audit-subgrid">
                <div className="subgrid-row">
                  <span>Duplicate Cluster Identifier:</span>
                  <strong className="font-mono">{clusterId ? `Cluster #${clusterId}` : "Not in Cluster"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Linked Proposals in Cluster:</span>
                  <strong>{clusterSize ? `${clusterSize} Linked Proposals` : "Unique Proposal"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Candidate Pair Relationships:</span>
                  <strong>{pairCount ? `${pairCount} Evaluated Pairs` : "Single Work"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Average Text Similarity:</span>
                  <strong className={textSimPct && Number(textSimPct) > 80 ? "danger-text" : ""}>
                    {textSimPct ? `${textSimPct}%` : "Unique"}
                  </strong>
                </div>
                <div className="subgrid-row">
                  <span>Maximum Text Similarity:</span>
                  <strong className={maxTextSimPct && Number(maxTextSimPct) > 90 ? "danger-text" : ""}>
                    {maxTextSimPct ? `${maxTextSimPct}%` : "—"}
                  </strong>
                </div>
                <div className="subgrid-row">
                  <span>Average Cost Similarity:</span>
                  <strong>{amountSimPct ? `${amountSimPct}%` : "—"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Cluster Suspicion Score:</span>
                  <strong className="danger-text">
                    {work.CLUSTER_SUSPICION_SCORE ? `${formatDecimal(work.CLUSTER_SUSPICION_SCORE)} / 100` : "Low"}
                  </strong>
                </div>
                <div className="subgrid-row">
                  <span>Exact Description Text Match:</span>
                  <strong>{work.EXACT_DESCRIPTION_MATCH ? "YES (Identical Text Match)" : "NO"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Exact Sanction Amount Match:</span>
                  <strong>{work.EXACT_AMOUNT_MATCH ? "YES (Identical Budget Match)" : "NO"}</strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 8: VENDOR & IMPLEMENTING AGENCY (IA) SURVEILLANCE */}
          {shouldShow("ia") && (
            <section className="dossier-section" id="dossier-sec-ia">
              <div className="section-header-row">
                <h3 className="section-title">
                  <span className="sec-num-badge">8</span>
                  <span>Executing Agency & Implementing District Authority (IA)</span>
                </h3>
                <span className="status-pill stage-pill">
                  <Building2 size={12} />
                  AGENCY
                </span>
              </div>

              <div className="audit-grid-2">
                <div className="grid-cell highlight-blue">
                  <span className="cell-label">Implementing District Authority (IDA)</span>
                  <strong className="cell-val text-slate-800">
                    {work.IDA_NAME || "District Collectorate / District Planning Office"}
                  </strong>
                </div>
                <div className="grid-cell highlight-blue">
                  <span className="cell-label">Executing Body / Technical Division</span>
                  <strong className="cell-val">
                    {work.WORK_CATEGORY ? `${work.WORK_CATEGORY} Engineering Division` : "Zila Parishad / Rural Works"}
                  </strong>
                </div>
              </div>

              <div className="audit-subgrid">
                <div className="subgrid-row">
                  <span>Current Milestone Stage:</span>
                  <strong className="font-semibold">{stage}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Disbursement Progress:</span>
                  <strong>{formatCurrency(actAmount)} released of {formatCurrency(sancAmount)} ({disbursementRate}%)</strong>
                </div>
                <div className="subgrid-row">
                  <span>Contractor / Vendor Status:</span>
                  <strong>
                    {stage === "Vendor Identification"
                      ? "Vendor Tendering in Progress"
                      : stage === "Pending Sanction"
                      ? "Awaiting AS/TS before Tendering"
                      : "Agency Assigned & Executing"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 9: GROUND & ANALYTICAL EVIDENCE VERIFICATION */}
          {shouldShow("evidence") && (
            <section className="dossier-section" id="dossier-sec-evidence">
              <div className="section-header-row">
                <h3 className="section-title">
                  <span className="sec-num-badge">9</span>
                  <span>Ground Evidence & Analytical Scrutiny</span>
                </h3>
                <span className={`status-pill ${suspicionLevel === "HIGH SUSPICION" ? "risk-high" : "risk-low"}`}>
                  {suspicionLevel}
                </span>
              </div>

              <div className="audit-grid-2">
                <div className="grid-cell">
                  <span className="cell-label">Milestone Evidence Score</span>
                  <strong className="cell-val">
                    {work.EVIDENCE_SCORE != null ? `${work.EVIDENCE_SCORE} / 100` : "Baseline (Verified)"}
                  </strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">Ground Suspicion Rating</span>
                  <strong className={suspicionLevel === "HIGH SUSPICION" ? "danger-text font-bold" : "cell-val"}>
                    {suspicionLevel}
                  </strong>
                </div>
              </div>

              <div className="audit-subgrid">
                <div className="subgrid-row">
                  <span>Scrutiny Requirement:</span>
                  <strong>{work.REQUIRES_REVIEW ? "Mandatory Verification Required" : "Standard Procedural Review"}</strong>
                </div>
                <div className="subgrid-row">
                  <span>Review Rationale:</span>
                  <strong className="text-slate-800">{work.REVIEW_REASON || work.RISK_REASON || "No anomalies flagged"}</strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 10: GEO-PHOTO & PHYSICAL SITE INSPECTION (SECTION 3.16 MPLADS) */}
          {shouldShow("geo-photo") && (
            <section className="dossier-section" id="dossier-sec-geo-photo">
              <div className="section-header-row">
                <h3 className="section-title">
                  <span className="sec-num-badge">10</span>
                  <span>Geo-Photo & Physical Site Inspection (Sec 3.16)</span>
                </h3>
                <Link
                  to="/photo-verifier"
                  className="gov-btn-outline text-xs py-1 px-2 flex items-center gap-1"
                >
                  <Camera size={12} />
                  <span>Launch Geo-Photo Verifier</span>
                </Link>
              </div>

              <div className="dossier-guideline-note">
                <strong>MPLADS Mandate (Section 3.16):</strong> District Authorities and designated nodal officers
                must conduct physical inspection of at least 10% of works, and mandatory geo-tagged before/after
                photographs must be uploaded to eSAKSHI prior to final asset handover.
              </div>

              <div className="audit-grid-3 mt-2">
                <div className="grid-cell">
                  <span className="cell-label">Physical Inspection Milestone</span>
                  <strong className="cell-val">
                    {stage === "Physical Inspection" || stage === "Work Completed" ? "Required & Logged" : "Pre-Execution"}
                  </strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">Geo-Tagged Photo Status</span>
                  <strong className="cell-val">
                    {stage === "Work Completed" ? "Final Asset Photo Mandated" : "In Progress"}
                  </strong>
                </div>
                <div className="grid-cell">
                  <span className="cell-label">Inspection Requirement</span>
                  <strong className="cell-val">
                    {recAmount > 1000000 ? "Mandatory Collector Audit" : "Sub-Divisional Officer"}
                  </strong>
                </div>
              </div>

              <div className="audit-subgrid">
                <div className="subgrid-row">
                  <span>Constituency Coordinates:</span>
                  <strong>{work.CONSTITUENCY || "District Bounds"} ({work.STATE_NAME || "State"})</strong>
                </div>
                <div className="subgrid-row">
                  <span>Photo Milestone Verification Score:</span>
                  <strong>{work.EVIDENCE_SCORE ? `${work.EVIDENCE_SCORE} / 100` : "Baseline Verified"}</strong>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 11: COLLECTOR PRIORITY QUEUE & ADMINISTRATIVE CLEARANCE */}
          {shouldShow("actions") && (
            <section className="dossier-section" id="dossier-sec-actions">
              <div className="section-header-row">
                <h3 className="section-title">
                  <span className="sec-num-badge">11</span>
                  <span>District Collectorate Priority Action & Official Clearance</span>
                </h3>
                {verifiedLocally ? (
                  <span className="status-pill risk-low">CLEARED ✓</span>
                ) : (
                  <span className="status-pill review-pill">ACTION PENDING</span>
                )}
              </div>

              <div className="collector-action-box">
                <div className="action-box-title">
                  <ShieldAlert size={15} color="#b45309" />
                  <span>District Collectorate Action Directives</span>
                </div>
                <p className="action-box-desc">
                  Under statutory powers vested in the District Magistrate / Deputy Commissioner under the MPLADS Guidelines,
                  execute formal review clearances, issue notices to defaulting implementing agencies, or accord administrative sanction.
                </p>

                <div className="action-box-buttons">
                  <button
                    type="button"
                    className={`collector-btn ${verifiedLocally ? "btn-verified" : "btn-primary"}`}
                    onClick={() => setVerifiedLocally(!verifiedLocally)}
                  >
                    <CheckCircle2 size={14} />
                    <span>{verifiedLocally ? "Collectorate Verified (Click to Undo)" : "Mark Collectorate Feasibility Clearance"}</span>
                  </button>

                  <button
                    type="button"
                    className={`collector-btn ${noticeIssued ? "btn-notice-issued" : "btn-warning"}`}
                    onClick={() => setNoticeIssued(!noticeIssued)}
                  >
                    <AlertOctagon size={14} />
                    <span>{noticeIssued ? "Notice Issued to IA (Active) ✓" : "Issue 7-Day Explanation Notice to Agency"}</span>
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 5. Sticky Bottom Action Clearance Bar */}
        <div className="drawer-footer-actions">
          <div className="footer-left-status">
            <span className="font-mono text-xs text-slate-500">
              Record #{recId || workId} · Stage: <strong>{stage}</strong>
            </span>
          </div>

          <div className="footer-right-buttons">
            <button
              type="button"
              className={`drawer-action-btn ${verifiedLocally ? "btn-cleared" : "btn-primary"}`}
              onClick={() => setVerifiedLocally(!verifiedLocally)}
            >
              <CheckCircle2 size={14} />
              <span>{verifiedLocally ? "Collectorate Cleared ✓" : "Mark Clearance"}</span>
            </button>

            <Link
              to={`/works?q=${workId || recId || ""}`}
              className="drawer-action-btn-outline"
            >
              <span>Explore in Registry</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
