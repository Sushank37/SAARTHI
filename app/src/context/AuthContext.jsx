import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { ROLE_IDS, getRoleConfig, isValidRole } from "../data/roles";

export const AuthContext = createContext(null);

const STORAGE_KEY = "saarthi_demo_role";

export function AuthProvider({ children }) {
  const [role, setRoleState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && isValidRole(saved)) {
        return saved.toUpperCase();
      }
    } catch {
      // sessionStorage unavailable or blocked
    }
    return null;
  });

  const isAuthenticated = Boolean(role && isValidRole(role));

  const roleConfig = useMemo(() => {
    return getRoleConfig(role);
  }, [role]);

  const login = useCallback((roleId) => {
    if (!isValidRole(roleId)) {
      console.error(`[AuthContext] Invalid role provided for login: ${roleId}`);
      return false;
    }
    const normalized = String(roleId).trim().toUpperCase();
    try {
      sessionStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // sessionStorage unavailable
    }
    setRoleState(normalized);
    return true;
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage unavailable
    }
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
