import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./ConstituencyMap.css";
import {
  MapPin,
  Layers,
  Search,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Table as TableIcon,
  Map as MapIcon,
  Info,
  Compass
} from "lucide-react";

/**
 * Production 2D GIS Map Component using Leaflet & Leaflet.markercluster
 * Real MPLADS Works visualized with honest location precision.
 */
export default function ConstituencyMap({ selectedMP, constituency, onSelectWork }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clusterGroupRef = useRef(null);

  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stageFilter, setStageFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("map"); // 'map' or 'list'

  // Format currency in Lakhs or Crores
  const formatAmount = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  // Fetch GeoJSON from backend API
  const fetchGeoData = useCallback(async () => {
    if (!selectedMP) return;
    setLoading(true);
    setError(null);

    try {
      let url = `http://127.0.0.1:8000/api/works/geo?mp_name=${encodeURIComponent(selectedMP)}`;
      if (stageFilter === "Approved") {
        url += `&stage=Sanction`;
      }
      if (riskFilter !== "All") {
        url += `&risk_level=${encodeURIComponent(riskFilter)}`;
      }
      if (searchQuery.trim()) {
        url += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setGeoData(data);
    } catch (err) {
      console.error("[GIS] Failed to fetch geo works:", err);
      setError("Unable to load work locations from backend.");
    } finally {
      setLoading(false);
    }
  }, [selectedMP, stageFilter, riskFilter, searchQuery]);

  // Refetch when MP or filters change
  useEffect(() => {
    fetchGeoData();
  }, [fetchGeoData]);

  // Create custom marker icon according to backend risk
  const createMarkerIcon = useCallback((riskLevel) => {
    const risk = String(riskLevel || "LOW").toUpperCase();
    const riskClass =
      risk === "HIGH" ? "risk-high" : risk === "MEDIUM" ? "risk-medium" : "risk-low";

    return L.divIcon({
      className: "custom-leaflet-pin",
      html: `<div class="gis-marker-pin ${riskClass}"><div class="gis-marker-dot"></div></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double initialization

    // Default pan to India center
    const map = L.map(mapContainerRef.current, {
      center: [18.6725, 78.0941],
      zoom: 10,
      zoomControl: true,
      attributionControl: true,
    });

    // Tile Provider: MapTiler if key available, else OpenStreetMap
    const maptilerKey = import.meta.env?.VITE_MAPTILER_API_KEY;
    const tileUrl = maptilerKey
      ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = maptilerKey
      ? '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: attribution,
    }).addTo(map);

    // MarkerCluster Group
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let sizeClass = "marker-cluster-small";
        if (count > 25) sizeClass = "marker-cluster-medium";
        if (count > 80) sizeClass = "marker-cluster-large";

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${sizeClass}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    map.addLayer(clusterGroup);

    mapInstanceRef.current = map;
    clusterGroupRef.current = clusterGroup;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        clusterGroupRef.current = null;
      }
    };
  }, []);

  // Update Markers & Fit Bounds when geoData changes
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;
    const clusterGroup = clusterGroupRef.current;
    const map = mapInstanceRef.current;

    // Clear previous markers
    clusterGroup.clearLayers();

    if (!geoData || !geoData.features || geoData.features.length === 0) {
      return;
    }

    const validPoints = [];

    geoData.features.forEach((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length < 2) return;

      const lng = coords[0];
      const lat = coords[1];

      // Validate coordinate range
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return;
      }

      validPoints.push([lat, lng]);

      const props = feature.properties || {};
      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(props.risk_level),
      });

      // Bind custom DOM popup with event listener
      marker.bindPopup(() => {
        const card = document.createElement("div");
        card.className = "gis-popup-card";

        const riskClass =
          props.risk_level === "HIGH"
            ? "risk-high"
            : props.risk_level === "MEDIUM"
            ? "risk-medium"
            : "risk-low";

        const precisionLabel =
          props.location_precision === "exact" ? "Exact Work Location" : "Locality-level";

        card.innerHTML = `
          <div class="gis-popup-header">
            <span class="gis-popup-id">WORK #${props.work_id}</span>
            <span class="gis-popup-risk ${riskClass}">${props.risk_level || "LOW"} RISK</span>
          </div>
          <div class="gis-popup-body">
            <div class="gis-popup-desc" title="${props.description || ""}">${props.description || "Work Project"}</div>
            
            <div class="gis-popup-precision-tag ${props.location_precision === "exact" ? "exact" : ""}">
              <span>📍 <strong>Location:</strong> ${props.locality || "Constituency Site"}</span>
            </div>

            <div class="gis-popup-meta-grid">
              <div class="gis-meta-item">
                <span class="gis-meta-label">Precision</span>
                <span class="gis-meta-val">${precisionLabel}</span>
              </div>
              <div class="gis-meta-item">
                <span class="gis-meta-label">Stage</span>
                <span class="gis-meta-val">${props.stage || "—"}</span>
              </div>
              <div class="gis-meta-item">
                <span class="gis-meta-label">Recommended</span>
                <span class="gis-meta-val">${formatAmount(props.recommended_amount)}</span>
              </div>
              <div class="gis-meta-item">
                <span class="gis-meta-label">Sanctioned</span>
                <span class="gis-meta-val">${formatAmount(props.sanction_amount)}</span>
              </div>
            </div>
          </div>
        `;

        // Action button to open existing Work Detail Drawer
        const actionBtn = document.createElement("button");
        actionBtn.type = "button";
        actionBtn.className = "gis-popup-action-btn";
        actionBtn.innerHTML = `<span>View Full Work Details</span> →`;
        actionBtn.onclick = (e) => {
          e.stopPropagation();
          if (onSelectWork && props.raw_work) {
            onSelectWork(props.raw_work);
          }
        };

        card.querySelector(".gis-popup-body").appendChild(actionBtn);
        return card;
      });

      clusterGroup.addLayer(marker);
    });

    // Dynamic fitBounds to actual mapped work coordinates
    if (validPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch (e) {
        console.warn("[GIS] fitBounds error:", e);
      }
    }
  }, [geoData, createMarkerIcon, onSelectWork]);

  // Fit to Works button handler
  const handleFitToWorks = () => {
    if (!mapInstanceRef.current || !geoData?.features?.length) return;
    const validPoints = geoData.features
      .filter((f) => f.geometry?.coordinates)
      .map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);

    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  };

  const meta = geoData?.meta || {
    total_works: 0,
    mapped_works: 0,
    exact_works: 0,
    locality_works: 0,
    location_unavailable: 0,
  };

  return (
    <div className="constituency-map-container">
      {/* Top Toolbar */}
      <div className="constituency-map-toolbar">
        <div className="map-toolbar-top">
          <div className="map-title-group">
            <h3>
              <MapIcon size={18} className="text-blue-700" />
              <span>Map of Constituency Works (GIS)</span>
            </h3>
            <p>
              Real-world 2D GIS visualization of MPLADS projects across {constituency || selectedMP}'s constituency.
            </p>
          </div>

          <div className="map-actions-group">
            {viewMode === "map" && (
              <button
                type="button"
                className="map-control-btn"
                onClick={handleFitToWorks}
                title="Zoom map to all mapped works"
              >
                <Compass size={14} />
                <span>Fit to Works</span>
              </button>
            )}

            <button
              type="button"
              className="map-control-btn"
              onClick={fetchGeoData}
              title="Refresh geographic data"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {/* View Mode Toggle */}
            <div className="view-toggle-wrap">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "map" ? "active" : ""}`}
                onClick={() => setViewMode("map")}
              >
                <MapIcon size={12} className="inline mr-1" />
                <span>MAP</span>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <TableIcon size={12} className="inline mr-1" />
                <span>LIST</span>
              </button>
            </div>
          </div>
        </div>

        {/* Honest Geographic Accounting Bar */}
        <div className="map-stats-bar">
          <span className="stat-chip">
            Total Works: <strong>{meta.total_works}</strong>
          </span>
          <span className="stat-separator">•</span>
          <span className="stat-chip stat-mapped">
            Mapped Works: <strong>{meta.mapped_works}</strong>
          </span>
          {meta.exact_works > 0 && (
            <>
              <span className="stat-separator">•</span>
              <span className="stat-chip">
                Exact Sites: <strong>{meta.exact_works}</strong>
              </span>
            </>
          )}
          <span className="stat-separator">•</span>
          <span className="stat-chip stat-locality">
            Locality-level: <strong>{meta.locality_works}</strong>
          </span>
          <span className="stat-separator">•</span>
          <span className="stat-chip stat-unmapped">
            Location Unavailable: <strong>{meta.location_unavailable}</strong>
          </span>
        </div>

        {/* Filter Pills & Search */}
        <div className="map-filter-row">
          <div className="map-pill-group">
            {["All", "Approved"].map((f) => (
              <button
                key={f}
                type="button"
                className={`map-filter-pill ${stageFilter === f ? "active" : ""}`}
                onClick={() => setStageFilter(f)}
              >
                {f === "All" ? `All Stages (${meta.total_works})` : f}
              </button>
            ))}

            <span className="stat-separator">|</span>

            {["All", "HIGH", "MEDIUM", "LOW"].map((r) => (
              <button
                key={r}
                type="button"
                className={`map-filter-pill ${riskFilter === r ? "active" : ""}`}
                onClick={() => setRiskFilter(r)}
              >
                {r === "All" ? "All Risk" : `${r} Risk`}
              </button>
            ))}
          </div>

          <div className="map-search-box">
            <Search size={13} className="map-search-icon" />
            <input
              type="text"
              className="map-search-input"
              placeholder="Search work or village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Viewport: Map or List */}
      {viewMode === "map" ? (
        <div className="gis-map-viewport">
          <div ref={mapContainerRef} className="gis-map-canvas" />

          {/* Loading Overlay */}
          {loading && (
            <div className="map-loading-overlay">
              <div className="map-spinner" />
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                Loading verified work locations...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="map-error-overlay">
              <AlertTriangle size={32} className="text-amber-600" />
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
                Unable to load work locations
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{error}</div>
              <button type="button" className="map-control-btn" onClick={fetchGeoData}>
                Retry
              </button>
            </div>
          )}

          {/* Empty Data State: Basemap visible, informative banner */}
          {!loading && !error && meta.mapped_works === 0 && (
            <div className="map-honesty-notice" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
              <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
              <span>
                <strong>Location data unavailable:</strong> No specific village or locality coordinates could be reliably verified for these {meta.total_works} works.
              </span>
            </div>
          )}

          {/* Honest Auditing Notice */}
          {!loading && meta.mapped_works > 0 && (
            <div className="map-honesty-notice">
              <Info size={14} className="text-blue-600 flex-shrink-0" />
              <span>
                <strong>Auditable GIS:</strong> Markers indicate verified village/locality coordinates. {meta.location_unavailable} works lacking location metadata are excluded to prevent false placement.
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Tabular List View of Filtered Works */
        <div className="gis-list-view">
          <table className="gis-works-table">
            <thead>
              <tr>
                <th>Work ID</th>
                <th>Description</th>
                <th>Locality</th>
                <th>Precision</th>
                <th>Stage</th>
                <th>Sanction Amount</th>
                <th>Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {geoData?.features && geoData.features.length > 0 ? (
                geoData.features.map((f, idx) => {
                  const p = f.properties || {};
                  return (
                    <tr key={p.work_id || idx}>
                      <td>
                        <strong>#{p.work_id}</strong>
                      </td>
                      <td style={{ maxWidth: "260px" }}>{p.description || "—"}</td>
                      <td>{p.locality || "—"}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: p.location_precision === "exact" ? "#ecfdf5" : "#eff6ff",
                            color: p.location_precision === "exact" ? "#065f46" : "#1e40af",
                          }}
                        >
                          {p.location_precision === "exact" ? "Exact Site" : "Locality-level"}
                        </span>
                      </td>
                      <td>{p.stage || "—"}</td>
                      <td><strong>{formatAmount(p.sanction_amount)}</strong></td>
                      <td>
                        <span
                          className={`gis-popup-risk ${
                            p.risk_level === "HIGH"
                              ? "risk-high"
                              : p.risk_level === "MEDIUM"
                              ? "risk-medium"
                              : "risk-low"
                          }`}
                        >
                          {p.risk_level || "LOW"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="gis-table-action-btn"
                          onClick={() => {
                            if (onSelectWork && p.raw_work) {
                              onSelectWork(p.raw_work);
                            }
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    No mapped works found matching the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
