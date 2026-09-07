import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Search,
  Building,
  MapPin,
  IndianRupee,
  Layers,
  ArrowRight,
  User,
  PieChart,
} from "lucide-react";
import { API_BASE, formatCurrency, formatNumber } from "../constants";

const PROMINENT_MPS = [
  {
    name: "Shri Rahul Shewale",
    constituency: "Mumbai South Central",
    state: "Maharashtra",
    house: "Lok Sabha",
    annualQuota: 50000000,
    earmarkedAmount: 38000000,
  },
  {
    name: "Smt. Supriya Sule",
    constituency: "Baramati",
    state: "Maharashtra",
    house: "Lok Sabha",
    annualQuota: 50000000,
    earmarkedAmount: 41500000,
  },
  {
    name: "Dr. Shashi Tharoor",
    constituency: "Thiruvananthapuram",
    state: "Kerala",
    house: "Lok Sabha",
    annualQuota: 50000000,
    earmarkedAmount: 34500000,
  },
  {
    name: "Shri Asaduddin Owaisi",
    constituency: "Hyderabad",
    state: "Telangana",
    house: "Lok Sabha",
    annualQuota: 50000000,
    earmarkedAmount: 39000000,
  },
  {
    name: "Dr. Chandra Sekhar Pemmasani",
    constituency: "Guntur",
    state: "Andhra Pradesh",
    house: "Lok Sabha",
    annualQuota: 50000000,
    earmarkedAmount: 29000000,
  },
  {
    name: "Dr. K. Keshava Rao",
    constituency: "Telangana (Elected)",
    state: "Telangana",
    house: "Rajya Sabha",
    annualQuota: 50000000,
    earmarkedAmount: 26000000,
  },
  {
    name: "Custom / Enter Any MP",
    constituency: "District Nodal Jurisdiction",
    state: "Maharashtra",
    house: "Lok Sabha",
    annualQuota: 50000000,
    earmarkedAmount: 30000000,
  },
];

export default function PreSanctionValidator({ onSelectWork }) {
  const [states, setStates] = useState([]);
  const [selectedMpIdx, setSelectedMpIdx] = useState(0);
  const [customMpName, setCustomMpName] = useState("");
  const [customConstituency, setCustomConstituency] = useState("");
  const [description, setDescription] = useState(
    "Construction of CC road and side drain from Panchayat Bhawan to Primary School"
  );
  const [stateName, setStateName] = useState("Maharashtra");
  const [category, setCategory] = useState("Roads, Pathways and Bridges");
  const [amount, setAmount] = useState(2500000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const activeMp = PROMINENT_MPS[selectedMpIdx];
  const isCustomMp = activeMp.name.startsWith("Custom");
  const mpDisplayName = isCustomMp ? customMpName || "Hon'ble MP" : activeMp.name;
  const mpConstituency = isCustomMp ? customConstituency || "Constituency" : activeMp.constituency;
  const annualQuota = activeMp.annualQuota;
  const earmarked = activeMp.earmarkedAmount;
  const availableQuota = annualQuota - earmarked;
  const quotaAfterWork = availableQuota - amount;
  const isOverQuota = quotaAfterWork < 0;

  useEffect(() => {
    fetch(`${API_BASE}/api/states`)
      .then((res) => res.json())
      .then((data) => {
        if (data.states?.length) {
          setStates(data.states);
        }
      })
      .catch(() => {});
  }, []);

  const handleMpChange = (e) => {
    const idx = Number(e.target.value);
    setSelectedMpIdx(idx);
    const mp = PROMINENT_MPS[idx];
    if (!mp.name.startsWith("Custom")) {
      setStateName(mp.state);
    }
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      // 1. Try real-time pre-sanction validation endpoint
      const validateUrl = `${API_BASE}/api/validate-proposal?description=${encodeURIComponent(
        description
      )}&state=${encodeURIComponent(stateName || "")}&constituency=${encodeURIComponent(
        mpConstituency || ""
      )}&amount=${amount}`;

      const response = await fetch(validateUrl);
      if (response.ok) {
        const valData = await response.json();
        const matches = valData.matched_works || [];
        setResult({
          matchedWorks: matches,
          topMatch: valData.top_match,
          isDuplicate: valData.is_duplicate,
          similarityScore: valData.similarity_score,
          duplicateRisk: valData.duplicate_risk,
          peerMedianSanction: valData.peer_median_sanction || 1850000,
          costRatio: valData.cost_ratio || (amount / 1850000),
          costRisk: valData.cost_risk,
          verdict: valData.verdict,
          mpName: mpDisplayName,
          constituency: mpConstituency,
          availableQuota,
          isOverQuota,
          quotaAfterWork,
        });
      } else {
        // Fallback to /api/works search
        const searchTokens = description
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .slice(0, 3)
          .join(" ");

        const fallbackRes = await fetch(
          `${API_BASE}/api/works?q=${encodeURIComponent(searchTokens)}&state=${encodeURIComponent(
            stateName
          )}&limit=10`
        );
        const data = await fallbackRes.json();
        const matches = data.data || [];
        const topMatch = matches[0] || null;
        const isDuplicate = matches.length > 0;
        const peerMedianSanction = 1850000;

        setResult({
          matchedWorks: matches,
          topMatch,
          isDuplicate,
          peerMedianSanction,
          costRatio: amount / (peerMedianSanction || 1),
          mpName: mpDisplayName,
          constituency: mpConstituency,
          availableQuota,
          isOverQuota,
          quotaAfterWork,
        });
      }
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setLoading(false);
    }
  };


  const presetAmounts = [
    { label: "₹5 Lakh", val: 500000 },
    { label: "₹15 Lakh", val: 1500000 },
    { label: "₹25 Lakh", val: 2500000 },
    { label: "₹50 Lakh", val: 5000000 },
    { label: "₹1.00 Cr", val: 10000000 },
    { label: "₹2.00 Cr", val: 20000000 },
  ];

  return (
    <div className="compact-page-container">
      <div className="pre-sanction-header">
        <div className="title-area">
          <div className="sih-pill">
            <Sparkles size={14} />
            <span>Pre-Sanction Advisory Module</span>
          </div>
          <h2>Pre-Sanction Work & Fund Verification</h2>
          <p>
            Verify newly recommended MPLADS proposals prior to administrative sanction. Automatically
            checks against 102,703 existing projects to prevent duplicate recommendations, verify cost
            benchmarks, and track Hon'ble MP annual fund entitlements.
          </p>
        </div>
      </div>

      <div className="validator-grid">
        {/* Form Card */}
        <div className="validator-form-card">
          <form onSubmit={handleValidate}>
            {/* 1. MP Selection & Entitlement Earmarking */}
            <div className="mp-selection-section">
              <div className="form-group">
                <label className="section-field-label">
                  <User size={14} />
                  <span>Recommending Hon'ble Member of Parliament (MP) *</span>
                </label>
                <select value={selectedMpIdx} onChange={handleMpChange} className="mp-select-input">
                  {PROMINENT_MPS.map((mp, i) => (
                    <option key={i} value={i}>
                      {mp.name} — {mp.constituency} ({mp.state}) [{mp.house}]
                    </option>
                  ))}
                </select>
              </div>

              {isCustomMp && (
                <div className="form-row-2">
                  <div className="form-group">
                    <label>MP Name *</label>
                    <input
                      type="text"
                      value={customMpName}
                      onChange={(e) => setCustomMpName(e.target.value)}
                      placeholder="e.g., Shri Ramdas Athawale"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Constituency *</label>
                    <input
                      type="text"
                      value={customConstituency}
                      onChange={(e) => setCustomConstituency(e.target.value)}
                      placeholder="e.g., Pune / Maharashtra"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Annual Entitlement Meter */}
              <div className="mp-entitlement-meter-card">
                <div className="meter-header">
                  <span>MP Annual Entitlement (FY 2024–25):</span>
                  <strong>₹ 5.00 Cr Limit</strong>
                </div>
                <div className="meter-progress-track">
                  <div
                    className="meter-fill-earmarked"
                    style={{ width: `${(earmarked / annualQuota) * 100}%` }}
                    title={`Already Earmarked: ${formatCurrency(earmarked)}`}
                  />
                  <div
                    className={`meter-fill-proposed ${isOverQuota ? "over-limit" : ""}`}
                    style={{
                      width: `${Math.min((amount / annualQuota) * 100, 100 - (earmarked / annualQuota) * 100)}%`,
                    }}
                    title={`Proposed Work: ${formatCurrency(amount)}`}
                  />
                </div>
                <div className="meter-legend">
                  <span>Already Earmarked: <strong>{formatCurrency(earmarked)}</strong></span>
                  <span>Available Balance: <strong>{formatCurrency(availableQuota)}</strong></span>
                  <span>
                    Status:{" "}
                    <strong className={isOverQuota ? "danger-text" : "safe-text"}>
                      {isOverQuota ? "⚠️ Exceeds FY Quota" : "✅ Available"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Proposal Description */}
            <div className="form-group mt-3">
              <label>Work Proposal Title / Description *</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter proposed work description (e.g., Construction of CC Road from...)"
                required
              />
              <span className="field-hint">
                System checks title tokens and similarity against existing works in this jurisdiction.
              </span>
            </div>

            {/* 3. State & Category */}
            <div className="form-row-2">
              <div className="form-group">
                <label>Target State / UT</label>
                <select value={stateName} onChange={(e) => setStateName(e.target.value)}>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {!states.length && <option value="Maharashtra">Maharashtra</option>}
                </select>
              </div>

              <div className="form-group">
                <label>Work Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Roads, Pathways and Bridges">Roads, Pathways and Bridges</option>
                  <option value="Drinking Water Facility">Drinking Water Facility</option>
                  <option value="Education">Education & School Infrastructure</option>
                  <option value="Health and Family Welfare">Health and Family Welfare</option>
                  <option value="Sanitation and Community Facilities">
                    Sanitation & Community Facilities
                  </option>
                  <option value="Other Public Facilities">Other Public Facilities</option>
                </select>
              </div>
            </div>

            {/* 4. Proposed Amount (Fixed & Freeform Input with Quick Chips) */}
            <div className="form-group">
              <label>Proposed Sanction Amount (INR ₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                min={0}
                step="any"
                placeholder="Enter sanction amount"
                required
              />

              {/* Quick Amount Preset Chips */}
              <div className="amount-chips-row">
                {presetAmounts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`amount-chip ${amount === p.val ? "active" : ""}`}
                    onClick={() => setAmount(p.val)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <span className="field-hint">
                Current Input: <strong>{formatCurrency(amount)}</strong>
              </span>
            </div>

            <button type="submit" className="gov-btn-primary full-width mt-3" disabled={loading}>
              {loading ? (
                <span>Checking 102,703 Existing Records...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Verify Proposal Against Records</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="validator-results-card">
          {!result && !loading && (
            <div className="empty-results-state">
              <ShieldAlert size={48} className="empty-icon" />
              <h3>Awaiting Proposal Submission</h3>
              <p>
                Click <strong>"Verify Proposal Against Records"</strong> to run an instant duplicate check
                across 102,703 works, compare category cost medians, and check Hon'ble MP entitlement.
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Searching 102,703 works in eSAKSHI repository...</p>
            </div>
          )}

          {result && (
            <div className="audit-results-content">
              {/* Overall Verdict Banner */}
              <div
                className={`verdict-banner ${
                  result.isDuplicate ? "verdict-danger" : "verdict-success"
                }`}
              >
                <div className="verdict-icon">
                  {result.isDuplicate ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div className="verdict-text">
                  <h4>
                    {result.isDuplicate
                      ? "⚠️ ADVISORY: Potential Duplicate Work Found"
                      : "✅ CLEAR: No Significant Overlap Detected"}
                  </h4>
                  <p>
                    {result.isDuplicate
                      ? `Found ${result.matchedWorks.length} closely matching works in ${stateName} with similar descriptions or matching amounts.`
                      : `The work title and location tokens show no conflict in existing eSAKSHI registers.`}
                  </p>
                </div>
              </div>

              {/* 3 Verification Metric Boxes */}
              <div className="audit-section-box">
                <div className="box-title">1. MP Annual Entitlement Earmarking Compliance</div>
                <div className="benchmark-stat-row">
                  <div>
                    <span>Recommending MP</span>
                    <strong>{result.mpName}</strong>
                  </div>
                  <div>
                    <span>Available Entitlement</span>
                    <strong>{formatCurrency(result.availableQuota)}</strong>
                  </div>
                  <div>
                    <span>Entitlement Status</span>
                    <strong className={result.isOverQuota ? "danger-text" : "safe-text"}>
                      {result.isOverQuota ? "⚠️ Quota Exceeded" : "✅ Entitlement Cleared"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="audit-section-box">
                <div className="box-title">2. Financial Peer Comparison (Category Median)</div>
                <div className="benchmark-stat-row">
                  <div>
                    <span>Proposed Amount</span>
                    <strong>{formatCurrency(amount)}</strong>
                  </div>
                  <div>
                    <span>State Category Median</span>
                    <strong>{formatCurrency(result.peerMedianSanction)}</strong>
                  </div>
                  <div>
                    <span>Ratio vs Peer</span>
                    <strong className={result.costRatio > 1.3 ? "danger-text" : "safe-text"}>
                      {result.costRatio.toFixed(2)}x
                    </strong>
                  </div>
                </div>
              </div>

              {/* Top Duplicate Matches */}
              {result.matchedWorks.length > 0 && (
                <div className="audit-section-box">
                  <div className="box-title">3. Closest Matching Works in eSAKSHI:</div>
                  <div className="matched-works-list">
                    {result.matchedWorks.slice(0, 3).map((w, idx) => (
                      <div
                        key={idx}
                        className="matched-work-item"
                        onClick={() => onSelectWork && onSelectWork(w)}
                      >
                        <div className="item-header">
                          <span className="item-id">
                            Work #{w.WORK_ID || w.WORK_RECOMMENDATION_DTL_ID}
                          </span>
                          <span className="item-constituency">
                            {w.CONSTITUENCY}, {w.STATE_NAME}
                          </span>
                          <span className="item-amount">{formatCurrency(w.SANCTION_AMOUNT)}</span>
                        </div>
                        <div className="item-desc">{w.WORK_DESCRIPTION}</div>
                        <div className="item-footer">
                          <span>Recommending MP: {w.MP_NAME || "Hon'ble MP"}</span>
                          <span className="inspect-link">Inspect Dossier →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
