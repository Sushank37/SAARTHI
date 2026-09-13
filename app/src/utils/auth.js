/**
 * SAARTHI — Cryptographic Auth Utilities for Frontend
 * Provides session token management and Bearer headers for authoritative backend authorization.
 */

import { API_BASE } from "../constants";

const STORAGE_KEY_ROLE = "saarthi_demo_role";
const STORAGE_KEY_TOKEN = "saarthi_session_token";

export function getAuthToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY_TOKEN) || null;
  } catch {
    return null;
  }
}

export function getActiveRole() {
  try {
    return sessionStorage.getItem(STORAGE_KEY_ROLE) || null;
  } catch {
    return null;
  }
}

export function setSessionAuth(role, token) {
  try {
    if (role) sessionStorage.setItem(STORAGE_KEY_ROLE, role);
    if (token) sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
  } catch {
    // sessionStorage unavailable
  }
}

export function clearSessionAuth() {
  try {
    sessionStorage.removeItem(STORAGE_KEY_ROLE);
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
  } catch {
    // sessionStorage unavailable
  }
}

/**
 * Returns HTTP headers including cryptographic Bearer token and role for authoritative backend verification.
 */
export function getAuthHeaders() {
  const headers = {};
  const token = getAuthToken();
  const role = getActiveRole();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (role) {
    headers["X-Saarthi-Role"] = role;
  }
  return headers;
}

/**
 * Fetch or refresh a cryptographically signed HMAC-SHA256 session token from backend for a role.
 */
export async function fetchSessionToken(role, userId = null) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: role.toUpperCase(),
        user_id: userId || `USR-${role.toUpperCase()}`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        setSessionAuth(role.toUpperCase(), data.token);
        return data.token;
      }
    }
  } catch (err) {
    console.warn("[Auth] Failed to obtain server session token:", err);
  }
  return null;
}
