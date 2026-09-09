import React, { useState } from "react";
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
  Sparkles,
} from "lucide-react";
import ConstituencyMap from "../../../components/ConstituencyMap";

export default function CitizenMapTab({
  onSelectWork,
  onReportWork,
}) {
  const [sectorFilter, setSectorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLocality, setActiveLocality] = useState("Nizamabad");

  const sectors = [
    { id: "all", label: "All Categories" },
    { id: "roads", label: "Roads & Bridges" },
    { id: "water", label: "Drinking Water" },
    { id: "education", label: "Education & Schools" },
    { id: "health", label: "Healthcare & Clinics" },
    { id: "community", label: "Community Halls" },
    { id: "electricity", label: "Solar & Electrification" },
  ];

  const statuses = [
    { id: "all", label: "All Statuses" },
    { id: "completed", label: "Completed" },
    { id: "ongoing", label: "Ongoing" },
    { id: "sanctioned", label: "Sanctioned" },
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
                placeholder="Search village, mandal, project description..."
              />
            </div>
          </div>

          {/* Category & Status Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={13} color="#64748b" />
              <select
                className="gov-select citizen-select"
                style={{ width: "auto", height: "32px", fontSize: "12px" }}
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
              >
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

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

            <span className="gov-constituency-tag">
              <MapPin size={11} style={{ marginRight: "3px" }} />
              Nizamabad (916 Works)
            </span>
          </div>
        </div>
      </div>

      {/* Real 2D GIS Leaflet Map with MarkerCluster */}
      <div className="gov-mp-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="card-section-title">
            <MapPin size={15} color="#0284c7" />
            <span>Public Works GIS Spatial Map</span>
            <span style={{ fontSize: "10.5px", background: "#ecfdf5", color: "#047857", fontWeight: "700", padding: "1px 6px", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
              Live GeoJSON
            </span>
          </div>
          <span style={{ fontSize: "11.5px", color: "#64748b" }}>
            Click any pin to inspect work details or report grounds
          </span>
        </div>

        <div style={{ height: "620px", width: "100%", position: "relative" }}>
          <ConstituencyMap
            onSelectWork={(work) => {
              if (onSelectWork) onSelectWork(work);
            }}
          />
        </div>

        {/* Legend strip */}
        <div style={{ padding: "10px 18px", background: "#ffffff", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", fontSize: "12px", color: "#475569" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a" }} />
              Completed Asset
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2563eb" }} />
              Ongoing Project
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#eab308" }} />
              Sanctioned / Planning
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dc2626" }} />
              Delayed / Attention Required
            </span>
          </div>

          <span style={{ fontStyle: "italic", fontSize: "11.5px", color: "#64748b" }}>
            * Verified locality coordinates geocoded via Survey of India & Census directory
          </span>
        </div>
      </div>
    </div>
  );
}
