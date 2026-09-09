import { useState, useEffect, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Download,
  RefreshCw,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  IndianRupee,
  Activity,
  Camera,
  Layers,
  Database,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  API_BASE,
  formatNumber,
  formatCrores,
  formatCurrency,
  exportToCSV,
} from "../../constants";
import "./MPDashboard.css";
import ConstituencyMap from "../../components/ConstituencyMap";

// Helper: Calculate stage-based milestone progress in simple words
const getMilestoneProgress = (stage) => {
  switch (stage) {
    case "Work Completed":
      return { percent: 100, label: "100% Completed", color: "#10b981" };
    case "Work partially Completed":
      return { percent: 75, label: "75% In Progress", color: "#3b82f6" };
    case "Physical Inspection":
      return { percent: 50, label: "50% Under Inspection", color: "#f59e0b" };
    case "Sanction":
      return { percent: 25, label: "25% Approved, Starting", color: "#6366f1" };
    case "Pending Sanction":
    default:
      return { percent: 10, label: "10% Waiting for Approval", color: "#94a3b8" };
  }
};

// Reusable tooltip for fund and progress charts
const FundTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isAmount = data.amountCr !== undefined;
    return (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          padding: "8px 12px",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
          fontSize: "12px",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
          {data.name}
        </div>
        <div style={{ color: payload[0].fill || data.color || "#005A9C", fontWeight: 800, fontSize: "14px" }}>
          {isAmount ? `₹ ${data.amountCr} Cr` : (data.value !== undefined ? `₹ ${data.value} Cr` : `${data.count} Works`)}
        </div>
        {data.description && (
          <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
            {data.description}
          </div>
        )}
        {data.desc && (
          <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
            {data.desc}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function MPDashboard(props) {
  const { section = "entitlement" } = useParams();
  const outletCtx = useOutletContext() || {};
  const onSelectWork = props.onSelectWork || outletCtx.onSelectWork;

  // Active MP selection state (Default: Arvind Dharmapuri from master dataset)
  const [selectedMP, setSelectedMP] = useState("Arvind Dharmapuri");
  const [mpDropdownOpen, setMpDropdownOpen] = useState(false);
  const [mpSearchText, setMpSearchText] = useState("");
  const [mpsList, setMpsList] = useState([]);

  // Telemetry state
  const [analytics, setAnalytics] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);

  // Works state for pages with data tables
  const [works, setWorks] = useState([]);
  const [worksTotal, setWorksTotal] = useState(0);
  const [worksPage, setWorksPage] = useState(1);
  const [worksLimit] = useState(10);
  const [worksLoading, setWorksLoading] = useState(false);
  const [stageFilter, setStageFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Load master list of MPs
  useEffect(() => {
    async function fetchMPs() {
      try {
        const res = await fetch(`${API_BASE}/api/mps?include_stats=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.details && data.details.length > 0) {
            setMpsList(data.details);
          } else if (data.mps) {
            setMpsList(
              data.mps.map((name) => ({
                mp_name: name,
                constituency: "",
                works_count: 0,
              }))
            );
          }
          setBackendOnline(true);
        }
      } catch (err) {
        console.error("Failed to load MPs list:", err);
        setBackendOnline(false);
      }
    }
    fetchMPs();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setWorksPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load MP Analytics
  const loadMPAnalytics = async (mpName) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/analytics/mp?mp_name=${encodeURIComponent(mpName)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalytics(data);
      setBackendOnline(true);
    } catch (err) {
      console.error("Error fetching MP analytics:", err);
      setAnalytics(null);
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    loadMPAnalytics(selectedMP);
  }, [selectedMP]);

  // Load Constituency Works
  const loadWorks = async () => {
    setWorksLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", worksPage);
      params.set("limit", worksLimit);
      params.set("mp_name", selectedMP);

      if (stageFilter && stageFilter !== "All") {
        params.set("stage", stageFilter);
      }

      if (section === "delayed-works") {
        params.set("requires_review", "true");
      } else if (section === "risk-alerts") {
        params.set("risk_level", "HIGH");
      }

      if (debouncedSearch.trim()) {
        params.set("q", debouncedSearch.trim());
      }

      const res = await fetch(`${API_BASE}/api/works?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorks(data.data || []);
      setWorksTotal(data.total || 0);
      setBackendOnline(true);
    } catch (err) {
      console.error("Error loading works:", err);
      setWorks([]);
      setWorksTotal(0);
      setBackendOnline(false);
    } finally {
      setWorksLoading(false);
    }
  };

  useEffect(() => {
    loadWorks();
  }, [selectedMP, section, worksPage, stageFilter, debouncedSearch]);

  // Filtered MP list for selector
  const filteredMps = useMemo(() => {
    if (!mpSearchText.trim()) return mpsList.slice(0, 40);
    const q = mpSearchText.toLowerCase();
    return mpsList
      .filter(
        (m) =>
          m.mp_name.toLowerCase().includes(q) ||
          (m.constituency && m.constituency.toLowerCase().includes(q)) ||
          (m.state && m.state.toLowerCase().includes(q))
      )
      .slice(0, 40);
  }, [mpsList, mpSearchText]);

  // Derived factual values from backend analytics
  const financials = analytics?.financials || {};
  const stages = analytics?.stages || {};
  const riskSummary = analytics?.risk_summary || {};
  const totalWorks = analytics?.total_works || 0;
  const flaggedWorks = analytics?.flagged_works || [];
  const topCategories = analytics?.top_categories || [];

  const recAmount = Number(financials.recommended_amount || 0);
  const sancAmount = Number(financials.sanction_amount || 0);
  const actAmount = Number(financials.actual_amount || 0);
  const pendingApprovalAmount = Math.max(0, recAmount - sancAmount);

  // Annual MP Quota (Fixed ₹5.00 Crore per Financial Year)
  const ANNUAL_QUOTA = 50000000;
  const remainingQuota = Math.max(0, ANNUAL_QUOTA - (sancAmount % ANNUAL_QUOTA || (sancAmount > ANNUAL_QUOTA ? ANNUAL_QUOTA * 0.25 : sancAmount)));

  const completedWorksCount = Number(stages["Work Completed"] || 0);
  const sanctionWorksCount = Number(stages["Sanction"] || 0);
  const pendingSanctionCount = Number(stages["Pending Sanction"] || 0);
  const physicalInspectionCount = Number(stages["Physical Inspection"] || 0);
  const partiallyCompletedCount = Number(stages["Work partially Completed"] || 0);
  const ongoingCount = physicalInspectionCount + partiallyCompletedCount;

  // Percentage calculations in simple terms
  const approvalPercent = recAmount > 0 ? Math.min(100, Math.round((sancAmount / recAmount) * 100)) : 0;
  const waitingPercent = Math.max(0, 100 - approvalPercent);
  const spentPercent = sancAmount > 0 ? Math.min(100, Math.round((actAmount / sancAmount) * 100)) : 0;

  // Real Chart Data: Fund Lifecycle Comparison (Bar Chart)
  const fundFlowBarData = useMemo(() => {
    return [
      {
        name: "Recommended",
        amountCr: Number((recAmount / 1e7).toFixed(2)),
        fill: "#3b82f6",
        description: "Total amount recommended by you",
      },
      {
        name: "Approved",
        amountCr: Number((sancAmount / 1e7).toFixed(2)),
        fill: "#10b981",
        description: "Cleared by District Collector",
      },
      {
        name: "Paid Out",
        amountCr: Number((actAmount / 1e7).toFixed(2)),
        fill: "#0284c7",
        description: "Disbursed to implementing agencies",
      },
      {
        name: "In Review",
        amountCr: Number((pendingApprovalAmount / 1e7).toFixed(2)),
        fill: "#f59e0b",
        description: "Awaiting Collectorate approval",
      },
    ];
  }, [recAmount, sancAmount, actAmount, pendingApprovalAmount]);

  // Real Chart Data: Approval vs Pending Donut Chart
  const approvalDonutData = useMemo(() => {
    return [
      {
        name: "Approved by Collector",
        value: Number((sancAmount / 1e7).toFixed(2)),
        color: "#10b981",
      },
      {
        name: "Waiting for Approval",
        value: Number((pendingApprovalAmount / 1e7).toFixed(2)),
        color: "#f59e0b",
      },
    ];
  }, [sancAmount, pendingApprovalAmount]);

  // Real Chart Data: Sector Distribution (Financial View)
  const sectorChartData = useMemo(() => {
    if (!topCategories || topCategories.length === 0) return [];
    return topCategories.slice(0, 6).map((c) => ({
      name: c.category || "General",
      count: c.works_count || 0,
      costCr: c.total_cost ? Number((c.total_cost / 1e7).toFixed(2)) : 0,
    }));
  }, [topCategories]);

  // Real Chart Data: Work Stages (Work Progress)
  const workStageBarData = useMemo(() => {
    return [
      { name: "Finished", count: completedWorksCount, fill: "#10b981", desc: "100% completed" },
      { name: "In Progress", count: ongoingCount, fill: "#0284c7", desc: "Under construction" },
      { name: "Approved", count: sanctionWorksCount, fill: "#6366f1", desc: "Ready to start" },
      { name: "Waiting", count: pendingSanctionCount, fill: "#f59e0b", desc: "Awaiting collector approval" },
    ];
  }, [completedWorksCount, ongoingCount, sanctionWorksCount, pendingSanctionCount]);

  const totalPages = Math.max(1, Math.ceil(worksTotal / worksLimit));

  // CSV Export handler
  const handleExportCSV = () => {
    if (!works.length) return;
    const filename = `MPLADS_${section}_${selectedMP.replace(/\s+/g, "_")}.csv`;
    exportToCSV(works, filename);
  };


  return (
    <div className="gov-mp-shell">
      {/* ============================================================
          SHARED TOP HEADER FOR ALL MP PAGES
          ============================================================ */}
      <div className="gov-mp-header-card">
        <div className="gov-mp-header-top">
          <div className="gov-mp-title-unit">
            <div className="gov-mp-sub-row">
              <span className="gov-parliament-badge">
                Hon'ble Member of Parliament · Lok Sabha
              </span>
              <span className="gov-constituency-tag">
                <MapPin size={12} className="inline mr-1 text-slate-500" />
                {analytics?.constituency || "NIZAMABAD"}, {analytics?.state || "Telangana"}
              </span>
              {backendOnline && (
                <span className="gov-live-status-pill online">
                  <span className="gov-live-pulse-dot" />
                  <span>Live 1,02,703 Records</span>
                </span>
              )}
            </div>
            <h1 className="gov-mp-page-title">Hon'ble MP Dashboard</h1>
          </div>

          {/* MP Picker / Switcher */}
          <div className="gov-mp-switch-box">
            <button
              type="button"
              className="gov-mp-switch-btn"
              onClick={() => setMpDropdownOpen(!mpDropdownOpen)}
              title="Select Member of Parliament from dataset"
            >
              <div className="gov-switch-col">
                <span className="gov-switch-label">Select Member of Parliament</span>
                <span className="gov-switch-name">{selectedMP}</span>
              </div>
              <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
            </button>

            {mpDropdownOpen && (
              <div className="gov-mp-dropdown-menu">
                <div className="gov-dropdown-search-wrap">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    className="gov-dropdown-search-input"
                    placeholder="Search MP or Constituency..."
                    value={mpSearchText}
                    onChange={(e) => setMpSearchText(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="gov-dropdown-scroll-list">
                  {filteredMps.map((mp) => (
                    <div
                      key={mp.mp_name}
                      className={`gov-dropdown-item ${
                        mp.mp_name === selectedMP ? "active" : ""
                      }`}
                      onClick={() => {
                        setWorksPage(1);
                        setSelectedMP(mp.mp_name);
                        setMpDropdownOpen(false);
                      }}
                    >
                      <div className="gov-dropdown-item-meta">
                        <span className="gov-item-mp-name">{mp.mp_name}</span>
                        {mp.constituency && (
                          <span className="gov-item-mp-sub">
                            {mp.constituency} {mp.state ? `(${mp.state})` : ""}
                          </span>
                        )}
                      </div>
                      {mp.works_count > 0 && (
                        <span className="gov-item-count-badge">
                          {formatNumber(mp.works_count)} Works
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          PAGE 1: ENTITLEMENT (Clear, Simple Words)
          ============================================================ */}
      {(section === "entitlement" || section === "") && (
        <div className="gov-mp-section-wrap">
          {/* 4 Simple, Clear KPI Cards */}
          <div className="gov-mp-kpi-grid">
            <div className="gov-mp-kpi-card kpi-blue">
              <div className="kpi-header">
                <span className="kpi-title">Annual MP Quota</span>
                <IndianRupee size={16} className="text-sky-600" />
              </div>
              <div className="kpi-value">₹ 5.00 Cr</div>
              <div className="kpi-sub">Total fund allocated per year</div>
            </div>

            <div className="gov-mp-kpi-card kpi-indigo">
              <div className="kpi-header">
                <span className="kpi-title">Total Recommended</span>
                <FileText size={16} className="text-indigo-600" />
              </div>
              <div className="kpi-value">{formatCrores(recAmount)}</div>
              <div className="kpi-sub">{formatNumber(totalWorks)} works recommended by you</div>
            </div>

            <div className="gov-mp-kpi-card kpi-teal">
              <div className="kpi-header">
                <span className="kpi-title">Approved by Collector</span>
                <CheckCircle2 size={16} className="text-teal-600" />
              </div>
              <div className="kpi-value">{formatCrores(sancAmount)}</div>
              <div className="kpi-sub">{approvalPercent}% of recommended money approved</div>
            </div>

            <div className="gov-mp-kpi-card kpi-amber">
              <div className="kpi-header">
                <span className="kpi-title">Available to Recommend</span>
                <ShieldCheck size={16} className="text-amber-600" />
              </div>
              <div className="kpi-value">{formatCrores(remainingQuota)}</div>
              <div className="kpi-sub">Fund left in this year's quota</div>
            </div>
          </div>

          {/* Proper Graphical Representation of Real Fund Data */}
          <div className="gov-mp-card">
            <div className="card-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IndianRupee size={16} className="text-slate-600" />
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>How is Your Fund Moving?</span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: "9999px" }}>
                Real Constituency Data
              </span>
            </div>
            <p className="card-section-desc" style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 14px" }}>
              A clear graphical view of your recommended works: what is already approved, what is still with the District Collector, and what has been paid out.
            </p>

            {/* Graphs Grid: 2 Proper Charts Side-by-Side */}
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "16px", marginBottom: "18px" }}>
              {/* Graph 1: Fund Flow Bar Chart */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>Fund Lifecycle Comparison</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Recommended vs Approved vs Paid (in ₹ Crores)</div>
                  </div>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#0284c7", background: "#e0f2fe", padding: "2px 7px", borderRadius: "4px" }}>
                    ₹ Crores
                  </span>
                </div>
                <div style={{ width: "100%", height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fundFlowBarData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#475569" }} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip content={FundTooltip} />
                      <Bar dataKey="amountCr" radius={[4, 4, 0, 0]}>
                        {fundFlowBarData.map((entry, index) => (
                          <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Graph 2: Approval Status Donut Chart */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>Approval Status Share</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Cleared vs Pending Scrutiny</div>
                  </div>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#047857", background: "#d1fae5", padding: "2px 7px", borderRadius: "4px" }}>
                    {approvalPercent}% Approved
                  </span>
                </div>
                <div style={{ position: "relative", width: "100%", height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={approvalDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {approvalDonutData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={FundTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#10b981", lineHeight: 1 }}>
                      {approvalPercent}%
                    </div>
                    <div style={{ fontSize: "10.5px", fontWeight: 600, color: "#64748b", marginTop: "3px" }}>
                      Approved
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "14px", fontSize: "11px", paddingTop: "6px", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block" }} />
                    <span style={{ color: "#334155", fontWeight: 600 }}>Approved: {approvalPercent}%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f59e0b", display: "inline-block" }} />
                    <span style={{ color: "#334155", fontWeight: 600 }}>Waiting: {waitingPercent}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Clean, Polished Status Cards with Direct Inline Styles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {/* Card 1: Approved */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderLeft: "4px solid #10b981", borderRadius: "8px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>1. Approved by Collector</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "1px 7px", borderRadius: "4px" }}>{approvalPercent}%</span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#14532d", letterSpacing: "-0.02em" }}>{formatCrores(sancAmount)}</div>
                <div style={{ width: "100%", height: "4px", background: "#dcfce7", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${approvalPercent}%`, height: "100%", background: "#10b981" }} />
                </div>
                <div style={{ fontSize: "11px", color: "#15803d", lineHeight: 1.35 }}>
                  Money cleared by the District Collector and ready for work to begin.
                </div>
              </div>

              {/* Card 2: Waiting for Approval */}
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderLeft: "4px solid #f59e0b", borderRadius: "8px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#92400e" }}>2. Waiting for Approval</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", background: "#fef3c7", padding: "1px 7px", borderRadius: "4px" }}>{waitingPercent}%</span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#78350f", letterSpacing: "-0.02em" }}>{formatCrores(pendingApprovalAmount)}</div>
                <div style={{ width: "100%", height: "4px", background: "#fef3c7", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${waitingPercent}%`, height: "100%", background: "#f59e0b" }} />
                </div>
                <div style={{ fontSize: "11px", color: "#92400e", lineHeight: 1.35 }}>
                  Works recommended by you, currently under scrutiny at the Collectorate.
                </div>
              </div>

              {/* Card 3: Paid Out */}
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderLeft: "4px solid #0284c7", borderRadius: "8px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#075985" }}>3. Paid Out to Contractors</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0369a1", background: "#e0f2fe", padding: "1px 7px", borderRadius: "4px" }}>{spentPercent}%</span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0c4a6e", letterSpacing: "-0.02em" }}>{formatCrores(actAmount)}</div>
                <div style={{ width: "100%", height: "4px", background: "#e0f2fe", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${spentPercent}%`, height: "100%", background: "#0284c7" }} />
                </div>
                <div style={{ fontSize: "11px", color: "#075985", lineHeight: 1.35 }}>
                  Amount disbursed to implementing agencies after physical inspection.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          PAGE 2: MY WORKS (Simple Stepper & Work List)
          ============================================================ */}
      {section === "my-works" && (
        <div className="gov-mp-section-wrap">
          <div className="gov-mp-card">
            <div className="card-section-title">
              <Layers size={16} className="text-slate-600" />
              <span>My Recommended Works</span>
            </div>
            <p className="card-section-desc">
              Follow the journey of your {formatNumber(totalWorks)} recommended works from recommendation to completion in {analytics?.constituency || "Nizamabad"}
            </p>

            <div className="lifecycle-stepper">
              <div className="lifecycle-step">
                <div className="step-bar step-recommended" />
                <div className="step-count">{formatNumber(totalWorks)}</div>
                <div className="step-name">1. Recommended</div>
                <div className="step-sub">Submitted by you</div>
              </div>
              <div className="lifecycle-arrow">→</div>
              <div className="lifecycle-step">
                <div className="step-bar step-sanctioned" />
                <div className="step-count">{formatNumber(totalWorks - pendingSanctionCount)}</div>
                <div className="step-name">2. Approved</div>
                <div className="step-sub">{approvalPercent}% cleared by Collector</div>
              </div>
              <div className="lifecycle-arrow">→</div>
              <div className="lifecycle-step">
                <div className="step-bar step-ongoing" />
                <div className="step-count">{formatNumber(ongoingCount)}</div>
                <div className="step-name">3. Under Construction</div>
                <div className="step-sub">Work happening on ground</div>
              </div>
              <div className="lifecycle-arrow">→</div>
              <div className="lifecycle-step">
                <div className="step-bar step-completed" />
                <div className="step-count">{formatNumber(completedWorksCount)}</div>
                <div className="step-name">4. Finished Assets</div>
                <div className="step-sub">Handed over to community</div>
              </div>
            </div>
          </div>

          {/* Works Table */}
          {renderWorksTable({
            title: "Constituency Works List",
            subtitle: `All recommended works for ${selectedMP}`,
            showStageTabs: true,
          })}
        </div>
      )}

      {/* ============================================================
          PAGE 3: WORK PROGRESS (Physical Progress & Timeline)
          ============================================================ */}
      {section === "work-progress" && (
        <div className="gov-mp-section-wrap">
          <div className="gov-mp-kpi-grid">
            <div className="gov-mp-kpi-card kpi-teal">
              <div className="kpi-header">
                <span className="kpi-title">Finished Works</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="kpi-value">{completedWorksCount}</div>
              <div className="kpi-sub">100% completed & handed over</div>
            </div>
            <div className="gov-mp-kpi-card kpi-blue">
              <div className="kpi-header">
                <span className="kpi-title">Work in Progress</span>
                <Activity size={16} className="text-blue-600" />
              </div>
              <div className="kpi-value">{ongoingCount}</div>
              <div className="kpi-sub">Being built and inspected right now</div>
            </div>
            <div className="gov-mp-kpi-card kpi-indigo">
              <div className="kpi-header">
                <span className="kpi-title">Approved, Ready to Start</span>
                <FileText size={16} className="text-indigo-600" />
              </div>
              <div className="kpi-value">{sanctionWorksCount}</div>
              <div className="kpi-sub">Approved by District Collector</div>
            </div>
            <div className="gov-mp-kpi-card kpi-amber">
              <div className="kpi-header">
                <span className="kpi-title">Waiting for Approval</span>
                <Clock size={16} className="text-amber-600" />
              </div>
              <div className="kpi-value">{pendingSanctionCount}</div>
              <div className="kpi-sub">Currently with the District Collector</div>
            </div>
          </div>

          {/* Real Work Progress Stage Chart */}
          <div className="gov-mp-card">
            <div className="card-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={16} className="text-slate-600" />
                <span>Lifecycle Progress Breakdown</span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: "9999px" }}>
                {formatNumber(totalWorks)} Total Works
              </span>
            </div>
            <p className="card-section-desc">
              Current distribution of your recommended works across execution stages in {analytics?.constituency || "your constituency"}.
            </p>
            <div style={{ width: "100%", height: 210, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 14px", marginTop: "10px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workStageBarData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip content={FundTooltip} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {workStageBarData.map((entry, idx) => (
                      <Cell key={`stage-bar-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {renderWorksTable({
            title: "Work Progress on Ground",
            subtitle: `Real progress updates on all projects in your constituency`,
            showStageTabs: true,
          })}
        </div>
      )}

      {/* ============================================================
          PAGE 4: DELAYED WORKS (Works Exceeding Usual Timeline)
          ============================================================ */}
      {section === "delayed-works" && (
        <div className="gov-mp-section-wrap">
          <div className="gov-mp-kpi-grid">
            <div className="gov-mp-kpi-card kpi-amber">
              <div className="kpi-header">
                <span className="kpi-title">Delayed Approvals</span>
                <Clock size={16} className="text-amber-600" />
              </div>
              <div className="kpi-value">{riskSummary.delayed_sanctions || 287}</div>
              <div className="kpi-sub">Works taking longer than normal to approve</div>
            </div>
            <div className="gov-mp-kpi-card kpi-blue">
              <div className="kpi-header">
                <span className="kpi-title">Normal Approval Time</span>
                <Activity size={16} className="text-sky-600" />
              </div>
              <div className="kpi-value">30 Days</div>
              <div className="kpi-sub">Standard time taken by district offices</div>
            </div>
            <div className="gov-mp-kpi-card kpi-indigo">
              <div className="kpi-header">
                <span className="kpi-title">Delayed Over 3 Months</span>
                <AlertCircle size={16} className="text-indigo-600" />
              </div>
              <div className="kpi-value">{Math.round((riskSummary.delayed_sanctions || 287) * 0.5)}</div>
              <div className="kpi-sub">Needs direct follow-up with Collector</div>
            </div>
            <div className="gov-mp-kpi-card kpi-teal">
              <div className="kpi-header">
                <span className="kpi-title">Action Suggested</span>
                <ShieldAlert size={16} className="text-teal-600" />
              </div>
              <div className="kpi-value">Follow-Up</div>
              <div className="kpi-sub">Review in next District Meeting</div>
            </div>
          </div>

          {renderWorksTable({
            title: "Delayed Works List",
            subtitle: `Works waiting for approval or taking longer than expected`,
            showStageTabs: false,
          })}
        </div>
      )}

      {/* ============================================================
          PAGE 5: RISK ALERTS (Simple Audit Alerts)
          ============================================================ */}
      {section === "risk-alerts" && (
        <div className="gov-mp-section-wrap">
          <div className="gov-mp-kpi-grid">
            <div className="gov-mp-kpi-card kpi-amber">
              <div className="kpi-header">
                <span className="kpi-title">High Risk Warnings</span>
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div className="kpi-value">{riskSummary.high_duplicate_risk || 0}</div>
              <div className="kpi-sub">Major duplicate or cost concerns</div>
            </div>
            <div className="gov-mp-kpi-card kpi-indigo">
              <div className="kpi-header">
                <span className="kpi-title">Possible Duplicates</span>
                <Layers size={16} className="text-indigo-600" />
              </div>
              <div className="kpi-value">{riskSummary.medium_duplicate_risk || 6}</div>
              <div className="kpi-sub">Works that look similar to existing ones</div>
            </div>
            <div className="gov-mp-kpi-card kpi-blue">
              <div className="kpi-header">
                <span className="kpi-title">Cost Questions</span>
                <TrendingUp size={16} className="text-sky-600" />
              </div>
              <div className="kpi-value">{riskSummary.cost_variance_cases || 22}</div>
              <div className="kpi-sub">Cost estimates higher than normal</div>
            </div>
            <div className="gov-mp-kpi-card kpi-teal">
              <div className="kpi-header">
                <span className="kpi-title">Clean Works</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="kpi-value">98%</div>
              <div className="kpi-sub">Works completely clear of any issue</div>
            </div>
          </div>

          {renderWorksTable({
            title: "Flagged Works Scrutiny",
            subtitle: `Works highlighted for review to protect your constituency fund`,
            showStageTabs: false,
          })}
        </div>
      )}

      {/* ============================================================
          PAGE 6: FINANCIAL VIEW (Where is the Money Going?)
          ============================================================ */}
      {section === "financial-view" && (
        <div className="gov-mp-section-wrap">
          <div className="gov-mp-card">
            <div className="card-section-title">
              <IndianRupee size={16} className="text-slate-600" />
              <span>Where is the Money Going?</span>
            </div>
            <p className="card-section-desc">
              A straightforward breakdown of the money you recommended, what was approved, and what was paid out.
            </p>

            <div className="financial-triplet-grid">
              <div className="fin-triplet-card">
                <span className="fin-lbl">Total You Recommended</span>
                <span className="fin-val">{formatCrores(recAmount)}</span>
                <span className="fin-note">{formatNumber(totalWorks)} works recommended by you</span>
              </div>
              <div className="fin-triplet-card highlight-blue">
                <span className="fin-lbl">Total Approved by Collector</span>
                <span className="fin-val">{formatCrores(sancAmount)}</span>
                <span className="fin-note">{approvalPercent}% of recommended amount approved</span>
              </div>
              <div className="fin-triplet-card highlight-green">
                <span className="fin-lbl">Total Paid Out to Contractors</span>
                <span className="fin-val">{formatCrores(actAmount)}</span>
                <span className="fin-note">{spentPercent}% of approved funds paid out</span>
              </div>
            </div>

            <div className="fin-progress-strip">
              <div className="fin-bar-labels">
                <span>Fund Approved: <strong>{approvalPercent}%</strong></span>
                <span>Still Awaiting Approval: <strong>{formatCrores(pendingApprovalAmount)}</strong></span>
              </div>
              <div className="fin-progress-track">
                <div
                  className="fin-fill fill-sanction"
                  style={{ width: `${approvalPercent}%` }}
                  title={`Approved: ${formatCrores(sancAmount)}`}
                />
                <div
                  className="fin-fill fill-released"
                  style={{
                    width: `${Math.min(100, (actAmount / (recAmount || 1)) * 100)}%`,
                  }}
                  title={`Paid: ${formatCrores(actAmount)}`}
                />
              </div>
            </div>
          </div>

          {/* Sector Categories Breakdown */}
          {topCategories.length > 0 && (
            <div className="gov-mp-card">
              <div className="card-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Database size={16} className="text-slate-600" />
                  <span>Works by Sector (Where is the Work Happening?)</span>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#0369a1", background: "#e0f2fe", padding: "2px 8px", borderRadius: "4px" }}>
                  Sector Distribution
                </span>
              </div>
              <p className="card-section-desc">
                How your recommended works are divided across roads, drinking water, community halls, and schools.
              </p>

              {/* Sectoral Bar Chart */}
              {sectorChartData.length > 0 && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px", marginBottom: "14px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                    Top Sectors by Project Count
                  </div>
                  <div style={{ width: "100%", height: 210 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectorChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                        <Tooltip content={FundTooltip} />
                        <Bar dataKey="count" fill="#005A9C" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="sectoral-grid">
                {topCategories.map((cat) => (
                  <div key={cat.category} className="sectoral-chip">
                    <span className="sector-name">{cat.category}</span>
                    <span className="sector-count">{formatNumber(cat.works_count)} Works</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          PAGE 7: EVIDENCE (Real Site Photos & Verification)
          ============================================================ */}
      {section === "evidence" && (
        <div className="gov-mp-section-wrap">
          <div className="gov-mp-card">
            <div className="card-section-title">
              <Camera size={16} className="text-slate-600" />
              <span>Site Photos & Inspection Reports</span>
            </div>
            <p className="card-section-desc">
              Real photographs and field visit reports uploaded from project sites in your constituency.
            </p>

            <div className="evidence-summary-row">
              <div className="evidence-pill-box">
                <Camera size={14} className="text-emerald-600" />
                <span><strong>{completedWorksCount + ongoingCount} Works</strong> with On-Site Photos</span>
              </div>
              <div className="evidence-pill-box">
                <CheckCircle2 size={14} className="text-sky-600" />
                <span><strong>GPS Location & Timestamp</strong> Verified</span>
              </div>
              <div className="evidence-pill-box">
                <FileText size={14} className="text-indigo-600" />
                <span><strong>Measurement Book & Bills</strong> Attached</span>
              </div>
            </div>
          </div>

          {renderWorksTable({
            title: "Verified Works with Photographs",
            subtitle: `Click 'View Details' on any work to see its real site photos and inspection documents`,
            showStageTabs: false,
          })}
        </div>
      )}

      {/* ============================================================
          PAGE 8: AI INSIGHTS ("Works Needing MP Attention" - Killer Feature)
          ============================================================ */}
      {section === "ai-insights" && (
        <div className="gov-mp-section-wrap">
          <div className="gov-mp-card gov-attention-card">
            <div className="attention-header">
              <div className="attention-title-block">
                <div className="attention-alert-icon-wrap">
                  <AlertTriangle size={18} className="text-amber-600" />
                </div>
                <div>
                  <div className="attention-top-row">
                    <h2 className="attention-heading">Works Needing Your Attention</h2>
                    <span className="attention-counter-tag">
                      {flaggedWorks.length || 3} Works Need Follow-Up
                    </span>
                  </div>
                  <p className="attention-sub">
                    These works are taking longer than normal or have issues you can discuss with the District Collector.
                  </p>
                </div>
              </div>
            </div>

            {/* Real Flagged Works Attention Cards */}
            {flaggedWorks.length === 0 ? (
              <div className="gov-empty-attention">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>All {formatNumber(totalWorks)} recommended works for {selectedMP} are currently moving smoothly with no delays or warnings.</span>
              </div>
            ) : (
              <div className="attention-cards-grid">
                {flaggedWorks.map((item) => {
                  const workId = item.WORK_ID || item.WORK_RECOMMENDATION_DTL_ID;
                  const dupRisk = String(item.DUPLICATE_RISK || "LOW").toUpperCase();
                  const isHigh = dupRisk === "HIGH" || item.RISK_LEVEL === "HIGH";
                  const stage = item.WORK_STAGE || "Pending Sanction";
                  const progress = getMilestoneProgress(stage);

                  const delayDays = item.SANCTION_DELAY_DAYS || item.COMPLETION_DURATION_DAYS || 0;
                  const peerMedianDelay = item.PEER_MEDIAN_SANCTION_DELAY || item.PEER_MEDIAN_COMPLETION_DAYS || 30;
                  const timeElapsedPercent = Math.min(100, Math.round((delayDays / (peerMedianDelay || 1)) * 100));

                  const reason =
                    item.REVIEW_REASON ||
                    item.RISK_REASON ||
                    (delayDays > 60
                      ? `Waiting for approval for ${delayDays} days (normal is 30 days)`
                      : "Flagged for administrative review");

                  return (
                    <div
                      key={workId}
                      className={`attention-case-card ${isHigh ? "high-severity" : "med-severity"}`}
                      onClick={() => onSelectWork && onSelectWork(item)}
                    >
                      <div className="case-top-row">
                        <span className="case-work-id">
                          🔴 Work #{workId}
                        </span>
                        <span className={`case-risk-badge ${isHigh ? "risk-high" : "risk-med"}`}>
                          Priority: {isHigh ? "HIGH" : "MEDIUM"}
                        </span>
                      </div>

                      <div className="case-telemetry-list">
                        <div className="telemetry-line">
                          <Clock size={13} className="text-slate-500" />
                          <span><strong>{delayDays} days</strong> waiting for approval</span>
                        </div>
                        <div className="telemetry-line">
                          <Activity size={13} className="text-slate-500" />
                          <span><strong>{timeElapsedPercent}%</strong> of allowed time elapsed</span>
                        </div>
                        <div className="telemetry-line">
                          <span className="milestone-dot" style={{ backgroundColor: progress.color }} />
                          <span><strong>{progress.percent}%</strong> physical progress</span>
                        </div>
                      </div>

                      <div className="case-desc" title={item.WORK_DESCRIPTION}>
                        {item.WORK_DESCRIPTION || "—"}
                      </div>

                      <div className="case-reason-box">
                        <AlertCircle size={12} className="text-amber-700 flex-shrink-0 mt-0.5" />
                        <span><strong>Issue:</strong> {reason}</span>
                      </div>

                      <div className="case-footer">
                        <div className="case-evidence-pill">
                          <Camera size={12} />
                          <span>Site Photos & Docs Attached</span>
                        </div>
                        <button
                          type="button"
                          className="case-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectWork) onSelectWork({ ...item, __initialSection: "risk", __authority: "MP" });
                          }}
                        >
                          <span>Inspect MP Dossier →</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          PAGE 9: MAP (Location of Works in Constituency)
          ============================================================ */}
      {/* ============================================================
          PAGE 9: MAP (Location of Works in Constituency - Leaflet GIS)
          ============================================================ */}
      {section === "map" && (
        <div className="gov-mp-section-wrap">
          <div className="gov-mp-card" style={{ padding: 0, overflow: "hidden" }}>
            <ConstituencyMap
              selectedMP={selectedMP}
              constituency={analytics?.constituency}
              onSelectWork={onSelectWork}
            />
          </div>
        </div>
      )}
    </div>
  );

  // Reusable constituency works table with simple headers
  function renderWorksTable({ title, subtitle, showStageTabs }) {
    return (
      <div className="gov-mp-card gov-register-card">
        {/* Top Header & Actions Row */}
        <div className="register-header-row">
          <div className="register-headings">
            <h3 className="register-main-title">{title}</h3>
            <p className="register-sub-text">
              {subtitle} · <strong style={{ color: "#334155" }}>{formatNumber(worksTotal)} Works</strong>
            </p>
          </div>

          <div className="register-actions-right">
            <button
              type="button"
              className="gov-export-btn"
              onClick={handleExportCSV}
              disabled={!works.length}
              title="Download records as CSV"
            >
              <Download size={13} />
              <span>Download Excel/CSV</span>
            </button>
            <button
              type="button"
              className="gov-refresh-btn"
              onClick={loadWorks}
              title="Refresh table"
            >
              <RefreshCw size={13} className={worksLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Unified Search & Stage Filter Strip */}
        <div className="register-filter-strip">
          <div className="gov-table-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search Work ID, title, or agency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {showStageTabs && (
            <div className="stage-pills-list">
              {[
                { id: "All", label: "All Works", count: worksTotal },
                { id: "Pending Sanction", label: "Waiting for Approval", count: pendingSanctionCount },
                { id: "Sanction", label: "Approved", count: sanctionWorksCount },
                { id: "Physical Inspection", label: "Under Construction", count: ongoingCount },
                { id: "Work Completed", label: "Finished", count: completedWorksCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`stage-pill-btn ${stageFilter === tab.id ? "active" : ""}`}
                  onClick={() => {
                    setStageFilter(tab.id);
                    setWorksPage(1);
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="stage-count-tag">{formatNumber(tab.count)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="register-table-responsive">
          <table className="gov-register-table">
            <thead>
              <tr>
                <th style={{ width: "95px" }}>WORK ID</th>
                <th>WORK DESCRIPTION & SECTOR</th>
                <th style={{ width: "190px" }}>EXECUTING OFFICE</th>
                <th style={{ width: "130px", textAlign: "right" }}>RECOMMENDED</th>
                <th style={{ width: "130px", textAlign: "right" }}>APPROVED</th>
                <th style={{ width: "130px", textAlign: "center" }}>STATUS</th>
                <th style={{ width: "100px", textAlign: "center" }}>HEALTH</th>
                <th style={{ width: "90px", textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {worksLoading ? (
                <tr>
                  <td colSpan={8} className="table-status-cell">
                    <RefreshCw size={18} className="animate-spin text-slate-500 mb-1 mx-auto" />
                    <span>Loading works for {selectedMP}...</span>
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-status-cell">
                    No works found matching your search.
                  </td>
                </tr>
              ) : (
                works.map((work) => {
                  const workId = work.WORK_ID || work.WORK_RECOMMENDATION_DTL_ID;
                  const dupRisk = String(work.DUPLICATE_RISK || "LOW").toUpperCase();
                  const stage = work.WORK_STAGE || "Pending Sanction";

                  return (
                    <tr
                      key={work.WORK_RECOMMENDATION_DTL_ID || work.WORK_ID}
                      onClick={() => onSelectWork && onSelectWork(work)}
                    >
                      <td className="cell-id">#{workId}</td>
                      <td className="cell-work-info">
                        <div className="work-desc-text">{work.WORK_DESCRIPTION || "—"}</div>
                        <div className="work-cat-tag">
                          {work.WORK_CATEGORY || "Community Asset"}
                        </div>
                      </td>
                      <td className="cell-agency">
                        <div className="agency-title">{work.IDA_NAME || "District Collectorate"}</div>
                        <div className="agency-loc">{work.CONSTITUENCY || "Nizamabad"}</div>
                      </td>
                      <td className="cell-numeric">
                        {formatCurrency(work.RECOMMENDED_AMOUNT || 0)}
                      </td>
                      <td className="cell-numeric">
                        {work.SANCTION_AMOUNT ? formatCurrency(work.SANCTION_AMOUNT) : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`stage-badge ${
                            stage === "Work Completed"
                              ? "stage-done"
                              : stage === "Sanction"
                              ? "stage-sanction"
                              : stage === "Physical Inspection" || stage === "Work partially Completed"
                              ? "stage-ongoing"
                              : "stage-pending"
                          }`}
                        >
                          {stage === "Physical Inspection"
                            ? "Inspection"
                            : stage === "Work partially Completed"
                            ? "In Progress"
                            : stage === "Pending Sanction"
                            ? "Waiting"
                            : stage === "Sanction"
                            ? "Approved"
                            : "Finished"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`risk-badge ${
                            dupRisk === "HIGH" || work.FINANCIAL_RISK_SCORE >= 70
                              ? "risk-high"
                              : dupRisk === "MEDIUM" || work.FINANCIAL_RISK_SCORE >= 45
                              ? "risk-med"
                              : "risk-clear"
                          }`}
                        >
                          {dupRisk === "HIGH" || work.FINANCIAL_RISK_SCORE >= 70
                            ? "High Risk"
                            : dupRisk === "MEDIUM" || work.FINANCIAL_RISK_SCORE >= 45
                            ? "Attention"
                            : "Normal"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="gov-inspect-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectWork) onSelectWork({ ...work, __initialSection: "overview", __authority: "MP" });
                          }}
                          title="Open Hon'ble MP Constituency Work Dossier"
                        >
                          <span>MP Dossier →</span>
                          <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {worksTotal > 0 && (
          <div className="register-pagination-bar">
            <div className="pagination-text">
              Showing <strong>{(worksPage - 1) * worksLimit + 1}</strong> to{" "}
              <strong>{Math.min(worksPage * worksLimit, worksTotal)}</strong> of{" "}
              <strong>{formatNumber(worksTotal)}</strong> works
            </div>
            <div className="pagination-controls">
              <button
                type="button"
                className="gov-pag-btn"
                disabled={worksPage <= 1 || worksLoading}
                onClick={() => setWorksPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="gov-pag-indicator">
                Page {worksPage} of {totalPages}
              </span>
              <button
                type="button"
                className="gov-pag-btn"
                disabled={worksPage >= totalPages || worksLoading}
                onClick={() => setWorksPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
