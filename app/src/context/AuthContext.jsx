import { useState, useEffect, useMemo, useCallback } from "react";
import { ROLE_IDS, getRoleConfig, isValidRole } from "../data/roles";
import { fetchSessionToken, setSessionAuth, clearSessionAuth, getActiveRole, getAuthToken } from "../utils/auth";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [role, setRoleState] = useState(() => {
    const saved = getActiveRole();
    if (saved && isValidRole(saved)) {
      return saved.toUpperCase();
    }
    return null;
  });

  const isAuthenticated = Boolean(role && isValidRole(role));

  // If role is active but token is missing, retrieve token asynchronously
  useEffect(() => {
    if (role && isValidRole(role) && !getAuthToken()) {
      fetchSessionToken(role);
    }
  }, [role]);

  const roleConfig = useMemo(() => {
    return getRoleConfig(role);
  }, [role]);

  const login = useCallback((roleId) => {
    if (!isValidRole(roleId)) {
      console.error(`[AuthContext] Invalid role provided for login: ${roleId}`);
      return false;
    }
    const normalized = String(roleId).trim().toUpperCase();
    setSessionAuth(normalized, null);
    setRoleState(normalized);
    // Request cryptographic session token from backend
    fetchSessionToken(normalized);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearSessionAuth();
    setRoleState(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      role,
      roleConfig,
      login,
      logout,
      availableRoles: ROLE_IDS,
    }),
    [isAuthenticated, role, roleConfig, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
