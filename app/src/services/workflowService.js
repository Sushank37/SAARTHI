/**
 * SAARTHI — Centralized Workflow Service
 * Client for cross-role workflow requests, status transitions, and dynamic counters.
 */

import { API_BASE } from "../constants";

export const REQUEST_STATUSES = {
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  ACTION_TAKEN: "ACTION_TAKEN",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};

export const REQUEST_TYPES = {
  GRIEVANCE: "GRIEVANCE",
  PUBLIC_VERIFICATION: "PUBLIC_VERIFICATION",
  PAYMENT_REQUEST: "PAYMENT_REQUEST",
  TIME_EXTENSION: "TIME_EXTENSION",
  MEASUREMENT_BOOK_SUBMISSION: "MEASUREMENT_BOOK_SUBMISSION",
  CONSTITUENCY_INQUIRY: "CONSTITUENCY_INQUIRY",
  ADMINISTRATIVE_NOTICE: "ADMINISTRATIVE_NOTICE",
  ADMINISTRATIVE_ESCALATION: "ADMINISTRATIVE_ESCALATION",
  OVERSIGHT_DIRECTIVE: "OVERSIGHT_DIRECTIVE",
};

export const REQUEST_TYPE_LABELS = {
  [REQUEST_TYPES.GRIEVANCE]: "Public Grievance",
  [REQUEST_TYPES.PUBLIC_VERIFICATION]: "Citizen Verification",
  [REQUEST_TYPES.PAYMENT_REQUEST]: "Payment Claim",
  [REQUEST_TYPES.TIME_EXTENSION]: "Time Extension (EOT)",
  [REQUEST_TYPES.MEASUREMENT_BOOK_SUBMISSION]: "MB Ledger Submission",
  [REQUEST_TYPES.CONSTITUENCY_INQUIRY]: "Parliamentary Inquiry",
  [REQUEST_TYPES.ADMINISTRATIVE_NOTICE]: "Collectorate Notice",
  [REQUEST_TYPES.ADMINISTRATIVE_ESCALATION]: "National Escalation",
  [REQUEST_TYPES.OVERSIGHT_DIRECTIVE]: "MoSPI Central Directive",
};

/**
 * Fetch list of requests with optional filters
 */
export async function getRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.targetRole) params.set("target_role", filters.targetRole);
  if (filters.raisedByRole) params.set("raised_by_role", filters.raisedByRole);
  if (filters.workId) params.set("work_id", filters.workId);
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters.requestType && filters.requestType !== "ALL") params.set("request_type", filters.requestType);
  if (filters.idaName && filters.idaName !== "ALL") params.set("ida_name", filters.idaName);
  if (filters.search) params.set("q", filters.search);

  const res = await fetch(`${API_BASE}/api/requests?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch requests (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetch single request details
 */
export async function getRequestById(requestId) {
  const res = await fetch(`${API_BASE}/api/requests/${encodeURIComponent(requestId)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request not found (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Create a new workflow request
 */
export async function createRequest(payload) {
  const res = await fetch(`${API_BASE}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Submission failed (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Update request status with audit note
 */
export async function updateRequestStatus(requestId, { role, status, note, actorIdentity }) {
  const res = await fetch(`${API_BASE}/api/requests/${encodeURIComponent(requestId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role,
      status,
      note,
      actor_identity: actorIdentity,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Status update failed (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Get real-time counts for badges (prevents fake badge numbers)
 */
export async function getRequestCounts(role, idaName) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (idaName && idaName !== "ALL") params.set("ida_name", idaName);

  const res = await fetch(`${API_BASE}/api/requests/counts?${params.toString()}`);
  if (!res.ok) return { total: 0, submitted: 0, under_review: 0, action_taken: 0, resolved: 0, pending_action: 0 };
  return res.json();
}
