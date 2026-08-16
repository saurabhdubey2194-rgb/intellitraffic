/**
 * Professional role-based sign-in page for IntelliTraffic.
 *
 * Flow: IntelliTraffic header → role selection (Ambulance / Emergency, Police,
 * Hospital) → role-specific credential form → backend OAuth sign-in →
 * role-verified dashboard redirect.
 *
 * Security note: role selection here is a UI preference ONLY. It does not grant
 * authorization — the backend verifies the authenticated user's actual role
 * (ctx.user.role) on every protected procedure, and RoleShell/Dashboards render
 * based on the verified role. A user selecting "Police" will still land on the
 * dashboard matching their true role.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Ambulance as AmbulanceIcon,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Radio,
  Siren,
  ShieldCheck,
  TrafficCone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export type SignInRole = "ambulance" | "police" | "hospital";

interface RoleDef {
  key: SignInRole;
  label: string;
  description: string;
  longLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // text/icon/border accent color
  accentBg: string; // soft bg for icon tile
  accentBorder: string; // selected card border
  accentGlow: string; // selected glow
  button: string; // continue button color
  idLabel: string; // credential field label
  idPlaceholder: string;
  secondIdLabel?: string;
  secondIdPlaceholder?: string;
}

const ROLES: RoleDef[] = [
  {
    key: "ambulance",
    label: "Ambulance / Emergency",
    longLabel: "Ambulance / Emergency",
    description: "For verified ambulances and emergency response vehicles",
    icon: AmbulanceIcon,
    accent: "text-red-400",
    accentBg: "bg-red-500/10 border-red-400/25",
    accentBorder: "border-red-400/70",
    accentGlow: "shadow-[0_0_32px_rgba(239,68,68,0.35)]",
    button: "bg-red-600 text-white hover:bg-red-500",
    idLabel: "Ambulance ID / Registration Number",
    idPlaceholder: "e.g. UP16AB1234",
    secondIdLabel: "Email or Phone",
    secondIdPlaceholder: "driver@ambulance.example or +91 9XXXXXXXXX",
  },
  {
    key: "police",
    label: "Police",
    longLabel: "Police",
    description: "For police stations and authorized traffic officers",
    icon: TrafficCone,
    accent: "text-sky-400",
    accentBg: "bg-sky-500/10 border-sky-400/25",
    accentBorder: "border-sky-400/70",
    accentGlow: "shadow-[0_0_32px_rgba(56,189,248,0.35)]",
    button: "bg-sky-600 text-white hover:bg-sky-500",
    idLabel: "Police Station ID",
    idPlaceholder: "e.g. PS-CP-01",
    secondIdLabel: "Officer ID",
    secondIdPlaceholder: "e.g. OFF-1042",
  },
  {
    key: "hospital",
    label: "Hospital",
    longLabel: "Hospital",
    description: "For hospitals managing emergency ambulance coordination",
    icon: Building2,
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-400/25",
    accentBorder: "border-emerald-400/70",
    accentGlow: "shadow-[0_0_32px_rgba(34,197,94,0.35)]",
    button: "bg-emerald-600 text-white hover:bg-emerald-500",
    idLabel: "Hospital ID",
    idPlaceholder: "e.g. HOSP-AIIMS-01",
    secondIdLabel: "Authorized Email / ID",
    secondIdPlaceholder: "triage@hospital.example",
  },
];

export function signInRoleLabel(role: SignInRole) {
  return ROLES.find(r => r.key === role)?.label ?? role;
}

/** Where the verified role dashboard lives (role → path). */
export const ROLE_DASHBOARD_PATH: Record<SignInRole | "host" | "public", string> = {
  ambulance: "/emergency",
  police: "/requests",
  hospital: "/emergencies",
  host: "/dashboard",
  public: "/",
};

export default function SignInPage() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<SignInRole | null>(() => {
    // Allow deep links like /signin?role=police to preselect a role card.
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role");
    if (r === "ambulance" || r === "police" || r === "hospital") return r;
    try {
      const saved = localStorage.getItem("it.preferredRole");
      if (saved === "ambulance" || saved === "police" || saved === "hospital") return saved;
    } catch {
      /* storage unavailable */
    }
    return null;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  // Credential fields — informational for this prototype; the actual session is
  // established by the existing OAuth flow (startLogin).
  const [creds, setCreds] = useState<Partial<Record<SignInRole, { id: string; second: string; password: string }>>>({});

  const roleDef = ROLES.find(r => r.key === selected);

  /** Already signed in → send straight to the verified role dashboard. */
  useEffect(() => {
    if (loading || !user) return;
    const role = user.role === "admin" || user.role === "host" ? "host" : (user.role ?? "public");
    if (role === "ambulance") navigate(ROLE_DASHBOARD_PATH.ambulance, { replace: true });
    else if (role === "police") navigate(ROLE_DASHBOARD_PATH.police, { replace: true });
    else if (role === "hospital") navigate(ROLE_DASHBOARD_PATH.hospital, { replace: true });
    else navigate(ROLE_DASHBOARD_PATH.host, { replace: true });
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen" />;

  const setField = (field: "id" | "second" | "password", value: string) => {
    if (!selected) return;
    setCreds(prev => ({ ...prev, [selected]: { ...prev[selected], [field]: value } }));
  };

  const handleContinue = () => {
    if (!roleDef) return;
    if (rememberMe) {
      try {
        localStorage.setItem("it.preferredRole", roleDef.key);
      } catch {
        /* storage unavailable */
      }
    }
    // OAuth sign-in. After the callback, RoleShell/dashboard redirects to the
    // user's verified role dashboard (RBAC enforced server-side).
    startLogin();
  };

  const emergencyMode = selected === "ambulance";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-[#0b1526]">
        <div className="container flex items-center justify-center gap-3 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-400/25">
            <Radio className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight">
              Intelli<span className="text-emerald-400">Traffic</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Smart Roads. Faster Emergencies. Safer Cities.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {roleDef ? (
              <span className="flex items-center justify-center gap-3">
                <roleDef.icon className={`h-7 w-7 ${roleDef.accent}`} aria-hidden="true" />
                {roleDef.longLabel} Selected
              </span>
            ) : (
              "Select your access type"
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {roleDef
              ? roleDef.description
              : "IntelliTraffic role-based access — choose the account type you are signing in with."}
          </p>
        </div>

        {/* Role selection */}
        <div
          className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300 ${roleDef ? "lg:grid-cols-3" : ""}`}
          role="radiogroup"
          aria-label="Access type"
        >
          {ROLES.map(r => {
            const chosen = selected === r.key;
            return (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={chosen}
                aria-label={`${r.label} — ${r.description}`}
                onClick={() => setSelected(r.key)}
                className={`group relative text-left rounded-2xl border bg-card p-6 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-primary ${
                  chosen ? `${r.accentBorder} ${r.accentGlow}` : "border-border hover:border-primary/50 hover:bg-[#0f1d33]"
                }`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${r.accentBg}`}>
                    <r.icon className={`h-7 w-7 ${r.accent}`} aria-hidden="true" />
                  </div>
                  {chosen && (
                    <CheckCircle2 className={`h-6 w-6 ${r.accent}`} aria-label="Selected" />
                  )}
                </div>
                <h3 className="text-base font-bold mb-1">{r.label}</h3>
                <p className="text-sm text-muted-foreground leading-snug">{r.description}</p>
                <span className={`mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${chosen ? r.button : "border border-border text-muted-foreground"}`}>
                  {chosen ? (
                    <>
                      <r.icon className="h-3.5 w-3.5" aria-hidden="true" />
                      Continue as {r.label}
                    </>
                  ) : (
                    "Continue"
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Role-specific credential form */}
        {roleDef && (
          <Card
            className={`mt-8 rounded-2xl border p-6 md:p-8 max-w-md mx-auto transition-all duration-300 ${roleDef.accentBorder}`}
            role="form"
            aria-label={`${roleDef.longLabel} sign-in form`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${roleDef.accentBg}`}>
                <roleDef.icon className={`h-6 w-6 ${roleDef.accent}`} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight">{roleDef.longLabel}</h2>
                <p className="text-xs text-muted-foreground">Sign in to your IntelliTraffic account</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="roleId" className="text-sm font-semibold">
                  {roleDef.idLabel}
                </label>
                <Input
                  id="roleId"
                  value={creds[selected!]?.id ?? ""}
                  onChange={e => setField("id", e.target.value)}
                  placeholder={roleDef.idPlaceholder}
                  aria-label={roleDef.idLabel}
                />
              </div>
              {roleDef.secondIdLabel && (
                <div className="space-y-1.5">
                  <label htmlFor="roleSecondId" className="text-sm font-semibold">
                    {roleDef.secondIdLabel}
                  </label>
                  <Input
                    id="roleSecondId"
                    value={creds[selected!]?.second ?? ""}
                    onChange={e => setField("second", e.target.value)}
                    placeholder={roleDef.secondIdPlaceholder}
                    aria-label={roleDef.secondIdLabel}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="rolePassword" className="text-sm font-semibold">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="rolePassword"
                    type={showPassword ? "text" : "password"}
                    value={creds[selected!]?.password ?? ""}
                    onChange={e => setField("password", e.target.value)}
                    placeholder="Enter your password"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#2563eb]"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    aria-label="Remember me"
                  />
                  Remember me
                </label>
                <button type="button" className="text-sm text-primary hover:underline" aria-label="Forgot password">
                  Forgot password?
                </button>
              </div>

              <Button
                type="button"
                onClick={handleContinue}
                className={`w-full rounded-xl h-11 font-bold ${roleDef.button}`}
                aria-label={`Sign in as ${roleDef.longLabel}`}
              >
                {emergencyMode ? (
                  <>
                    <Siren className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Sign In — Start Emergency
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Sign In as {roleDef.label}
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                aria-label="Change access type"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Change access type
              </button>
            </div>
          </Card>
        )}
      </main>

      {/* Footer notices */}
      <footer className="border-t border-border/60 bg-[#0b1526]">
        <div className="container max-w-4xl py-6 px-4 space-y-2.5">
          <div className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-background/60 px-4 py-3">
            <Info className="h-4.5 w-4.5 mt-0.5 shrink-0 text-info" aria-hidden="true" />
            <p className="text-sm text-foreground/90">
              Demo / simulated traffic data. Real signal control requires municipal integration.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Authorized access only. Emergency services should use verified credentials.
          </p>
        </div>
      </footer>
    </div>
  );
}
