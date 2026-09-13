/**
 * SAARTHI — Work Concern, Action, Response, and Accountability Service
 * Client for creating, managing, tracking, and resolving work concerns.
 */

import { API_BASE } from "../constants";
import { getAuthHeaders } from "../utils/auth";

export const CONCERN_CATEGORIES = [
  "Work Progress Issue",
  "Work Quality Concern",
  "Delayed Work",
  "Financial Irregularity",
  "Incorrect Work Status",
  "Missing or Incomplete Asset",
  "Public Complaint",
  "Safety Concern",
  "Other",
];

export const CONCERN_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const CONCERN_STATUSES = {
  RAISED: "RAISED",
  RECEIVED: "RECEIVED",
  UNDER_REVIEW: "UNDER_REVIEW",
  CLARIFICATION_REQUESTED: "CLARIFICATION_REQUESTED",
  ACTION_ASSIGNED: "ACTION_ASSIGNED",
  ACTION_IN_PROGRESS: "ACTION_IN_PROGRESS",
  ACTION_TAKEN: "ACTION_TAKEN",
  EVIDENCE_SUBMITTED: "EVIDENCE_SUBMITTED",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
  REOPENED: "REOPENED",
};

export const CONCERN_STATUS_META = {
  RAISED: { label: "Raised by MP", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  RECEIVED: { label: "Received by DA", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  UNDER_REVIEW: { label: "Under Review", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  CLARIFICATION_REQUESTED: { label: "Clarification Requested", color: "#9333ea", bg: "#faf5ff", border: "#e9d5ff" },
  ACTION_ASSIGNED: { label: "Assigned to IA", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  ACTION_IN_PROGRESS: { label: "Action in Progress", color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
  ACTION_TAKEN: { label: "Action Taken", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  EVIDENCE_SUBMITTED: { label: "Evidence Submitted", color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
  RESOLVED: { label: "Resolved", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  REJECTED: { label: "Rejected", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
  REOPENED: { label: "Reopened", color: "#b91c1c", bg: "#fef2f2", border: "#f87171" },
};

/**
 * Raise a formal concern against a canonical work record
 */
export async function createConcern(payload) {
  const res = await fetch(`${API_BASE}/api/concerns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to raise concern (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Query concerns with jurisdiction and status filters
 */
export async function getConcerns(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.mpName && filters.mpName !== "ALL") params.set("mp_name", filters.mpName);
  if (filters.daId && filters.daId !== "ALL") params.set("da_id", filters.daId);
  if (filters.iaId && filters.iaId !== "ALL") params.set("ia_id", filters.iaId);
  if (filters.workId) params.set("work_id", filters.workId);
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters.priority && filters.priority !== "ALL") params.set("priority", filters.priority);
  if (filters.category && filters.category !== "ALL") params.set("category", filters.category);
  if (filters.search) params.set("q", filters.search);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const res = await fetch(`${API_BASE}/api/concerns?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch concerns (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetch complete concern record with actions, responses, and timeline
 */
export async function getConcernById(concernId) {
  const res = await fetch(`${API_BASE}/api/concerns/${encodeURIComponent(concernId)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Concern not found (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Update concern status
 */
export async function updateConcernStatus(concernId, payload) {
  const res = await fetch(`${API_BASE}/api/concerns/${encodeURIComponent(concernId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update status (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Record an official action taken by DA, IA, or MoSPI
 */
export async function recordConcernAction(concernId, payload) {
  const res = await fetch(`${API_BASE}/api/concerns/${encodeURIComponent(concernId)}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to record action (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Submit response / explanation / clarification thread entry
 */
export async function submitConcernResponse(concernId, payload) {
  const res = await fetch(`${API_BASE}/api/concerns/${encodeURIComponent(concernId)}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to submit response (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Retrieve immutable audit log timeline for a concern
 */
export async function getConcernTimeline(concernId) {
  const res = await fetch(`${API_BASE}/api/concerns/${encodeURIComponent(concernId)}/timeline`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Timeline not found (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetch all concerns attached to a canonical work
 */
export async function getWorkConcerns(workId) {
  const res = await fetch(`${API_BASE}/api/works/${encodeURIComponent(workId)}/concerns`);
  if (!res.ok) return { total: 0, concerns: [] };
  return res.json();
}

/**
 * Fetch real-time concern metrics for dashboard KPIs
 */
export async function getConcernMetrics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.mpName && filters.mpName !== "ALL") params.set("mp_name", filters.mpName);
  if (filters.daId && filters.daId !== "ALL") params.set("da_id", filters.daId);
  if (filters.iaId && filters.iaId !== "ALL") params.set("ia_id", filters.iaId);

  const res = await fetch(`${API_BASE}/api/concerns/metrics?${params.toString()}`);
  if (!res.ok) {
    return {
      total: 0,
      open: 0,
      raised: 0,
      under_review: 0,
      action_assigned: 0,
      action_in_progress: 0,
      action_taken: 0,
      evidence_submitted: 0,
      resolved: 0,
      reopened: 0,
      rejected: 0,
      high_priority: 0,
      critical_priority: 0,
      awaiting_da_action: 0,
      awaiting_ia_response: 0,
    };
  }
  return res.json();
}
