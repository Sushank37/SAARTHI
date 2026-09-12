import React, { useState, useEffect } from "react";
import {
  MapPin,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Flag,
  Eye,
  Layers,
} from "lucide-react";
import { API_BASE } from "../../../constants";
import ConstituencyMap from "../../../components/ConstituencyMap";

export default function CitizenMapTab({
  onSelectWork,
  onReportWork,
}) {
  const [constituencyList, setConstituencyList] = useState([]);
  const [selectedConstituency, setSelectedConstituency] = useState("Nizamabad");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadConstituencies() {
      try {
        const res = await fetch(`${API_BASE}/api/constituencies`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setConstituencyList(list);
          }
        }
      } catch (e) {
        console.error("Failed to load constituencies for map:", e);
      }
    }
    loadConstituencies();
  }, []);

  const sectors = [
    { id: "all", label: "All Categories" },
    { id: "Roads and Bridges", label: "Roads & Bridges" },
    { id: "Drinking Water", label: "Drinking Water" },
    { id: "Education", label: "Education & Schools" },
    { id: "Health and Family Welfare", label: "Healthcare & Clinics" },
    { id: "Community Infrastructure", label: "Community Halls" },
    { id: "Electricity", label: "Solar & Electrification" },
  ];

  const statuses = [
    { id: "All", label: "All Statuses" },
    { id: "Approved", label: "Approved / Sanctioned" },
    { id: "Completed", label: "Work Completed" },
    { id: "Physical Inspection", label: "Physical Inspection" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Search and Filter Strip */}
      <div className="gov-mp-card" style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          {/* Location Search */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexGrow: 1, maxWidth: "450px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#64748b" }} />
              <input
                type="text"
                className="gov-input citizen-input"
                style={{ paddingLeft: "30px", width: "100%", height: "32px", fontSize: "12px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search village, mandal, or project description..."
              />
            </div>
          </div>

          {/* Constituency, Category & Status Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Constituency:</span>
              <select
                className="gov-select citizen-select"
                style={{ width: "auto", height: "32px", fontSize: "12px", fontWeight: "700", color: "#005A9C" }}
                value={selectedConstituency}
                onChange={(e) => setSelectedConstituency(e.target.value)}
              >
                {constituencyList.length > 0 ? (
                  constituencyList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Nizamabad">Nizamabad</option>
                    <option value="Varanasi">Varanasi</option>
                    <option value="Guntur">Guntur</option>
                    <option value="Jaunpur">Jaunpur</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={13} color="#64748b" />
              <select
                className="gov-select citizen-select"
                style={{ width: "auto", height: "32px", fontSize: "12px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <span className="gov-constituency-tag">
              <MapPin size={11} style={{ marginRight: "3px" }} />
              {selectedConstituency}
            </span>
          </div>
        </div>
      </div>

      {/* Real 2D GIS Leaflet Map with MarkerCluster */}
      <div className="gov-mp-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="card-section-title">
            <MapPin size={15} color="#0284c7" />
            <span>Public Works GIS Spatial Distribution</span>
            <span style={{ fontSize: "10.5px", background: "#ecfdf5", color: "#047857", fontWeight: "700", padding: "1px 6px", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
              Verified Telemetry
            </span>
          </div>
          <span style={{ fontSize: "11.5px", color: "#64748b" }}>
            Click any pin to inspect work details or verify milestone execution
          </span>
        </div>

        <div style={{ height: "620px", width: "100%", position: "relative" }}>
          <ConstituencyMap
            constituency={selectedConstituency}
            onSelectWork={(work) => {
              if (onSelectWork)
                onSelectWork({
                  ...work,
                  __initialSection: "overview",
                  __authority: "CITIZEN",
                });
            }}
          />
        </div>

        {/* Legend strip */}
        <div style={{ padding: "10px 18px", background: "#ffffff", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", fontSize: "12px", color: "#475569" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a" }} />
              Normal / Low Risk
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#d97706" }} />
              Medium Risk (Attention)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dc2626" }} />
              High Risk / Cost Anomaly
            </span>
          </div>

          <span style={{ fontStyle: "italic", fontSize: "11.5px", color: "#64748b" }}>
            * Verified locality coordinates geocoded via Survey of India & Census directory (unmapped works accounted separately)
          </span>
        </div>
      </div>
    </div>
  );
}
