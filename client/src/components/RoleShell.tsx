import { ROLE_NAV } from "@/components/DashboardLayout";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { ROLE_LABEL } from "@/lib/ui";
import { startLogin } from "@/const";
import { AlertTriangle, Bell, Crown, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

/**
 * Role-aware shell:
 * - If not signed in: shows a sign-in gate
 * - If signed in but role profile incomplete: offers role registration
 * - Redirects unauthenticated dashboard access to home with a link
 * - On mobile (<lg): renders the role-specific bottom navigation bar
 * - On desktop: delegates to DashboardLayout (sidebar)
 */
export function useRole(user: { role?: string | null } | null | undefined): string {
  const r = user?.role;
  if (r === "admin" || r === "host") return "host";
  return r || "public";
}

export default function RoleShell({
  children,
  demoMode = true,
}: {
  children: React.ReactNode;
  /** show DEMO badge on dashboards */
  demoMode?: boolean;
}) {
  const { user, loading } = useAuth();
  const role = useRole(user);
  const [location] = useLocation();

  if (loading) {
    return <div className="min-h-screen" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full rounded-2xl border border-white/10 bg-card p-8 text-center space-y-4">
          <div className="h-12 w-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-emerald-300" />
          </div>
          <h1 className="text-xl font-bold">Sign in to continue</h1>
          <p className="text-sm text-muted-foreground">
            This page is reserved for verified IntelliTraffic accounts. Sign in to
            access your role dashboard.
          </p>
          <Link
            href="/"
            className="block text-sm font-semibold text-emerald-300 hover:text-emerald-200"
          >
            ← Back to home
          </Link>
          <button
            onClick={() => startLogin()}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative pb-24 lg:pb-4 fade-in-up">
        {demoMode && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            DEMO / SIMULATED DATA — traffic, signals, and AI predictions in this
            prototype are simulated, not live government feeds. Signal control is
            simulated; real-world control needs municipal integration.
          </div>
        )}
        {children}
      </div>
      <MobileBottomNav role={role} location={location} />
      <StickyEmergency role={role} />
    </DashboardLayout>
  );
}

function MobileBottomNav({
  role,
  location,
}: {
  role: string;
  location: string;
}) {
  const items = ROLE_NAV[role] || ROLE_NAV.public;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-white/10 bg-[#0c1a33]/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <div className="grid grid-cols-5 h-16">
        {items.map(item => {
          const isActive = location === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-12 active:scale-95 transition-transform ${
                isActive
                  ? "text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.4]" : ""}`} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Sticky SOS/emergency quick-action element for ambulance & hospital roles. */
function StickyEmergency({ role }: { role: string }) {
  const [location, setLocation] = useLocation();
  // Only show on ambulance home & hospital emergencies pages
  const show =
    (role === "ambulance" && location === "/dashboard") ||
    (role === "hospital" && location === "/emergencies") ||
    role === "police";
  if (!show) return null;
  const href =
    role === "police" ? "/requests" : role === "hospital" ? "/emergencies" : "/emergency";
  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-50">
      <Link href={href}>
        <button
          className={`flex items-center gap-2 rounded-full px-4 py-3 font-bold shadow-xl transition-all ${
            role === "ambulance"
              ? "bg-red-600 hover:bg-red-500 text-white pulse-emergency"
              : "bg-primary hover:bg-primary/90 text-primary-foreground border border-white/15"
          }`}
        >
          {role === "ambulance" ? (
            <>
              <SirenSmall className="h-4 w-4" />
              <span className="text-sm">SOS</span>
            </>
          ) : (
            <Crown className="h-4 w-4" />
          )}
        </button>
      </Link>
    </div>
  );
}

function SirenSmall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18v-6a5 5 0 0 1 10 0v6" />
      <path d="M5 21h14" />
      <path d="M12 3v2" />
      <path d="m19.07 4.93-1.41 1.41" />
      <path d="M21 12h-2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="M3 12h2" />
    </svg>
  );
}
