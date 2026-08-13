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
import { priorityColor, priorityLabel } from "@/lib/labels";
import {
  Ambulance,
  CheckCircle2,
  Clock,
  Crosshair,
  HeartPulse,
  Loader2,
  Route,
  ShieldCheck,
  Timer,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

type ReqRow = {
  id: number;
  requestId: string;
  ambulanceId: number;
  priority: string;
  status: string;
  patientCondition: string | null;
  distanceKm: number | null;
  etaSec: number | null;
  createdAt: Date;
};

export default function HospitalEmergencies() {
  const utils = trpc.useUtils();
  const incoming = trpc.emergencies.incoming.useQuery(undefined, {
    retry: 1,
    refetchInterval: 20000,
  });
  const rows = ((incoming.data?.rows ?? []) as ReqRow[]) ?? [];
  const hospital = incoming.data?.hospital as { name: string; emergencyContact: string | null } | null;

  const arrive = trpc.emergencies.arrive.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Patient arrival confirmed — handover registered");
      utils.emergencies.incoming.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const complete = trpc.emergencies.complete.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Emergency completed — corridor closing, signals normalizing");
      utils.emergencies.incoming.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const active = rows.filter(r => !["completed", "rejected", "cancelled"].includes(r.status));
  const history = rows.filter(r => ["completed", "rejected", "cancelled"].includes(r.status));

  return (
    <RoleShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-rose-300" /> Emergency Bay
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hospital?.name ?? "Hospital"} — live incoming ambulance emergencies with
            corridor telemetry.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MiniStat
            label="In transit"
            value={active.filter(r => r.status === "corridor_active" || r.status === "in_transit").length}
            icon={Ambulance}
            tone="amber"
          />
          <MiniStat
            label="Arrived"
            value={active.filter(r => r.status === "arrived").length}
            icon={UserCheck}
            tone="blue"
          />
          <MiniStat
            label="Completed"
            value={history.length}
            icon={CheckCircle2}
            tone="green"
          />
        </div>

        {incoming.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full bg-white/5" />
            <Skeleton className="h-28 w-full bg-white/5" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {active.map(r => (
                <Card key={r.id} className="border-white/10 bg-card">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-400/25 flex items-center justify-center">
                          <Ambulance className="h-5 w-5 text-rose-300" />
                        </div>
                        <div>
                          <p className="text-sm font-black font-mono">{r.requestId}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Filed{" "}
                            {new Date(r.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          style={{ backgroundColor: priorityColor(r.priority), color: "#fff", border: 0 }}
                          className="font-bold"
                        >
                          {priorityLabel(r.priority)}
                        </Badge>
                        <Badge className="bg-blue-500/15 text-blue-300 border-blue-400/30">
                          {(r.status as string).replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {r.patientCondition && (
                      <div className="flex items-center gap-2.5 rounded-lg bg-accent/40 border border-white/5 px-3 py-2">
                        <HeartPulse className="h-4 w-4 text-rose-300 shrink-0" />
                        <span className="text-[10px] text-muted-foreground w-24 shrink-0 uppercase tracking-wide font-bold">
                          Condition
                        </span>
                        <span className="text-xs font-semibold">{r.patientCondition}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Tele icon={Route} label="Unit" value={`#${r.ambulanceId}`} />
                      <Tele
                        icon={Crosshair}
                        label="Distance"
                        value={r.distanceKm ? `${r.distanceKm.toFixed(1)} km` : "—"}
                      />
                      <Tele
                        icon={Timer}
                        label="ETA"
                        value={r.etaSec ? `${Math.round(r.etaSec / 60)} min` : "—"}
                      />
                      <Tele
                        icon={ShieldCheck}
                        label="Corridor"
                        value={r.status === "submitted" ? "PENDING" : "ACTIVE"}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {r.status === "in_transit" || r.status === "corridor_active" ? (
                        <Button
                          size="sm"
                          disabled={arrive.isPending}
                          onClick={() => arrive.mutate({ requestId: r.requestId })}
                          className="bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs"
                        >
                          {arrive.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                          Confirm Arrival
                        </Button>
                      ) : null}
                      {r.status === "arrived" && (
                        <Button
                          size="sm"
                          disabled={complete.isPending}
                          onClick={() => complete.mutate({ requestId: r.requestId })}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                        >
                          {complete.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                          Complete Emergency (Close Corridor)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {active.length === 0 && (
                <Card className="border-white/10 bg-card">
                  <CardContent className="pt-8 pb-8 text-center">
                    <HeartPulse className="h-10 w-10 text-rose-300/40 mx-auto" />
                    <p className="text-sm font-semibold mt-3">No active emergencies</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verified ambulances will appear here the moment police approve a
                      corridor to this hospital.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {history.length > 0 && (
              <Card className="border-white/10 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {history.map(r => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-accent/30 px-3 py-2"
                    >
                      <p className="text-xs font-bold font-mono">{r.requestId}</p>
                      <Badge
                        className="bg-white/10 text-slate-300"
                        style={{ border: 0 }}
                      >
                        {(r.status as string).replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </RoleShell>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "amber" | "blue" | "green";
}) {
  const tones: Record<string, string> = {
    amber: "text-amber-300",
    blue: "text-blue-300",
    green: "text-emerald-300",
  };
  return (
    <div className="rounded-xl border border-white/10 bg-card px-4 py-3 flex items-center gap-3">
      <Icon className={`h-5 w-5 ${tone ? tones[tone] : "text-slate-400"}`} />
      <div>
        <p className="text-lg font-black leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

function Tele({
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
      <Icon className="h-4 w-4 text-rose-300 shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-black leading-tight">{value}</p>
      </div>
    </div>
  );
}
