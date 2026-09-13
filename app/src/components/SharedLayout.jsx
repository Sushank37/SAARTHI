import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation, useOutletContext, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Header from "./Header";
import Sidebar from "./Sidebar";
import WorkDetailDrawer from "./WorkDetailDrawer";
import RajyaSabhaNotice from "./RajyaSabhaNotice";
import { API_BASE } from "../constants";

export function RouteConsumer({ Component, extraProps = {} }) {
  const context = useOutletContext();
  return <Component {...context} {...extraProps} />;
}

export default function SharedLayout() {
  const { role, roleConfig, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [house, setHouse] = useState("Lok Sabha");
  const [fontSize, setFontSize] = useState(15);
  const [summary, setSummary] = useState(null);
  const [selectedWork, setSelectedWork] = useState(null);
  const [backendStatus, setBackendStatus] = useState("connecting"); // "connected" | "connecting" | "offline"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile sidebar on route transition (BUG-009)
  useEffect(() => {
    const timer = setTimeout(() => setMobileMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data);
      setBackendStatus("connected");
    } catch (err) {
      console.error("Summary fetch error:", err);
      setBackendStatus("offline");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/summary`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setSummary(data);
          setBackendStatus("connected");
        }
      } catch (err) {
        console.error("Summary fetch error:", err);
        if (isMounted) setBackendStatus("offline");
      }
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Synchronize URL search params with Work Detail Drawer (BUG-018)
  useEffect(() => {
    const urlWorkId = searchParams.get("workId");
    if (urlWorkId) {
      if (!selectedWork || (String(selectedWork.WORK_ID) !== urlWorkId && String(selectedWork.WORK_RECOMMENDATION_DTL_ID) !== urlWorkId)) {
        const timer = setTimeout(() => {
          setSelectedWork({
            WORK_ID: urlWorkId,
            __initialSection: searchParams.get("section") || "all",
            __authority: roleConfig?.id?.toUpperCase() || role?.toUpperCase() || "DISTRICT_AUTHORITY",
          });
        }, 0);
        return () => clearTimeout(timer);
      }
    } else if (selectedWork) {
      // User pressed Browser Back button: close drawer cleanly
      const timer = setTimeout(() => {
        setSelectedWork(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, selectedWork, role, roleConfig]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSelectWork = (work, section = null) => {
    if (!work) {
      setSelectedWork(null);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("workId");
        next.delete("section");
        return next;
      });
      return;
    }
    const initialSection = section || (typeof work === "object" ? work.__initialSection : null) || "all";
    const currentAuthority = (typeof work === "object" && work.__authority)
      ? String(work.__authority).toUpperCase()
      : (roleConfig?.id?.toUpperCase() || role?.toUpperCase() || "DISTRICT_AUTHORITY");

    const wObj = typeof work === "object"
      ? { ...work, __initialSection: initialSection, __authority: currentAuthority }
      : { WORK_ID: String(work).replace(/\.0$/, ""), __initialSection: initialSection, __authority: currentAuthority };

    setSelectedWork(wObj);

    // Update browser URL so Back/Forward and direct linking work seamlessly
    const targetId = wObj.WORK_ID || wObj.WORK_RECOMMENDATION_DTL_ID;
    if (targetId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("workId", String(targetId));
        if (initialSection && initialSection !== "all") {
          next.set("section", initialSection);
        } else {
          next.delete("section");
        }
        return next;
      });
    }
  };

  return (
    <div
      className="gov-app-shell theme-official"
      data-theme="official"
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Shared Government Header */}
      <Header
        house={house}
        setHouse={setHouse}
        fontSize={fontSize}
        setFontSize={setFontSize}
        backendStatus={backendStatus}
        onReconnect={loadSummary}
        totalWorks={summary?.total_works}
        roleConfig={roleConfig}
        onLogout={handleLogout}
        onSelectWork={handleSelectWork}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Main Layout (Sidebar only shown for Lok Sabha) */}
      <div className={`gov-layout-body ${house === "Rajya Sabha" ? "gov-layout-body-rs" : ""}`}>
        {mobileMenuOpen && (
          <div
            className="sidebar-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        {house !== "Rajya Sabha" && (
          <Sidebar
            summary={summary}
            roleConfig={roleConfig}
            onLogout={handleLogout}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="gov-content-viewport">
          {/* If Rajya Sabha is selected, show the Phase 2 development / upcoming release notice */}
          {house === "Rajya Sabha" ? (
            <RajyaSabhaNotice onSwitchToLokSabha={() => setHouse("Lok Sabha")} />
          ) : (
            <Outlet
              context={{
                summary,
                house,
                selectedWork,
                setSelectedWork: handleSelectWork,
                onSelectWork: handleSelectWork,
              }}
            />
          )}

          {/* Official Government Footer */}
          <footer className="gov-official-footer">
            <div className="footer-tricolor-line" />
            <div className="footer-content">
              <div className="footer-left">
                <strong>
                  सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय | Ministry of Statistics and
                  Programme Implementation (MoSPI)
                </strong>
                <p>
                  eSAKSHI — Members of Parliament Local Area Development Scheme (MPLADS)
                  Surveillance & Anomaly Extension Layer.
                </p>
                <small>
                  Official Digital Portal · Ministry of Statistics & Programme Implementation (MoSPI) ·
                  Data Informatics & National Surveillance Division (DIID).
                </small>
              </div>
              <div className="footer-right">
                <div className="footer-badge">
                  <span>DIGITAL INDIA</span>
                </div>
                <div className="footer-badge nic">
                  <span>NATIONAL INFORMATICS CENTRE</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Work Inspection Dossier Drawer */}
      <WorkDetailDrawer
        work={selectedWork}
        initialSection={selectedWork?.__initialSection || "all"}
        onClose={() => handleSelectWork(null)}
      />
    </div>
  );
}
