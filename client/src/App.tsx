import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import HistoryPage from "./pages/HistoryPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import InvestigatorDashboardPage from "./pages/InvestigatorDashboardPage";
import AnalyzePage from "./pages/AnalyzePage";
import CaseDetailPage from "./pages/CaseDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminScansPage from "./pages/AdminScansPage";
import AdminModelsPage from "./pages/AdminModelsPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import AdminSystemPage from "./pages/AdminSystemPage";
import ThreatIntelligencePage from "./pages/ThreatIntelligencePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import FAQPage from "./pages/FAQPage";
import ProfilePage from "./pages/ProfilePage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/signin" component={SignInPage} />
      <Route path="/signup" component={SignUpPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      <Route path="/features">
        <DashboardLayout>
          <FeaturesPage />
        </DashboardLayout>
      </Route>
      <Route path="/pricing">
        <DashboardLayout>
          <PricingPage />
        </DashboardLayout>
      </Route>
      <Route path="/faq">
        <DashboardLayout>
          <FAQPage />
        </DashboardLayout>
      </Route>
      
      {/* Workspace routes */}
      <Route path="/dashboard">
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/analyze">
        <DashboardLayout>
          <AnalyzePage />
        </DashboardLayout>
      </Route>
      
      <Route path="/analysis/:id">
        <DashboardLayout>
          <AnalysisDetailPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/history">
        <DashboardLayout>
          <HistoryPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/threat-intelligence">
        <DashboardLayout>
          <ThreatIntelligencePage />
        </DashboardLayout>
      </Route>

      <Route path="/search">
        <DashboardLayout>
          <SearchResultsPage />
        </DashboardLayout>
      </Route>

      <Route path="/investigator">
        <DashboardLayout>
          <InvestigatorDashboardPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/cases/:id">
        <DashboardLayout>
          <CaseDetailPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/profile">
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <DashboardLayout>
          <AdminDashboardPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin/users">
        <DashboardLayout>
          <AdminUsersPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin/scans">
        <DashboardLayout>
          <AdminScansPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin/models">
        <DashboardLayout>
          <AdminModelsPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin/logs">
        <DashboardLayout>
          <AdminLogsPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin/system">
        <DashboardLayout>
          <AdminSystemPage />
        </DashboardLayout>
      </Route>

      <Route path="/settings">
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      </Route>

      <Route path="/notifications">
        <DashboardLayout>
          <NotificationsPage />
        </DashboardLayout>
      </Route>

      <Route path="/reports">
        <DashboardLayout>
          <HistoryPage />
        </DashboardLayout>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Router />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
