import React from "react";
import {
  IndianRupee,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
} from "lucide-react";
import { formatNumber, formatCrores } from "../../../constants";

export default function FinancialTimelineTab({ analytics }) {
  const kpis = analytics?.national_kpis || {};
  const timelines = analytics?.timeline_benchmarks || {};

  return (
    <div className="mospi-panel">
      {/* 1. Financial Flow Lifecycle Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Recommended</span>
            <IndianRupee size={16} className="text-blue-500" />
          </div>
          <div className="mospi-kpi-value">{formatCrores(kpis.total_recommended_amount || 0)}</div>
          <div className="mospi-kpi-sub">100% of MP recommendations</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Sanctioned</span>
            <IndianRupee size={16} className="text-emerald-500" />
          </div>
          <div className="mospi-kpi-value">{formatCrores(kpis.total_sanction_amount || 0)}</div>
          <div className="mospi-kpi-sub">{kpis.sanction_rate || 72.6}% Sanction Conversion Rate</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Total Disbursed</span>
            <IndianRupee size={16} className="text-sky-500" />
          </div>
          <div className="mospi-kpi-value">{formatCrores(kpis.total_actual_amount || 0)}</div>
          <div className="mospi-kpi-sub">{kpis.utilization_pct || 39.7}% Utilization of Sanctioned</div>
        </div>

        <div className="mospi-card">
          <div className="mospi-kpi-header">
            <span className="mospi-kpi-title">Sanction Gap</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="mospi-kpi-value">{formatCrores(kpis.sanction_gap || 0)}</div>
          <div className="mospi-kpi-sub">Pending Collectorate sanction</div>
        </div>
      </div>

      {/* 2. Timeline Benchmarks */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div className="mospi-card">
          <div className="mospi-card-header">
            <div>
              <h3 className="mospi-card-title">National Sanction Delay Benchmark</h3>
              <p className="mospi-card-subtitle">
                Average duration between MP recommendation and administrative sanction
              </p>
            </div>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", margin: "10px 0" }}>
            <span style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a" }}>
              {timelines.avg_sanction_delay_days || 105.7}
            </span>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>Days on Average</span>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
            Calculated across 77,617 sanctioned works with valid recommendation and sanction date records.
            Prescribed standard per operational guidelines is 45 days.
          </p>
        </div>

        <div className="mospi-card">
          <div className="mospi-card-header">
            <div>
              <h3 className="mospi-card-title">National Execution Duration Benchmark</h3>
              <p className="mospi-card-subtitle">
                Average duration between administrative sanction and physical completion
              </p>
            </div>
            <Calendar size={16} className="text-emerald-500" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", margin: "10px 0" }}>
            <span style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a" }}>
              {timelines.avg_completion_duration_days || 174.5}
            </span>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>Days on Average</span>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
            Calculated across 33,727 completed works with recorded final measurement books and completion certificates.
          </p>
        </div>
      </div>

      {/* 3. Compliance Classification Matrix */}
      <div className="mospi-card">
        <div className="mospi-card-header">
          <div>
            <h3 className="mospi-card-title">National Compliance & Data Classification</h3>
            <p className="mospi-card-subtitle">
              Adherence to public program audit standards and data fidelity classifications
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span className="mospi-pill emerald" style={{ marginBottom: "6px" }}>Compliant & Verified</span>
            <p style={{ fontSize: "11.5px", color: "#475569", margin: "4px 0 0 0" }}>
              Works with documented geo-tagged photo evidence, milestone signoffs, and valid MB measurement entries.
            </p>
          </div>

          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span className="mospi-pill blue" style={{ marginBottom: "6px" }}>Pending Information</span>
            <p style={{ fontSize: "11.5px", color: "#475569", margin: "4px 0 0 0" }}>
              Active civil execution works awaiting milestone completion documentation or contractor payment submission.
            </p>
          </div>

          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span className="mospi-pill amber" style={{ marginBottom: "6px" }}>Timeline Concern</span>
            <p style={{ fontSize: "11.5px", color: "#475569", margin: "4px 0 0 0" }}>
              Sanction or completion timelines significantly exceeding peer cohort medians without recorded delay justification.
            </p>
          </div>

          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span className="mospi-pill rose" style={{ marginBottom: "6px" }}>Requires Audit Review</span>
            <p style={{ fontSize: "11.5px", color: "#475569", margin: "4px 0 0 0" }}>
              Works flagged by automated duplicate detection, multi-work cluster linkage, or cost variance outliers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
