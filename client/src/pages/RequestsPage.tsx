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
import {
  Ambulance,
  CheckCircle2,
  Clock,
  Hospital,
  Loader2,
  Radar,
  ShieldCheck,
  Siren,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { priorityColor, priorityLabel } from "@/lib/labels";

type ReqRow = {
  id: number;
  requestId: string;
  ambulanceId: number;
  ambulanceUserId: number;
  hospitalId: number;
  patientCondition: string | null;
  priority: string;
  status: string;
  suspicious: boolean;
  reviewNote: string | null;
  distanceKm: number | null;
  etaSec: number | null;
  fromLat: number | null;
  fromLng: number | null;
  toLat: number | null;
  toLng: number | null;
  createdAt: Date;
};

export default function RequestsPage() {
  const [, setLocation] = useLocation();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const pending = trpc.emergencies.pendingForPolice.useQuery(undefined, {
    retry: 1,
    refetchInterval: 20000,
  });

  const rows = ((pending.data?.rows ?? []) as ReqRow[]) ?? [];

  // Resolve hospital names via traffic.nearby (cheap, public)
  const nearby = trpc.traffic.nearby.useQuery(
    { lat: 26.4499, lng: 80.3319, radiusKm: 15 },
    { retry: 1 }
  );
  const hospitalList = nearby.data?.hospitals ?? [];
  const hospitalName = (id: number) =>
    hospitalList.find(h => h.id === id)?.name ?? `Hospital #${id}`;

  const approve = trpc.emergencies.approve.useMutation({
    onSuccess: data => {
      toast.success(`${data.corridorId ?? "Request"} approved — corridor preparing`);
      utils.emergencies.pendingForPolice.invalidate();
      setLocation("/dashboard");
    },
    onError: e => toast.error(e.message),
  });

  const reject = trpc.emergencies.reject.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${vars.requestId} rejected`);
      utils.emergencies.pendingForPolice.invalidate();
      setReasons(r => ({ ...r, [vars.requestId]: "" }));
    },
    onError: e => toast.error(e.message),
  });

  return (
    <RoleShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-300" /> Emergency Verification
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verify ambulance emergency requests. Approval triggers AI route selection
            and predictive corridor activation — signals begin pre-clearing before the
            ambulance departs.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Pending" value={rows.length} icon={Clock} tone="amber" />
          <MiniStat
            label="Total verified"
            value={rows.filter(r => r.reviewNote != null).length}
            icon={CheckCircle2}
            tone="green"
          />
          <MiniStat
            label="Suspicious flagged"
            value={rows.filter(r => r.suspicious).length}
            icon={Radar}
            tone="blue"
          />
        </div>

        {pending.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full bg-white/5" />
            <Skeleton className="h-28 w-full bg-white/5" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="border-white/10 bg-card">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-300/50 mx-auto" />
              <p className="text-sm font-semibold mt-3">All caught up</p>
              <p className="text-xs text-muted-foreground mt-1">
                No emergency requests are waiting for verification.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map(r => (
              <Card
                key={r.id}
                className={`border bg-card transition-all ${r.suspicious ? "border-red-400/30" : "border-white/10"}`}
              >
                <CardContent className="pt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-red-500/15 border border-red-400/25 flex items-center justify-center">
                        <Siren className="h-5 w-5 text-red-300" />
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
                      {r.suspicious && (
                        <Badge className="bg-red-500/15 text-red-300 border-red-400/30">
                          <Radar className="h-3 w-3 mr-1" /> Suspicious
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <InfoRow
                      icon={Ambulance}
                      label="Ambulance"
                      value={`Unit #${r.ambulanceId} (driver profile verified via RBAC)`}
                    />
                    <InfoRow
                      icon={Hospital}
                      label="Destination"
                      value={hospitalName(r.hospitalId)}
                    />
                    {r.patientCondition && (
                      <InfoRow icon={Ambulance} label="Condition" value={r.patientCondition} />
                    )}
                    <InfoRow
                      icon={Clock}
                      label="Estimated transit"
                      value={r.etaSec ? `${Math.round(r.etaSec / 60)} min · ${(r.distanceKm ?? 0).toFixed(1)} km` : "Pending AI route"}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Review note (optional)
                    </label>
                    <Textarea
                      value={notes[r.requestId] ?? ""}
                      onChange={e =>
                        setNotes(n => ({ ...n, [r.requestId]: e.target.value }))
                      }
                      placeholder="Verification details..."
                      className="bg-accent/40 border-white/15 text-xs"
                      rows={1}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={approve.isPending}
                      onClick={() =>
                        approve.mutate({ requestId: r.requestId, reviewNote: notes[r.requestId] || undefined })
                      }
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                    >
                      {approve.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      )}
                      Approve &amp; Activate Corridor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-400/30 text-red-300 hover:bg-red-500/10 text-xs font-bold"
                      disabled={reject.isPending}
                      onClick={() => {
                        const reason = reasons[r.requestId];
                        if (!reason || reason.trim().length < 3) {
                          toast.error("Enter a short rejection reason (min 3 chars)");
                          return;
                        }
                        reject.mutate({ requestId: r.requestId, reason });
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Textarea
                      value={reasons[r.requestId] ?? ""}
                      onChange={e =>
                        setReasons(rr => ({ ...rr, [r.requestId]: e.target.value }))
                      }
                      placeholder="Rejection reason (required to reject)..."
                      className="bg-accent/40 border-white/15 text-xs"
                      rows={1}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-accent/40 border border-white/5 px-3 py-2">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <span className="text-[10px] text-muted-foreground w-24 shrink-0 uppercase tracking-wide font-bold">
        {label}
      </span>
      <span className="text-xs font-semibold truncate">{value}</span>
    </div>
  );
}
