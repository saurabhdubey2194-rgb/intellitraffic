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
import { useIsMobile } from "@/hooks/useMobile";
import {
  Activity,
  History,
  Home,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  User,
  FileSearch,
  Users,
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { NotificationCenter } from "./NotificationCenter";

export type NavItem = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  path: string;
};

export const ROLE_NAV: Record<string, NavItem[]> = {
  user: [
    { icon: LayoutDashboard, label: "Workspace", path: "/dashboard" },
    { icon: Activity, label: "Analysis History", path: "/history" },
    { icon: ShieldCheck, label: "My Cases", path: "/cases" },
    { icon: Shield, label: "Threat Intel", path: "/threat-intelligence" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  investigator: [
    { icon: LayoutDashboard, label: "Console", path: "/dashboard" },
    { icon: FileSearch, label: "Analysis History", path: "/history" },
    { icon: ShieldCheck, label: "Case Manager", path: "/cases" },
    { icon: Shield, label: "Threat Intel", path: "/threat-intelligence" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Command Center", path: "/dashboard" },
    { icon: Users, label: "User Management", path: "/admin/users" },
    { icon: FileSearch, label: "Scan Activity", path: "/admin/scans" },
    { icon: ShieldCheck, label: "Model Health", path: "/admin/models" },
    { icon: History, label: "Audit Logs", path: "/admin/logs" },
    { icon: Activity, label: "System Status", path: "/admin/system" },
    { icon: Shield, label: "Threat Intel", path: "/threat-intelligence" },
    { icon: Settings, label: "Platform Settings", path: "/settings" },
  ],
};

const SIDEBAR_WIDTH_KEY = "fs-sidebar-width";
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

function roleForUser(user: { role?: string | null } | null | undefined): string {
  return user?.role || "user";
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
  const [, navigate] = useLocation();

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
              Sign in to FakeShield AI
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to the analysis workspace requires authentication.
            </p>
          </div>
          <Button
            onClick={() => navigate("/signin")}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all bg-blue-600 hover:bg-blue-500"
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
  const menuItems = ROLE_NAV[role] || ROLE_NAV.user;
  const isMobile = useIsMobile();

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
                    FakeShield <span className="text-blue-400">AI</span>
                  </span>
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded px-2 py-0.5 whitespace-nowrap">
                    {ROLE_LABEL[role]}
                  </span>
                  <NotificationCenter />
                  <ThemeToggle className="!border-sidebar-border h-8 w-8 !text-sidebar-foreground/90" />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 shrink-0">
                  <LogoMark className="shrink-0" />
                  <NotificationCenter />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-white/10 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-blue-600 text-white">
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
                  {activeMenuItem?.label ?? "FakeShield AI"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded px-2 py-1 whitespace-nowrap mr-2">
                {ROLE_LABEL[role]}
              </span>
              <NotificationCenter />
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
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
        <Shield className="h-4 w-4 text-white" />
      </div>
    </div>
  );
}
