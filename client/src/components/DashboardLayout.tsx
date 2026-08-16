import { useAuth } from "@/_core/hooks/useAuth";
import { ROLE_LABEL } from "@/lib/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Ambulance,
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  ClipboardList,
  Crown,
  Database,
  FileSearch,
  History,
  Home,
  Hospital,
  Landmark,
  LogOut,
  Map as MapIcon,
  MapPin,
  PanelLeft,
  Settings,
  Shield,
  Siren,
  TrafficCone,
  User,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

export type NavItem = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  path: string;
};

export const ROLE_NAV: Record<string, NavItem[]> = {
  public: [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: MapIcon, label: "Map", path: "/map" },
    { icon: MapPin, label: "Routes", path: "/routes" },
    { icon: Bell, label: "Alerts", path: "/alerts" },
    { icon: History, label: "Activity", path: "/history" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  ambulance: [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Siren, label: "Emergency", path: "/emergency" },
    { icon: MapPin, label: "Route", path: "/routes" },
    { icon: Bell, label: "Alerts", path: "/alerts" },
    { icon: History, label: "Activity", path: "/history-ambulance" },
    { icon: Ambulance, label: "Profile", path: "/profile" },
  ],
  police: [
    { icon: Activity, label: "Command", path: "/dashboard" },
    { icon: ClipboardList, label: "Requests", path: "/requests" },
    { icon: MapIcon, label: "Map", path: "/map" },
    { icon: Bell, label: "Alerts", path: "/alerts" },
    { icon: History, label: "Activity", path: "/history-police" },
    { icon: Shield, label: "Profile", path: "/profile" },
  ],
  hospital: [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Siren, label: "Emergencies", path: "/emergencies" },
    { icon: Ambulance, label: "Ambulances", path: "/ambulances" },
    { icon: Bell, label: "Alerts", path: "/alerts" },
    { icon: History, label: "Activity", path: "/history-hospital" },
    { icon: Hospital, label: "Profile", path: "/profile" },
  ],
  host: [
    { icon: Activity, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: FileSearch, label: "Verification", path: "/admin/verification" },
    { icon: TrafficCone, label: "Traffic", path: "/admin/traffic" },
    { icon: SignalIcon, label: "Signals", path: "/admin/signals" },
    { icon: MapIcon, label: "Maps", path: "/map" },
    { icon: Ambulance, label: "Ambulances", path: "/admin/ambulances" },
    { icon: Hospital, label: "Hospitals", path: "/admin/hospitals" },
    { icon: Landmark, label: "Police", path: "/admin/police" },
    { icon: Siren, label: "Emergencies", path: "/admin/emergencies" },
    { icon: AlertTriangle, label: "Incidents", path: "/admin/incidents" },
    { icon: History, label: "Routes", path: "/admin/routes" },
    { icon: Bot, label: "Analytics", path: "/admin/analytics" },
    { icon: Crown, label: "Activity Center", path: "/history-admin" },
    { icon: Shield, label: "Audit Logs", path: "/admin/audit" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
    { icon: Database, label: "Data Center", path: "/admin/data" },
  ],
};

function SignalIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="17" r="2" />
    </svg>
  );
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

function roleForUser(user: { role?: string | null } | null | undefined): string {
  const r = user?.role;
  if (r === "admin" || r === "host") return "host";
  return r || "public";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <LogoMark />
            <h1 className="text-2xl font-bold tracking-tight text-center">
              Sign in to IntelliTraffic
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Sign in with your account.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const role = roleForUser(user);
  const menuItems = ROLE_NAV[role] || ROLE_NAV.public;
  const isMobile = useIsMobile();

  // Redirect to role dashboard if not logged in yet... no-op: handled above.

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const activeMenuItem = menuItems.find(item => item.path === location);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold tracking-tight truncate text-base">
                    Intelli<span className="text-emerald-400">Traffic</span>
                  </span>
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded px-2 py-0.5 whitespace-nowrap">
                    {ROLE_LABEL[role]}
                  </span>
                  <ThemeToggle className="!border-sidebar-border h-8 w-8 !text-sidebar-foreground/90" />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 shrink-0">
                  <LogoMark className="shrink-0" />
                  <ThemeToggle className="!border-sidebar-border h-8 w-8 !text-sidebar-foreground/90" />
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 mb-2 group-data-[collapsible=icon]:hidden">
              <p className="text-[11px] text-muted-foreground">
                Demo / simulated traffic data. Real signal control requires municipal integration.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-white/10 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b border-border h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <span className="tracking-tight text-foreground text-sm font-semibold">
                  {activeMenuItem?.label ?? "IntelliTraffic"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded px-2 py-1 whitespace-nowrap mr-2">
                {ROLE_LABEL[role]}
              </span>
              <ThemeToggle />
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? ""}`}>
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Siren className="h-4 w-4 text-slate-900" />
      </div>
    </div>
  );
}
