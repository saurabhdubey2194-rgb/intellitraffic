import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import Home from "./pages/Home";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import ProfilePage from "./pages/ProfilePage";
import FAQPage from "./pages/FAQPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import HistoryPage from "./pages/HistoryPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SharedCasePage from "./pages/SharedCasePage";
import InvestigatorDashboardPage from "./pages/InvestigatorDashboardPage";
import AnalyzePage from "./pages/AnalyzePage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import CaseDetailPage from "./pages/CaseDetailPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminScansPage from "./pages/AdminScansPage";
import AdminModelsPage from "./pages/AdminModelsPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import AdminSystemPage from "./pages/AdminSystemPage";
import ThreatIntelligencePage from "./pages/ThreatIntelligencePage";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/DashboardLayout";

function AuthGuard({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/signin?redirect=${encodeURIComponent(location)}`);
    } else if (!loading && user && roles && !roles.includes(user.role)) {
      navigate("/signin?accessDenied=true");
    }
  }, [user, loading, navigate, location, roles]);

  if (loading || !user) return null;
  return <>{children}</>;
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/signin" component={SignInPage} />
      <Route path="/login" component={SignInPage} />
      <Route path="/signup" component={SignUpPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/shared/case/:token" component={SharedCasePage} />

      <Route path="/dashboard">
        <AuthGuard>
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/analyze">
        <AuthGuard>
          <DashboardLayout>
            <AnalyzePage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/analysis/:id">
        <AuthGuard>
          <DashboardLayout>
            <AnalysisDetailPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/history">
        <AuthGuard>
          <DashboardLayout>
            <HistoryPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/search">
        <AuthGuard>
          <DashboardLayout>
            <SearchResultsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/investigator">
        <AuthGuard roles={["investigator", "admin"]}>
          <DashboardLayout>
            <InvestigatorDashboardPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/case/:id">
        <AuthGuard roles={["investigator", "admin"]}>
          <DashboardLayout>
            <CaseDetailPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/threat-intelligence">
        <AuthGuard>
          <DashboardLayout>
            <ThreatIntelligencePage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/admin">
        <AuthGuard roles={["admin"]}>
          <DashboardLayout>
            <AdminDashboardPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/admin/users">
        <AuthGuard roles={["admin"]}>
          <DashboardLayout>
            <AdminUsersPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/admin/scans">
        <AuthGuard roles={["admin"]}>
          <DashboardLayout>
            <AdminScansPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/admin/models">
        <AuthGuard roles={["admin"]}>
          <DashboardLayout>
            <AdminModelsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/admin/logs">
        <AuthGuard roles={["admin"]}>
          <DashboardLayout>
            <AdminLogsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/admin/system">
        <AuthGuard roles={["admin"]}>
          <DashboardLayout>
            <AdminSystemPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/settings">
        <AuthGuard>
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/notifications">
        <AuthGuard>
          <DashboardLayout>
            <NotificationsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/reports">
        <AuthGuard>
          <DashboardLayout>
            <HistoryPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route path="/profile">
        <AuthGuard>
          <DashboardLayout>
            <ProfilePage />
          </DashboardLayout>
        </AuthGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}
