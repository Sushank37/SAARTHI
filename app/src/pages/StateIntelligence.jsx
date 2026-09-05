import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Map,
  Search,
  Download,
  ShieldAlert,
  ClipboardCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { API_BASE, formatNumber, exportToCSV } from "../constants";

export default function StateIntelligence() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/states`)
      .then((res) => res.json())
      .then((data) => setStates(data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredStates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return states
      .filter((s) => !q || (s.STATE_NAME && s.STATE_NAME.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.REVIEW_REQUIRED || 0) - Number(a.REVIEW_REQUIRED || 0));
  }, [states, search]);

  const handleExport = () => {
    exportToCSV(states, "mplads_state_intelligence_summary.csv");
  };

  return (
    <div className="compact-page-container">
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">eSAKSHI INTEGRATION / STATE-WISE PERFORMANCE</div>
          <h2>State & Union Territory Overview</h2>
          <p>
            Comparative progress of MPLADS work volume, financial risk exposure, and audit workload
            across all States and UTs. Click any state to explore its individual works.
          </p>
        </div>
        <div className="gov-header-actions">
          <button className="gov-btn-outline" onClick={handleExport}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="gov-card full-width-card">
        <div className="table-controls-bar">
          <div className="search-box-wrap">
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search State or Union Territory..."
            />
          </div>
          <span className="results-count-tag">
            {filteredStates.length} States & UTs analyzed
          </span>
        </div>

        <div className="table-responsive">
          <table className="gov-data-table">
            <thead>
              <tr>
                <th>State / Union Territory</th>
                <th>Total Works</th>
                <th>High Risk Works</th>
                <th>Medium Risk</th>
                <th>Duplicate Flags</th>
                <th>Audit Review Cases</th>
                <th>Review Rate</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="spinner" /> Loading State metrics...
                  </td>
                </tr>
              ) : (
                filteredStates.map((item, idx) => {
                  const total = Number(item.TOTAL_WORKS || 0);
                  const review = Number(item.REVIEW_REQUIRED || 0);
                  const rate = total ? ((review / total) * 100).toFixed(1) : "0.0";
                  return (
                    <tr
                      key={idx}
                      onClick={() =>
                        navigate(`/works?state=${encodeURIComponent(item.STATE_NAME)}`)
                      }
                    >
                      <td>
                        <strong>{item.STATE_NAME || "State Unknown"}</strong>
                      </td>
                      <td>{formatNumber(total)}</td>
                      <td>
                        <strong className="danger-text">{formatNumber(item.HIGH_RISK)}</strong>
                      </td>
                      <td>{formatNumber(item.MEDIUM_RISK)}</td>
                      <td>{formatNumber(item.HIGH_DUPLICATE)}</td>
                      <td>
                        <strong className="warning-text">{formatNumber(review)}</strong>
                      </td>
                      <td>
                        <div className="progress-cell">
                          <div className="mini-progress-track">
                            <div
                              className="mini-progress-fill"
                              style={{ width: `${Math.min(100, Number(rate))}%` }}
                            />
                          </div>
                          <span>{rate}%</span>
                        </div>
                      </td>
                      <td>
                        <button className="table-action-btn">
                          <span>View Works</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
