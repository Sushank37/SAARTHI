import {
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Layers,
  CheckCircle2,
  Calendar,
  Compass,
} from "lucide-react";
import "./RajyaSabhaNotice.css";

/**
 * RajyaSabhaNotice Component
 * Displayed when user switches to "Rajya Sabha" in the header toggle.
 * Communicates clearly that Rajya Sabha (Council of States) state-wide module
 * is in active Phase 2 development and directs the user to the live 18th Lok Sabha system.
 */
export default function RajyaSabhaNotice({ onSwitchToLokSabha }) {
  return (
    <div className="rs-notice-container">
      {/* Hero Banner */}
      <div className="rs-hero-card">
        <div className="rs-hero-header">
          <div className="rs-hero-left">
            <div className="rs-emblem-badge">
              <Building2 size={28} />
            </div>

            <div>
              <div className="rs-status-pill-row">
                <span className="rs-live-pill">
                  <span className="rs-pulse-dot" />
                  Phase 2 · In Active Integration
                </span>
                <span className="rs-statutory-ref">
                  MoSPI Statutory Guidelines § 2.3 & § 2.4
                </span>
              </div>

              <h1 className="rs-hero-title">
                Rajya Sabha Architecture
                <span className="rs-hero-hindi">राज्‍य सभा (Council of States)</span>
              </h1>

              <p className="rs-hero-desc">
                Currently, the SAARTHI AI Surveillance Platform is fully live and operational for{" "}
                <strong>18th & 17th Lok Sabha</strong> (543 Parliamentary Constituencies across 36
                States/UTs, 102,703 works). The dedicated Rajya Sabha whole-state allocation & nominated
                member monitoring module is actively being integrated for the upcoming release.
              </p>

              <div className="rs-action-block">
                <button
                  type="button"
                  className="rs-switch-btn"
                  onClick={onSwitchToLokSabha}
                >
                  <span>Switch to Live 18th Lok Sabha (102,703 Works)</span>
                  <ArrowRight size={16} />
                </button>
                <span className="rs-secondary-text">
                  Real-time AI monitoring active on Lok Sabha
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Grid: Lok Sabha (Live) vs Rajya Sabha (Phase 2) */}
      <div className="rs-compare-strip">
        <div className="rs-state-card active-ls">
          <div className="rs-card-top">
            <span className="rs-card-title">
              <CheckCircle2 size={16} color="#16a34a" />
              18th / 17th Lok Sabha (Operational)
            </span>
            <span className="rs-card-badge green">Live Deployment</span>
          </div>
          <p className="rs-card-body">
            Jurisdiction: <strong>543 Single-Member Constituencies</strong>. 102,703 verified works,
            ₹5,614 Cr funds tracked, spatial GIS clustering, and active District Authority & IA
            verification workflows.
          </p>
        </div>

        <div className="rs-state-card pending-rs">
          <div className="rs-card-top">
            <span className="rs-card-title">
              <Clock size={16} color="#d97706" />
              Rajya Sabha (Phase 2 Release)
            </span>
            <span className="rs-card-badge amber">Under Construction</span>
          </div>
          <p className="rs-card-body">
            Jurisdiction: <strong>Whole-State Multi-District Allocation</strong>. Ingestion of 245
            Hon'ble Members of Rajya Sabha (including 12 Nominated pan-India members) and continuous
            6-year quota ledger reconciliation.
          </p>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <h3 className="rs-features-heading">
        <Layers size={18} color="#1e3a8a" />
        Upcoming Rajya Sabha Capabilities (In Development)
      </h3>

      <div className="rs-features-grid">
        <div className="rs-feature-box">
          <div className="rs-feature-icon">
            <Globe2 size={20} />
          </div>
          <h4 className="rs-feature-title">Whole-State Jurisdiction Model</h4>
          <p className="rs-feature-desc">
            Elected Rajya Sabha MPs can recommend works in any district across their elected State
            (Section 2.3), requiring multi-collectorate routing and state-level quota aggregation.
          </p>
          <span className="rs-guideline-tag">SLA Section 2.3</span>
        </div>

        <div className="rs-feature-box">
          <div className="rs-feature-icon">
            <Compass size={20} />
          </div>
          <h4 className="rs-feature-title">Nominated Member Pan-India Scope</h4>
          <p className="rs-feature-desc">
            12 Nominated Hon'ble MPs possess statutory authority to recommend community assets in any
            State or Union Territory nationwide (Section 2.4).
          </p>
          <span className="rs-guideline-tag">SLA Section 2.4</span>
        </div>

        <div className="rs-feature-box">
          <div className="rs-feature-icon">
            <Calendar size={20} />
          </div>
          <h4 className="rs-feature-title">6-Year Staggered Quota Ledger</h4>
          <p className="rs-feature-desc">
            Continuous biennial turnover tracking with 6-year parliamentary tenure accounting
            (₹30.00 Cr allocation cycle) rather than 5-year general election terms.
          </p>
          <span className="rs-guideline-tag">6-Yr Cycle Sync</span>
        </div>

        <div className="rs-feature-box">
          <div className="rs-feature-icon">
            <ShieldCheck size={20} />
          </div>
          <h4 className="rs-feature-title">Inter-District Duplicate Screening</h4>
          <p className="rs-feature-desc">
            Cross-state and cross-district duplicate detection engine specifically configured for
            overlapping Lok Sabha and Rajya Sabha recommendations on the same asset.
          </p>
          <span className="rs-guideline-tag">Cross-House Integrity</span>
        </div>
      </div>

      {/* Schedule / Status Footer */}
      <div className="rs-schedule-footer">
        <div className="rs-schedule-left">
          <Clock size={20} className="rs-schedule-icon" />
          <div className="rs-schedule-text">
            <h4>System Architecture Notice</h4>
            <p>
              To inspect live works, risk analytics, duplicates, or district dashboards, please use
              the Lok Sabha mode.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="rs-schedule-btn"
          onClick={onSwitchToLokSabha}
        >
          Return to 18th Lok Sabha →
        </button>
      </div>
    </div>
  );
}
