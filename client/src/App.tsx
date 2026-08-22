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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/signin" component={SignInPage} />
      <Route path="/signup" component={SignUpPage} />
      
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
      
      <Route path="/profile">
        <DashboardLayout>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">User Profile</h1>
          </div>
        </DashboardLayout>
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <DashboardLayout>
          <AdminDashboardPage />
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
