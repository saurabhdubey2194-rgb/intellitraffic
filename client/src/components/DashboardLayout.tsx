import { useAuth } from "@/_core/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Activity,
  History,
  Settings,
  Shield,
  User,
  FileSearch,
  Users,
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Zap,
  ChevronRight,
  Bell,
  FileText
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { TopNav } from "./TopNav";
import { SubNav } from "./SubNav";
import { Input } from "./ui/input";
import { toast } from "sonner";

type NavItem = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  path: string;
};

const ROLE_NAV: Record<string, NavItem[]> = {
  user: [
    { icon: LayoutDashboard, label: "Workspace", path: "/dashboard" },
    { icon: Activity, label: "Analysis History", path: "/history" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: FileText, label: "Forensic Reports", path: "/reports" },
    { icon: Shield, label: "Threat Intel", path: "/threat-intelligence" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  investigator: [
    { icon: LayoutDashboard, label: "Investigator Console", path: "/investigator" },
    { icon: FileSearch, label: "Analysis History", path: "/history" },
    { icon: ShieldCheck, label: "Case Manager", path: "/investigator" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Shield, label: "Threat Intel", path: "/threat-intelligence" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Command Center", path: "/admin" },
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
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [location, navigate] = useLocation();
  const currentPath = typeof location === 'string' ? location : window.location.pathname;

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white font-sans">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-card/30 backdrop-blur-xl border border-white/5 rounded-3xl">
          <div className="flex flex-col items-center gap-6">
            <Shield className="h-16 w-16 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-center font-rajdhani uppercase">
              Neural Access <span className="text-primary">Required</span>
            </h1>
            <p className="text-[10px] text-muted-foreground text-center max-w-sm font-bold uppercase tracking-[0.2em]">
              The forensic workspace is currently locked. Authenticate to proceed.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/signin?redirect=${encodeURIComponent(currentPath)}`)}
            size="lg"
            className="w-full h-14 rounded-2xl shadow-lg shadow-primary/20 transition-all bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            Initiate Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent sidebarWidth={sidebarWidth} setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  sidebarWidth,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const currentPath = typeof location === 'string' ? location : window.location.pathname;
  const [isResizing, setIsResizing] = useState(false);
  const [threatEmail, setThreatEmail] = useState("");
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

  const showSidebar = !isMobile;

  const handleJoinThreatAlerts = () => {
    if (!threatEmail || !threatEmail.includes("@")) {
      toast.error("Provide a valid neural index (email).");
      return;
    }
    toast.success("Identity subscribed to neural threat index. Verification pending.");
    setThreatEmail("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans selection:bg-primary/30">
      <TopNav />
      <SubNav />
      <div className="flex flex-1 relative">
        {showSidebar && (
          <div className="relative border-r border-white/5 bg-card/10 backdrop-blur-sm" ref={sidebarRef} style={{ width: sidebarWidth }}>
            <Sidebar
              collapsible="none"
              className="w-full bg-transparent"
            >
              <SidebarContent className="gap-0 py-8">
                <div className="px-6 mb-8">
                  <div className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-1">Navigation Console</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Operational Modules</div>
                </div>
                <SidebarMenu className="px-3 gap-2">
                  {menuItems.map(item => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          className={`h-12 px-4 rounded-xl transition-all font-normal group ${isActive ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-white/5 border border-transparent"}`}
                        >
                          <item.icon className={`h-4 w-4 transition-transform duration-500 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                          <span className="font-rajdhani font-bold text-xs uppercase tracking-[0.1em]">{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors"
              onMouseDown={() => setIsResizing(true)}
              style={{ zIndex: 50 }}
            />
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10">
          <div className="container max-w-7xl mx-auto pb-20">
            {children}
          </div>
        </main>
      </div>

      <footer className="border-t border-white/5 bg-black py-16 relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="font-rajdhani text-3xl font-bold uppercase tracking-tighter">Fake<span className="text-primary">Shield</span></span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest">
              High-fidelity neural forensic platform. Exposing digital deception through advanced machine learning and cryptographic verification.
            </p>
          </div>
          <div>
            <h4 className="font-rajdhani font-bold text-xs mb-6 uppercase tracking-[0.2em] text-white">Forensic Suite</h4>
            <ul className="space-y-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <li><button onClick={() => setLocation("/analyze?type=video")} className="hover:text-primary transition-colors flex items-center gap-2 text-left">Deepfake Video</button></li>
              <li><button onClick={() => setLocation("/analyze?type=audio")} className="hover:text-primary transition-colors flex items-center gap-2 text-left">Neural Audio</button></li>
              <li><button onClick={() => setLocation("/analyze?type=text")} className="hover:text-primary transition-colors flex items-center gap-2 text-left">Scam Analysis</button></li>
              <li><button onClick={() => setLocation("/analyze?type=url")} className="hover:text-primary transition-colors flex items-center gap-2 text-left">URL Forensic</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-rajdhani font-bold text-xs mb-6 uppercase tracking-[0.2em] text-white">Information</h4>
            <ul className="space-y-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <li><button onClick={() => setLocation("/features")} className="hover:text-primary transition-colors flex items-center gap-2 text-left"><Zap className="h-3 w-3" /> Capabilities</button></li>
              <li><button onClick={() => setLocation("/pricing")} className="hover:text-primary transition-colors flex items-center gap-2 text-left"><CreditCard className="h-3 w-3" /> Subscriptions</button></li>
              <li><button onClick={() => setLocation("/faq#docs")} className="hover:text-primary transition-colors flex items-center gap-2 text-left">Documentation</button></li>
              <li><button onClick={() => setLocation("/faq#privacy")} className="hover:text-primary transition-colors flex items-center gap-2 text-left"><ShieldCheck className="h-3 w-3" /> Privacy Protocol</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-rajdhani font-bold text-xs mb-6 uppercase tracking-[0.2em] text-white">Threat Alerts</h4>
            <p className="text-[10px] font-bold text-muted-foreground mb-6 uppercase tracking-widest leading-relaxed">Subscribe to the global neural threat index for real-time protection updates.</p>
            <div className="flex gap-2">
              <Input 
                placeholder="Forensic Email" 
                value={threatEmail}
                onChange={(e) => setThreatEmail(e.target.value)}
                className="h-12 text-[10px] font-bold uppercase tracking-widest bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all text-white" 
              />
              <Button onClick={handleJoinThreatAlerts} className="h-12 px-6 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">Join</Button>
            </div>
          </div>
        </div>
        <div className="container mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">© 2026 FakeShield AI Neural Forensic Platform. All rights reserved.</p>
          <div className="flex gap-8 text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">
            <button onClick={() => window.open("https://x.com", "_blank")} className="hover:text-primary transition-colors">X.COM</button>
            <button onClick={() => window.open("https://linkedin.com", "_blank")} className="hover:text-primary transition-colors">LINKEDIN</button>
            <button onClick={() => window.open("https://github.com", "_blank")} className="hover:text-primary transition-colors">GITHUB</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
