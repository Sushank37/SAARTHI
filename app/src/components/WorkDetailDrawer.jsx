import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  X,
  ShieldAlert,
  AlertTriangle,
  GitBranch,
  Clock,
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
  Copy,
  Check,
  Bell,
  AlertOctagon,
  FileText,
} from "lucide-react";
import { API_BASE, formatDecimal, formatCurrency } from "../constants";
import {
  getRequests,
  createRequest,
} from "../services/workflowService";
import RequestStatusBadge from "./workflow/RequestStatusBadge";
import RequestPriorityBadge from "./workflow/RequestPriorityBadge";
import RequestComposerModal from "./workflow/RequestComposerModal";
import WorkConcernSection from "./workflow/WorkConcernSection";
import "./WorkDetailDrawer.css";

// Authority-specific tabs for the dossier
const getAuthorityTabs = (authority) => {
  switch (authority) {
    case "MOSPI":
      return [
        { id: "all", label: "Full Central Audit (All)" },
        { id: "overview", label: "1. Central Registry & Identifiers" },
        { id: "financials", label: "2. Central SNA Fund Flow & Audit" },
        { id: "duplicates", label: "3. Inter-State Duplicate Clusters" },
        { id: "compliance-45d", label: "4. National Delay Breach & SLAs" },
        { id: "risk", label: "5. National Risk & Forensic Anomalies" },
        { id: "ia", label: "6. IA National Benchmarking" },
        { id: "evidence", label: "7. Evidence & EXIF Forensic Audit" },
        { id: "actions", label: "8. National Concerns & Central Directives" },
      ];
    case "IMPLEMENTING_AGENCY":
      return [
        { id: "all", label: "Full Execution File (All)" },
        { id: "overview", label: "1. Work Order & Scope of Works" },
        { id: "completion", label: "2. Physical Milestones & Progress" },
        { id: "financials", label: "3. Measurement Book (MB) & Claims" },
        { id: "geo-photo", label: "4. Geo-Tagged Photos & Site Uploads" },
        { id: "compliance-45d", label: "5. Deadlines & Extension (EOT)" },
        { id: "risk", label: "6. Site Quality & Rectification Log" },
        { id: "actions", label: "7. Assigned Concerns & IA Directives" },
      ];
    case "MP":
      return [
        { id: "all", label: "Full Parliamentary Brief (All)" },
        { id: "overview", label: "1. MP Sponsorship & ₹5 Cr Quota Debit" },
        { id: "sanction", label: "2. Constituency Sanction SLA & DA Status" },
        { id: "completion", label: "3. Ground Delivery & Milestone Progress" },
        { id: "financials", label: "4. Constituency Fund Release & Balance" },
        { id: "geo-photo", label: "5. Asset Photos for Public Dedication" },
        { id: "risk", label: "6. Grievances & Constituency Delay Flags" },
        { id: "actions", label: "7. Parliamentary Concerns & Directives" },
      ];
    case "CITIZEN":
      return [
        { id: "all", label: "Public Factsheet (All)" },
        { id: "overview", label: "1. Community Infrastructure Summary" },
        { id: "financials", label: "2. Public Fund Utilization Breakdown" },
        { id: "completion", label: "3. Delivery Status & Public Opening" },
        { id: "geo-photo", label: "4. Before & After Photo Gallery" },
        { id: "actions", label: "5. Citizen Concerns & Social Audit" },
      ];
    case "DISTRICT_AUTHORITY":
    default:
      return [
        { id: "all", label: "Full Statutory Audit (All)" },
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
        { id: "actions", label: "11. Work Concerns & Collector Directives" },
      ];
  }
};

export default function WorkDetailDrawer({ work: initialWork, onClose, initialSection = "all" }) {
  const { role: authRole } = useAuth() || {};
  const location = useLocation();

  // Normalize incoming work object (handles raw IDs, numbers, lowercase objects)
  const incomingWorkObj = useMemo(() => {
    if (!initialWork) return null;
    if (typeof initialWork === "object") {
      const wId = initialWork.WORK_ID ?? initialWork.work_id ?? initialWork.id;
      const rId = initialWork.WORK_RECOMMENDATION_DTL_ID ?? initialWork.rec_id ?? initialWork.recommendation_id;
      return {
        ...initialWork,
        WORK_ID: wId != null ? String(wId).replace(/\.0$/, "") : null,
        WORK_RECOMMENDATION_DTL_ID: rId != null ? String(rId).replace(/\.0$/, "") : null,
        WORK_DESCRIPTION: initialWork.WORK_DESCRIPTION ?? initialWork.work_title ?? initialWork.title ?? initialWork.description ?? "",
        STATE_NAME: initialWork.STATE_NAME ?? initialWork.state ?? initialWork.state_name ?? "",
        CONSTITUENCY: initialWork.CONSTITUENCY ?? initialWork.constituency ?? "",
        IDA_NAME: initialWork.IDA_NAME ?? initialWork.ida_name ?? initialWork.agency_name ?? "",
        MP_NAME: initialWork.MP_NAME ?? initialWork.mp_name ?? "",
        SANCTION_AMOUNT: initialWork.SANCTION_AMOUNT ?? initialWork.sanction_amount ?? 0,
        ACTUAL_AMOUNT: initialWork.ACTUAL_AMOUNT ?? initialWork.actual_amount ?? 0,
        WORK_STAGE: initialWork.WORK_STAGE ?? initialWork.work_stage ?? initialWork.stage ?? "Sanction",
      };
    }
    const cleanRaw = String(initialWork).replace(/\.0$/, "");
    return { WORK_ID: cleanRaw };
  }, [initialWork]);

  const [fetchedWork, setFetchedWork] = useState(null);
  const work = useMemo(() => {
    if (
      fetchedWork &&
      (fetchedWork.WORK_ID === incomingWorkObj?.WORK_ID ||
        fetchedWork.WORK_RECOMMENDATION_DTL_ID === incomingWorkObj?.WORK_RECOMMENDATION_DTL_ID)
    ) {
      return { ...(incomingWorkObj || {}), ...fetchedWork };
    }
    return incomingWorkObj || {};
  }, [incomingWorkObj, fetchedWork]);

  // Clean IDs
  const workId = work.WORK_ID != null ? String(work.WORK_ID).replace(/\.0$/, "") : null;
  const recId = work.WORK_RECOMMENDATION_DTL_ID != null ? String(work.WORK_RECOMMENDATION_DTL_ID).replace(/\.0$/, "") : null;
  const primaryId = workId ? `Work #${workId}` : `Proposal #${recId || "—"}`;
  const canonicalWorkId = workId || recId;
  const clusterId = (work.CLUSTER_ID != null ? String(Math.round(Number(work.CLUSTER_ID))) : null)
    || (work.cluster_id != null ? String(work.cluster_id) : null);
  const clusterSize = work.CLUSTER_SIZE != null ? Math.round(Number(work.CLUSTER_SIZE)) : (clusterId ? 2 : null);
  const pairCount = work.PAIR_COUNT != null ? Math.round(Number(work.PAIR_COUNT)) : null;

  // Auto-hydrate if missing detailed work fields
  useEffect(() => {
    if (!canonicalWorkId) return;
    const isBare = !incomingWorkObj?.WORK_DESCRIPTION || incomingWorkObj.WORK_DESCRIPTION.length < 5 || !incomingWorkObj?.STATE_NAME;
    if (isBare) {
      let cancelled = false;
      fetch(`${API_BASE}/api/works/${encodeURIComponent(canonicalWorkId)}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("HTTP error " + res.status);
        })
        .then((data) => {
          if (!cancelled && data && !data.error) {
            setFetchedWork(data);
          }
        })
        .catch((err) => console.warn("Failed to auto-hydrate work dossier:", err));
      return () => {
        cancelled = true;
      };
    }
  }, [canonicalWorkId, incomingWorkObj?.WORK_DESCRIPTION, incomingWorkObj?.STATE_NAME]);

  // Determine active authority persona
  const activeAuthority = useMemo(() => {
    if (work?.__authority) return String(work.__authority).toUpperCase();
    if (authRole) return String(authRole).toUpperCase();
    const path = location?.pathname || "";
    if (path.startsWith("/mospi")) return "MOSPI";
    if (path.startsWith("/ia")) return "IMPLEMENTING_AGENCY";
    if (path.startsWith("/da")) return "DISTRICT_AUTHORITY";
    if (path.startsWith("/mp")) return "MP";
    if (path.startsWith("/citizen")) return "CITIZEN";
    return "DISTRICT_AUTHORITY";
  }, [work, authRole, location?.pathname]);

  const currentTabs = useMemo(() => getAuthorityTabs(activeAuthority), [activeAuthority]);

  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Authority-specific action interactive states
  // 1. DA states
  const [verifiedLocally, setVerifiedLocally] = useState(false);
  const [noticeIssued, setNoticeIssued] = useState(false);
  const [fundsFrozen, setFundsFrozen] = useState(false);

  // 2. MoSPI states
  const [mospiDirectiveIssued, setMospiDirectiveIssued] = useState(false);
  const [snaTrancheWithheld, setSnaTrancheWithheld] = useState(false);
  const [cagAuditOrdered, setCagAuditOrdered] = useState(false);

  // 3. IA states
  const [mbSubmitted, setMbSubmitted] = useState(false);
  const [geoEvidenceUploaded, setGeoEvidenceUploaded] = useState(false);
  const [eotFiled, setEotFiled] = useState(false);

  // 4. MP states
  const [sansadNoticeIssued, setSansadNoticeIssued] = useState(false);
  const [inaugurationApproved, setInaugurationApproved] = useState(false);
  const [inspectionScheduled, setInspectionScheduled] = useState(false);

  // 5. Citizen states
  const [citizenRating, setCitizenRating] = useState(5);
  const [citizenAuditVerified, setCitizenAuditVerified] = useState(false);
  const [grievanceReported, setGrievanceReported] = useState(false);

  const effectiveInitialSection = work?.__initialSection || initialSection || "all";
  const [activeSection, setActiveSection] = useState(effectiveInitialSection);

  // Synchronize initial section if prop updates
  useEffect(() => {
    const nextSection = work?.__initialSection || initialSection || "all";
    const timer = setTimeout(() => setActiveSection(nextSection), 0);
    return () => clearTimeout(timer);
  }, [initialSection, work]);

  // Persistent cross-role workflow requests attached to this work
  const [workRequests, setWorkRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDefaultType, setComposerDefaultType] = useState("GRIEVANCE");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");

  const loadWorkRequests = useCallback(async () => {
    if (!canonicalWorkId) return;
    try {
      const data = await getRequests({ workId: canonicalWorkId });
      setWorkRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to load requests for work:", err);
    } finally {
      setRequestsLoading(false);
    }
  }, [canonicalWorkId]);

  useEffect(() => {
    if (!canonicalWorkId) return;
    let isMounted = true;
    const fetchRequests = async () => {
      try {
        const data = await getRequests({ workId: canonicalWorkId });
        if (isMounted) {
          setWorkRequests(data.requests || []);
          setRequestsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load requests for work:", err);
        if (isMounted) setRequestsLoading(false);
      }
    };
    fetchRequests();
    return () => {
      isMounted = false;
    };
  }, [canonicalWorkId]);

  const handleExecuteWorkflowAction = async (type, defaultTitle, defaultDesc, defaultPriority = "MEDIUM") => {
    if (!canonicalWorkId) return;
    setActionLoading(true);
    setActionFeedback("Submitting request to server...");
    try {
      const res = await createRequest({
        work_id: canonicalWorkId,
        raised_by_role: activeAuthority,
        request_type: type,
        title: defaultTitle,
        description: defaultDesc,
        priority: defaultPriority,
      });
      setActionFeedback(`Request registered (${res.request_id}) and routed to ${res.request?.target_department} ✓`);
      await loadWorkRequests();
      setTimeout(() => setActionFeedback(""), 4000);
    } catch (err) {
      console.error("Action error:", err);
      setActionFeedback(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };


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
    if (activeSection === "all") return true;
    if (activeSection === sectionId) return true;
    // Section aliases for authority tabs
    if (activeSection === "milestones" && (sectionId === "completion" || sectionId === "sanction")) return true;
    if (activeSection === "mb-billing" && sectionId === "financials") return true;
    if (activeSection === "deadlines" && sectionId === "compliance-45d") return true;
    return false;
  };

  // Authority Header Title & Tagline
  const authorityMeta = useMemo(() => {
    switch (activeAuthority) {
      case "MOSPI":
        return {
          eyebrow: "🏛️ CENTRAL NODAL AUTHORITY (MoSPI) · NATIONAL AUDIT DOSSIER",
          badge: "NATIONAL VIGILANCE DESK",
          subtitle: "Pan-India Central Surveillance & Fiscal Audit Under MoSPI Guidelines",
        };
      case "IMPLEMENTING_AGENCY":
        return {
          eyebrow: "👷 IMPLEMENTING AGENCY (IA) · CONTRACT EXECUTION & MB DOSSIER",
          badge: "SITE EXECUTION & BILLING",
          subtitle: "Measurement Book (MB) Recordings, Milestone Delivery & Photo Evidence",
        };
      case "MP":
        return {
          eyebrow: "🎖️ HON'BLE MEMBER OF PARLIAMENT · CONSTITUENCY WORK DOSSIER",
          badge: "SANSAD OVERSIGHT BRIEF",
          subtitle: "₹5.00 Cr Quota Entitlement, Recommendation Tracking & Asset Delivery",
        };
      case "CITIZEN":
        return {
          eyebrow: "👥 SAARTHI CITIZEN · PUBLIC TRANSPARENCY & SOCIAL AUDIT",
          badge: "PUBLIC AUDIT REGISTER",
          subtitle: "Constituency Development Verification & Democratic Social Audit",
        };
      case "DISTRICT_AUTHORITY":
      default:
        return {
          eyebrow: "⚖️ DISTRICT MAGISTRATE & COLLECTORATE · STATUTORY SANCTION DOSSIER",
          badge: "STATUTORY RECORD · FORM 78-A",
          subtitle: "Section 3.11 Feasibility & Section 3.12 45-Day Statutory Scrutiny",
        };
    }
  }, [activeAuthority]);

  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Lock body scroll while drawer is open to prevent background scrolling (BUG-008)
  useEffect(() => {
    if (!initialWork) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "";
    };
  }, [initialWork]);

  // Escape key listener & focus trapping for accessibility (BUG-008 & BUG-014)
  useEffect(() => {
    if (!initialWork) return;
    const prevActiveElement = document.activeElement;

    // Focus close button on mount
    const timer = setTimeout(() => {
      if (closeBtnRef.current) {
        closeBtnRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
        return;
      }

      // Focus trapping inside drawer
      if (e.key === "Tab" && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      if (prevActiveElement && typeof prevActiveElement.focus === "function") {
        try {
          prevActiveElement.focus();
        } catch {
          // Ignore focus errors on unmounted triggers
        }
      }
    };
  }, [initialWork, onClose]);

  if (!initialWork) return null;

  return createPortal(
    <div className="drawer-overlay" onClick={onClose} role="presentation">
      <aside
        ref={drawerRef}
        className="gov-detail-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${authorityMeta.eyebrow} — ${primaryId}`}
        tabIndex={-1}
      >
        {/* 1. Official Government Dossier Header */}
        <div className="drawer-header">
          <div className="header-meta">
            <div className="doc-category-line">
              <span className="doc-category">{authorityMeta.eyebrow}</span>
              <span className="doc-confidential-tag">{authorityMeta.badge}</span>
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
              aria-label="Copy Record ID"
            >
              {copiedId ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
              <span>{copiedId ? "Copied" : "Copy ID"}</span>
            </button>
            <button
              type="button"
              className="gov-btn-outline"
              onClick={handlePrint}
              title="Print Official Dossier"
              aria-label="Print Official Dossier"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              ref={closeBtnRef}
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Close Work Detail Dossier"
              title="Close Dossier (Esc)"
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

          {/* Authority Status Badges */}
          {activeAuthority === "MOSPI" && (
            <>
              {mospiDirectiveIssued && (
                <span className="status-pill review-pill">
                  <AlertOctagon size={12} />
                  CENTRAL DIRECTIVE ACTIVE ✓
                </span>
              )}
              {snaTrancheWithheld && (
                <span className="status-pill risk-high">
                  <ShieldAlert size={12} />
                  SNA TRANCHE BLOCKED ⛔
                </span>
              )}
              {cagAuditOrdered && (
                <span className="status-pill dup-high">
                  <FileText size={12} />
                  CAG AUDIT REQUISITIONED ⚖️
                </span>
              )}
            </>
          )}

          {activeAuthority === "IMPLEMENTING_AGENCY" && (
            <>
              {mbSubmitted && (
                <span className="status-pill risk-low">
                  <FileCheck size={12} />
                  MB BILL SUBMITTED ✓
                </span>
              )}
              {geoEvidenceUploaded && (
                <span className="status-pill risk-low">
                  <Camera size={12} />
                  GEO-EVIDENCE LOGGED 📷
                </span>
              )}
              {eotFiled && (
                <span className="status-pill review-pill">
                  <Clock size={12} />
                  EOT EXTENSION CLAIMED
                </span>
              )}
            </>
          )}

          {activeAuthority === "MP" && (
            <>
              {sansadNoticeIssued && (
                <span className="status-pill review-pill">
                  <Bell size={12} />
                  SANSAD INQUIRY SERVED ✓
                </span>
              )}
              {inaugurationApproved && (
                <span className="status-pill risk-low">
                  <CheckCircle2 size={12} />
                  DEDICATION APPROVED 🎖️
                </span>
              )}
              {inspectionScheduled && (
                <span className="status-pill stage-pill">
                  <Calendar size={12} />
                  GROUND INSPECTION LOGGED 📍
                </span>
              )}
            </>
          )}

          {activeAuthority === "CITIZEN" && (
            <>
              {citizenAuditVerified && (
                <span className="status-pill risk-low">
                  <CheckCircle2 size={12} />
                  COMMUNITY VERIFIED ({citizenRating}★) ✓
                </span>
              )}
              {grievanceReported && (
                <span className="status-pill risk-high">
                  <AlertTriangle size={12} />
                  GRIEVANCE LOGGED TO DM
                </span>
              )}
            </>
          )}

          {activeAuthority === "DISTRICT_AUTHORITY" && (
            <>
              {verifiedLocally && (
                <span className="status-pill risk-low">
                  <CheckCircle2 size={12} />
                  COLLECTORATE VERIFIED ✓
                </span>
              )}
              {noticeIssued && (
                <span className="status-pill review-pill">
                  <AlertOctagon size={12} />
                  7-DAY NOTICE ISSUED
                </span>
              )}
              {fundsFrozen && (
                <span className="status-pill risk-high">
                  <ShieldAlert size={12} />
                  INSTALLMENT WITHHELD ⛔
                </span>
              )}
            </>
          )}
        </div>

        {/* 3. Section Navigation Filter Pills (Tailored to Authority) */}
        <div className="dossier-nav-tabs-bar">
          <div className="dossier-nav-tabs-scroll">
            {currentTabs.map((tab) => (
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

          {/* SECTION: AUTHORITY DIRECTIVES & PRIORITY CLEARANCE */}
          {shouldShow("actions") && (
            <section className="dossier-section" id="dossier-sec-actions">
              {/* Feedback Banner */}
              {actionFeedback && (
                <div
                  style={{
                    background: actionFeedback.includes("failed") ? "#fef2f2" : "#f0fdf4",
                    border: `1px solid ${actionFeedback.includes("failed") ? "#fca5a5" : "#86efac"}`,
                    color: actionFeedback.includes("failed") ? "#991b1b" : "#166534",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {actionLoading ? <Clock size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>{actionFeedback}</span>
                </div>
              )}

              {/* Official Work Concern, Action & Response Thread */}
              <WorkConcernSection
                work={work}
                canonicalWorkId={canonicalWorkId}
                currentRole={activeAuthority}
              />

              {/* Active Workflow Requests on this Work */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "14px 16px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={16} color="#005A9C" />
                    <strong style={{ fontSize: "13.5px", color: "#0f172a" }}>
                      Active Cross-Role Workflow Requests ({workRequests.length})
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="workflow-btn workflow-btn-primary workflow-btn-sm"
                    onClick={() => {
                      setComposerDefaultType(activeAuthority === "CITIZEN" ? "GRIEVANCE" : activeAuthority === "IMPLEMENTING_AGENCY" ? "PAYMENT_REQUEST" : activeAuthority === "MP" ? "CONSTITUENCY_INQUIRY" : "ADMINISTRATIVE_NOTICE");
                      setComposerOpen(true);
                    }}
                  >
                    <span>+ Raise Formal Request</span>
                  </button>
                </div>

                {requestsLoading ? (
                  <div style={{ fontSize: "12px", color: "#64748b", padding: "8px 0" }}>
                    Loading workflow records...
                  </div>
                ) : workRequests.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#64748b", padding: "6px 0" }}>
                    No active workflow requests or disputes logged for Work #{canonicalWorkId}.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                    {workRequests.map((req) => (
                      <div
                        key={req.request_id}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "4px",
                          padding: "8px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <strong style={{ fontSize: "12px", fontFamily: "monospace", color: "#005A9C" }}>
                              {req.request_id}
                            </strong>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                              {req.title || req.request_type_label}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Raised by <strong>{req.raised_by_role}</strong> ➔ Target: <strong>{req.target_department}</strong> · {req.created_at ? req.created_at.slice(0, 10) : ""}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <RequestPriorityBadge priority={req.priority} />
                          <RequestStatusBadge status={req.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* A. MoSPI Central Directives */}
              {activeAuthority === "MOSPI" && (
                <div className="authority-directive-box mospi-directive-theme">
                  <div className="section-header-row" style={{ marginBottom: "10px" }}>
                    <h3 className="section-title">
                      <span className="sec-num-badge">8</span>
                      <span>MoSPI Central Vigilance & National Directive Board</span>
                    </h3>
                    <span className="authority-badge-small mospi">Central Nodal Authority</span>
                  </div>
                  <p className="action-box-desc">
                    Statutory central oversight powers under MoSPI MPLADS Guidelines: issue national compliance directives,
                    withhold central State Nodal Account (SNA) tranches, refer anomalous multi-district clusters to Central Vigilance Commission (CVC), or requisition CAG special performance audits.
                  </p>

                  <div className="directive-kpi-row">
                    <div className="d-kpi">
                      <span className="d-kpi-label">Central Vigilance Priority</span>
                      <strong className="d-kpi-val" style={{ color: riskLevel === "HIGH" ? "#b91c1c" : "#0284c7" }}>
                        {riskLevel === "HIGH" ? "LEVEL 1 — IMMEDIATE AUDIT" : "STANDARD CENTRAL SURVEILLANCE"}
                      </strong>
                    </div>
                    <div className="d-kpi">
                      <span className="d-kpi-label">SNA Grant Release</span>
                      <strong className="d-kpi-val" style={{ color: snaTrancheWithheld ? "#b91c1c" : "#059669" }}>
                        {snaTrancheWithheld ? "BLOCKED / WITHHELD ⚠️" : "CENTRAL SNA AUTHORISED ✓"}
                      </strong>
                    </div>
                    <div className="d-kpi">
                      <span className="d-kpi-label">CAG Special Audit</span>
                      <strong className="d-kpi-val">
                        {cagAuditOrdered ? "REQUISITION ACTIVE ✓" : "NOT REQUISITIONED"}
                      </strong>
                    </div>
                  </div>

                  <div className="action-box-buttons">
                    <button
                      type="button"
                      className="collector-btn btn-primary"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("OVERSIGHT_DIRECTIVE", "MoSPI Central Compliance Directive", "Ministry of Statistics & Programme Implementation issued national compliance directive to District Nodal Authority.", "CRITICAL");
                        setMospiDirectiveIssued(true);
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Issue Central MoSPI Compliance Directive to State</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-warning"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("OVERSIGHT_DIRECTIVE", "MoSPI SNA Tranche Withheld", "Central SNA disbursement tranche withheld pending field verification.", "HIGH");
                        setSnaTrancheWithheld(true);
                      }}
                    >
                      <AlertOctagon size={14} />
                      <span>Withhold State Nodal Account (SNA) Tranche</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-outline"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("OVERSIGHT_DIRECTIVE", "Special CAG / CVC Audit Requisition", "Requisitioned special CAG / CVC audit for inter-state duplicate cluster scrutiny.", "CRITICAL");
                        setCagAuditOrdered(true);
                      }}
                    >
                      <ShieldAlert size={14} />
                      <span>Requisition Special CAG / CVC Audit</span>
                    </button>
                  </div>
                </div>
              )}

              {/* B. Implementing Agency Directives */}
              {activeAuthority === "IMPLEMENTING_AGENCY" && (
                <div className="authority-directive-box ia-directive-theme">
                  <div className="section-header-row" style={{ marginBottom: "10px" }}>
                    <h3 className="section-title">
                      <span className="sec-num-badge">7</span>
                      <span>Implementing Agency Execution, MB Records & Billing Submissions</span>
                    </h3>
                    <span className="authority-badge-small ia">Executing Agency</span>
                  </div>
                  <p className="action-box-desc">
                    Official execution portal for designated executing body ({work.IDA_NAME || "Executing Agency"}): log physical progress, record Measurement Book (MB) measurements, submit running contractor bills to District Authority, and upload verified site evidence.
                  </p>

                  <div className="directive-kpi-row">
                    <div className="d-kpi">
                      <span className="d-kpi-label">MB Ledger Entry</span>
                      <strong className="d-kpi-val" style={{ color: "#059669" }}>
                        {`MB-2026-${canonicalWorkId || "PENDING"}`}
                      </strong>
                    </div>
                    <div className="d-kpi">
                      <span className="d-kpi-label">Stage Geo-Photos</span>
                      <strong className="d-kpi-val" style={{ color: "#059669" }}>
                        GEO-STAMP VERIFIED (100%)
                      </strong>
                    </div>
                    <div className="d-kpi">
                      <span className="d-kpi-label">Time Extension (EOT)</span>
                      <strong className="d-kpi-val">
                        STANDARD TIMELINE
                      </strong>
                    </div>
                  </div>

                  <div className="action-box-buttons">
                    <button
                      type="button"
                      className="collector-btn btn-primary"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("MEASUREMENT_BOOK_SUBMISSION", "MB Entry & Running Bill Claim", `IA recorded Measurement Book (MB-2026-${canonicalWorkId}) measurements and submitted running bill for District Authority clearance.`, "MEDIUM");
                        setMbSubmitted(true);
                      }}
                    >
                      <FileCheck size={14} />
                      <span>Record Measurement Book (MB) Entry & Submit Bill</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-warning"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("MEASUREMENT_BOOK_SUBMISSION", "Milestone Geo-Photo Logged", "Verified milestone geo-tagged photograph logged with tamper-proof timestamp.", "LOW");
                        setGeoEvidenceUploaded(true);
                      }}
                    >
                      <Camera size={14} />
                      <span>Upload Verified Milestone Geo-Photo</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-outline"
                      disabled={actionLoading}
                      onClick={() => {
                        setEotFiled(true);
                        setComposerDefaultType("TIME_EXTENSION");
                        setComposerOpen(true);
                      }}
                    >
                      <Clock size={14} />
                      <span>Apply for Formal Time Extension (EOT)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* C. MP Parliamentary Directives */}
              {activeAuthority === "MP" && (
                <div className="authority-directive-box mp-directive-theme">
                  <div className="section-header-row" style={{ marginBottom: "10px" }}>
                    <h3 className="section-title">
                      <span className="sec-num-badge">8</span>
                      <span>Hon'ble Member of Parliament Directives & Priority Inquiries</span>
                    </h3>
                    <span className="authority-badge-small mp">Elected Representative</span>
                  </div>
                  <p className="action-box-desc">
                    Direct oversight by Hon'ble MP ({work.MP_NAME || "Constituency Representative"}): raise parliamentary inquiries regarding stalled execution, request expedited sanction from Collectorate, or schedule field inspection.
                  </p>

                  <div className="directive-kpi-row">
                    <div className="d-kpi">
                      <span className="d-kpi-label">Constituency Recommendation</span>
                      <strong className="d-kpi-val" style={{ color: "#d97706" }}>
                        OFFICIALLY SPONSORED
                      </strong>
                    </div>
                    <div className="d-kpi">
                      <span className="d-kpi-label">Citizen Endorsement</span>
                      <strong className="d-kpi-val">
                        HIGH COMMUNITY NEED
                      </strong>
                    </div>
                    <div className="d-kpi">
                      <span className="d-kpi-label">Sansad Notice Status</span>
                      <strong className="d-kpi-val" style={{ color: "#059669" }}>
                        ACTIVE EXPEDITE REQUEST
                      </strong>
                    </div>
                  </div>

                  <div className="action-box-buttons">
                    <button
                      type="button"
                      className="collector-btn btn-primary"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("CONSTITUENCY_INQUIRY", "Parliamentary Expedited Inquiry", "Hon'ble MP issued parliamentary priority inquiry to District Collectorate regarding execution status.", "HIGH");
                        setSansadNoticeIssued(true);
                      }}
                    >
                      <Bell size={14} />
                      <span>Issue Parliamentary Expedited Inquiry to Collector</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-warning"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("CONSTITUENCY_INQUIRY", "Asset Endorsement for Public Dedication", "Hon'ble MP formally endorsed completed community asset for public dedication and plaque inscription.", "LOW");
                        setInaugurationApproved(true);
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Endorse for Public Dedication & Plaque Inscription</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-outline"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("CONSTITUENCY_INQUIRY", "On-Site Constituency Inspection Scheduled", "Hon'ble MP scheduled on-site constituency inspection visit with District Collectorate.", "MEDIUM");
                        setInspectionScheduled(true);
                      }}
                    >
                      <Calendar size={14} />
                      <span>Schedule On-Site Constituency Inspection</span>
                    </button>
                  </div>
                </div>
              )}

              {/* D. Citizen Social Audit */}
              {activeAuthority === "CITIZEN" && (
                <div className="authority-directive-box citizen-directive-theme">
                  <div className="section-header-row" style={{ marginBottom: "10px" }}>
                    <h3 className="section-title">
                      <span className="sec-num-badge">5</span>
                      <span>Saarthi Citizen Social Audit & Public Verification</span>
                    </h3>
                    <span className="authority-badge-small citizen">Public Transparency</span>
                  </div>
                  <p className="action-box-desc">
                    Public transparency and civic oversight: verify on-ground completion of community projects,
                    submit 5-star public utility satisfaction ratings, report ghost or substandard infrastructure, or file an e-RTI inquiry.
                  </p>

                  <div className="citizen-rating-box">
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#1e293b" }}>
                      Rate Community Asset Quality & Utility:
                    </span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCitizenRating(star)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "22px",
                            cursor: "pointer",
                            color: star <= citizenRating ? "#f59e0b" : "#cbd5e1",
                            transition: "transform 0.1s ease",
                            padding: "2px",
                          }}
                          title={`Rate ${star} Star${star > 1 ? "s" : ""}`}
                        >
                          ★
                        </button>
                      ))}
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginLeft: "6px" }}>
                        ({citizenRating} / 5 Stars · Public Social Audit)
                      </span>
                    </div>
                  </div>

                  <div className="action-box-buttons">
                    <button
                      type="button"
                      className="collector-btn btn-primary"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("PUBLIC_VERIFICATION", "Citizen Social Audit Asset Verification", `Citizen verified community asset as delivered and usable with a satisfaction rating of ${citizenRating}/5 stars.`, "LOW");
                        setCitizenAuditVerified(true);
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Verify Community Asset as Delivered & Usable</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-warning"
                      disabled={actionLoading}
                      onClick={() => {
                        setGrievanceReported(true);
                        setComposerDefaultType("GRIEVANCE");
                        setComposerOpen(true);
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>Report On-Ground Defect / Incomplete Work</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-outline"
                      onClick={() => alert(`e-RTI Application template generated for Work #${canonicalWorkId}. You can file this directly with Nodal District Authority.`)}
                    >
                      <ExternalLink size={14} />
                      <span>File e-RTI Public Information Request</span>
                    </button>
                  </div>
                </div>
              )}

              {/* E. District Authority / Collector Clearances (Default) */}
              {activeAuthority === "DISTRICT_AUTHORITY" && (
                <div className="collector-action-box">
                  <div className="section-header-row" style={{ marginBottom: "10px" }}>
                    <h3 className="section-title">
                      <span className="sec-num-badge">11</span>
                      <span>District Collectorate Priority Action & Official Clearance</span>
                    </h3>
                    <span className="status-pill risk-low">ACTIVE COLLECTORATE</span>
                  </div>
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
                      className="collector-btn btn-primary"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("ADMINISTRATIVE_NOTICE", "Collectorate Feasibility Clearance", "District Collectorate verified feasibility and cleared administrative scrutiny under MPLADS Guidelines.", "LOW");
                        setVerifiedLocally(true);
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Collectorate Feasibility Clearance</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-warning"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("ADMINISTRATIVE_NOTICE", "7-Day Explanation Notice to Agency", "District Collectorate issued statutory 7-day explanation notice to implementing agency for execution delay.", "HIGH");
                        setNoticeIssued(true);
                      }}
                    >
                      <AlertOctagon size={14} />
                      <span>Issue 7-Day Explanation Notice to Agency</span>
                    </button>

                    <button
                      type="button"
                      className="collector-btn btn-outline"
                      disabled={actionLoading}
                      onClick={() => {
                        handleExecuteWorkflowAction("ADMINISTRATIVE_ESCALATION", "National Administrative Escalation to MoSPI", "District Collectorate escalated high-risk non-compliance / default to MoSPI Central Surveillance.", "CRITICAL");
                        setFundsFrozen(true);
                      }}
                    >
                      <ShieldAlert size={14} />
                      <span>Escalate to MoSPI Central Surveillance</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* 5. Sticky Bottom Action Clearance Bar Tailored to Authority */}
        <div className="drawer-footer-actions">
          <div className="footer-left-status">
            <span className="font-mono text-xs text-slate-500">
              {activeAuthority === "MOSPI" ? (
                <>MoSPI Central Record #{recId || workId} · State: <strong>{work.STATE_NAME || "All-India"}</strong></>
              ) : activeAuthority === "IMPLEMENTING_AGENCY" ? (
                <>Work Order #{workId || recId} · Agency: <strong>{work.IDA_NAME || "Executing Agency"}</strong></>
              ) : activeAuthority === "MP" ? (
                <>Constituency Work #{recId || workId} · <strong>{displayHouse}</strong></>
              ) : activeAuthority === "CITIZEN" ? (
                <>Public Asset #{workId || recId} · <strong>{work.CONSTITUENCY || "Local Area"}</strong></>
              ) : (
                <>Record #{recId || workId} · Stage: <strong>{stage}</strong></>
              )}
            </span>
          </div>

          <div className="footer-right-buttons">
            {activeAuthority === "MOSPI" ? (
              <button
                type="button"
                className={`drawer-action-btn ${mospiDirectiveIssued ? "btn-cleared" : "btn-primary"}`}
                onClick={() => setMospiDirectiveIssued(!mospiDirectiveIssued)}
              >
                <CheckCircle2 size={14} />
                <span>{mospiDirectiveIssued ? "Directive Active ✓" : "MoSPI Central Action"}</span>
              </button>
            ) : activeAuthority === "IMPLEMENTING_AGENCY" ? (
              <button
                type="button"
                className={`drawer-action-btn ${mbSubmitted ? "btn-cleared" : "btn-primary"}`}
                onClick={() => setMbSubmitted(!mbSubmitted)}
              >
                <CheckCircle2 size={14} />
                <span>{mbSubmitted ? "MB Bill Filed ✓" : "Submit Execution Claim / MB"}</span>
              </button>
            ) : activeAuthority === "MP" ? (
              <button
                type="button"
                className={`drawer-action-btn ${sansadNoticeIssued ? "btn-cleared" : "btn-primary"}`}
                onClick={() => setSansadNoticeIssued(!sansadNoticeIssued)}
              >
                <Bell size={14} />
                <span>{sansadNoticeIssued ? "Notice Served ✓" : "Dispatch Sansad Notice"}</span>
              </button>
            ) : activeAuthority === "CITIZEN" ? (
              <button
                type="button"
                className={`drawer-action-btn ${citizenAuditVerified ? "btn-cleared" : "btn-primary"}`}
                onClick={() => setCitizenAuditVerified(!citizenAuditVerified)}
              >
                <CheckCircle2 size={14} />
                <span>{citizenAuditVerified ? "Feedback Recorded ✓" : "Submit Social Audit Feedback"}</span>
              </button>
            ) : (
              <button
                type="button"
                className={`drawer-action-btn ${verifiedLocally ? "btn-cleared" : "btn-primary"}`}
                onClick={() => setVerifiedLocally(!verifiedLocally)}
              >
                <CheckCircle2 size={14} />
                <span>{verifiedLocally ? "Collectorate Cleared ✓" : "Accord Clearance"}</span>
              </button>
            )}

            <Link
              to={`/works?q=${workId || recId || ""}`}
              className="drawer-action-btn-outline"
              title="View full record in All-India Works Explorer"
            >
              <span>Explore in Registry</span>
              <ExternalLink size={13} />
            </Link>

            <button
              type="button"
              className="drawer-action-btn-outline"
              onClick={onClose}
              title="Close Work Dossier (Esc)"
              style={{ color: "#64748b" }}
            >
              <span>Close Dossier</span>
            </button>
          </div>
        </div>

        {composerOpen && (
          <RequestComposerModal
            work={work}
            currentRole={activeAuthority}
            defaultType={composerDefaultType}
            onClose={() => setComposerOpen(false)}
            onRequestCreated={(newReq) => {
              setComposerOpen(false);
              setActionFeedback(`Request ${newReq.request_id} created successfully ✓`);
              loadWorkRequests();
              setTimeout(() => setActionFeedback(""), 4000);
            }}
          />
        )}
      </aside>
    </div>,
    document.body
  );
}
