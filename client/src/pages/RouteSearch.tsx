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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatEta } from "@shared/intellitraffic";
import {
  AlertTriangle,
  Bot,
  Car,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Route,
  Star,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Candidate = {
  name: string;
  distanceKm: number;
  baseEtaSec: number;
  etaSec: number;
  congestionDelayMin: number;
  incidentDelayMin: number;
  signalDelayMin: number;
  historicalDelayMin: number;
  trafficLevel: string;
  score: number;
  reason?: string;
  scoreBreakdown?: { congestion: number; incidents: number; capacity: number; historical: number; signalDensity: number };
  waypoints: { lat: number; lng: number; name: string }[];
  selected?: boolean;
};

const LANDMARKS: { name: string; lat: number; lng: number }[] = [
  { name: "Kanpur Central Station", lat: 26.4696, lng: 80.3402 },
  { name: "Allen Forest (Phool Bagh)", lat: 26.4677, lng: 80.3556 },
  { name: "Nana Rao Park", lat: 26.4511, lng: 80.3462 },
  { name: "Green Park Stadium", lat: 26.4851, lng: 80.3462 },
  { name: "Jajmau", lat: 26.4964, lng: 80.3886 },
  { name: "Kalyanpur", lat: 26.4778, lng: 80.2787 },
  { name: "Swaroop Nagar", lat: 26.4979, lng: 80.3006 },
  { name: "Kidwai Nagar", lat: 26.4592, lng: 80.3246 },
];

export default function RouteSearch() {
  const { user } = useAuth();
  const [from, setFrom] = useState("Kanpur Central Station");
  const [to, setTo] = useState("Kalyanpur");
  const [emergency, setEmergency] = useState(false);

  const calc = trpc.routes.calculate.useMutation();
  const saveMutation = trpc.routes.saveRoute.useMutation({
    onSuccess: () => toast.success("Route saved to your profile"),
    onError: () => toast.error("Could not save route — sign in first"),
  });
  const saved = trpc.routes.saved.useQuery(undefined, { retry: 1 });

  const fromPoint = LANDMARKS.find(l => l.name === from) ?? LANDMARKS[0];
  const toPoint = LANDMARKS.find(l => l.name === to) ?? LANDMARKS[1];
  const results = (calc.data?.routes ?? []) as Candidate[];
  const best = results[0];

  return (
    <RoleShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">AI Route Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-route comparison powered by the IntelliTraffic AI engine — weighing
            congestion, incidents, road capacity, historical data and signal density.
          </p>
        </div>

        <Card className="border-white/10 bg-card">
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">From</label>
                <select
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-accent/50 px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  {LANDMARKS.map(l => (
                    <option key={l.name} value={l.name} className="bg-[#0c1a33]">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">To</label>
                <select
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-accent/50 px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  {LANDMARKS.map(l => (
                    <option key={l.name} value={l.name} className="bg-[#0c1a33]">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Switch checked={emergency} onCheckedChange={setEmergency} />
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className={`h-4 w-4 ${emergency ? "text-red-400" : "text-muted-foreground"}`} />
                  Emergency / priority routing
                </span>
              </label>
              <Button
                size="lg"
                disabled={calc.isPending}
                onClick={() =>
                  calc.mutate({
                    fromLat: fromPoint.lat,
                    fromLng: fromPoint.lng,
                    toLat: toPoint.lat,
                    toLng: toPoint.lng,
                    emergency,
                  })
                }
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                {calc.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Route className="h-4 w-4 mr-2" />
                )}
                Find Routes
              </Button>
            </div>
          </CardContent>
        </Card>

        {calc.isPending && (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full bg-white/5" />
            <Skeleton className="h-32 w-full bg-white/5" />
          </div>
        )}

        {calc.error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {calc.error.message}
          </div>
        )}

        {results.length > 0 && (
          <>
            {/* Best route highlight */}
            <Card className="border-emerald-400/30 bg-emerald-500/5">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500 text-slate-950 font-bold border-0">AI RECOMMENDED</Badge>
                      <span className="text-xs text-muted-foreground">score {best.score.toFixed(2)}</span>
                    </div>
                    <p className="text-base font-black mt-1">{best.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm">
                      <span className="flex items-center gap-1 font-semibold">
                        <Car className="h-4 w-4 text-blue-300" /> {best.distanceKm.toFixed(1)} km
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="h-4 w-4 text-emerald-300" /> {formatEta(best.etaSec)}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{ backgroundColor: best.trafficLevel === "low" ? "#22c55e" : best.trafficLevel === "moderate" ? "#f59e0b" : "#ef4444", color: "#fff" }}
                      >
                        {best.trafficLevel} traffic
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Why this route
                    </p>
                    <ul className="space-y-1">
                      <li className="flex gap-2 text-xs text-slate-200">
                        <ChevronRight className="h-3.5 w-3.5 text-emerald-300 mt-0.5 shrink-0" />
                        {best.reason || "Fastest available route."}
                      </li>
                    </ul>
                  </div>
                  {best.scoreBreakdown && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                        AI scoring factors (higher = better)
                      </p>
                      <div className="space-y-1.5">
                        <FactorBar label="Congestion" value={best.scoreBreakdown.congestion} />
                        <FactorBar label="Incidents" value={best.scoreBreakdown.incidents} />
                        <FactorBar label="Capacity stress" value={best.scoreBreakdown.capacity} />
                        <FactorBar label="Historical fit" value={best.scoreBreakdown?.historical ?? 0} />
                        <FactorBar label="Signal density" value={best.scoreBreakdown?.signalDensity ?? 0} />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* All candidate routes */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {results.map(r => (
                <Card
                  key={r.name}
                  className={`border bg-card transition-all ${r.selected ? "border-emerald-400/40" : "border-white/10 hover:border-white/25"}`}
                >
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{r.name}</p>
                      {r.selected && <Star className="h-4 w-4 text-emerald-300" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Car className="h-3.5 w-3.5" /> {r.distanceKm.toFixed(1)} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {formatEta(r.etaSec)}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{ backgroundColor: r.trafficLevel === "low" ? "#22c55e" : r.trafficLevel === "moderate" ? "#f59e0b" : "#ef4444", color: "#fff" }}
                      >
                        {r.trafficLevel}
                      </span>
                    </div>
                    {r.waypoints.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
                          Via
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {r.waypoints.map((w, i) => (
                            <span key={i} className="text-[10px] rounded bg-accent/50 border border-white/5 px-1.5 py-0.5 text-slate-200">
                              {w.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-white/15 text-xs font-semibold"
                        onClick={() =>
                          saveMutation.mutate({
                            fromLat: fromPoint.lat,
                            fromLng: fromPoint.lng,
                            toLat: toPoint.lat,
                            toLng: toPoint.lng,
                            name: `${fromPoint.name} → ${toPoint.name}`,
                          })
                        }
                      >
                        Save this route
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {!calc.isPending && results.length === 0 && !calc.data && (
          <Card className="border-white/10 bg-card">
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3 text-center">
              <Navigation className="h-10 w-10 text-emerald-300/60" />
              <p className="text-sm font-semibold">Choose your start and destination</p>
              <p className="text-xs text-muted-foreground max-w-md">
                The AI evaluates every candidate path against live congestion, reported
                incidents, road capacity, historical patterns and signal density — then
                ranks them by an overall score.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Saved routes */}
        {saved.data && saved.data.length > 0 && (
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Saved Routes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {saved.data.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-accent/40 border border-white/5 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-emerald-300 shrink-0" />
                    <span className="text-xs font-semibold truncate">{s.name ?? "Unnamed"}</span>
                  </div>
                    <button
                    onClick={() => {
                      const pick = (lat: number | null, lng: number | null) =>
                        lat != null && lng != null
                          ? (LANDMARKS.find(
                              l => Math.abs(l.lat - lat) < 0.001 && Math.abs(l.lng - lng) < 0.001
                            )?.name ?? undefined)
                          : undefined;
                      const f = pick(s.fromLat, s.fromLng);
                      const t = pick(s.toLat, s.toLng);
                      if (f) setFrom(f);
                      if (t) setTo(t);
                    }}
                    className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 shrink-0 ml-2"
                  >
                    USE
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </RoleShell>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, value * 10))}%`,
            backgroundColor: value < 0.4 ? "#22c55e" : value < 0.7 ? "#f59e0b" : "#ef4444",
          }}
        />
      </div>
      <TrendingDown className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}
