/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  LayoutDashboard,
  ShieldAlert,
  GitBranch,
  ClipboardCheck,
  Map,
  Database,
  Search,
  Activity,
  ChevronRight,
  CircleDot,
  AlertTriangle,
  Clock3,
  IndianRupee,
  TrendingUp,
  Eye,
  X,
  RefreshCw,
  FileSearch,
  Network,
  BarChart3,
  Layers3,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import "./App.css";


/* =========================================================
   API
========================================================= */

const API_BASE = "http://127.0.0.1:8000";


/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "—";
  }

  return number.toLocaleString("en-IN");
}


function formatDecimal(value, digits = 1) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "—";
  }

  return number.toFixed(digits);
}


function formatCurrency(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "—";
  }

  return number.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}


/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar() {
  const location = useLocation();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/summary`)
      .then((response) => response.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  const monitoringItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Risk Cases", path: "/risk-cases", icon: ShieldAlert },
    { label: "Duplicate Intelligence", path: "/duplicates", icon: GitBranch },
    { label: "Review Queue", path: "/review", icon: ClipboardCheck },
  ];

  const analyticsItems = [
    { label: "State Intelligence", path: "/states", icon: Map },
    { label: "Work Explorer", path: "/works", icon: Database },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div>
          <div className="brand-name">MPLADS</div>
          <div className="brand-subtitle">INTELLIGENCE</div>
        </div>
      </div>

      <div className="sidebar-intro">
        <div className="sidebar-intro-label">MONITORING SNAPSHOT</div>
        <div className="sidebar-stat">
          <span>Works monitored</span>
          <strong>{formatNumber(summary?.total_works || 0)}</strong>
        </div>
        <div className="sidebar-stat">
          <span>States / UTs</span>
          <strong>{formatNumber(summary?.states_covered || 0)}</strong>
        </div>
        <div className="sidebar-stat">
          <span>MPs tracked</span>
          <strong>{formatNumber(summary?.mps_tracked || 0)}</strong>
        </div>
        <div className="sidebar-stat">
          <span>Review flagged</span>
          <strong className="sidebar-stat-alert">
            {formatNumber(summary?.review_required || 0)}
          </strong>
        </div>
        <div className="sidebar-updated">
          Data through {summary?.last_data_update || "—"}
        </div>
      </div>

      <nav className="navigation">
        <div className="nav-section">
          <div className="nav-section-title">MONITORING</div>
          {monitoringItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
                {location.pathname === item.path && <div className="active-indicator" />}
              </NavLink>
            );
          })}
        </div>

        <div className="nav-section analytics-section">
          <div className="nav-section-title">ANALYTICS</div>
          {analyticsItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-bottom">
        <div className="system-status">
          <div className="status-row">
            <span className="status-dot" />
            <span>Monitoring Active</span>
          </div>
          <div className="status-description">
            Dataset synchronized · {formatNumber(summary?.works_in_clusters || 0)} works linked
          </div>
        </div>
        <div className="version">MPLADS Intelligence v1.0</div>
      </div>
    </aside>
  );
}

/* =========================================================
   TOP BAR
========================================================= */

function TopBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (value) {
      navigate(`/works?q=${encodeURIComponent(value)}`);
    }
  };

  return (
    <header className="topbar">
      <div className="breadcrumb">
        Monitoring <span>/</span> MPLADS Intelligence
      </div>

      <div className="topbar-actions">
        <form className="global-search" onSubmit={submitSearch}>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search works, states, MPs..."
            aria-label="Global search"
          />
        </form>

        <div className="engine-status">
          <CircleDot size={13} />
          <span>ENGINE ONLINE</span>
        </div>

        <div className="date-badge">26 AUG 2026</div>
      </div>
    </header>
  );
}

/* =========================================================
   LAYOUT
========================================================= */

function Layout({ children }) {
  return (
    <div className="app">

      <Sidebar />

      <main className="main">

        <TopBar />

        <div className="content">
          {children}
        </div>

      </main>

    </div>
  );
}


/* =========================================================
   PAGE HEADER
========================================================= */

function PageHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="page-header">

      <div>

        <div className="eyebrow">
          {eyebrow}
        </div>

        <h1>
          {title}
        </h1>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  danger,
  warning,
}) {
  return (
    <div
      className={`metric-card ${
        danger ? "danger" : ""
      } ${warning ? "warning" : ""}`}
    >

      <div className="metric-top">

        <span>
          {label}
        </span>

        <div className="metric-icon">
          <Icon size={18} />
        </div>

      </div>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </div>
  );
}


/* =========================================================
   ANALYTICS CARD
========================================================= */

function AnalyticsCard({
  title,
  subtitle,
  rows,
}) {
  return (
    <section className="analytics-card">

      <div className="card-header">

        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        <Activity size={18} />

      </div>

      <div className="analytics-rows">

        {rows.map((row) => (

          <div
            className="analytics-row"
            key={row[0]}
          >

            <div className="row-label">

              <span>
                {row[0]}
              </span>

              <strong>
                {row[1]}
              </strong>

            </div>

            <div className="progress-track">

              <div
                className="progress-value"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, Number(row[2]) || 0)
                  )}%`,
                }}
              />

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stageData, setStageData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/summary`
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      setSummary(data);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load dashboard intelligence."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    const loadStates = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/analytics/states`
        );
  
        if (!response.ok) {
          throw new Error(
            `State API returned ${response.status}`
          );
        }
  
        const result = await response.json();
  
        setStateData(
          Array.isArray(result)
            ? result
            : result.data || []
        );
  
      } catch (err) {
        console.error(
          "State analytics error:",
          err
        );
      }
    };
  
    loadStates();
  }, []);

  useEffect(() => {
    const loadStages = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/analytics/stages`
        );
  
        if (!response.ok) {
          throw new Error(
            `Stage API returned ${response.status}`
          );
        }
  
        const result = await response.json();
  
        setStageData(
          Array.isArray(result)
            ? result
            : result.data || []
        );
  
      } catch (err) {
        console.error(
          "Stage analytics error:",
          err
        );
      }
    };
  
    loadStages();
  }, []);

  // ========================================================
  // REAL DATA FROM BACKEND
  // ========================================================

  const totalWorks =
    Number(summary?.total_works || 0);

  const highRisk =
    Number(summary?.high_risk || 0);

  const mediumRisk =
    Number(summary?.medium_risk || 0);

  const duplicateRisk =
    Number(summary?.high_duplicate_risk || 0);

  const reviewRequired =
    Number(summary?.review_required || 0);


  const riskDistribution =
    summary?.risk_distribution || {};

  const duplicateDistribution =
    summary?.duplicate_distribution || {};


  const lowRisk =
    Number(
      riskDistribution.LOW || 0
    );


  const highDuplicate =
    Number(
      duplicateDistribution.HIGH || 0
    );


  const mediumDuplicate =
    Number(
      duplicateDistribution.MEDIUM || 0
    );


  const lowDuplicate =
    Number(
      duplicateDistribution.LOW || 0
    );


  const notInCluster =
    Number(
      duplicateDistribution["NOT IN CLUSTER"] || 0
    );


  // ========================================================
  // CHART DATA
  // ========================================================

  const riskChartData = [
    {
      name: "Low",
      value: lowRisk,
    },
    {
      name: "Medium",
      value: mediumRisk,
    },
    {
      name: "High",
      value: highRisk,
    },
  ];


  const duplicateChartData = [
    {
      name: "Not in cluster",
      value: notInCluster,
    },
    {
      name: "Low",
      value: lowDuplicate,
    },
    {
      name: "Medium",
      value: mediumDuplicate,
    },
    {
      name: "High",
      value: highDuplicate,
    },
  ];


  const overviewChartData = [
    {
      name: "Total works",
      value: totalWorks,
    },
    {
      name: "Review",
      value: reviewRequired,
    },
    {
      name: "Duplicate",
      value: duplicateRisk,
    },
    {
      name: "Medium risk",
      value: mediumRisk,
    },
    {
      name: "High risk",
      value: highRisk,
    },
  ];

  const topStates = [...stateData]
  .sort(
    (a, b) =>
      Number(b.TOTAL_WORKS || 0) -
      Number(a.TOTAL_WORKS || 0)
  )
  .slice(0, 10)
  .map((item) => ({
    name: item.STATE_NAME || "Unknown",
    total: Number(item.TOTAL_WORKS || 0),
    high: Number(item.HIGH_RISK || 0),
    medium: Number(item.MEDIUM_RISK || 0),
    review: Number(item.REVIEW_REQUIRED || 0),
  }));

  const stageChartData = stageData.map(
    (item) => ({
      name: item.WORK_STAGE || "Unknown",
      value: Number(item.TOTAL_WORKS || 0),
    })
  );

  return (
    <>
      <PageHeader
        eyebrow="MONITORING / OVERVIEW"
        title="Dashboard"
        description="Operational intelligence across monitored MPLADS works."
      />


      {/* =================================================
          ENGINE STATUS
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          padding: "12px 16px",
          border:
            "1px solid rgba(80,170,220,.15)",
          borderRadius: 10,
          background:
            "rgba(7,24,35,.65)",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: 13,
            color: "#8da4b5",
          }}
        >

          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                error
                  ? "#ff5d67"
                  : "#39d99b",
              boxShadow:
                error
                  ? "0 0 12px rgba(255,93,103,.5)"
                  : "0 0 12px rgba(57,217,155,.5)",
            }}
          />

          {error
            ? "MONITORING ENGINE OFFLINE"
            : "MONITORING ENGINE ONLINE"}

        </div>


        <button
          onClick={loadSummary}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            border:
              "1px solid rgba(91,184,234,.2)",
            background:
              "rgba(22,58,78,.5)",
            color: "#7dd7ff",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >

          <RefreshCw size={14} />

          Refresh data

        </button>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          style={{
            padding: 18,
            borderRadius: 10,
            border:
              "1px solid rgba(255,93,103,.25)",
            background:
              "rgba(255,93,103,.06)",
            color: "#ff8990",
            marginBottom: 18,
          }}
        >

          <strong>
            Dashboard connection failed
          </strong>

          <div
            style={{
              marginTop: 5,
              fontSize: 13,
              opacity: 0.8,
            }}
          >
            Make sure the FastAPI server is running
            on port 8000.
          </div>

        </div>
      )}


      {/* =================================================
          HERO
      ================================================= */}

      <div className="hero">

        <div className="hero-content">

          <div className="live-label">
            <span />
            LIVE MONITORING
          </div>

          <h2>
            Monitor public works.
            <br />
            Detect anomalies early.
          </h2>

          <p>
            A unified intelligence layer for
            financial, execution and
            duplicate-work monitoring
            across MPLADS projects.
          </p>

        </div>


        <div className="hero-metric">

          <Activity size={20} />

          <strong>
            {loading
              ? "—"
              : formatNumber(totalWorks)}
          </strong>

          <span>
            works monitored
          </span>

        </div>

      </div>


      {/* =================================================
          KEY METRICS
      ================================================= */}

      <div className="metric-grid">

        <MetricCard
          label="TOTAL WORKS"
          value={
            loading
              ? "—"
              : formatNumber(totalWorks)
          }
          description="Records in dataset"
          icon={Database}
        />


        <MetricCard
          label="HIGH RISK"
          value={
            loading
              ? "—"
              : formatNumber(highRisk)
          }
          description="Priority investigation"
          icon={ShieldAlert}
          danger
        />


        <MetricCard
          label="DUPLICATE RISK"
          value={
            loading
              ? "—"
              : formatNumber(duplicateRisk)
          }
          description="High-risk duplicate records"
          icon={GitBranch}
        />


        <MetricCard
          label="REVIEW REQUIRED"
          value={
            loading
              ? "—"
              : formatNumber(reviewRequired)
          }
          description="Records requiring review"
          icon={ClipboardCheck}
          warning
        />

      </div>


      {/* =================================================
          VISUAL ANALYTICS
      ================================================= */}

      <div
        className="dashboard-charts"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >


        {/* RISK DISTRIBUTION */}

        <section
          className="chart-card"
          style={{
            minWidth: 0,
            border:
              "1px solid rgba(87,155,190,.12)",
            borderRadius: 12,
            background:
              "rgba(7,24,35,.72)",
            padding: 18,
          }}
        >

          <div className="card-header">

            <div>

              <h3>
                Risk distribution
              </h3>

              <p>
                Classification across all monitored works
              </p>

            </div>

            <ShieldAlert size={18} />

          </div>


          <div
            style={{
              width: "100%",
              height: 280,
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

<PieChart>

  <Pie
    data={riskChartData}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="46%"
    innerRadius={70}
    outerRadius={100}
    paddingAngle={2}

    labelLine={({
      cx,
      cy,
      midAngle,
      outerRadius,
      percent,
    }) => {
      const RADIAN = Math.PI / 180;
    
      const x1 =
        cx +
        outerRadius *
          Math.cos(-midAngle * RADIAN);
    
      const y1 =
        cy +
        outerRadius *
          Math.sin(-midAngle * RADIAN);
    
      const x2 =
        cx +
        (outerRadius + 18) *
          Math.cos(-midAngle * RADIAN);
    
      let y2 =
        cy +
        (outerRadius + 18) *
          Math.sin(-midAngle * RADIAN);
    
      const x3 =
        x2 +
        (x2 >= cx ? 35 : -35);
    
      // Separate tiny slices vertically
      if (percent > 0 && percent < 0.1) {
        y2 -= 12;
      }
    
      return (
        <path
          d={`
            M ${x1} ${y1}
            L ${x2} ${y2}
            L ${x3} ${y2}
          `}
          stroke="#718998"
          fill="none"
          strokeWidth={1.2}
        />
      );
    }}

    label={({
      cx,
      cy,
      midAngle,
      outerRadius,
      percent,
      name,
    }) => {
      const RADIAN = Math.PI / 180;
    
      const x =
        cx +
        (outerRadius + 43) *
          Math.cos(-midAngle * RADIAN);
    
      let y =
        cy +
        (outerRadius + 43) *
          Math.sin(-midAngle * RADIAN);
    
      const percentage =
        Math.floor(percent * 10000) / 100;
    
      // Manually separate the two tiny categories
      if (name === "Medium") {
        y -= 18;
      }
    
      if (name === "High") {
        y += 18;
      }
    
      return (
        <text
          x={x}
          y={y}
          fill={
            name === "Low"
              ? "#39d99b"
              : name === "Medium"
              ? "#ffb84d"
              : "#ff6672"
          }
          textAnchor={
            x >= cx
              ? "start"
              : "end"
          }
          dominantBaseline="central"
          fontSize={12}
          fontWeight={600}
        >
          {name} {percentage.toFixed(2)}%
        </text>
      );
    }}
  >

    <Cell fill="#39d99b" />
    <Cell fill="#ffb84d" />
    <Cell fill="#ff6672" />

  </Pie>


  {/* CENTER TOTAL */}

  <text
    x="50%"
    y="43%"
    textAnchor="middle"
    dominantBaseline="middle"
    fill="#edf6fb"
    fontSize="24"
    fontWeight="700"
  >
    {formatNumber(totalWorks)}
  </text>

  <text
    x="50%"
    y="53%"
    textAnchor="middle"
    dominantBaseline="middle"
    fill="#718998"
    fontSize="11"
  >
    TOTAL WORKS
  </text>


  {/* TOOLTIP */}

  <Tooltip
    formatter={(value, name) => {

      const numericValue =
        Number(value || 0);

      const percentage =
        totalWorks > 0
          ? (numericValue / totalWorks) * 100
          : 0;

      const truncated =
        Math.floor(
          percentage * 100
        ) / 100;

      return [
        `${formatNumber(
          numericValue
        )} works (${truncated.toFixed(2)}%)`,
        name,
      ];
    }}

    contentStyle={{
      background: "#07131c",
      border:
        "1px solid rgba(91,180,220,.2)",
      borderRadius: 8,
      color: "#dce8ef",
    }}
  />


  {/* LEGEND — COUNTS ONLY */}

  <Legend
    formatter={(value) => {

      const item =
        riskChartData.find(
          (entry) =>
            entry.name === value
        );

      return `${value} — ${formatNumber(
        item?.value || 0
      )}`;
    }}
  />

</PieChart>

            </ResponsiveContainer>

          </div>

        </section>


        {/* DUPLICATE DISTRIBUTION */}

        <section
          className="chart-card"
          style={{
            minWidth: 0,
            border:
              "1px solid rgba(87,155,190,.12)",
            borderRadius: 12,
            background:
              "rgba(7,24,35,.72)",
            padding: 18,
          }}
        >

          <div className="card-header">

            <div>

              <h3>
                Duplicate monitoring
              </h3>

              <p>
                Duplicate-risk distribution across works
              </p>

            </div>

            <GitBranch size={18} />

          </div>


          <div
            style={{
              width: "100%",
              height: 280,
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={duplicateChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(120,160,180,.12)"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: "#8199a8",
                  }}
                  axisLine={{
                    stroke:
                      "rgba(120,160,180,.15)",
                  }}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "#8199a8",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    formatNumber(value)
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    formatNumber(value)
                  }
                  contentStyle={{
                    background:
                      "#07131c",
                    border:
                      "1px solid rgba(91,180,220,.2)",
                    borderRadius: 8,
                    color: "#dce8ef",
                  }}
                />

                <Bar
                  dataKey="value"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                  fill="#5ec7f2"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>

      </div>

        {/* =================================================
          STATE RISK ANALYSIS
      ================================================= */}

<section
        className="analytics-card"
        style={{
          marginTop: 20,
        }}
      >

        <div className="card-header">

          <div>

            <h3>
              State risk analysis
            </h3>

            <p>
              Top 10 states by monitored works and risk signals
            </p>

          </div>

          <Map size={18} />

        </div>


        <div
          style={{
            width: "100%",
            height: 380,
            marginTop: 10,
          }}
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={topStates}
              layout="vertical"
              margin={{
                top: 10,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="rgba(120,160,180,.12)"
              />

              <XAxis
                type="number"
                tick={{
                  fontSize: 11,
                  fill: "#8199a8",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  formatNumber(value)
                }
              />

              <YAxis
                type="category"
                dataKey="name"
                width={135}
                tick={{
                  fontSize: 11,
                  fill: "#8199a8",
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: "#07131c",
                  border:
                    "1px solid rgba(91,180,220,.2)",
                  borderRadius: 8,
                  color: "#dce8ef",
                }}
                formatter={(value, name) => [
                  formatNumber(value),
                  name,
                ]}
              />

              <Legend />

              <Bar
                dataKey="total"
                name="Total works"
                fill="#5ec7f2"
                radius={[0, 5, 5, 0]}
              />

              <Bar
                dataKey="medium"
                name="Medium risk"
                fill="#ffb84d"
                radius={[0, 5, 5, 0]}
              />

              <Bar
                dataKey="high"
                name="High risk"
                fill="#ff6672"
                radius={[0, 5, 5, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </section>


      {/* =================================================
          MONITORING SNAPSHOT
      ================================================= */}

      <section
        className="analytics-card"
        style={{
          marginTop: 20,
        }}
      >

        <div className="card-header">

          <div>

            <h3>
              Monitoring snapshot
            </h3>

            <p>
              Key signals requiring attention
            </p>

          </div>

          <Activity size={18} />

        </div>


        <div
          style={{
            width: "100%",
            height: 210,
            marginTop: 8,
          }}
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={overviewChartData}
              layout="vertical"
              margin={{
                top: 10,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="rgba(120,160,180,.12)"
              />

              <XAxis
                type="number"
                tick={{
                  fontSize: 11,
                  fill: "#8199a8",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  formatNumber(value)
                }
              />

              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fontSize: 11,
                  fill: "#8199a8",
                }}
                axisLine={false}
                tickLine={false}
                width={100}
              />

              <Tooltip
                formatter={(value) =>
                  formatNumber(value)
                }
                contentStyle={{
                  background:
                    "#07131c",
                  border:
                    "1px solid rgba(91,180,220,.2)",
                  borderRadius: 8,
                  color: "#dce8ef",
                }}
              />

              <Bar
                dataKey="value"
                radius={[
                  0,
                  5,
                  5,
                  0,
                ]}
                fill="#5ec7f2"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </section>

{/* =================================================
    WORK STAGE DISTRIBUTION
================================================= */}

<section
  className="analytics-card"
  style={{
    marginTop: 20,
  }}
>

  <div className="card-header">

    <div>

      <h3>
        Work stage distribution
      </h3>

      <p>
        Current distribution across MPLADS work stages
      </p>

    </div>

    <Layers3 size={18} />

  </div>


  <div
    style={{
      width: "100%",
      height: 320,
      marginTop: 8,
    }}
  >

    <ResponsiveContainer
      width="100%"
      height="100%"
    >

      <BarChart
        data={stageChartData}
        layout="vertical"
        margin={{
          top: 10,
          right: 30,
          left: 20,
          bottom: 10,
        }}
      >

        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="rgba(120,160,180,.12)"
        />

        <XAxis
          type="number"
          tick={{
            fontSize: 11,
            fill: "#8199a8",
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) =>
            formatNumber(value)
          }
        />

        <YAxis
          type="category"
          dataKey="name"
          width={170}
          tick={{
            fontSize: 10,
            fill: "#8199a8",
          }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          formatter={(value) => [
            `${formatNumber(value)} works`,
            "Works",
          ]}
          contentStyle={{
            background: "#07131c",
            border:
              "1px solid rgba(91,180,220,.2)",
            borderRadius: 8,
            color: "#dce8ef",
          }}
        />

        <Bar
          dataKey="value"
          radius={[
            0,
            5,
            5,
            0,
          ]}
          fill="#5ec7f2"
        />

      </BarChart>

    </ResponsiveContainer>

  </div>

</section>

      {/* =================================================
          DATASET INTELLIGENCE
      ================================================= */}

      <section
        className="analytics-card"
        style={{
          marginTop: 20,
        }}
      >

        <div className="card-header">

          <div>

            <h3>
              Dataset intelligence
            </h3>

            <p>
              Live statistics returned directly
              from the MPLADS monitoring backend.
            </p>

          </div>

          <Database size={18} />

        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginTop: 15,
          }}
        >

          <div className="signal-card">

            <strong>
              {loading
                ? "—"
                : formatNumber(totalWorks)}
            </strong>

            <span>
              Total records
            </span>

          </div>


          <div className="signal-card">

            <strong>
              {loading
                ? "—"
                : formatNumber(duplicateRisk)}
            </strong>

            <span>
              High duplicate signals
            </span>

          </div>


          <div className="signal-card">

            <strong>
              {loading
                ? "—"
                : formatNumber(reviewRequired)}
            </strong>

            <span>
              Records requiring review
            </span>

          </div>

        </div>

      </section>


    </>
  );
}

/* =========================================================
   RISK INTELLIGENCE
========================================================= */

function RiskIntelligence() {

  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [riskFactors, setRiskFactors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
const [level, setLevel] = useState("ALL");
const [selectedCase, setSelectedCase] = useState(null);

const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalCases, setTotalCases] = useState(0);
const PAGE_SIZE = 100;

const loadCases = async (requestedPage = page) => {
  try {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: requestedPage,
      limit: PAGE_SIZE,
    });

    if (level !== "ALL") {
      params.append("level", level);
    }

    const response = await fetch(
      `${API_BASE}/api/risk-cases?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        `Backend returned ${response.status}`
      );
    }

    const result = await response.json();

    const data = Array.isArray(result)
      ? result
      : result.data || [];

    setCases(data);

    setTotalCases(
      Number(result.total || data.length)
    );

    setTotalPages(
      Math.max(
        1,
        Number(result.pages || 1)
      )
    );

    setPage(requestedPage);

  } catch (err) {
    console.error(err);

    setError(
      "Unable to connect to the MPLADS risk engine."
    );

  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadCases(1);
  }, [level]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/summary`
        );
  
        if (!response.ok) {
          throw new Error(
            `Backend returned ${response.status}`
          );
        }
  
        const data = await response.json();
  
        setSummary(data);
      } catch (err) {
        console.error(
          "Risk summary error:",
          err
        );
      }
    };
  
    loadSummary();
  }, []);

  useEffect(() => {
    const loadRiskFactors = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/analytics/risk-factors`
        );
  
        if (!response.ok) {
          throw new Error(
            `Risk factor API returned ${response.status}`
          );
        }
  
        const result = await response.json();
  
        setRiskFactors(result);
  
      } catch (err) {
        console.error(
          "Risk factor analytics error:",
          err
        );
      }
    };
  
    loadRiskFactors();
  }, []);

  const filteredCases = useMemo(() => {

    const query = search
      .trim()
      .toLowerCase();

    return cases.filter((item) => {

      const matchesLevel =
        level === "ALL" ||
        String(item.RISK_LEVEL || "")
          .toUpperCase() === level;

      const searchable = [
        item.WORK_ID,
        item.WORK_RECOMMENDATION_DTL_ID,
        item.STATE_NAME,
        item.CONSTITUENCY,
        item.MP_NAME,
        item.WORK_DESCRIPTION,
        item.RISK_REASON,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesLevel &&
        (!query || searchable.includes(query))
      );

    });

  }, [cases, search, level]);

  const counts = useMemo(() => {

    const total =
      Number(summary?.risk_cases || 0);
  
    const high =
      Number(summary?.high_risk || 0);
  
    const medium =
      Number(summary?.medium_risk || 0);
  
    const low =
      Math.max(0, total - high - medium);
  
    return {
      total,
      high,
      medium,
      low,
    };
  
  }, [summary]);
  
  const averageRisk = Number(
    summary?.average_risk_score || 0
  );

  const riskFactorChartData = [
    {
      name: "Delay",
      value: Number(
        riskFactors?.delay_risk || 0
      ),
    },
    {
      name: "Completion duration risk",
      value: Number(
        riskFactors?.completion_risk || 0
      ),
    },
    {
      name: "Cost",
      value: Number(
        riskFactors?.cost_risk || 0
      ),
    },
    {
      name: "Variance",
      value: Number(
        riskFactors?.variance_risk || 0
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="MONITORING / RISK"
        title="Risk Intelligence"
        description="Investigate financial, execution and completion anomalies detected across MPLADS works."
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          padding: "12px 16px",
          border: "1px solid rgba(80, 170, 220, 0.15)",
          borderRadius: 10,
          background: "rgba(7, 24, 35, 0.65)",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: 13,
            color: "#8da4b5",
          }}
        >

          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: error
                ? "#ff5d67"
                : "#39d99b",
            }}
          />

          {error
            ? "RISK ENGINE OFFLINE"
            : "RISK ENGINE ONLINE"}

        </div>

        <button
          onClick={loadCases}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            border: "1px solid rgba(91,184,234,.2)",
            background: "rgba(22,58,78,.5)",
            color: "#7dd7ff",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Refresh analysis
        </button>

      </div>


      <div className="metric-grid">

        <MetricCard
          label="RISK CASES"
          value={
            loading
              ? "—"
              : formatNumber(counts.total)
          }
          description="Returned by risk engine"
          icon={ShieldAlert}
        />

        <MetricCard
          label="HIGH RISK"
          value={
            loading
              ? "—"
              : formatNumber(counts.high)
          }
          description="Priority investigation"
          icon={AlertTriangle}
          danger
        />

        <MetricCard
          label="MEDIUM RISK"
          value={
            loading
              ? "—"
              : formatNumber(counts.medium)
          }
          description="Requires assessment"
          icon={Activity}
          warning
        />

        <MetricCard
          label="AVG RISK SCORE"
          value={
            loading
              ? "—"
              : averageRisk.toFixed(1)
          }
          description="Across all monitored works"
          icon={TrendingUp}
        />

      </div>


      {/* =================================================
    RISK ANALYTICS
================================================= */}

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: 16,
    marginTop: 20,
    alignItems: "start",
  }}
>

  {/* =================================================
      RISK CLASSIFICATION
  ================================================= */}

  <section className="analytics-card">

    <div className="card-header">

      <div>

        <h3>
          Risk classification
        </h3>

        <p>
          Distribution across actual risk cases
        </p>

      </div>

      <ShieldAlert size={18} />

    </div>


    <div
  className="analytics-rows"
  style={{
    marginTop: 4,
  }}
>

      <div className="analytics-row">

        <div className="row-label">

          <span>
            High
          </span>

          <strong>
            {formatNumber(counts.high)}
          </strong>

        </div>

        <div className="progress-track">

          <div
            className="progress-value"
            style={{
              width: `${
                counts.total
                  ? (counts.high / counts.total) * 100
                  : 0
              }%`,
            }}
          />

        </div>

      </div>


      <div className="analytics-row">

        <div className="row-label">

          <span>
            Medium
          </span>

          <strong>
            {formatNumber(counts.medium)}
          </strong>

        </div>

        <div className="progress-track">

          <div
            className="progress-value"
            style={{
              width: `${
                counts.total
                  ? (counts.medium / counts.total) * 100
                  : 0
              }%`,
            }}
          />

        </div>

      </div>


      <div className="analytics-row">

        <div className="row-label">

          <span>
            Low
          </span>

          <strong>
            {formatNumber(counts.low)}
          </strong>

        </div>

        <div className="progress-track">

          <div
            className="progress-value"
            style={{
              width: `${
                counts.total
                  ? (counts.low / counts.total) * 100
                  : 0
              }%`,
            }}
          />

        </div>

      </div>

    </div>

  </section>


  {/* =================================================
      RISK FACTOR BREAKDOWN
  ================================================= */}

  <section className="analytics-card">

    <div className="card-header">

      <div>

        <h3>
          Risk factor breakdown
        </h3>

        <p>
          Average signal strength across actual risk cases
        </p>

      </div>

      <TrendingUp size={18} />

    </div>


    <div
      style={{
        width: "100%",
        height: 124,
        marginTop: 10,
      }}
    >

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <BarChart
          data={riskFactorChartData}
          layout="vertical"
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="rgba(120,160,180,.12)"
          />

          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{
              fontSize: 11,
              fill: "#8199a8",
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{
              fontSize: 10,
              fill: "#8199a8",
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            formatter={(value) => [
              Number(value).toFixed(1),
              "Risk signal",
            ]}
            contentStyle={{
              background: "#07131c",
              border:
                "1px solid rgba(91,180,220,.2)",
              borderRadius: 8,
              color: "#dce8ef",
            }}
          />

          <Bar
            dataKey="value"
            name="Risk signal"
            fill="#5ec7f2"
            radius={[
              0,
              5,
              5,
              0,
            ]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  </section>

</div>


{/* =================================================
    RISK SIGNALS
================================================= */}

<section
  className="analytics-card"
  style={{
    marginTop: 16,
  }}
>

  <div className="card-header">

    <div>

      <h3>
        Risk signals
      </h3>

      <p>
        Main dimensions used by the monitoring engine
      </p>

    </div>

    <ShieldAlert size={18} />

  </div>


  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(4, minmax(0, 1fr))",
      gap: 12,
      marginTop: 10,
    }}
  >

    <RiskSignal
      icon={Clock3}
      title="Execution"
      description="Completion and sanction delays"
    />

    <RiskSignal
      icon={IndianRupee}
      title="Financial"
      description="Cost and peer variance"
    />

    <RiskSignal
      icon={TrendingUp}
      title="Peer deviation"
      description="Comparison with similar works"
    />

    <RiskSignal
      icon={GitBranch}
      title="Duplicate"
      description="Related-work relationships"
    />

  </div>

</section>


      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >

        <div
          className="cluster-search"
          style={{
            flex: 1,
            minWidth: 280,
          }}
        >

          <Search size={18} />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search work, state, constituency, MP or reason..."
          />

        </div>

        <select
          value={level}
          onChange={(e) =>
            setLevel(e.target.value)
          }
          style={{
            minWidth: 150,
            padding: "0 14px",
            borderRadius: 8,
            border: "1px solid rgba(80,150,190,.2)",
            background: "#091923",
            color: "#c9d8e3",
            outline: "none",
          }}
        >

          <option value="ALL">
            All risk levels
          </option>

          <option value="HIGH">
            High risk
          </option>

          <option value="MEDIUM">
            Medium risk
          </option>

          <option value="LOW">
            Low risk
          </option>

        </select>

      </div>


      {error && (

        <div
          style={{
            padding: 18,
            borderRadius: 10,
            border: "1px solid rgba(255,93,103,.25)",
            background: "rgba(255,93,103,.06)",
            color: "#ff8990",
            marginBottom: 18,
          }}
        >

          <strong>
            Backend connection failed
          </strong>

          <div
            style={{
              marginTop: 5,
              fontSize: 13,
              opacity: .8,
            }}
          >
            Make sure your FastAPI server is running
            on port 8000.
          </div>

        </div>

      )}


      <section className="table-card">

        <div className="table-heading">

          <div>

            <div className="eyebrow">
              INVESTIGATION QUEUE
            </div>

            <h2>
              Detected risk cases
            </h2>

          </div>

          <span>
            {totalCases.toLocaleString("en-IN")} cases
          </span>

        </div>


        {loading ? (

          <div
            style={{
              padding: 50,
              textAlign: "center",
              color: "#71899a",
            }}
          >
            Loading risk intelligence...
          </div>

        ) : filteredCases.length === 0 ? (

          <div
            style={{
              padding: 50,
              textAlign: "center",
              color: "#71899a",
            }}
          >
            No risk cases match the current filters.
          </div>

        ) : (

          <div className="table">

            <div className="table-row table-header">

              <span>WORK</span>
              <span>LOCATION</span>
              <span>RISK</span>
              <span>EXECUTION</span>
              <span>FINANCIAL</span>
              <span>REASON</span>
              <span />

            </div>

            {filteredCases.map(
              (item, index) => (

                <RiskRow
                  key={
                    item.WORK_ID ||
                    item.WORK_RECOMMENDATION_DTL_ID ||
                    index
                  }
                  item={item}
                  onClick={() =>
                    setSelectedCase(item)
                  }
                />

              )
            )}

          </div>

        )}

      </section>


      {selectedCase && (

        <RiskDetail
          item={selectedCase}
          onClose={() =>
            setSelectedCase(null)
          }
        />

      )}

    </>
  );
}


/* =========================================================
   RISK SIGNAL
========================================================= */

function RiskSignal({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div
      style={{
        padding: 13,
        borderRadius: 9,
        border: "1px solid rgba(87,155,190,.12)",
        background: "rgba(8,28,40,.55)",
      }}
    >

      <Icon
        size={17}
        style={{
          color: "#5ec7f2",
          marginBottom: 8,
        }}
      />

      <div
        style={{
          color: "#dce8ef",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#708796",
          fontSize: 11,
          marginTop: 3,
          lineHeight: 1.4,
        }}
      >
        {description}
      </div>

    </div>
  );
}


/* =========================================================
   RISK ROW
========================================================= */

function RiskRow({
  item,
  onClick,
}) {

  const level =
    String(item.RISK_LEVEL || "LOW")
      .toUpperCase();

  const riskScore =
    Number(item.RISK_SCORE || 0);

  const execution =
    Math.max(
      Number(item.DELAY_RISK || 0),
      Number(item.COMPLETION_RISK || 0)
    );

  const financial =
    Math.max(
      Number(item.COST_RISK || 0),
      Number(item.VARIANCE_RISK || 0)
    );

  return (
    <div
      className="table-row"
      onClick={onClick}
      style={{
        cursor: "pointer",
      }}
    >

      <div className="cluster-name">

        <div className="cluster-icon">
          <ShieldAlert size={17} />
        </div>

        <div>

          <strong>
            Work #{item.WORK_ID || "—"}
          </strong>

          <small>
            Score {riskScore.toFixed(1)}
          </small>

        </div>

      </div>


      <div>

        <strong>
          {item.STATE_NAME || "—"}
        </strong>

        <small>
          {item.CONSTITUENCY || "—"}
        </small>

      </div>


      <div>

        <span
          className="risk-pill"
          style={{
            background:
              level === "HIGH"
                ? "rgba(255,76,88,.12)"
                : level === "MEDIUM"
                ? "rgba(255,177,66,.12)"
                : "rgba(73,180,255,.1)",

            color:
              level === "HIGH"
                ? "#ff707a"
                : level === "MEDIUM"
                ? "#ffb84d"
                : "#68c9ff",
          }}
        >
          {level}
        </span>

        <small>
          {riskScore.toFixed(1)} score
        </small>

      </div>


      <div>

        <strong>
          {execution.toFixed(0)}
        </strong>

        <small>
          execution signal
        </small>

      </div>


      <div>

        <strong>
          {financial.toFixed(0)}
        </strong>

        <small>
          financial signal
        </small>

      </div>


      <div
        style={{
          maxWidth: 270,
        }}
      >

        <strong
          style={{
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.RISK_REASON || "No reason provided"}
        </strong>

        <small>
          {item.WORK_STAGE || "—"}
        </small>

      </div>


      <ChevronRight
        size={19}
        className="row-arrow"
      />

    </div>
  );
}


/* =========================================================
   RISK DETAIL
========================================================= */

function RiskDetail({
  item,
  onClose,
}) {

  const level =
    String(item.RISK_LEVEL || "LOW")
      .toUpperCase();

  const score =
    Number(item.RISK_SCORE || 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(1,7,12,.68)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >

      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        style={{
          width: "min(620px, 92vw)",
          height: "100%",
          overflowY: "auto",
          background: "#07131c",
          borderLeft: "1px solid rgba(91,180,220,.16)",
          padding: 28,
          boxShadow: "-20px 0 70px rgba(0,0,0,.4)",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >

          <div>

            <div className="eyebrow">
              RISK INVESTIGATION
            </div>

            <h2
              style={{
                margin: "5px 0 0",
                color: "#edf6fb",
              }}
            >
              Work #{item.WORK_ID || "—"}
            </h2>

          </div>


          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid rgba(100,170,205,.18)",
              background: "rgba(255,255,255,.03)",
              color: "#91a8b7",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>

        </div>


        <div
          style={{
            marginTop: 25,
            padding: 20,
            borderRadius: 12,
            border: "1px solid rgba(90,180,220,.14)",
            background:
              "linear-gradient(135deg, rgba(13,40,55,.8), rgba(6,20,29,.8))",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >

            <div>

              <div
                style={{
                  color: "#7f98a8",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                }}
              >
                Risk score
              </div>

              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: "#edf7fb",
                  marginTop: 4,
                }}
              >
                {score.toFixed(1)}
              </div>

            </div>


            <span
              className="risk-pill"
              style={{
                fontSize: 12,
                padding: "7px 12px",
                color:
                  level === "HIGH"
                    ? "#ff707a"
                    : level === "MEDIUM"
                    ? "#ffb84d"
                    : "#68c9ff",
                background:
                  level === "HIGH"
                    ? "rgba(255,76,88,.12)"
                    : level === "MEDIUM"
                    ? "rgba(255,177,66,.12)"
                    : "rgba(73,180,255,.1)",
              }}
            >
              {level} RISK
            </span>

          </div>

        </div>


        <DetailSection title="Why this work was flagged">

          <div
            style={{
              padding: 15,
              borderRadius: 9,
              background: "rgba(255,177,66,.06)",
              border: "1px solid rgba(255,177,66,.12)",
              color: "#d9e5eb",
              lineHeight: 1.6,
            }}
          >
            {item.RISK_REASON ||
              "No risk reason available."}
          </div>

        </DetailSection>


        <DetailSection title="Work information">

          <DetailGrid
            items={[
              ["State", item.STATE_NAME],
              ["Constituency", item.CONSTITUENCY],
              ["MP", item.MP_NAME],
              ["Stage", item.WORK_STAGE],
              ["Category", item.WORK_CATEGORY],
              [
                "Sanction amount",
                formatCurrency(item.SANCTION_AMOUNT),
              ],
              [
                "Actual amount",
                formatCurrency(item.ACTUAL_AMOUNT),
              ],
            ]}
          />

        </DetailSection>


        <DetailSection title="Execution signals">

          <SignalBar
            label="Sanction delay"
            value={item.SANCTION_DELAY_DAYS}
            suffix=" days"
            max={Math.max(
              Number(item.PEER_MEDIAN_SANCTION_DELAY || 1),
              Number(item.SANCTION_DELAY_DAYS || 0)
            )}
          />

          <SignalBar
            label="Completion duration"
            value={item.COMPLETION_DURATION_DAYS}
            suffix=" days"
            max={Math.max(
              Number(item.PEER_MEDIAN_COMPLETION_DAYS || 1),
              Number(item.COMPLETION_DURATION_DAYS || 0)
            )}
          />

        </DetailSection>


        <DetailSection title="Financial signals">

          <DetailGrid
            items={[
              [
                "Cost variance",
                formatCurrency(item.COST_VARIANCE),
              ],
              [
                "Variance %",
                `${Number(
                  item.COST_VARIANCE_PERCENT || 0
                ).toFixed(2)}%`,
              ],
              [
                "Cost vs peer",
                `${Number(
                  item.COST_VS_PEER || 0
                ).toFixed(2)}×`,
              ],
              [
                "Peer median amount",
                formatCurrency(
                  item.PEER_MEDIAN_SANCTION_AMOUNT
                ),
              ],
            ]}
          />

        </DetailSection>


        <DetailSection title="Duplicate intelligence">

          <DetailGrid
            items={[
              [
                "Cluster",
                item.CLUSTER_ID || "—",
              ],
              [
                "Cluster size",
                item.CLUSTER_SIZE || "—",
              ],
              [
                "Pair count",
                item.PAIR_COUNT || "—",
              ],
              [
                "Duplicate risk",
                item.DUPLICATE_RISK || "—",
              ],
              [
                "Suspicion",
                item.SUSPICION_LEVEL || "—",
              ],
            ]}
          />

        </DetailSection>


        <DetailSection title="Review status">

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >

            <Eye
              size={18}
              style={{
                color: "#61c9f2",
                marginTop: 2,
              }}
            />

            <div>

              <strong
                style={{
                  color: "#e4eef3",
                }}
              >
                {item.REQUIRES_REVIEW
                  ? "Human review required"
                  : "No review required"}
              </strong>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#78909f",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {item.REVIEW_REASON ||
                  "No review reason provided."}
              </p>

            </div>

          </div>

        </DetailSection>

      </div>

    </div>
  );
}


/* =========================================================
   DETAIL HELPERS
========================================================= */

function DetailSection({
  title,
  children,
}) {
  return (
    <section
      style={{
        marginTop: 26,
      }}
    >

      <h3
        style={{
          fontSize: 13,
          color: "#8da6b6",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          marginBottom: 12,
        }}
      >
        {title}
      </h3>

      {children}

    </section>
  );
}


function DetailGrid({
  items,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 1,
        background: "rgba(90,160,190,.08)",
        borderRadius: 9,
        overflow: "hidden",
      }}
    >

      {items.map(
        ([label, value]) => (

          <div
            key={label}
            style={{
              padding: 13,
              background: "#091720",
            }}
          >

            <div
              style={{
                fontSize: 11,
                color: "#718998",
                marginBottom: 5,
              }}
            >
              {label}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#dbe7ed",
                fontWeight: 600,
              }}
            >
              {value ?? "—"}
            </div>

          </div>

        )
      )}

    </div>
  );
}


function SignalBar({
  label,
  value,
  suffix,
  max,
}) {

  const numeric =
    Number(value || 0);

  const percentage =
    max > 0
      ? Math.min(
          100,
          (numeric / max) * 100
        )
      : 0;

  return (
    <div
      style={{
        marginBottom: 15,
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 7,
        }}
      >

        <span
          style={{
            color: "#8199a8",
          }}
        >
          {label}
        </span>

        <strong
          style={{
            color: "#dce8ee",
          }}
        >
          {numeric}
          {suffix}
        </strong>

      </div>


      <div
        style={{
          height: 6,
          borderRadius: 20,
          background: "rgba(130,170,190,.1)",
          overflow: "hidden",
        }}
      >

        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            borderRadius: 20,
            background:
              "linear-gradient(90deg,#248fca,#66d5ff)",
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   DUPLICATE INTELLIGENCE
========================================================= */

function DuplicateIntelligence() {

  const [cases, setCases] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("ALL");

  const [selectedCluster, setSelectedCluster] =
    useState(null);

  const [clusterLoading, setClusterLoading] =
    useState(false);

// PAGINATION
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalCases, setTotalCases] = useState(0);

const PAGE_SIZE = 100;

const loadCases = async (requestedPage = 1) => {
  try {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: requestedPage,
      limit: PAGE_SIZE,
    });

    if (level !== "ALL") {
      params.append("level", level);
    }

    const [
      casesResponse,
      analyticsResponse,
    ] = await Promise.all([
      fetch(
        `${API_BASE}/api/duplicate-cases?${params.toString()}`
      ),

      fetch(
        `${API_BASE}/api/analytics/duplicates`
      ),
    ]);

    if (!casesResponse.ok) {
      throw new Error(
        `Duplicate API returned ${casesResponse.status}`
      );
    }

    if (!analyticsResponse.ok) {
      throw new Error(
        `Analytics API returned ${analyticsResponse.status}`
      );
    }

    const casesResult =
      await casesResponse.json();

    const analyticsResult =
      await analyticsResponse.json();

    const data =
      Array.isArray(casesResult)
        ? casesResult
        : casesResult.data || [];

    setCases(data);

    setAnalytics(
      analyticsResult
    );

    // PAGINATION DATA
    setTotalCases(
      Number(
        casesResult.total || data.length
      )
    );

    setTotalPages(
      Math.max(
        1,
        Number(
          casesResult.pages || 1
        )
      )
    );

    setPage(requestedPage);

  } catch (err) {

    console.error(
      "Duplicate intelligence error:",
      err
    );

    setError(
      "Unable to connect to the duplicate intelligence engine."
    );

  } finally {

    setLoading(false);

  }
};
  useEffect(() => {
    loadCases(1);
  }, [level]);

  const filteredCases = useMemo(() => {

    const query =
      search.trim().toLowerCase();

    return cases.filter((item) => {

      const duplicateRisk =
        String(
          item.DUPLICATE_RISK || ""
        ).toUpperCase();

      const matchesLevel =
        level === "ALL" ||
        duplicateRisk === level;

      const searchable = [
        item.CLUSTER_ID,
        item.WORK_ID,
        item.STATE_NAME,
        item.CONSTITUENCY,
        item.MP_NAME,
        item.WORK_CATEGORY,
        item.WORK_DESCRIPTION,
        item.EVIDENCE,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesLevel &&
        (!query ||
          searchable.includes(query))
      );

    });

  }, [
    cases,
    search,
    level,
  ]);


  const highRisk =
    Number(
      analytics?.duplicate_risk?.HIGH || 0
    );

const mediumRisk =
    Number(
      analytics?.duplicate_risk?.MEDIUM || 0
    );


  const clusterCount =
    analytics?.clusters || 0;


  const worksInClusters =
    analytics?.works_in_clusters || 0;


  const loadCluster = async (clusterId) => {

    if (
      clusterId === null ||
      clusterId === undefined ||
      clusterId === ""
    ) {
      return;
    }

    try {

      setClusterLoading(true);

      const response =
        await fetch(
          `${API_BASE}/api/clusters/${clusterId}`
        );

      if (!response.ok) {
        throw new Error(
          `Cluster API returned ${response.status}`
        );
      }

      const data =
        await response.json();

      setSelectedCluster(data);

    } catch (err) {

      console.error(
        "Cluster loading error:",
        err
      );

      alert(
        "Unable to load cluster investigation."
      );

    } finally {

      setClusterLoading(false);

    }
  };


  return (
    <>
      <PageHeader
        eyebrow="MONITORING / DUPLICATES"
        title="Duplicate Intelligence"
        description="Identify potentially duplicated MPLADS works using description, financial and contextual similarity signals."
      />


      {/* ENGINE STATUS */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          padding: "12px 16px",
          border:
            "1px solid rgba(80,170,220,.15)",
          borderRadius: 10,
          background:
            "rgba(7,24,35,.65)",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            color: "#8da4b5",
            fontSize: 13,
          }}
        >

          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: error
                ? "#ff5d67"
                : "#39d99b",
            }}
          />

          {error
            ? "DUPLICATE ENGINE OFFLINE"
            : "DUPLICATE ENGINE ONLINE"}

        </div>


        <button
          onClick={() => loadCases(page)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            border:
              "1px solid rgba(91,184,234,.2)",
            background:
              "rgba(22,58,78,.5)",
            color: "#7dd7ff",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >

          <RefreshCw size={14} />

          Refresh intelligence

        </button>

      </div>


      {/* METRICS */}

      <div className="metric-grid">

        <MetricCard
          label="DUPLICATE CLUSTERS"
          value={
            loading
              ? "—"
              : formatNumber(clusterCount)
          }
          description="Detected relationship groups"
          icon={GitBranch}
        />


        <MetricCard
          label="HIGH DUPLICATE RISK"
          value={
            loading
              ? "—"
              : formatNumber(highRisk)
          }
          description="Priority investigation"
          icon={ShieldAlert}
          danger
        />


        <MetricCard
          label="MEDIUM RISK"
          value={
            loading
              ? "—"
              : formatNumber(mediumRisk)
          }
          description="Potential duplicate signals"
          icon={AlertTriangle}
          warning
        />


        <MetricCard
          label="WORKS IN CLUSTERS"
          value={
            loading
              ? "—"
              : formatNumber(worksInClusters)
          }
          description="Works linked by similarity"
          icon={Network}
        />

      </div>


      {/* PIPELINE */}

      <section className="pipeline">

        <div className="pipeline-title">

          <GitBranch size={18} />

          Detection pipeline

        </div>


        <div className="pipeline-grid">

          <PipelineStep
            number="01"
            title="Candidate matching"
            subtitle="Text + amount similarity"
          />

          <PipelineArrow />

          <PipelineStep
            number="02"
            title="Relationship graph"
            subtitle="Strong links connected"
          />

          <PipelineArrow />

          <PipelineStep
            number="03"
            title="Cluster analysis"
            subtitle="Suspicion scored"
          />

          <PipelineArrow />

          <PipelineStep
            number="04"
            title="Investigation"
            subtitle="Evidence surfaced"
          />

        </div>

      </section>

 
      {/* FILTER BAR */}

      <div
        className="investigation-toolbar"
      >

        <div className="cluster-search">

          <Search size={18} />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search cluster, state, constituency, MP..."
          />

        </div>


        <select
          value={level}
          onChange={(e) =>
            setLevel(e.target.value)
          }
          style={{
            minWidth: 170,
            padding: "0 14px",
            borderRadius: 8,
            border:
              "1px solid rgba(80,150,190,.2)",
            background: "#091923",
            color: "#c9d8e3",
            outline: "none",
          }}
        >

          <option value="ALL">
            All duplicate levels
          </option>

          <option value="HIGH">
            High risk
          </option>

          <option value="MEDIUM">
            Medium risk
          </option>

          <option value="LOW">
            Low risk
          </option>

        </select>


        <button
          onClick={() => {
            setLevel("HIGH");
            setSearch("");
          }}
        >
          Highest suspicion
        </button>

      </div>


      {error && (

        <div
          style={{
            padding: 18,
            borderRadius: 10,
            border:
              "1px solid rgba(255,93,103,.25)",
            background:
              "rgba(255,93,103,.06)",
            color: "#ff8990",
            marginBottom: 18,
          }}
        >

          <strong>
            Duplicate intelligence unavailable
          </strong>

          <div
            style={{
              marginTop: 5,
              fontSize: 13,
              opacity: .8,
            }}
          >
            Make sure your FastAPI server is
            running on port 8000.
          </div>

        </div>

      )}


      {/* TABLE */}

      <section className="table-card">

        <div className="table-heading">

          <div>

            <div className="eyebrow">
              INVESTIGATION QUEUE
            </div>

            <h2>
              Suspicious work relationships
            </h2>

          </div>

          <span>
            {loading
              ? "Loading..."
              : `${filteredCases.length} records`}
          </span>

        </div>


        {loading ? (

          <div
            style={{
              padding: 55,
              textAlign: "center",
              color: "#71899a",
            }}
          >
            Loading duplicate intelligence...
          </div>

        ) : filteredCases.length === 0 ? (

          <div
            style={{
              padding: 55,
              textAlign: "center",
              color: "#71899a",
            }}
          >
            No duplicate cases match the
            current filters.
          </div>

        ) : (

          <div className="table">

            <div
              className="table-row table-header"
            >

              <span>WORK / CLUSTER</span>
              <span>LOCATION</span>
              <span>CLUSTER SIZE</span>
              <span>SIMILARITY</span>
              <span>SUSPICION</span>
              <span>EVIDENCE</span>
              <span />

            </div>


            {filteredCases.map(
              (item, index) => (

                <DuplicateRow
                  key={
                    `${item.CLUSTER_ID || "cluster"}-${
                      item.WORK_ID || index
                    }`
                  }
                  item={item}
                  onClick={() =>
                    loadCluster(
                      item.CLUSTER_ID
                    )
                  }
                />

              )
            )}

          </div>

        )}

      </section>

      {/* =================================================
          PAGINATION
      ================================================= */}

      {!loading && totalPages > 1 && (
        <div className="pagination-bar">

          <div className="pagination-info">
            Showing{" "}
            <strong>
              {((page - 1) * PAGE_SIZE) + 1}
            </strong>
            {" "}–{" "}
            <strong>
              {Math.min(
                page * PAGE_SIZE,
                totalCases
              )}
            </strong>
            {" "}of{" "}
            <strong>
              {totalCases.toLocaleString("en-IN")}
            </strong>
            {" "}records
          </div>

          <div className="pagination-controls">

            <button
              disabled={page === 1}
              onClick={() => loadCases(page - 1)}
            >
              ← Previous
            </button>

            <div className="page-number">
              Page {page} of {totalPages}
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() => loadCases(page + 1)}
            >
              Next →
            </button>

          </div>

        </div>
      )}


      {/* CLUSTER DETAIL DRAWER */}

      {selectedCluster && (

        <DuplicateDetail
          cluster={selectedCluster}
          loading={clusterLoading}
          onClose={() =>
            setSelectedCluster(null)
          }
        />

      )}

    </>
  );
}


/* =========================================================
   DUPLICATE ROW
========================================================= */

function DuplicateRow({
  item,
  onClick,
}) {

  const duplicateRisk =
    String(
      item.DUPLICATE_RISK || "UNKNOWN"
    ).toUpperCase();


  const score =
    Number(
      item.CLUSTER_SUSPICION_SCORE || 0
    );


  return (
    <div
      className="table-row"
      onClick={onClick}
      style={{
        cursor: "pointer",
      }}
    >

      <div className="cluster-name">

        <div className="cluster-icon">
          <GitBranch size={17} />
        </div>

        <div>

          <strong>
            Cluster #{item.CLUSTER_ID || "—"}
          </strong>

          <small>
            Work #{item.WORK_ID || "—"}
          </small>

        </div>

      </div>


      <div>

        <strong>
          {item.STATE_NAME || "—"}
        </strong>

        <small>
          {item.CONSTITUENCY || "—"}
        </small>

      </div>


      <div>

        <strong>
          {formatNumber(item.CLUSTER_SIZE)}
        </strong>

        <small>
          linked works
        </small>

      </div>


      <div className="similarity">

        <small>
          TEXT&nbsp;&nbsp;&nbsp;&nbsp;AMOUNT
        </small>

        <strong>
          {formatDecimal(
            Number(
              item.DESCRIPTION_CONCENTRATION ??
              item.AVG_TEXT_SIMILARITY ??
              0
            ) * 100,
            0
          )}%&nbsp;&nbsp;

          {formatDecimal(
            Number(
              item.AMOUNT_CONCENTRATION ??
              item.AVG_AMOUNT_SIMILARITY ??
              0
            ) * 100,
            0
          )}%
        </strong>

      </div>


      <div>

        <span
          className="risk-pill"
          style={{
            background:
              duplicateRisk === "HIGH"
                ? "rgba(255,76,88,.12)"
                : duplicateRisk === "MEDIUM"
                ? "rgba(255,177,66,.12)"
                : "rgba(73,180,255,.1)",

            color:
              duplicateRisk === "HIGH"
                ? "#ff707a"
                : duplicateRisk === "MEDIUM"
                ? "#ffb84d"
                : "#68c9ff",
          }}
        >
          {duplicateRisk}
        </span>

        <small>
          Score {formatDecimal(score)}
        </small>

      </div>


      <div
        style={{
          maxWidth: 260,
        }}
      >

        <strong
          style={{
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.EVIDENCE || "Evidence available in cluster"}
        </strong>

        <small>
          {item.STRONGEST_COMPONENT
            ? `Signal: ${item.STRONGEST_COMPONENT}`
            : "Cluster evidence"}
        </small>

      </div>


      <ChevronRight
        size={19}
        className="row-arrow"
      />

    </div>
  );
}


/* =========================================================
   DUPLICATE DETAIL DRAWER
========================================================= */

function DuplicateDetail({
  cluster,
  loading,
  onClose,
}) {

  const risk =
    String(
      cluster?.duplicate_risk || "UNKNOWN"
    ).toUpperCase();

  const works =
    Array.isArray(cluster?.works)
      ? cluster.works
      : [];

  const similarityValues = (() => {
    const textValues = works
      .map((work) =>
        Number(work?.AVG_TEXT_SIMILARITY)
      )
      .filter((value) =>
        Number.isFinite(value)
      );

    const amountValues = works
      .map((work) =>
        Number(work?.AVG_AMOUNT_SIMILARITY)
      )
      .filter((value) =>
        Number.isFinite(value)
      );

    const average = (values) =>
      values.length
        ? values.reduce(
            (sum, value) => sum + value,
            0
          ) / values.length
        : null;

    return {
      text: average(textValues),
      amount: average(amountValues),
    };
  })();

  const textSimilarity =
    similarityValues.text !== null
      ? similarityValues.text * 100
      : null;

  const amountSimilarity =
    similarityValues.amount !== null
      ? similarityValues.amount * 100
      : null;

  const similarityRows = [
    {
      label: "Text similarity",
      value: textSimilarity,
    },
    {
      label: "Amount similarity",
      value: amountSimilarity,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(1,7,12,.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >

      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "min(760px, 94vw)",
          height: "100%",
          overflowY: "auto",
          background: "#07131c",
          borderLeft:
            "1px solid rgba(91,180,220,.16)",
          padding: 28,
          boxShadow:
            "-25px 0 80px rgba(0,0,0,.5)",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >

          <div>

            <div className="eyebrow">
              DUPLICATE INVESTIGATION
            </div>

            <h2
              style={{
                margin: "5px 0 0",
                color: "#edf6fb",
              }}
            >
              Cluster #{cluster?.cluster_id ?? "—"}
            </h2>

            <p
              style={{
                color: "#718b9b",
                fontSize: 13,
                marginTop: 7,
              }}
            >
              {cluster?.state || "Unknown state"}
              {" • "}
              {cluster?.constituency ||
                "Unknown constituency"}
            </p>

          </div>

          <button
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              border:
                "1px solid rgba(100,170,205,.18)",
              background:
                "rgba(255,255,255,.03)",
              color: "#91a8b7",
              cursor: "pointer",
            }}
            aria-label="Close cluster investigation"
          >
            <X size={18} />
          </button>

        </div>

        {loading ? (

          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "#71899a",
            }}
          >
            Loading cluster investigation...
          </div>

        ) : (

          <>

            {/* CLUSTER SUMMARY */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: 10,
                marginTop: 25,
              }}
            >

              <InvestigationMetric
                icon={Layers3}
                label="CLUSTER SIZE"
                value={formatNumber(
                  cluster?.cluster_size
                )}
              />

              <InvestigationMetric
                icon={Network}
                label="EVIDENCE SCORE"
                value={formatDecimal(
                  cluster?.evidence_score
                )}
              />

              <InvestigationMetric
                icon={BarChart3}
                label="SUSPICION SCORE"
                value={formatDecimal(
                  cluster?.cluster_suspicion_score
                )}
              />

            </div>


            {/* DUPLICATE ASSESSMENT */}

            <div
              style={{
                marginTop: 20,
                padding: 18,
                borderRadius: 12,
                border:
                  "1px solid rgba(90,180,220,.14)",
                background:
                  "linear-gradient(135deg, rgba(13,40,55,.8), rgba(6,20,29,.8))",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >

                <div>

                  <div
                    style={{
                      color: "#7e96a6",
                      fontSize: 11,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Duplicate assessment
                  </div>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 5,
                      color: "#edf6fb",
                      fontSize: 20,
                    }}
                  >
                    {risk} DUPLICATE RISK
                  </strong>

                </div>

                <span
                  className={`risk-pill ${risk.toLowerCase()}`}
                  style={{
                    padding: "7px 12px",
                  }}
                >
                  {risk}
                </span>

              </div>

            </div>


            {/* SIMILARITY ANALYSIS */}

            <DetailSection
              title="Similarity analysis"
            >

              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border:
                    "1px solid rgba(90,160,190,.12)",
                  background:
                    "rgba(8,28,40,.6)",
                }}
              >

                <div
                  style={{
                    color: "#718b9b",
                    fontSize: 11,
                    marginBottom: 14,
                  }}
                >
                  Average similarity across works in this cluster
                </div>

                {similarityRows.map(
                  ({ label, value }) => (

                    <div
                      key={label}
                      style={{
                        marginBottom:
                          label === "Text similarity"
                            ? 16
                            : 0,
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          marginBottom: 7,
                        }}
                      >

                        <span
                          style={{
                            color: "#8199a8",
                            fontSize: 12,
                          }}
                        >
                          {label}
                        </span>

                        <strong
                          style={{
                            color: "#dce8ef",
                            fontSize: 12,
                          }}
                        >
                          {value === null
                            ? "—"
                            : `${value.toFixed(2)}%`}
                        </strong>

                      </div>

                      <div
                        style={{
                          height: 7,
                          borderRadius: 20,
                          background:
                            "rgba(130,170,190,.1)",
                          overflow: "hidden",
                        }}
                      >

                        <div
                          style={{
                            height: "100%",
                            width:
                              value === null
                                ? "0%"
                                : `${Math.min(
                                    100,
                                    Math.max(0, value)
                                  )}%`,
                            borderRadius: 20,
                            background:
                              "linear-gradient(90deg,#248fca,#66d5ff)",
                          }}
                        />

                      </div>

                    </div>

                  )
                )}

              </div>

            </DetailSection>


            {/* EVIDENCE */}

            <DetailSection
              title="Evidence"
            >

              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border:
                    "1px solid rgba(90,160,190,.12)",
                  background:
                    "rgba(8,28,40,.6)",
                  color: "#d6e4eb",
                  lineHeight: 1.6,
                  fontSize: 13,
                }}
              >
                {cluster?.evidence ||
                  "No evidence description available."}
              </div>

            </DetailSection>


            {/* CONTEXT */}

            <DetailSection
              title="Cluster context"
            >

              <DetailGrid
                items={[
                  [
                    "Cluster ID",
                    cluster?.cluster_id,
                  ],
                  [
                    "State",
                    cluster?.state,
                  ],
                  [
                    "Constituency",
                    cluster?.constituency,
                  ],
                  [
                    "MP",
                    cluster?.mp_name,
                  ],
                  [
                    "Duplicate risk",
                    cluster?.duplicate_risk,
                  ],
                  [
                    "Suspicion level",
                    cluster?.suspicion_level,
                  ],
                  [
                    "Cluster suspicion",
                    formatDecimal(
                      cluster?.cluster_suspicion_score
                    ),
                  ],
                  [
                    "Evidence score",
                    formatDecimal(
                      cluster?.evidence_score
                    ),
                  ],
                ]}
              />

            </DetailSection>


            {/* WORKS */}

            <DetailSection
              title={`Works in cluster ${works.length}`}
            >

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >

                {works.length === 0 ? (

                  <div
                    style={{
                      padding: 16,
                      borderRadius: 9,
                      border:
                        "1px solid rgba(90,160,190,.1)",
                      background: "#091720",
                      color: "#718a9a",
                      fontSize: 12,
                    }}
                  >
                    No works were returned for this cluster.
                  </div>

                ) : (

                  works.map((work, index) => (

                    <div
                      key={
                        work?.WORK_ID ||
                        work?.WORK_RECOMMENDATION_DTL_ID ||
                        index
                      }
                      style={{
                        padding: 14,
                        borderRadius: 9,
                        border:
                          "1px solid rgba(90,160,190,.1)",
                        background: "#091720",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 15,
                        }}
                      >

                        <div>

                          <strong
                            style={{
                              color: "#dce9ef",
                              fontSize: 13,
                            }}
                          >
                            Work #{work?.WORK_ID || "—"}
                          </strong>

                          <div
                            style={{
                              color: "#718a9a",
                              fontSize: 11,
                              marginTop: 4,
                            }}
                          >
                            {work?.STATE_NAME || "—"}
                            {" • "}
                            {work?.CONSTITUENCY || "—"}
                          </div>

                        </div>

                        <div
                          style={{
                            textAlign: "right",
                          }}
                        >

                          <div
                            style={{
                              color: "#dce9ef",
                              fontSize: 12,
                            }}
                          >
                            {formatCurrency(
                              work?.SANCTION_AMOUNT
                            )}
                          </div>

                          <div
                            style={{
                              color: "#718a9a",
                              fontSize: 10,
                              marginTop: 3,
                            }}
                          >
                            sanction amount
                          </div>

                        </div>

                      </div>

                      {work?.WORK_DESCRIPTION && (

                        <div
                          style={{
                            marginTop: 10,
                            color: "#8da3b0",
                            fontSize: 12,
                            lineHeight: 1.5,
                          }}
                        >
                          {work.WORK_DESCRIPTION}
                        </div>

                      )}

                    </div>

                  ))

                )}

              </div>

            </DetailSection>

          </>

        )}

      </div>

    </div>
  );
}


/* =========================================================
   INVESTIGATION METRIC
========================================================= */

function InvestigationMetric({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        border:
          "1px solid rgba(90,160,190,.1)",
        background:
          "rgba(8,28,40,.6)",
      }}
    >

      <Icon
        size={17}
        style={{
          color: "#5ec7f2",
        }}
      />

      <div
        style={{
          color: "#708796",
          fontSize: 10,
          marginTop: 8,
          letterSpacing: ".06em",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          display: "block",
          color: "#e3edf2",
          fontSize: 18,
          marginTop: 3,
        }}
      >
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   PIPELINE
========================================================= */

function PipelineStep({
  number,
  title,
  subtitle,
}) {
  return (
    <div className="pipeline-step">

      <span>
        {number}
      </span>

      <strong>
        {title}
      </strong>

      <small>
        {subtitle}
      </small>

    </div>
  );
}


function PipelineArrow() {
  return (
    <ChevronRight
      className="pipeline-arrow"
      size={20}
    />
  );
}



/* =========================================================
   SHARED DATA UI
========================================================= */

function PageNotice({ loading, error, children }) {
  if (loading) {
    return <div className="page-notice">Loading intelligence data…</div>;
  }

  if (error) {
    return (
      <div className="page-notice page-notice-error">
        <strong>Backend connection failed</strong>
        <span>{error}</span>
      </div>
    );
  }

  return children;
}


function WorkDetail({ work, onClose }) {
  if (!work) return null;

  const risk = String(work.RISK_LEVEL || "LOW").toUpperCase();
  const duplicate = String(work.DUPLICATE_RISK || "—").toUpperCase();

  const detailItems = [
    ["Work ID", work.WORK_ID || work.WORK_RECOMMENDATION_DTL_ID],
    ["State", work.STATE_NAME],
    ["Constituency", work.CONSTITUENCY],
    ["MP", work.MP_NAME],
    ["Category", work.WORK_CATEGORY],
    ["Stage", work.WORK_STAGE],
    ["Sanction amount", formatCurrency(work.SANCTION_AMOUNT)],
    ["Actual amount", formatCurrency(work.ACTUAL_AMOUNT)],
    ["Risk score", formatDecimal(work.RISK_SCORE)],
    ["Duplicate score", formatDecimal(work.CLUSTER_SUSPICION_SCORE)],
    ["Evidence score", formatDecimal(work.EVIDENCE_SCORE)],
  ];

  return (
    <div className="detail-overlay" onClick={onClose}>
      <aside className="detail-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="detail-top">
          <div>
            <div className="eyebrow">WORK INVESTIGATION</div>
            <h2>Work #{work.WORK_ID || work.WORK_RECOMMENDATION_DTL_ID}</h2>
            <p>{work.STATE_NAME || "—"} · {work.CONSTITUENCY || "—"}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="detail-badges">
          <span className={`detail-pill ${risk.toLowerCase()}`}>RISK {risk}</span>
          {duplicate !== "—" && (
            <span className={`detail-pill ${duplicate.toLowerCase()}`}>DUPLICATE {duplicate}</span>
          )}
          {work.SUSPICION_LEVEL && (
            <span className="detail-pill neutral">{work.SUSPICION_LEVEL}</span>
          )}
        </div>

        <section className="detail-section">
          <div className="detail-section-title">Work description</div>
          <div className="detail-description">
            {work.WORK_DESCRIPTION || "No work description available."}
          </div>
        </section>

        <section className="detail-section">
          <div className="detail-section-title">Signals</div>
          <div className="detail-grid">
            {detailItems.map(([label, value]) => (
              <div className="detail-grid-item" key={label}>
                <span>{label}</span>
                <strong>{value ?? "—"}</strong>
              </div>
            ))}
          </div>
        </section>

        {work.RISK_REASON && (
          <section className="detail-section">
            <div className="detail-section-title">Risk rationale</div>
            <div className="detail-description">{work.RISK_REASON}</div>
          </section>
        )}

        {work.REVIEW_REASON && (
          <section className="detail-section">
            <div className="detail-section-title">Review reason</div>
            <div className="detail-description">{work.REVIEW_REASON}</div>
          </section>
        )}

        {work.EVIDENCE && (
          <section className="detail-section">
            <div className="detail-section-title">Duplicate evidence</div>
            <div className="detail-description">{work.EVIDENCE}</div>
          </section>
        )}
      </aside>
    </div>
  );
}


/* =========================================================
   REVIEW QUEUE
========================================================= */

function ReviewQueue() {
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/api/review-cases?limit=100`);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const result = await response.json();

const summaryResponse = await fetch(
  `${API_BASE}/api/summary`
);

const summaryData = await summaryResponse.json();

setSummary(summaryData);

setCases(result.data || []);

    } catch (err) {
      console.error(err);
      setError("Make sure the FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((item) =>
      [
        item.WORK_ID,
        item.WORK_RECOMMENDATION_DTL_ID,
        item.STATE_NAME,
        item.CONSTITUENCY,
        item.MP_NAME,
        item.REVIEW_REASON,
        item.RISK_REASON,
        item.SUSPICION_LEVEL,
      ].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [cases, query]);

  const stats = useMemo(() => ({
    total: Number(summary?.review_required || 0),
  
    highRisk:
      Number(summary?.review_high_risk || 0),
  
    duplicate:
      Number(summary?.review_duplicate_signals || 0),
  
    suspicion:
      Number(summary?.review_high_suspicion || 0),
  
  }), [summary]);

  return (
    <>
      <PageHeader
        eyebrow="MONITORING / REVIEW"
        title="Review Queue"
        description="Prioritized works requiring human investigation, ranked using risk, duplicate and evidence signals."
      />

      <div className="status-strip">
        <div><span className="status-dot" /> REVIEW ENGINE ONLINE</div>
        <button className="outline-button" onClick={load}><RefreshCw size={14} /> Refresh queue</button>
      </div>

      <div className="metric-grid">
        <MetricCard label="REVIEW CASES" value={loading ? "—" : formatNumber(stats.total)} description="Prioritized records" icon={ClipboardCheck} warning />
        <MetricCard label="HIGH RISK" value={loading ? "—" : formatNumber(stats.highRisk)} description="Financial / execution" icon={ShieldAlert} danger />
        <MetricCard label="DUPLICATE SIGNALS" value={loading ? "—" : formatNumber(stats.duplicate)} description="Related-work alerts" icon={GitBranch} />
        <MetricCard label="HIGH SUSPICION" value={loading ? "—" : formatNumber(stats.suspicion)} description="Strong evidence clusters" icon={FileSearch} danger />
      </div>

      <div className="data-toolbar">
        <div className="toolbar-search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search work, state, MP or review reason..." />
        </div>
      </div>

      <section className="table-card">
        <div className="table-heading">
          <div>
            <div className="eyebrow">INVESTIGATION QUEUE</div>
            <h2>Cases needing human review</h2>
          </div>
          <span>{formatNumber(filtered.length)} records</span>
        </div>

        <PageNotice loading={loading} error={error}>
          {filtered.length === 0 ? (
            <div className="page-notice">No review cases match the current search.</div>
          ) : (
            <div className="review-list">
              <div className="review-row review-header">
                <span>WORK</span><span>LOCATION</span><span>RISK</span><span>DUPLICATE</span><span>EVIDENCE</span><span>REASON</span><span />
              </div>
              {filtered.map((item, index) => {
                const risk = String(item.RISK_LEVEL || "LOW").toUpperCase();
                const dup = String(item.DUPLICATE_RISK || "—").toUpperCase();
                return (
                  <div className="review-row" key={item.WORK_RECOMMENDATION_DTL_ID || item.WORK_ID || index} onClick={() => setSelected(item)}>
                    <div className="cluster-name">
                      <div className="cluster-icon"><ClipboardCheck size={16} /></div>
                      <div><strong>#{item.WORK_ID || item.WORK_RECOMMENDATION_DTL_ID || "—"}</strong><small>{item.MP_NAME || "MP unavailable"}</small></div>
                    </div>
                    <div><strong>{item.STATE_NAME || "—"}</strong><small>{item.CONSTITUENCY || "—"}</small></div>
                    <div><span className={`risk-pill ${risk.toLowerCase()}`}>{risk}</span><small>{formatDecimal(item.RISK_SCORE)}</small></div>
                    <div><span className={`risk-pill ${dup.toLowerCase()}`}>{dup}</span><small>{formatDecimal(item.CLUSTER_SUSPICION_SCORE)}</small></div>
                    <div><strong>{formatDecimal(item.EVIDENCE_SCORE)}</strong><small>{item.SUSPICION_LEVEL || "No suspicion score"}</small></div>
                    <div><strong className="truncate">{item.REVIEW_REASON || item.RISK_REASON || "Review flagged by monitoring engine"}</strong><small>Click to investigate</small></div>
                    <ChevronRight size={18} className="row-arrow" />
                  </div>
                );
              })}
            </div>
          )}
        </PageNotice>
      </section>

      {selected && <WorkDetail work={selected} onClose={() => setSelected(null)} />}
    </>
  );
}


/* =========================================================
   STATE INTELLIGENCE
========================================================= */

function StateIntelligence() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/states`)
      .then((response) => {
        if (!response.ok) throw new Error(`Backend returned ${response.status}`);
        return response.json();
      })
      .then((result) => setStates(result.data || []))
      .catch((err) => {
        console.error(err);
        setError("Make sure the FastAPI server is running on port 8000.");
      })
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return states
      .map((item) => ({
        ...item,
        HIGH_RISK: Number(item.HIGH_RISK || 0),
        REVIEW_REQUIRED: Number(item.REVIEW_REQUIRED || 0),
        TOTAL_WORKS: Number(item.TOTAL_WORKS || 0),
      }))
      .filter((item) => !q || String(item.STATE_NAME || "").toLowerCase().includes(q))
      .sort((a, b) => (b.REVIEW_REQUIRED - a.REVIEW_REQUIRED) || (b.HIGH_RISK - a.HIGH_RISK));
  }, [states, query]);

  const totals = useMemo(() => ({
    works: rows.reduce((s, x) => s + x.TOTAL_WORKS, 0),
    high: rows.reduce((s, x) => s + x.HIGH_RISK, 0),
    review: rows.reduce((s, x) => s + x.REVIEW_REQUIRED, 0),
  }), [rows]);

  return (
    <>
      <PageHeader
        eyebrow="ANALYTICS / STATES"
        title="State Intelligence"
        description="Compare MPLADS activity, risk exposure and review workload across States and Union Territories."
      />

      <div className="metric-grid">
        <MetricCard label="STATES / UTs" value={loading ? "—" : formatNumber(states.length)} description="Covered by dataset" icon={Map} />
        <MetricCard label="WORKS IN VIEW" value={loading ? "—" : formatNumber(totals.works)} description="Across selected states" icon={Database} />
        <MetricCard label="HIGH RISK" value={loading ? "—" : formatNumber(totals.high)} description="High risk works" icon={ShieldAlert} danger />
        <MetricCard label="REVIEW LOAD" value={loading ? "—" : formatNumber(totals.review)} description="Cases requiring review" icon={ClipboardCheck} warning />
      </div>

      <div className="state-overview">
        <div className="state-highlight">
          <div className="eyebrow">HIGHEST REVIEW LOAD</div>
          <strong>{rows[0]?.STATE_NAME || "—"}</strong>
          <span>{formatNumber(rows[0]?.REVIEW_REQUIRED || 0)} review cases · {formatNumber(rows[0]?.TOTAL_WORKS || 0)} works</span>
        </div>
        <div className="state-highlight">
          <div className="eyebrow">HIGHEST RISK COUNT</div>
          <strong>{[...rows].sort((a,b) => b.HIGH_RISK-a.HIGH_RISK)[0]?.STATE_NAME || "—"}</strong>
          <span>{formatNumber([...rows].sort((a,b) => b.HIGH_RISK-a.HIGH_RISK)[0]?.HIGH_RISK || 0)} high-risk works</span>
        </div>
      </div>

      <div className="data-toolbar">
        <div className="toolbar-search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search state or Union Territory..." />
        </div>
      </div>

      <section className="table-card">
        <div className="table-heading">
          <div><div className="eyebrow">STATE COMPARISON</div><h2>Monitoring exposure by state</h2></div>
          <span>{formatNumber(rows.length)} states</span>
        </div>
        <PageNotice loading={loading} error={error}>
          <div className="state-list">
            <div className="state-row state-header"><span>STATE / UT</span><span>WORKS</span><span>HIGH RISK</span><span>REVIEW</span><span>REVIEW RATE</span><span /></div>
            {rows.map((item) => {
              const reviewRate = item.TOTAL_WORKS ? (item.REVIEW_REQUIRED / item.TOTAL_WORKS) * 100 : 0;
              return (
                <div className="state-row" key={item.STATE_NAME} onClick={() => navigate(`/works?state=${encodeURIComponent(item.STATE_NAME)}`)}>
                  <div><strong>{item.STATE_NAME || "Unknown"}</strong><small>Open work explorer</small></div>
                  <strong>{formatNumber(item.TOTAL_WORKS)}</strong>
                  <strong className="danger-text">{formatNumber(item.HIGH_RISK)}</strong>
                  <strong className="warning-text">{formatNumber(item.REVIEW_REQUIRED)}</strong>
                  <div className="state-rate"><div className="mini-track"><span style={{width: `${Math.min(100, reviewRate)}%`}} /></div><small>{reviewRate.toFixed(1)}%</small></div>
                  <ChevronRight size={17} className="row-arrow" />
                </div>
              );
            })}
          </div>
        </PageNotice>
      </section>
    </>
  );
}


/* =========================================================
   WORK EXPLORER
========================================================= */

function WorkExplorer() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState({ data: [], total: 0, pages: 0 });
  const [states, setStates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const q = params.get("q") || "";
  const state = params.get("state") || "";
  const risk = params.get("risk_level") || "";
  const duplicate = params.get("duplicate_risk") || "";
  const review = params.get("requires_review") || "";
  const page = Number(params.get("page") || 1);

  useEffect(() => {
    fetch(`${API_BASE}/api/states`)
      .then((r) => r.json())
      .then((data) => setStates(data.states || []))
      .catch(() => {});
  }, []);

  const loadWorks = async () => {
    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({
        page: String(page),
        limit: "50",
      });
      if (q) query.set("q", q);
      if (state) query.set("state", state);
      if (risk) query.set("risk_level", risk);
      if (duplicate) query.set("duplicate_risk", duplicate);
      if (review) query.set("requires_review", review);

      const response = await fetch(`${API_BASE}/api/works?${query}`);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      setResult(await response.json());
    } catch (err) {
      console.error(err);
      setError("Make sure the FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorks(); }, [q, state, risk, duplicate, review, page]);

  const setFilter = (key, value) => {
  const next = new URLSearchParams(params);

  if (value) {
    next.set(key, value);
  } else {
    next.delete(key);
  }

  // Only reset pagination when changing an actual filter.
  if (key !== "page") {
    next.set("page", "1");
  }

  setParams(next);
};

  return (
    <>
      <PageHeader
        eyebrow="ANALYTICS / WORKS"
        title="Work Explorer"
        description="Search, filter and investigate individual MPLADS works using the same monitored dataset that powers the intelligence modules."
      />

      <div className="metric-grid">
        <MetricCard label="MATCHING WORKS" value={loading ? "—" : formatNumber(result.total)} description="Current filter scope" icon={Database} />
        <MetricCard label="PAGE" value={loading ? "—" : `${page} / ${result.pages || 1}`} description="50 works per page" icon={Layers3} />
        <MetricCard label="FILTER" value={state || "ALL STATES"} description={risk ? `${risk} risk` : "No risk filter"} icon={Map} />
        <MetricCard label="DATASET" value="LIVE" description="FastAPI connected" icon={Activity} />
      </div>

      <div className="explorer-toolbar">
        <div className="toolbar-search explorer-search">
          <Search size={17} />
          <input value={q} onChange={(e) => setFilter("q", e.target.value)} placeholder="Search ID, description, state, constituency or MP..." />
        </div>
        <select value={state} onChange={(e) => setFilter("state", e.target.value)}>
          <option value="">All states</option>
          {states.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={risk} onChange={(e) => setFilter("risk_level", e.target.value)}>
          <option value="">All risk levels</option>
          <option value="HIGH">High risk</option>
          <option value="MEDIUM">Medium risk</option>
          <option value="LOW">Low risk</option>
        </select>
        <select value={duplicate} onChange={(e) => setFilter("duplicate_risk", e.target.value)}>
          <option value="">All duplicate levels</option>
          <option value="HIGH">High duplicate</option>
          <option value="MEDIUM">Medium duplicate</option>
          <option value="LOW">Low duplicate</option>
        </select>
        <select value={review} onChange={(e) => setFilter("requires_review", e.target.value)}>
          <option value="">All review states</option>
          <option value="true">Review required</option>
          <option value="false">No review flag</option>
        </select>
      </div>

      <section className="table-card">
        <div className="table-heading">
          <div><div className="eyebrow">WORK REGISTER</div><h2>Monitored MPLADS works</h2></div>
          <span>{formatNumber(result.total)} matching records</span>
        </div>

        <PageNotice loading={loading} error={error}>
          {result.data.length === 0 ? (
            <div className="page-notice">No works match the current filters.</div>
          ) : (
            <div className="work-list">
              <div className="work-row work-header">
                <span>WORK</span><span>LOCATION</span><span>AMOUNT</span><span>RISK</span><span>DUPLICATE</span><span>STAGE</span><span />
              </div>
              {result.data.map((item, index) => {
                const riskLevel = String(item.RISK_LEVEL || "LOW").toUpperCase();
                const duplicateLevel = String(item.DUPLICATE_RISK || "—").toUpperCase();
                return (
                  <div className="work-row" key={item.WORK_RECOMMENDATION_DTL_ID || item.WORK_ID || index} onClick={() => setSelected(item)}>
                    <div className="cluster-name">
                      <div className="cluster-icon"><Database size={15} /></div>
                      <div><strong>#{item.WORK_ID || item.WORK_RECOMMENDATION_DTL_ID || "—"}</strong><small>{item.WORK_CATEGORY || "Uncategorized"}</small></div>
                    </div>
                    <div><strong>{item.STATE_NAME || "—"}</strong><small>{item.CONSTITUENCY || "—"}</small></div>
                    <strong>{formatCurrency(item.SANCTION_AMOUNT)}</strong>
                    <div><span className={`risk-pill ${riskLevel.toLowerCase()}`}>{riskLevel}</span><small>{formatDecimal(item.RISK_SCORE)}</small></div>
                    <div><span className={`risk-pill ${duplicateLevel.toLowerCase()}`}>{duplicateLevel}</span><small>{formatDecimal(item.CLUSTER_SUSPICION_SCORE)}</small></div>
                    <div><strong>{item.WORK_STAGE || "—"}</strong><small>{item.ACTUAL_END_DATE || "No end date"}</small></div>
                    <ChevronRight size={18} className="row-arrow" />
                  </div>
                );
              })}
            </div>
          )}
        </PageNotice>
      </section>

      {result.pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setFilter("page", String(page - 1))}>Previous</button>
          <span>Page {page} of {result.pages}</span>
          <button disabled={page >= result.pages} onClick={() => setFilter("page", String(page + 1))}>Next</button>
        </div>
      )}

      {selected && <WorkDetail work={selected} onClose={() => setSelected(null)} />}
    </>
  );
}


/* =========================================================
   SIMPLE PAGE
========================================================= */



/* =========================================================
   APP
========================================================= */

export default function App() {

  return (
    <BrowserRouter>

      <Layout>

        <Routes>

          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/risk-cases"
            element={<RiskIntelligence />}
          />

          <Route
            path="/duplicates"
            element={<DuplicateIntelligence />}
          />

          <Route path="/review" element={<ReviewQueue />} />

          <Route path="/states" element={<StateIntelligence />} />

          <Route path="/works" element={<WorkExplorer />} />

        </Routes>

      </Layout>

    </BrowserRouter>
  );
}