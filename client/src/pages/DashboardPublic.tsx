import RoleShell from "@/components/RoleShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  formatDistance,
  haversineKm,
  KANPUR_CENTER,
} from "@shared/intellitraffic";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Ambulance,
  ArrowRight,
  Bell,
  Building2,
  Car,
  MapPin,
  Shield,
  Siren,
  TrafficCone,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { incidentColor } from "@/lib/labels";

/** Public-facing dashboard: live nearby traffic, quick actions, feed. */
export default function DashboardPublic() {
  const { user } = useAuth();
  const [radius, setRadius] = useState(5);

  const anchor = useMemo(() => ({ lat: KANPUR_CENTER.lat, lng: KANPUR_CENTER.lng }), []);

  const nearby = trpc.traffic.nearby.useQuery({
    lat: anchor.lat,
    lng: anchor.lng,
    radiusKm: radius,
  });
  const incidents = trpc.traffic.incidents.useQuery({ status: "all", limit: 25 });

  const overallColor: Record<string, string> = {
    low: "#22c55e",
    moderate: "#f59e0b",
    heavy: "#f97316",
    severe: "#ef4444",
  };

  return (
      <>
            <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {user?.name
                ? `Welcome back, ${user.name.split(" ")[0]}`
                : "Good day, traveller"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live simulated traffic around Delhi NCR city centre ·{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/map">
              <Button
                variant="outline"
                size="sm"
                className="border-white/15 font-semibold"
              >
                <MapPin className="h-3.5 w-3.5 mr-1.5" /> Open Map
              </Button>
            </Link>
            <Link href="/routes">
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                Plan a Route{" "}
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction
            icon={Siren}
            label="Emergency SOS"
            desc="Call 112 directly"
            tone="red"
            href="tel:112"
          />
          <QuickAction
            icon={TrafficCone}
            label="Report Incident"
            desc="Accident, closure, flooding"
            tone="amber"
            href="/alerts"
          />
          <QuickAction
            icon={Building2}
            label="Find Hospital"
            desc="Nearest emergency care"
            tone="green"
            href="/map"
          />
          <QuickAction
            icon={Car}
            label="Traffic Update"
            desc="City-wide overview"
            tone="blue"
            href="/map"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Nearby traffic summary */}
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Nearby Traffic</CardTitle>
                <div className="flex gap-1">
                  {[3, 5, 10].map(r => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        radius === r
                          ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                          : "border-white/10 text-muted-foreground hover:text-slate-200"
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
              <CardDescription className="text-xs">
                Within {radius} km of city centre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {nearby.isLoading ? (
                <>
                  <Skeleton className="h-10 w-full bg-white/5" />
                  <Skeleton className="h-10 w-full bg-white/5" />
                </>
              ) : (
                <>
                  <MetricRow
                    label="Overall traffic"
                    value={
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              overallColor[nearby.data?.overall ?? "moderate"],
                          }}
                        />
                        <span className="capitalize font-bold">
                          {nearby.data?.overall ?? "—"}
                        </span>
                      </span>
                    }
                  />
                  <MetricRow
                    label="Average speed"
                    value={
                      nearby.data?.avgSpeedKmh
                        ? `${nearby.data.avgSpeedKmh} km/h`
                        : "—"
                    }
                  />
                  <MetricRow
                    label="Active incidents"
                    value={nearby.data?.incidentCount ?? 0}
                    tone="red"
                  />
                  <MetricRow
                    label="Signals monitored"
                    value={nearby.data?.signalCount ?? 0}
                    tone="green"
                  />
                  <MetricRow
                    label="Hospitals nearby"
                    value={nearby.data?.hospitalCount ?? 0}
                    tone="blue"
                  />
                  <MetricRow
                    label="Police booths"
                    value={nearby.data?.policeStationCount ?? 0}
                    tone="blue"
                  />
                </>
              )}
              <p className="text-[10px] text-muted-foreground pt-1">
                Updated {nearby.data?.lastUpdated ? new Date(nearby.data.lastUpdated).toLocaleTimeString("en-IN") : ""} (auto-refresh)
              </p>
            </CardContent>
          </Card>

          {/* Nearby places */}
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Nearby Services</CardTitle>
              <CardDescription className="text-xs">
                Hospitals & police booths within {radius} km
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {nearby.isLoading ? (
                <Skeleton className="h-10 w-full bg-white/5" />
              ) : (
                <>
                  {(nearby.data?.hospitals ?? []).map(h => (
                    <div
                      key={h.id}
                      className="flex items-center gap-2.5 rounded-lg bg-accent/40 border border-white/5 px-3 py-2"
                    >
                      <Building2 className="h-4 w-4 text-emerald-300 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">
                          {h.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistance((h as { distanceKm?: number }).distanceKm)}
                          {h.emergencyContact ? ` · ${h.emergencyContact}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(nearby.data?.policeStations ?? []).map(p => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 rounded-lg bg-accent/40 border border-white/5 px-3 py-2"
                    >
                      <Shield className="h-4 w-4 text-blue-300 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.district ?? ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(nearby.data?.signals ?? []).slice(0, 4).map(s => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2.5 rounded-lg bg-accent/40 border border-white/5 px-3 py-2"
                    >
                      <Car className="h-4 w-4 text-amber-300 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">
                          {s.signalCode}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.intersection ?? ""}
                        </p>
                      </div>
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            overallColor[s.trafficDensity ?? "moderate"],
                        }}
                      />
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Live incident feed */}
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-300" /> Live Alerts
                </CardTitle>
                <Link href="/alerts">
                  <span className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200">
                    View all →
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-72 overflow-y-auto">
              {incidents.isLoading ? (
                <Skeleton className="h-10 w-full bg-white/5" />
              ) : (incidents.data?.rows ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No active incidents. The city is clear.
                </p>
              ) : (
                (incidents.data?.rows ?? []).slice(0, 10).map(inc => (
                  <div
                    key={inc.id}
                    className="flex items-start gap-2.5 rounded-lg border border-white/5 px-3 py-2 hover:bg-accent/40 transition-colors"
                  >
                    <span
                      className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${incidentColor(inc.type)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">
                        {incidentTypeLabel(inc.type)}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {inc.reportId} · {inc.district ?? "New Delhi"} ·{" "}
                        {new Date(inc.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] border-0 uppercase bg-white/5 text-slate-300"
                    >
                      {inc.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Signal status grid */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Signal Status (Live Simulation)</CardTitle>
            <CardDescription className="text-xs">
              Traffic density per intersection — refreshed automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nearby.isLoading ? (
              <Skeleton className="h-24 w-full bg-white/5" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {(nearby.data?.signals ?? []).map(s => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-white/5 bg-accent/30 px-3 py-2"
                  >
                    <p className="text-xs font-semibold truncate">{s.signalCode}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor:
                            overallColor[s.trafficDensity ?? "moderate"],
                          color: "#fff",
                        }}
                      >
                        {s.trafficDensity ?? "moderate"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {(s.avgSpeedKmh ?? 0) > 0 ? `${s.avgSpeedKmh} km/h` : "idle"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </>
  );
}

function QuickAction({
  icon: Icon,
  label,
  desc,
  tone,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  tone: "red" | "amber" | "green" | "blue";
  href: string;
}) {
  const tones: Record<string, string> = {
    red: "from-red-500/15 to-red-500/5 border-red-400/30",
    amber: "from-amber-500/15 to-amber-500/5 border-amber-400/30",
    green: "from-emerald-500/15 to-emerald-500/5 border-emerald-400/30",
    blue: "from-blue-500/15 to-blue-500/5 border-blue-400/30",
  };
  return (
    <Link
      href={href}
      className={`block rounded-xl border bg-gradient-to-br ${tones[tone]} p-3 hover:brightness-125 transition-all`}
    >
      <Icon className="h-5 w-5 mb-2 text-white/90" />
      <p className="text-sm font-bold text-white">{label}</p>
      <p className="text-[11px] text-white/70">{desc}</p>
    </Link>
  );
}

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "red" | "amber" | "blue" | "green";
}) {
  const tones: Record<string, string> = {
    red: "text-red-300",
    amber: "text-amber-300",
    blue: "text-blue-300",
    green: "text-emerald-300",
  };
  return (
    <div className="flex items-center justify-between rounded-lg bg-accent/40 border border-white/5 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${tone ? tones[tone] : ""}`}>
        {value}
      </span>
    </div>
  );
}

function incidentTypeLabel(type?: string | null): string {
  const map: Record<string, string> = {
    accident: "Accident",
    road_blockage: "Road Blockage",
    waterlogging: "Waterlogging",
    construction: "Construction",
    broken_signal: "Broken Signal",
    heavy_congestion: "Heavy Congestion",
    other: "Other",
  };
  return map[type ?? "other"] ?? (type ?? "Incident");
}
