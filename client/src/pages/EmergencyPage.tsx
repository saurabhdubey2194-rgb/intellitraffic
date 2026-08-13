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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { KANPUR_CENTER } from "@shared/intellitraffic";
import { priorityColor, priorityLabel } from "@/lib/labels";
import {
  ArrowRight,
  Crosshair,
  Hospital,
  Loader2,
  Radio,
  Signal,
  Siren,
  Timer,
  Waves,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const STEPS = [
  { key: "submitted", label: "Request Submitted", desc: "Sent to police for verification" },
  { key: "approved", label: "Police Approved", desc: "Identity & urgency verified" },
  { key: "corridor_active", label: "Corridor Predictive Activation", desc: "AI clears signals ahead" },
  { key: "in_transit", label: "In Transit", desc: "Dynamic signal priority simulation" },
  { key: "arrived", label: "Arrived at Hospital", desc: "Handover confirmed" },
  { key: "completed", label: "Completed", desc: "Corridor closed, signals normalized" },
];

const STATUS_FLOW: Record<string, string[]> = {
  submitted: ["submitted", "approved", "corridor_active", "in_transit", "arrived", "completed"],
  approved: ["submitted", "approved", "corridor_active", "in_transit", "arrived", "completed"],
  corridor_active: ["submitted", "approved", "corridor_active", "in_transit", "arrived", "completed"],
  in_transit: ["submitted", "approved", "corridor_active", "in_transit", "arrived", "completed"],
  arrived: ["submitted", "approved", "corridor_active", "in_transit", "arrived", "completed"],
  completed: ["submitted", "approved", "corridor_active", "in_transit", "arrived", "completed"],
};

export default function EmergencyPage() {
  const [condition, setCondition] = useState("");
  const [priority, setPriority] = useState<string>("critical");
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [, setLocation] = useLocation();

  // Hospitals via nearby query at city centre
  const nearby = trpc.traffic.nearby.useQuery(
    { lat: KANPUR_CENTER.lat, lng: KANPUR_CENTER.lng, radiusKm: 12 },
    { retry: 1 }
  );
  const hospitalList = nearby.data?.hospitals ?? [];

  const utils = trpc.useUtils();
  const create = trpc.emergencies.create.useMutation({
    onSuccess: data => {
      toast.success(`Emergency request ${data.requestId} submitted for police verification`);
      utils.emergencies.mine.invalidate();
      setLocation("/dashboard");
    },
    onError: e => toast.error(e.message),
  });

  const mine = trpc.emergencies.mine.useQuery(undefined, {
    retry: 1,
    refetchInterval: 30000,
  });
  type MineRow = {
    id: number;
    requestId: string;
    patientCondition: string | null;
    priority: string;
    status: string;
    hospitalId: number;
    distanceKm: number | null;
    etaSec: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
  const mineRows = (mine.data?.rows ?? []) as Array<MineRow>;
  const latestActive = mineRows.find(
    r => !["completed", "rejected", "cancelled"].includes(r.status)
  );

  const corridor = trpc.emergencies.myCorridor.useQuery(
    { requestId: latestActive?.requestId ?? "" },
    { enabled: !!latestActive, retry: 1, refetchInterval: 15000 }
  );

  type CorridorRow = {
    corridorId: string;
    status: string;
    progressPct: number;
    estimatedTimeSavedMin: number;
    signalsPrepared: number;
    totalSignals: number;
  } | null;
  const corridorRow = (corridor.data?.corridor ?? null) as CorridorRow;
  const corridorSignals = (corridor.data?.signals ?? []) as unknown as Array<{
    id: number;
    signalCode: string;
    intersection: string;
    corridorPhase: string | null;
  }>;

  const activate = trpc.emergencies.activateCorridor.useMutation({
    onSuccess: () => {
      toast.success("Predictive corridor activated — signals ahead are pre-clearing");
      utils.emergencies.myCorridor.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const setProgress = trpc.emergencies.corridorProgress.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Position updated — ${vars.progressPct}% along the corridor`);
      utils.emergencies.myCorridor.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const activeSteps = latestActive ? STATUS_FLOW[latestActive.status] ?? [] : [];

  const hospitalName = (id: number) =>
    hospitalList.find(h => h.id === id)?.name ?? `Hospital #${id}`;

  return (
    <RoleShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Siren className="h-6 w-6 text-red-400" /> Emergency Ambulance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Request → Police Verification → AI Route → Predictive Corridor → Signal
            Priority Simulation. Every corridor is activated predictively, clearing
            signals ahead before the ambulance arrives.
          </p>
        </div>

        {latestActive && (
          <Card className="border-red-400/30 bg-red-500/5">
            <CardContent className="pt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-black">Active Emergency</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {latestActive.requestId}
                  </p>
                </div>
                <Badge
                  className="text-white font-bold"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  {(latestActive.status as string).replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              {/* Step timeline */}
              <div className="flex flex-wrap gap-x-1 gap-y-2">
                {STEPS.map((s, i) => {
                  const active =
                    activeSteps.includes(s.key) && s.key === latestActive.status
                      ? "current"
                      : activeSteps.includes(s.key)
                        ? "done"
                        : "pending";
                  return (
                    <div key={s.key} className="flex items-center gap-1.5">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 border ${
                          active === "done"
                            ? "bg-emerald-500 border-emerald-400 text-slate-950"
                            : active === "current"
                              ? "bg-red-600 border-red-400 text-white pulse-emergency"
                              : "bg-white/5 border-white/15 text-slate-500"
                        }`}
                      >
                        {active === "done" ? "✓" : i + 1}
                      </div>
                      <span
                        className={`text-[10px] font-semibold max-w-[90px] ${
                          active === "current" ? "text-red-300" : active === "done" ? "text-emerald-300" : "text-slate-500"
                        }`}
                      >
                        {s.label}
                      </span>
                      {i < STEPS.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-slate-600" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Corridor telemetry */}
              {corridorRow && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Telemetry
                    icon={Timer}
                    label="Time saved"
                    value={`${corridorRow.estimatedTimeSavedMin} min`}
                  />
                  <Telemetry
                    icon={Signal}
                    label="Signals prepared"
                    value={`${corridorRow.signalsPrepared}/${corridorRow.totalSignals}`}
                  />
                  <Telemetry
                    icon={Crosshair}
                    label="Ambulance progress"
                    value={`${corridorRow.progressPct}%`}
                  />
                  <Telemetry
                    icon={Radio}
                    label="Corridor status"
                    value={(corridorRow.status ?? "—").toUpperCase()}
                  />
                </div>
              )}

              {/* Dynamic signal priority simulation */}
              {corridorSignals.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Dynamic signal priority simulation — {corridorRow?.status}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {corridorSignals.map(s => (
                      <div
                        key={s.id}
                        className="rounded-lg border border-white/10 bg-card px-3 py-2"
                      >
                        <p className="text-[10px] text-muted-foreground truncate">
                          {s.signalCode}
                        </p>
                        <p
                          className="text-xs font-black mt-0.5"
                          style={{
                            color:
                              s.corridorPhase === "ready"
                                ? "#22c55e"
                                : s.corridorPhase === "preparing"
                                  ? "#f59e0b"
                                  : s.corridorPhase === "monitoring"
                                    ? "#3b82f6"
                                    : "#94a3b8",
                          }}
                        >
                          {(s.corridorPhase === "ready"
                            ? "GREEN WAVE"
                            : s.corridorPhase === "preparing"
                              ? "PRE-CLEARING"
                              : s.corridorPhase === "monitoring"
                                ? "MONITORING"
                                : "NORMAL")
                            .toUpperCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress slider — simulates ambulance movement */}
              {!["arrived", "completed", "rejected", "cancelled"].includes(latestActive.status ?? "") && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>AMBULANCE POSITION (SIMULATION)</span>
                    <span>{progressPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progressPct}
                    onChange={e => setProgressPct(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/15 text-xs font-semibold"
                      disabled={setProgress.isPending}
                      onClick={() =>
                        setProgress.mutate({ requestId: latestActive.requestId, progressPct })
                      }
                    >
                      Update Position
                    </Button>
                    {latestActive.status === "approved" && (
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                        disabled={activate.isPending}
                        onClick={() =>
                          activate.mutate({ requestId: latestActive.requestId })
                        }
                      >
                        {activate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                        Activate Predictive Corridor
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <Waves className="h-3 w-3" />
                The corridor predicts where the ambulance will be and turns signals
                green in advance — the simulation shows phases transitioning from
                normal → monitoring → preparing → ready as you progress.
              </p>
            </CardContent>
          </Card>
        )}

        {/* New request form */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-emerald-300" /> Raise New Emergency
            </CardTitle>
            <CardDescription className="text-xs">
              Select a destination hospital. Police will verify before the corridor is
              activated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nearby.isLoading ? (
              <Skeleton className="h-24 w-full bg-white/5" />
            ) : hospitalList.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hospitals loaded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {hospitalList.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setHospitalId(h.id)}
                    className={`rounded-lg border px-3 py-2 text-left transition-all active:scale-[0.98] ${
                      hospitalId === h.id
                        ? "border-red-400/50 bg-red-500/10"
                        : "border-white/10 bg-accent/30 hover:border-white/25"
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <Hospital className="h-3.5 w-3.5 text-rose-300 shrink-0" />
                      {h.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {(h.distanceKm ?? 0).toFixed(1)} km · {(h.bedsAvailable ?? 0) > 0 ? `${h.bedsAvailable} beds` : "ER available"}
                      {h.emergencyAvailable === false ? " · ER full" : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-accent/50 px-3 py-2 text-sm font-medium"
                >
                  <option value="high" className="bg-[#0c1a33]">High</option>
                  <option value="critical" className="bg-[#0c1a33]">Critical</option>
                  <option value="extreme" className="bg-[#0c1a33]">Extreme</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Patient condition
                </label>
                <Textarea
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  placeholder="e.g., Cardiac arrest, needs ICU"
                  className="bg-accent/50 border-white/15 text-sm"
                  rows={2}
                />
              </div>
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black"
              disabled={!hospitalId || create.isPending}
              onClick={() =>
                hospitalId &&
                create.mutate({
                  hospitalId,
                  patientCondition: condition || undefined,
                  priority: priority as "high" | "critical" | "extreme",
                  fromLat: KANPUR_CENTER.lat,
                  fromLng: KANPUR_CENTER.lng,
                })
              }
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Siren className="h-4 w-4 mr-2" />
              )}
              Submit Emergency Request
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        {mineRows.length > 0 && (
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Request History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mineRows.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-accent/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold font-mono">{r.requestId}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {hospitalName(r.hospitalId)} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge
                    className="shrink-0"
                    style={{
                      backgroundColor: priorityColor(r.priority),
                      color: "#fff",
                      border: 0,
                    }}
                  >
                    {priorityLabel(r.priority)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </RoleShell>
  );
}

function Telemetry({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-card px-3 py-2.5 flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-red-300 shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-black leading-tight">{value}</p>
      </div>
    </div>
  );
}
