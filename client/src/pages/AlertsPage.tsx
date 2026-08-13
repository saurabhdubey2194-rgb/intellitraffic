import RoleShell, { useRole } from "@/components/RoleShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { INCIDENT_TYPES, KANPUR_CENTER } from "@shared/intellitraffic";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plus,
  SearchCheck,
  Siren,
  Waves,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { incidentColor } from "@/lib/labels";

const TYPE_META: Record<string, { label: string; desc: string }> = {
  accident: { label: "Accident", desc: "Collision, injury, or vehicle breakdown" },
  road_blockage: { label: "Road Blockage", desc: "Lane closed, barricade, fallen object" },
  waterlogging: { label: "Waterlogging", desc: "Flooded road or drain overflow" },
  construction: { label: "Construction", desc: "Road works or new obstruction" },
  broken_signal: { label: "Broken Signal", desc: "Traffic light not working" },
  heavy_congestion: { label: "Heavy Congestion", desc: "Unusual traffic jam" },
  other: { label: "Other", desc: "Anything else affecting traffic" },
};

export default function AlertsPage() {
  const { user } = useAuth();
  const role = useRole(user);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("accident");
  const [desc, setDesc] = useState("");
  const [lat, setLat] = useState(String(KANPUR_CENTER.lat));
  const [lng, setLng] = useState(String(KANPUR_CENTER.lng));
  const [district, setDistrict] = useState("Kanpur Nagar");
  const [pinMode, setPinMode] = useState(false);

  const utils = trpc.useUtils();
  const report = trpc.traffic.reportIncident.useMutation({
    onSuccess: data => {
      toast.success(`Incident reported as ${data.reportId}`);
      setOpen(false);
      setDesc("");
      utils.traffic.incidents.invalidate();
      utils.traffic.nearby.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const incidents = trpc.traffic.incidents.useQuery({ status: "all", limit: 50 });
  const policePending =
    role === "police"
      ? trpc.traffic.incidents.useQuery({ status: "reported", limit: 50 }, { enabled: role === "police" })
      : null;
  const updateStatus = trpc.traffic.updateIncidentStatus.useMutation({
    onSuccess: () => {
      toast.success("Incident status updated");
      utils.traffic.incidents.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const rows = incidents.data?.rows ?? [];
  const pendingRows = policePending?.data?.rows ?? [];

  const statusBadge = (status?: string | null) => {
    const styles: Record<string, string> = {
      reported: "bg-amber-500/15 text-amber-300 border-amber-400/30",
      investigating: "bg-blue-500/15 text-blue-300 border-blue-400/30",
      verified: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
      resolved: "bg-slate-500/15 text-slate-300 border-slate-400/30",
      false_report: "bg-red-500/15 text-red-300 border-red-400/30",
    };
    return styles[status ?? "reported"] ?? styles.reported;
  };

  return (
    <RoleShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-amber-300" /> Incident Alerts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Report road incidents as a citizen, or review and verify them as police.
            </p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Report Incident
          </Button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Total reports" value={rows.length} icon={Bell} />
          <MiniStat
            label="Awaiting review"
            value={rows.filter(r => r.status === "reported").length}
            icon={Clock}
            tone="amber"
          />
          <MiniStat
            label="Verified / active"
            value={rows.filter(r => r.status === "verified" || r.status === "investigating").length}
            icon={SearchCheck}
            tone="blue"
          />
          <MiniStat
            label="Resolved"
            value={rows.filter(r => r.status === "resolved").length}
            icon={CheckCircle2}
            tone="green"
          />
        </div>

        {/* Police verification queue */}
        {role === "police" && (
          <Card className="border-amber-400/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldSmall /> Verification Queue — Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingRows.length === 0 && (
                <p className="text-xs text-muted-foreground">No unreviewed reports.</p>
              )}
              {pendingRows.map(inc => (
                <div
                  key={inc.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-400/20 bg-card px-3 py-2"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${incidentColor(inc.type)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold">
                      {inc.reportId} · {TYPE_META[inc.type]?.label ?? inc.type}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {inc.description ?? "No description"} · reported by user #{inc.reportedByUserId}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {(
                      ["investigating", "verified", "resolved", "false_report"] as const
                    ).map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] font-bold border-white/15"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: inc.id, status: s })}
                      >
                        {s === "investigating"
                          ? "Investigate"
                          : s === "verified"
                            ? "Verify"
                            : s === "resolved"
                              ? "Resolve"
                              : "False Report"}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Incident list */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">All Incidents</CardTitle>
            <CardDescription className="text-xs">
              Latest {rows.length} reports across {KANPUR_CENTER.lng > 0 ? "Kanpur" : "the city"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incidents.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full bg-white/5" />
                <Skeleton className="h-12 w-full bg-white/5" />
                <Skeleton className="h-12 w-full bg-white/5" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No incidents reported yet. The city is clear.
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map(inc => (
                  <div
                    key={inc.id}
                    className="flex items-start gap-3 rounded-lg border border-white/5 bg-accent/30 px-3.5 py-2.5"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${incidentColor(inc.type)}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold">{inc.reportId}</span>
                        <Badge className={`border-0 text-[9px] h-4 ${statusBadge(inc.status)}`}>
                          {inc.status}
                        </Badge>
                        {inc.type === "accident" && (
                          <Siren className="h-3 w-3 text-red-400" />
                        )}
                        {inc.type === "waterlogging" && (
                          <Waves className="h-3 w-3 text-sky-400" />
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-0.5">
                        {TYPE_META[inc.type]?.label ?? inc.type}
                      </p>
                      {inc.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {inc.description}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> {inc.district ?? "Kanpur Nagar"} ·{" "}
                        {new Date(inc.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0c1a33] border-white/15">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-300" /> Report an Incident
            </DialogTitle>
            <DialogDescription>
              Your report is sent to the nearest police booth and reflected on the city
              map after verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-accent/50 border-white/15">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                      {TYPE_META[t]?.label ?? t} — {TYPE_META[t]?.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Description (optional)
              </label>
              <Textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="e.g., Two-wheeler collision near the crossing, lane blocked"
                className="bg-accent/50 border-white/15"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-accent/50 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={e => setLng(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-accent/50 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Default coordinates point to Kanpur city centre. In production, your
              browser location or a map picker would set these precisely.
            </p>
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              disabled={report.isPending || !lat || !lng}
              onClick={() =>
                report.mutate({
                  type: type as (typeof INCIDENT_TYPES)[number],
                  description: desc || undefined,
                  lat: parseFloat(lat),
                  lng: parseFloat(lng),
                  district: district || undefined,
                })
              }
            >
              {report.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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

function ShieldSmall() {
  return (
    <svg className="h-4 w-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
