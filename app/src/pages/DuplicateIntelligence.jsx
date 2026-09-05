import React, { useEffect, useState, useMemo } from "react";
import {
  GitBranch,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Eye,
  X,
  Building,
  User,
  MapPin,
  FileText,
  Download,
} from "lucide-react";
import {
  API_BASE,
  formatNumber,
  formatDecimal,
  formatCurrency,
  exportToCSV,
} from "../constants";

export default function DuplicateIntelligence({ onSelectWork }) {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClusters, setTotalClusters] = useState(0);

  // Selected cluster modal
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [clusterDetail, setClusterDetail] = useState(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  const PAGE_SIZE = 12;

  const loadClusters = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });
      if (level !== "ALL") {
        params.append("level", level);
      }
      const res = await fetch(`${API_BASE}/api/duplicate-cases?${params.toString()}`);
      const data = await res.json();
      setClusters(data.data || []);
      setTotalClusters(data.total || 0);
      setTotalPages(data.pages || 1);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters(1);
  }, [level]);

  const loadClusterDetails = async (clusterId) => {
    setSelectedClusterId(clusterId);
    setClusterLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/clusters/${clusterId}`);
      const data = await res.json();
      setClusterDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setClusterLoading(false);
    }
  };

  const filteredClusters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clusters;
    return clusters.filter((item) =>
      [
        item.CLUSTER_ID,
        item.STATE_NAME,
        item.CONSTITUENCY,
        item.MP_NAME,
        item.EVIDENCE,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [clusters, search]);

  const handleExport = () => {
    exportToCSV(clusters, `mplads_duplicate_clusters_page_${page}.csv`);
  };

  return (
    <div className="compact-page-container">
      <div className="gov-page-header">
        <div>
          <div className="gov-eyebrow">eSAKSHI INTEGRATION / AUDIT VERIFICATION</div>
          <h2>Duplicate Work Proposals</h2>
          <p>
            Identifies works with matching titles, identical sanction amounts, or overlapping locations
            within the same constituency to prevent double funding.
          </p>
        </div>
        <div className="gov-header-actions">
          <button className="gov-btn-outline" onClick={handleExport}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Cluster Table */}
      <div className="gov-card full-width-card">
        <div className="table-controls-bar">
          <div className="search-box-wrap">
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, constituency, state, or MP name..."
            />
          </div>

          <div className="filter-group">
            <Filter size={15} />
            <span>Risk Level:</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="ALL">All Categories</option>
              <option value="HIGH">High Similarity (Priority)</option>
              <option value="MEDIUM">Medium Similarity</option>
              <option value="LOW">Low Similarity</option>
            </select>
          </div>

          <span className="results-count-tag">
            {formatNumber(totalClusters)} clusters found
          </span>
        </div>

        <div className="table-responsive">
          <table className="gov-data-table">
            <thead>
              <tr>
                <th>Group ID</th>
                <th>Linked Works</th>
                <th>Location</th>
                <th>Recommending MP</th>
                <th>Title Match</th>
                <th>Cost Match</th>
                <th>Confidence</th>
                <th>Risk Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <div className="spinner" /> Loading duplicate clusters...
                  </td>
                </tr>
              ) : filteredClusters.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    No duplicate clusters match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredClusters.map((cluster, idx) => (
                  <tr key={idx} onClick={() => loadClusterDetails(cluster.CLUSTER_ID)}>
                    <td>
                      <strong className="cluster-tag">Cluster #{cluster.CLUSTER_ID}</strong>
                    </td>
                    <td>
                      <span className="badge-pill count">
                        {cluster.CLUSTER_SIZE} works
                      </span>
                    </td>
                    <td>
                      <div>{cluster.STATE_NAME}</div>
                      <small className="block-muted">{cluster.CONSTITUENCY}</small>
                    </td>
                    <td>
                      <span>{cluster.MP_NAME || "Hon'ble MP"}</span>
                      {cluster.MP_NAMES?.length > 1 && (
                        <small className="block-muted">
                          +{cluster.MP_NAMES.length - 1} other MPs
                        </small>
                      )}
                    </td>
                    <td>
                      <strong>
                        {cluster.AVG_TEXT_SIMILARITY
                          ? `${(cluster.AVG_TEXT_SIMILARITY * 100).toFixed(1)}%`
                          : "—"}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {cluster.AVG_AMOUNT_SIMILARITY
                          ? `${(cluster.AVG_AMOUNT_SIMILARITY * 100).toFixed(1)}%`
                          : "—"}
                      </strong>
                    </td>
                    <td>
                      <strong className="score-highlight">
                        {formatDecimal(cluster.CLUSTER_SUSPICION_SCORE)}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`risk-tag ${cluster.DUPLICATE_RISK?.toLowerCase() || "medium"}`}
                      >
                        {cluster.DUPLICATE_RISK || "FLAGGED"}
                      </span>
                    </td>
                    <td>
                      <button className="table-action-btn">Inspect Cluster →</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="gov-pagination-bar">
            <button
              disabled={page <= 1}
              onClick={() => loadClusters(page - 1)}
              className="gov-page-btn"
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadClusters(page + 1)}
              className="gov-page-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Deep Cluster Inspection Modal */}
      {selectedClusterId && (
        <div className="drawer-overlay" onClick={() => setSelectedClusterId(null)}>
          <div className="gov-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="gov-eyebrow">CLUSTER DEEP AUDIT</span>
                <h2>Duplicate Cluster #{selectedClusterId}</h2>
                <p>
                  {clusterDetail?.cluster_size || 0} interconnected works sharing high text and
                  financial similarity in {clusterDetail?.state || "same constituency"}.
                </p>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setSelectedClusterId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {clusterLoading ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <p>Fetching constituent works in this cluster...</p>
                </div>
              ) : (
                <>
                  {clusterDetail?.evidence && (
                    <div className="warning-evidence-box mb-3">
                      <strong>AI Evidence: </strong>
                      {clusterDetail.evidence}
                    </div>
                  )}

                  <div className="cluster-works-list">
                    <h4>Constituent Works in Cluster #{selectedClusterId}:</h4>
                    {clusterDetail?.works?.map((w, i) => (
                      <div
                        key={i}
                        className="cluster-work-card"
                        onClick={() => {
                          setSelectedClusterId(null);
                          onSelectWork && onSelectWork(w);
                        }}
                      >
                        <div className="card-top">
                          <strong>
                            Work #{w.WORK_ID || w.WORK_RECOMMENDATION_DTL_ID}
                          </strong>
                          <span>{formatCurrency(w.SANCTION_AMOUNT)}</span>
                        </div>
                        <p className="work-desc">{w.WORK_DESCRIPTION}</p>
                        <div className="card-meta">
                          <span>
                            <User size={12} /> {w.MP_NAME || "Hon'ble MP"}
                          </span>
                          <span>
                            <MapPin size={12} /> {w.CONSTITUENCY}, {w.STATE_NAME}
                          </span>
                          <span className="click-hint">Inspect Full Dossier →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
