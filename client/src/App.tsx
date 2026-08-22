import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import AnalyzePage from "./pages/AnalyzePage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import InvestigatorDashboardPage from "./pages/InvestigatorDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import CaseDetailPage from "./pages/CaseDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminScansPage from "./pages/AdminScansPage";
import AdminModelsPage from "./pages/AdminModelsPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import AdminSystemPage from "./pages/AdminSystemPage";
import ThreatIntelligencePage from "./pages/ThreatIntelligencePage";
import SettingsPage from "./pages/SettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/signin" component={SignInPage} />
      <Route path="/signup" component={SignUpPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
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
      
      <Route path="/cases">
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

      <Route path="/threat-intelligence">
        <DashboardLayout>
          <ThreatIntelligencePage />
        </DashboardLayout>
      </Route>

      <Route path="/settings">
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      </Route>

      <Route path="/notifications">
        <DashboardLayout>
          <HistoryPage />
        </DashboardLayout>
      </Route>

      <Route path="/reports">
        <DashboardLayout>
          <HistoryPage />
        </DashboardLayout>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
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
