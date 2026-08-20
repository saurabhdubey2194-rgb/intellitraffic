import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ChooseAccessType from "./pages/ChooseAccessType";

// Dashboards

import EmergencyPage from "./pages/EmergencyPage";
import RequestsPage from "./pages/RequestsPage";
import HospitalEmergencies from "./pages/HospitalEmergencies";
import DashboardHost from "./pages/DashboardHost";
import MapPage from "./pages/MapPage";
import RouteSearch from "./pages/RouteSearch";
import AlertsPage from "./pages/AlertsPage";
import ProfilePage from "./pages/ProfilePage";
import HistoryPage from "./pages/HistoryPage";

// Host admin pages
import {
  UsersPage,
  VerificationQueuePage,
  SignalsAdminPage,
  EntitiesPage,
  IncidentsAdminPage,
  AuditLogPage,
  SettingsAdminPage,
  DataCenterPage,
} from "./pages/AdminPage";

/** Role-aware shared dashboard views.
 * All roles share: /map, /alerts, /profile, /routes
 * Role-specific: /dashboard (Public host dashboard), /emergency (ambulance),
 * /requests (police), /emergencies + /ambulances (hospital), /admin/* (host).
 */
import RoleShell, { useRole } from "./components/RoleShell";
import { useAuth } from "@/_core/hooks/useAuth";

function Shared({
  children,
  demoMode = true,
}: {
  children: React.ReactNode;
  demoMode?: boolean;
}) {
  return <RoleShell demoMode={demoMode}>{children}</RoleShell>;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/signin"} component={SignInPage} />
      <Route path={"/signup"} component={SignUpPage} />
      <Route path={"/choose-access-type"} component={ChooseAccessType} />
      {/* Public / shared */}
      <Route path={"/map"}>
        <Shared>
          <MapPage />
        </Shared>
      </Route>
      <Route path={"/routes"}>
        <Shared>
          <RouteSearch />
        </Shared>
      </Route>
      <Route path={"/alerts"}>
        <Shared>
          <AlertsPage />
        </Shared>
      </Route>
      <Route path={"/profile"}>
        <Shared>
          <ProfilePage />
        </Shared>
      </Route>

      {/* Role dashboards — RoleShell selects content by role internally?
       * No: RoleShell only wraps. Dashboards are role-aware pages that
       * render the right view based on the current user's role. */}
      <Route path={"/dashboard"}>
        <Shared demoMode={false}>
          <RoleDashboard />
        </Shared>
      </Route>

      {/* Role-specific */}
      <Route path={"/emergency"}>
        <Shared demoMode={false}>
          <EmergencyPage />
        </Shared>
      </Route>
      <Route path={"/requests"}>
        <Shared>
          <RequestsPage />
        </Shared>
      </Route>
      <Route path={"/emergencies"}>
        <Shared>
          <HospitalEmergencies />
        </Shared>
      </Route>
      <Route path={"/ambulances"}>
        <Shared>
          <EntitiesPage title="Ambulance Fleet" kind="ambulances" />
        </Shared>
      </Route>

      {/* Host admin */}
      <Route path={"/admin/users"}>
        <Shared>
          <UsersPage />
        </Shared>
      </Route>
      <Route path={"/admin/verification"}>
        <Shared>
          <VerificationQueuePage />
        </Shared>
      </Route>
      <Route path={"/admin/traffic"}>
        <Shared>
          <IncidentsAdminPage />
        </Shared>
      </Route>
      <Route path={"/admin/signals"}>
        <Shared>
          <SignalsAdminPage />
        </Shared>
      </Route>
      <Route path={"/admin/ambulances"}>
        <Shared>
          <EntitiesPage title="Ambulance Fleet" kind="ambulances" />
        </Shared>
      </Route>
      <Route path={"/admin/hospitals"}>
        <Shared>
          <EntitiesPage title="Hospital Network" kind="hospitals" />
        </Shared>
      </Route>
      <Route path={"/admin/police"}>
        <Shared>
          <EntitiesPage title="Police Stations" kind="police" />
        </Shared>
      </Route>
      <Route path={"/admin/emergencies"}>
        <Shared>
          <EntitiesPage title="Emergency Requests" kind="emergencies" />
        </Shared>
      </Route>
      <Route path={"/admin/incidents"}>
        <Shared>
          <IncidentsAdminPage />
        </Shared>
      </Route>
      <Route path={"/admin/routes"}>
        <Shared>
          <EntitiesPage title="Computed Routes" kind="emergencies" />
        </Shared>
      </Route>
      <Route path={"/admin/analytics"}>
        <Shared>
          <EntitiesPage title="Analytics — Corridors" kind="corridors" />
        </Shared>
      </Route>
      <Route path={"/admin/audit"}>
        <Shared>
          <AuditLogPage />
        </Shared>
      </Route>
      <Route path={"/admin/settings"}>
        <Shared>
          <SettingsAdminPage />
        </Shared>
      </Route>
      <Route path={"/admin/data"}>
        <Shared>
          <DataCenterPage />
        </Shared>
      </Route>
      <Route path={"/history"}>
        <Shared>
          <HistoryPage scope="public" />
        </Shared>
      </Route>
      <Route path={"/history-ambulance"}>
        <Shared>
          <HistoryPage scope="ambulance" />
        </Shared>
      </Route>
      <Route path={"/history-police"}>
        <Shared>
          <HistoryPage scope="police" />
        </Shared>
      </Route>
      <Route path={"/history-hospital"}>
        <Shared>
          <HistoryPage scope="hospital" />
        </Shared>
      </Route>
      <Route path={"/history-admin"}>
        <Shared>
          <HistoryPage scope="admin" />
        </Shared>
      </Route>
      <Route path={"/emergency-history"}>
        <Shared>
          <HistoryPage scope="emergencies" />
        </Shared>
      </Route>
      <Route path={"/corridor-history"}>
        <Shared>
          <HistoryPage scope="corridors" />
        </Shared>
      </Route>
      <Route path={"/signal-history"}>
        <Shared>
          <HistoryPage scope="signals" />
        </Shared>
      </Route>

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

/** Renders the correct dashboard view for the current user's role. */
function RoleDashboard() {
  const { user, loading } = useAuth();
  const role = useRole(user);
  if (loading) return <div className="min-h-screen" />;
  if (role === "ambulance") return <EmergencyPage />;
  if (role === "police") return <RequestsPage />;
  if (role === "hospital") return <HospitalEmergencies />;
  return <DashboardHost />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
