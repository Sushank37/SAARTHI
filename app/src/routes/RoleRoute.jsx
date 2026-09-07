import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function RoleRoute({ allowedRole, children }) {
  const { isAuthenticated, role, roleConfig } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const normalizedAllowed = String(allowedRole).toUpperCase();
  const normalizedCurrent = String(role).toUpperCase();

  if (normalizedCurrent !== normalizedAllowed) {
    // Redirect user to their own authorized dashboard path
    const targetPath = roleConfig?.path || "/login";
    return <Navigate to={targetPath} replace />;
  }

  return children ? children : <Outlet />;
}
