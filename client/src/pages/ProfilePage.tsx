import RoleShell from "@/components/RoleShell";
// startLogin imported from @/const
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

import {
  Activity,
  BadgeCheck,
  Building2,
  Calendar,
  HeartPulse,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useLocation } from "wouter";
import { useRole } from "@/components/RoleShell";
import { AlertCircle, Ambulance, ArrowRight, Hospital, Siren, TrafficCone } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", city: "", district: "", state: "" });
  const [loaded, setLoaded] = useState(false);

  const profile = trpc.auth.profile.useQuery(undefined, {
    enabled: !!user,
    retry: 1,
  });

  const p = profile.data;
  const u = p?.user;

  useEffect(() => {
    if (p && !loaded) {
      setForm({
        name: u?.name ?? "",
        phone: u?.phone ?? "",
        city: u?.city ?? "",
        district: u?.district ?? "",
        state: u?.state ?? "",
      });
      setLoaded(true);
    }
  }, [p, loaded, u]);

  const update = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      profile.refetch();
    },
    onError: e => toast.error(e.message),
  });

  const ambulance = p?.ambulance ?? null;
  const hospital = p?.hospital ?? null;
  const police = p?.police ?? null;

  return (
      <>
            <div className="space-y-4">
        <h1 className="text-2xl font-black tracking-tight">My Profile</h1>

        {/* Account card */}
        <Card className="border-white/10 bg-card">
          <CardContent className="pt-5 flex flex-wrap items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-xl font-black text-emerald-300 shrink-0">
              {(u?.name ?? user?.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black">{u?.name ?? user?.name ?? "IntelliTraffic User"}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-400/30">
                  {u?.role === "admin" || u?.role === "host" ? "Host / Admin" : u?.role ?? "Public"}
                </Badge>
                {u?.verificationStatus && u.verificationStatus !== "verified" ? (
                  <Badge className="bg-amber-500/15 text-amber-300 border-amber-400/30">
                    {u.verificationStatus.replace("_", " ")}
                  </Badge>
                ) : u?.verificationStatus === "verified" ? (
                  <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-400/30 flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3" /> Verified
                  </Badge>
                ) : null}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Joined {u?.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/15 text-xs font-semibold"
              onClick={() => startLogin()}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>

        {/* Public user CTA: apply for a verified role */}
        {useRole(u) === "public" && (
          <Card className="border-amber-400/25 bg-amber-500/5">
            <CardContent className="pt-5 pb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Get a verified role</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Apply as an Ambulance Driver, Police Officer or Hospital Staff to
                    unlock emergency corridors, verification queues and role
                    dashboards. Applications are reviewed by a host admin.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <ChooseRoleButton icon={Ambulance} label="Ambulance" />
                    <ChooseRoleButton icon={TrafficCone} label="Police" />
                    <ChooseRoleButton icon={Hospital} label="Hospital" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role-specific card */}
        {profile.isLoading ? (
          <Skeleton className="h-40 w-full bg-white/5" />
        ) : (
          <>
            {ambulance && (
              <Card className="border-white/10 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-red-400" /> Ambulance Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row icon={BadgeCheck} label="Registration" value={ambulance.registrationNumber} />
                  <Row icon={Star} label="Trust Score" value={`${ambulance.trustScore ?? "—"}`} />
                  <Row icon={Building2} label="Hospital Association" value={hospital?.name ?? ambulance.hospitalAssociation ?? "—"} />
                  <div className="pt-2">
                    <TrustBar score={ambulance.trustScore ?? 0} />
                  </div>
                </CardContent>
              </Card>
            )}

            {hospital && (
              <Card className="border-white/10 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-rose-400" /> Hospital Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row icon={Building2} label="Hospital" value={hospital.name} />
                  <Row icon={BadgeCheck} label="Registration" value={hospital.registrationNumber ?? "—"} />
                  <Row icon={Phone} label="Emergency Contact" value={hospital.emergencyContact ?? "—"} />
                  <Row icon={MapPin} label="Location" value={`${hospital.district ?? ""}, ${hospital.state ?? ""}`} />
                </CardContent>
              </Card>
            )}

            {police && (
              <Card className="border-white/10 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-400" /> Police Station
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row icon={Building2} label="Station" value={police.name} />
                  <Row icon={BadgeCheck} label="Officer ID" value={police.officerId ?? "—"} />
                  <Row icon={MapPin} label="District" value={`${police.district ?? ""}, ${police.state ?? ""}`} />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Editable info */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contact Information</CardTitle>
            <CardDescription className="text-xs">
              Used to notify you about incidents and emergency corridors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Field label="City" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Field label="District" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} />
              <Field label="State" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} />
            </div>
            <Button
              size="sm"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  name: form.name || undefined,
                  phone: form.phone || undefined,
                  city: form.city || undefined,
                  district: form.district || undefined,
                  state: form.state || undefined,
                })
              }
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              {update.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
      </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-accent/40 border border-white/5 px-3 py-2">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <span className="text-xs text-muted-foreground w-44 shrink-0">{label}</span>
      <span className="text-xs font-bold truncate">{value ?? "—"}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-accent/50 border-white/15 text-sm"
      />
    </div>
  );
}

function TrustBar({ score }: { score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
        <span>Driver trust & compliance</span>
        <span>{score} / 100</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor: score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444",
          }}
        />
      </div>
    </div>
  );
}

/** Public-user shortcut: jump to /choose-access-type pre-selecting a role. */
function ChooseRoleButton({ icon: Icon, label }: { icon: typeof Ambulance; label: string }) {
  const [, navigate] = useLocation();
  return (
    <button
      type="button"
      onClick={() => {
        localStorage.setItem("it.pendingRole", label.toLowerCase());
        navigate("/choose-access-type");
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-emerald-400/40 hover:text-emerald-300 transition-colors active:scale-[0.97]"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
      <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
