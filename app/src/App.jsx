import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { ROLE_IDS } from "./data/roles";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

import LoginPage from "./pages/Login/LoginPage";
import SharedLayout, { RouteConsumer } from "./components/SharedLayout";

import MPDashboard from "./pages/dashboards/MPDashboard";
import DADashboard from "./pages/dashboards/DADashboard";
import IADashboard from "./pages/dashboards/IADashboard";
import MoSPIDashboard from "./pages/dashboards/MoSPIDashboard";
import CitizenDashboard from "./pages/dashboards/CitizenDashboard";

import RiskIntelligence from "./pages/RiskIntelligence";
import DuplicateIntelligence from "./pages/DuplicateIntelligence";
import ReviewQueue from "./pages/ReviewQueue";
import StateIntelligence from "./pages/StateIntelligence";
import WorkExplorer from "./pages/WorkExplorer";
import PreSanctionValidator from "./components/PreSanctionValidator";
import GeoPhotoVerifier from "./components/GeoPhotoVerifier";

import "./App.css";

function RootRedirect() {
  const { isAuthenticated, roleConfig } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={roleConfig?.path || "/mospi"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Prototype Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Authenticated Application Shell */}
      <Route
        element={
          <ProtectedRoute>
            <SharedLayout />
          </ProtectedRoute>
        }
      >
        {/* 5 Role-Isolated Persona Dashboards */}
        <Route
          path="/mp"
          element={
            <RoleRoute allowedRole={ROLE_IDS.MP}>
              <RouteConsumer Component={MPDashboard} />
            </RoleRoute>
          }
        />
        <Route
          path="/da"
          element={
            <RoleRoute allowedRole={ROLE_IDS.DISTRICT_AUTHORITY}>
              <RouteConsumer Component={DADashboard} />
            </RoleRoute>
          }
        />
        <Route
          path="/ia"
          element={
            <RoleRoute allowedRole={ROLE_IDS.IMPLEMENTING_AGENCY}>
              <RouteConsumer Component={IADashboard} />
            </RoleRoute>
          }
        />
        <Route
          path="/mospi"
          element={
            <RoleRoute allowedRole={ROLE_IDS.MOSPI}>
              <RouteConsumer Component={MoSPIDashboard} />
            </RoleRoute>
          }
        />
        <Route
          path="/citizen"
          element={
            <RoleRoute allowedRole={ROLE_IDS.CITIZEN}>
              <RouteConsumer Component={CitizenDashboard} />
            </RoleRoute>
          }
        />

        {/* Shared Verification & Intelligence Tools (Single Source of Truth) */}
        <Route path="/works" element={<RouteConsumer Component={WorkExplorer} />} />
        <Route path="/risk-cases" element={<RouteConsumer Component={RiskIntelligence} />} />
        <Route path="/duplicates" element={<RouteConsumer Component={DuplicateIntelligence} />} />
        <Route path="/review" element={<RouteConsumer Component={ReviewQueue} />} />
        <Route path="/states" element={<RouteConsumer Component={StateIntelligence} />} />
        <Route path="/pre-sanction" element={<RouteConsumer Component={PreSanctionValidator} />} />
        <Route path="/photo-verifier" element={<RouteConsumer Component={GeoPhotoVerifier} />} />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}