import React, { useEffect, useState } from "react";
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
  ShieldAlert,
  GitBranch,
  ClipboardCheck,
  Map,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import ESakshiOfficialCards from "../components/ESakshiOfficialCards";
import { API_BASE, formatNumber, formatDecimal, formatCurrency } from "../constants";

const RISK_COLORS = {
  High: "#dc2626",
  Medium: "#f59e0b",
  Low: "#16a34a",
};

const DUP_COLORS = {
  High: "#dc2626",
  Medium: "#f59e0b",
  Low: "#0284c7",
  "Not in cluster": "#94a3b8",
};

export default function Dashboard({ summary, house, onSelectWork }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "ai", "priority"
  const [stageData, setStageData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [priorityCases, setPriorityCases] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/stages`)
      .then((r) => r.json())
      .then((d) => setStageData(d.data || []))
      .catch(() => {});

    fetch(`${API_BASE}/api/analytics/states`)
      .then((r) => r.json())
      .then((d) => setStateData(d.data || []))
      .catch(() => {});

    fetch(`${API_BASE}/api/review-cases?limit=6`)
      .then((r) => r.json())
      .then((d) => setPriorityCases(d.data || []))
      .catch(() => {});
  }, []);

  const riskDist = summary?.risk_distribution || {};
  const riskChartData = [
    { name: "High", value: Number(riskDist.HIGH || 14142) },
    { name: "Medium", value: Number(riskDist.MEDIUM || 28410) },
    { name: "Low", value: Number(riskDist.LOW || 60151) },
  ];

  const dupDist = summary?.duplicate_distribution || {};
  const duplicateChartData = [
    { name: "High", value: Number(dupDist.HIGH || 1240) },
    { name: "Medium", value: Number(dupDist.MEDIUM || 3512) },
    { name: "Low", value: Number(dupDist.LOW || 3090) },
    { name: "Not in cluster", value: Number(dupDist["NOT IN CLUSTER"] || 94861) },
  ];

  const topStates = [...stateData]
    .sort((a, b) => Number(b.TOTAL_WORKS || 0) - Number(a.TOTAL_WORKS || 0))
    .slice(0, 6)
    .map((s) => ({
      name: s.STATE_NAME?.length > 12 ? s.STATE_NAME.slice(0, 11) + "…" : s.STATE_NAME,
      total: Number(s.TOTAL_WORKS || 0),
      review: Number(s.REVIEW_REQUIRED || 0),
    }));

  return (
    <div className="compact-page-container">
      {/* 1. Clean Section Tabs */}
      <div className="dashboard-top-nav">
        <div className="section-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Scheme Funds & Physical Progress
          </button>
          <button
            className={`tab-btn ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            ⚠️ Audit & Risk Alerts (
            {summary ? formatNumber(summary.high_risk || 14142) : "14k"} Flags)
          </button>
          <button
            className={`tab-btn ${activeTab === "priority" ? "active" : ""}`}
            onClick={() => setActiveTab("priority")}
          >
            📋 District Verification Queue
          </button>
        </div>

        <Link to="/pre-sanction" className="quick-action-pill">
          <span>⚡ Verify New Work Proposal</span>
        </Link>
      </div>

      {/* TAB 1: SCHEME OVERVIEW & PROGRESS */}
      {activeTab === "overview" && (
        <div className="tab-pane-content">
          {/* 4 Compact KPIs */}
          <ESakshiOfficialCards summary={summary} house={house} />

          {/* Clean 2-Column Section: Execution Pipeline + State Breakdown */}
          <div className="compact-two-col mt-3">
            {/* Column 1: Execution Pipeline */}
            <div className="clean-panel">
              <div className="panel-title">
                <h4>Physical Execution Workflow</h4>
                <span>eSAKSHI Milestone Progress</span>
              </div>

              <div className="pipeline-steps-vertical">
                <div className="pipe-step">
                  <div className="pipe-dot active" />
                  <div className="pipe-info">
                    <div className="pipe-header">
                      <strong>1. Works Recommended</strong>
                      <span>106,896 Works (₹5,723 Cr)</span>
                    </div>
                    <div className="pipe-bar">
                      <div className="pipe-fill" style={{ width: "100%" }} />
                    </div>
                    <small>Submitted online by Hon'ble Members of Parliament</small>
                  </div>
                </div>

                <div className="pipe-step">
                  <div className="pipe-dot active" />
                  <div className="pipe-info">
                    <div className="pipe-header">
                      <strong>2. Works Sanctioned</strong>
                      <span>79,144 Works (74% rate)</span>
                    </div>
                    <div className="pipe-bar">
                      <div className="pipe-fill" style={{ width: "74%" }} />
                    </div>
                    <small>Feasibility cleared by District Authorities & IAs designated</small>
                  </div>
                </div>

                <div className="pipe-step">
                  <div className="pipe-dot complete" />
                  <div className="pipe-info">
                    <div className="pipe-header">
                      <strong>3. Works Completed</strong>
                      <span>34,339 Completed Assets (32%)</span>
                    </div>
                    <div className="pipe-bar">
                      <div className="pipe-fill green" style={{ width: "32%" }} />
                    </div>
                    <small>Physical asset created and marked complete on portal</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Top States Quick Comparison */}
            <div className="clean-panel">
              <div className="panel-title">
                <h4>Top States by Volume vs. Review Burden</h4>
                <span>Comparing Total Projects vs. Priority Audit Cases</span>
              </div>
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topStates} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name) => [
                        formatNumber(val),
                        name === "total" ? "Total Works" : "Review Required",
                      ]}
                      contentStyle={{ borderRadius: 6, fontSize: 12, padding: "6px 10px" }}
                    />
                    <Bar dataKey="total" name="Total Works" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="review" name="Review Required" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="panel-footer-link">
                <Link to="/states">View all 36 States & UTs →</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT & RISK FINDINGS */}
      {activeTab === "ai" && (
        <div className="tab-pane-content">
          {/* 3 Prominent Summary Cards */}
          <div className="ai-summary-grid">
            <Link to="/risk-cases" className="ai-box danger">
              <div className="ai-box-top">
                <ShieldAlert size={20} />
                <span>DELAY & COST ALERTS</span>
              </div>
              <div className="ai-box-num">
                {summary ? formatNumber(summary.high_risk || 14142) : "14,142"}
              </div>
              <p>Works with &gt;3x peer sanction delay or budget escalations</p>
              <div className="ai-box-link">Review Flagged Works →</div>
            </Link>

            <Link to="/duplicates" className="ai-box warning">
              <div className="ai-box-top">
                <GitBranch size={20} />
                <span>DUPLICATE PROPOSALS</span>
              </div>
              <div className="ai-box-num">
                {summary ? formatNumber(summary.duplicate_clusters || 2917) : "2,917"}
              </div>
              <p>Overlapping recommendations with matching titles or amounts</p>
              <div className="ai-box-link">View Duplicate Groups →</div>
            </Link>

            <Link to="/review" className="ai-box highlight">
              <div className="ai-box-top">
                <ClipboardCheck size={20} />
                <span>DISTRICT AUDIT QUEUE</span>
              </div>
              <div className="ai-box-num">
                {summary ? formatNumber(summary.review_required || 19531) : "19,531"}
              </div>
              <p>Priority cases flagged for District Collector verification</p>
              <div className="ai-box-link">Open Verification Queue →</div>
            </Link>
          </div>

          {/* 2 Visual Distribution Charts side by side */}
          <div className="compact-two-col mt-3">
            <div className="clean-panel">
              <div className="panel-title">
                <h4>Risk Tier Breakdown</h4>
                <span>Peer-benchmarked cost and delay analysis</span>
              </div>
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {riskChartData.map((e) => (
                        <Cell key={e.name} fill={RISK_COLORS[e.name]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${formatNumber(v)} works`, "Count"]}
                      contentStyle={{ borderRadius: 6, fontSize: 12 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="clean-panel">
              <div className="panel-title">
                <h4>Duplicate Work Detection</h4>
                <span>Groups of matching project titles and identical costs</span>
              </div>
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={duplicateChartData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {duplicateChartData.map((e) => (
                        <Cell key={e.name} fill={DUP_COLORS[e.name]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${formatNumber(v)} works`, "Count"]}
                      contentStyle={{ borderRadius: 6, fontSize: 12 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRIORITY TRIAGE FEED */}
      {activeTab === "priority" && (
        <div className="tab-pane-content">
          <div className="clean-panel">
            <div className="panel-title space-between">
              <div>
                <h4>Top Cases Requiring District Action</h4>
                <span>Ranked by compound evidence score and peer anomalies</span>
              </div>
              <Link to="/review" className="text-btn">
                Open Full Review Queue ({summary ? formatNumber(summary.review_required) : "19k"}) →
              </Link>
            </div>

            <div className="table-responsive">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Work ID</th>
                    <th>Location</th>
                    <th>MP Name</th>
                    <th>Sanction Amount</th>
                    <th>Risk</th>
                    <th>Audit Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityCases.map((item, idx) => (
                    <tr key={idx} onClick={() => onSelectWork && onSelectWork(item)}>
                      <td>
                        <strong>#{item.WORK_ID || item.WORK_RECOMMENDATION_DTL_ID}</strong>
                      </td>
                      <td>
                        {item.STATE_NAME}, <small>{item.CONSTITUENCY}</small>
                      </td>
                      <td>{item.MP_NAME || "Hon'ble MP"}</td>
                      <td>
                        <strong>{formatCurrency(item.SANCTION_AMOUNT)}</strong>
                      </td>
                      <td>
                        <span className="mini-tag danger">{item.RISK_LEVEL}</span>
                      </td>
                      <td className="truncate-sm">{item.REVIEW_REASON || item.RISK_REASON}</td>
                      <td>
                        <button className="row-action-btn">Inspect →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
