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
import { useAuth } from "../context/useAuth";

export default function DuplicateIntelligence({ onSelectWork }) {
  const { role, roleConfig } = useAuth() || {};
  const currentAuthority = (roleConfig?.id || role || "DISTRICT_AUTHORITY").toUpperCase();

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
    <div className="gov-mp-shell">
      {/* Page Title & Breadcrumb Header Card */}
      <div className="gov-mp-header-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <span className="gov-parliament-badge" style={{ background: "#fef2f2", color: "#b91c1c", borderColor: "#fca5a5" }}>
                <GitBranch size={12} />
                <span>AI Deduplication Engine · eSAKSHI Integration</span>
              </span>
            </div>
            <h1 className="gov-mp-page-title" style={{ fontSize: "18px", margin: "2px 0" }}>
              Duplicate Work Proposals
            </h1>
            <p className="gov-mp-page-subtitle">
              Identifies works with matching titles, identical sanction amounts, or overlapping locations within the same constituency to prevent double funding.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button className="gov-redirect-link-btn" onClick={handleExport}>
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Table Card */}
      <div className="gov-mp-card">
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
          <div style={{ position: "relative", flexGrow: 1, maxWidth: "420px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#64748b" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, constituency, state, or MP name..."
              style={{
                width: "100%",
                height: "32px",
                paddingLeft: "32px",
                paddingRight: "10px",
                fontSize: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                background: "#ffffff",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#64748b" />
            <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#475569" }}>Risk Level:</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{
                height: "32px",
                fontSize: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                padding: "0 8px",
                background: "#ffffff",
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="HIGH">High Similarity (Priority)</option>
              <option value="MEDIUM">Medium Similarity</option>
              <option value="LOW">Low Similarity</option>
            </select>
          </div>

          <span className="gov-parliament-badge" style={{ marginLeft: "auto" }}>
            {formatNumber(totalClusters)} clusters found
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="gov-mp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
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
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
                    Loading duplicate clusters...
                  </td>
                </tr>
              ) : filteredClusters.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "12px" }}>
                    No duplicate clusters match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredClusters.map((cluster, idx) => (
                  <tr key={idx} onClick={() => loadClusterDetails(cluster.CLUSTER_ID)}>
                    <td>
                      <strong style={{ fontFamily: "monospace", color: "#005A9C", fontSize: "12px" }}>
                        Cluster #{cluster.CLUSTER_ID}
                      </strong>
                    </td>
                    <td>
                      <span className="gov-parliament-badge" style={{ background: "#eff6ff", color: "#005A9C", borderColor: "#bfdbfe" }}>
                        {cluster.CLUSTER_SIZE} works
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: "600" }}>{cluster.STATE_NAME}</div>
                      <small style={{ color: "#64748b", fontSize: "11px" }}>{cluster.CONSTITUENCY}</small>
                    </td>
                    <td>
                      <span>{cluster.MP_NAME || "Hon'ble MP"}</span>
                      {cluster.MP_NAMES?.length > 1 && (
                        <small style={{ display: "block", color: "#64748b", fontSize: "10.5px" }}>
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
                      <strong style={{ color: "#005A9C" }}>
                        {formatDecimal(cluster.CLUSTER_SUSPICION_SCORE)}
                      </strong>
                    </td>
                    <td>
                      <span
                        className="gov-parliament-badge"
                        style={{
                          background: cluster.DUPLICATE_RISK === "HIGH" ? "#fef2f2" : "#fffbeb",
                          color: cluster.DUPLICATE_RISK === "HIGH" ? "#b91c1c" : "#b45309",
                          borderColor: cluster.DUPLICATE_RISK === "HIGH" ? "#fecaca" : "#fde68a",
                        }}
                      >
                        {cluster.DUPLICATE_RISK || "FLAGGED"}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="gov-redirect-link-btn">
                        Inspect Cluster →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
            <button
              disabled={page <= 1}
              onClick={() => loadClusters(page - 1)}
              className="gov-redirect-link-btn"
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadClusters(page + 1)}
              className="gov-redirect-link-btn"
              style={{ opacity: page >= totalPages ? 0.5 : 1 }}
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
                          onSelectWork &&
                            onSelectWork({
                              ...w,
                              __initialSection: "duplicates",
                              __authority: currentAuthority,
                            });
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
                          <span className="click-hint">Inspect Duplicate Cluster Dossier →</span>
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
