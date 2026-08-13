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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { incidentTypeLabel } from "@/lib/labels";
import { ROLE } from "@shared/intellitraffic";
import {
  CheckCircle2,
  Clock,
  Database,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function VerificationQueuePage() {
  const [filters, setFilters] = useState<{
    role?: string;
    status?: string;
  }>({ role: "any", status: "any" });
  const utils = trpc.useUtils();

  const users = trpc.admin.users.useQuery(
    {
      role:
        filters.role && filters.role !== "any" ? filters.role : undefined,
      verificationStatus:
        filters.status && filters.status !== "any" ? filters.status : undefined,
      limit: 200,
    },
    { retry: 1 }
  );

  const verify = trpc.admin.verifyUser.useMutation({
    onSuccess: () => {
      toast.success("Verification status updated");
      utils.admin.users.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const rows = (users.data?.rows ?? []) as Array<{
    id: number;
    name: string | null;
    email: string | null;
    role: string;
    verificationStatus: string | null;
    district: string | null;
    state: string | null;
    createdAt: Date;
  }>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-300" /> Verification Queue
        </h1>
        <div className="flex gap-2">
          <Select
            value={filters.role ?? "any"}
            onValueChange={v => setFilters(f => ({ ...f, role: v === "any" ? undefined : v }))}
          >
            <SelectTrigger className="w-[130px] bg-accent/50 border-white/15 text-xs">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-[#0c1a33]">
              <SelectItem value="any" className="text-slate-950">All roles</SelectItem>
              <SelectItem value="ambulance" className="text-slate-950">Ambulance</SelectItem>
              <SelectItem value="police" className="text-slate-950">Police</SelectItem>
              <SelectItem value="hospital" className="text-slate-950">Hospital</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {users.isLoading ? (
        <Skeleton className="h-64 w-full bg-white/5" />
      ) : (
        <Card className="border-white/10 bg-card">
          <CardContent className="pt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-[10px] text-muted-foreground">USER</TableHead>
                  <TableHead className="text-[10px] text-muted-foreground">ROLE</TableHead>
                  <TableHead className="text-[10px] text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-[10px] text-muted-foreground">LOCATION</TableHead>
                  <TableHead className="text-[10px] text-muted-foreground">JOINED</TableHead>
                  <TableHead className="text-[10px] text-muted-foreground text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      No users match the current filter.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map(u => (
                  <TableRow key={u.id} className="border-white/5">
                    <TableCell className="text-xs font-semibold">{u.name ?? u.email ?? `User #${u.id}`}</TableCell>
                    <TableCell>
                      <Badge className="bg-white/10 text-slate-200 border-0 capitalize">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={u.verificationStatus ?? "pending"} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.district ?? "—"}, {u.state ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.verificationStatus !== "verified" ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold"
                            disabled={verify.isPending}
                            onClick={() =>
                              verify.mutate({ userId: u.id, status: "verified", note: "Verified by host" })
                            }
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-red-400/30 text-red-300 text-[10px] font-bold hover:bg-red-500/10"
                            disabled={verify.isPending}
                            onClick={() =>
                              verify.mutate({
                                userId: u.id,
                                status: "rejected",
                                note: "Documents insufficient",
                              })
                            }
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-300 font-bold">VERIFIED</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function UsersPage() {
  const [role, setRole] = useState<string>("any");
  const [search, setSearch] = useState("");
  const users = trpc.admin.users.useQuery(
    {
      role: role === "any" ? undefined : role,
      search: search || undefined,
      limit: 200,
    },
    { retry: 1 }
  );
  const rows = (users.data?.rows ?? []) as Array<{
    id: number;
    name: string | null;
    email: string | null;
    role: string;
    verificationStatus: string | null;
    district: string | null;
    state: string | null;
    createdAt: Date;
  }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">User Management</h1>
      <div className="flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="w-56 bg-accent/50 border-white/15 text-xs"
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[140px] bg-accent/50 border-white/15 text-xs">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="bg-[#0c1a33]">
            <SelectItem value="any" className="text-slate-950">All roles</SelectItem>
            {ROLE.map(r => (
              <SelectItem key={r} value={r} className="text-slate-950 capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card className="border-white/10 bg-card">
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[10px] text-muted-foreground">USER</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">ROLE</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">STATUS</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">LOCATION</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">JOINED</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-16 w-full bg-white/5" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(u => (
                  <TableRow key={u.id} className="border-white/5">
                    <TableCell className="text-xs font-semibold">
                      {u.name ?? u.email ?? `User #${u.id}`}
                      {u.email && (
                        <p className="text-[10px] text-muted-foreground font-normal">{u.email}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-white/10 text-slate-200 border-0 capitalize">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={u.verificationStatus ?? "pending"} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.district ?? "—"}, {u.state ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SignalsAdminPage() {
  const signals = trpc.admin.signals.useQuery(undefined, { retry: 1 });
  const rows = (signals.data as unknown as Array<{
    id: number;
    signalCode: string;
    intersection: string;
    district: string | null;
    lat: number | null;
    lng: number | null;
    trafficDensity: string | null;
    currentPhase: string | null;
  }>) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">Traffic Signals</h1>
      <Card className="border-white/10 bg-card">
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[10px] text-muted-foreground">SIGNAL</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">DISTRICT</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">AVG SPEED</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">CONGESTION</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">COORDINATES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map(s => (
                <TableRow key={s.id} className="border-white/5">
                  <TableCell className="text-xs font-bold">{s.signalCode}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.intersection}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.district ?? "—"}</TableCell>
                  <TableCell>
                    {s.trafficDensity ? (
                      <Badge className="border-0 text-white bg-amber-500/85">{s.trafficDensity}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {s.lat?.toFixed(3)}, {s.lng?.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function EntitiesPage({
  title,
  icon,
  kind,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  kind: "ambulances" | "hospitals" | "police" | "incidents" | "emergencies" | "corridors";
}) {
  const queryKey =
    kind === "incidents"
      ? trpc.admin.incidents.useQuery(undefined, { retry: 1 })
      : kind === "emergencies"
        ? trpc.admin.emergencies.useQuery(undefined, { retry: 1 })
        : kind === "corridors"
          ? trpc.admin.corridors.useQuery(undefined, { retry: 1 })
          : kind === "ambulances"
            ? trpc.admin.ambulances.useQuery(undefined, { retry: 1 })
            : kind === "hospitals"
              ? trpc.admin.hospitals.useQuery(undefined, { retry: 1 })
              : trpc.admin.policeStations.useQuery(undefined, { retry: 1 });

  const rows = (queryKey.data as unknown as Array<Record<string, unknown>>) ?? [];
  const isLoading = queryKey.isLoading;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
        {icon && (() => {
          const Icon = icon as unknown as React.ComponentType<{ className?: string }>;
          return <Icon className="h-6 w-6 text-emerald-300" />;
        })()}
        {title}
      </h1>
      <Card className="border-white/10 bg-card">
        <CardContent className="pt-4 overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-56 w-full bg-white/5" />
          ) : rows.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No records.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-[10px] text-muted-foreground">ID</TableHead>
                  <TableHead className="text-[10px] text-muted-foreground">NAME / TITLE</TableHead>
                  <TableHead className="text-[10px] text-muted-foreground">STATUS / EXTRA</TableHead>
                  <TableHead className="text-[10px] text-muted-foreground">UPDATED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 60).map((r, i) => {
                  const id =
                    (r.requestId ?? r.corridorId ?? r.reportId ?? r.id) as string | number;
                  const name =
                    (r.name ??
                      r.stationName ??
                      r.hospitalName ??
                      r.registrationNumber ??
                      r.type ??
                      r.title) as string;
                  const extra =
                    (r.status ??
                      r.verificationStatus ??
                      r.severity ??
                      r.trustScore ??
                      r.district) as string;
                  const updated = (r.updatedAt ?? r.createdAt) as Date | null;
                  return (
                    <TableRow key={`${id}-${i}`} className="border-white/5">
                      <TableCell className="text-xs font-mono font-bold">{String(id)}</TableCell>
                      <TableCell className="text-xs font-semibold">{name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className="bg-white/10 text-slate-200 border-0 text-[10px]">
                          {String(extra ?? "—")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {updated ? new Date(updated).toLocaleString("en-IN") : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function IncidentsAdminPage() {
  const incidents = trpc.admin.incidents.useQuery(undefined, { retry: 1 });
  const rows = ((incidents.data as unknown as { rows?: Array<Record<string, unknown>> })?.rows ??
    (incidents.data as unknown as Array<Record<string, unknown>>) ??
    []) as Array<{
    id: number;
    reportId: string;
    type: string;
    description: string | null;
    severity: string | null;
    status: string;
    district: string | null;
    lat: number | null;
    lng: number | null;
    createdAt: Date;
  }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">Incident Register</h1>
      <Card className="border-white/10 bg-card">
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[10px] text-muted-foreground">REPORT ID</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">TYPE</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">STATUS</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">DISTRICT</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">FILED</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-16 w-full bg-white/5" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                    No incidents.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(r => (
                  <TableRow key={r.id} className="border-white/5">
                    <TableCell className="text-xs font-mono font-bold">{r.reportId}</TableCell>
                    <TableCell className="text-xs">{incidentTypeLabel(r.type)}</TableCell>
                    <TableCell>
                      <Badge className="bg-white/10 text-slate-200 border-0 text-[10px]">
                        {(r.status ?? "").replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.district ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuditLogPage() {
  const logs = trpc.admin.auditLogs.useQuery({ limit: 100 }, { retry: 1 });
  const rows = ((logs.data as unknown as { rows?: Array<Record<string, unknown>> })?.rows ?? []) as Array<{
    id: number;
    action: string;
    actorRole: string | null;
    targetType: string | null;
    targetId: string | null;
    details: string | null;
    createdAt: Date;
  }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">Audit Log</h1>
      <Card className="border-white/10 bg-card">
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[10px] text-muted-foreground">ACTION</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">ACTOR ROLE</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">TARGET</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">DETAILS</TableHead>
                <TableHead className="text-[10px] text-muted-foreground">WHEN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-16 w-full bg-white/5" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                    No audit records yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(r => (
                  <TableRow key={r.id} className="border-white/5">
                    <TableCell className="text-xs font-bold">{r.action}</TableCell>
                    <TableCell>
                      <Badge className="bg-white/10 text-slate-200 border-0 text-[10px] capitalize">
                        {r.actorRole ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.targetType ?? "—"} #{r.targetId ?? ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                      {r.details ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsAdminPage() {
  const [entries, setEntries] = useState<Record<string, string>>({});
  const settings = trpc.admin.settings.useQuery(undefined, { retry: 1 });
  const utils = trpc.useUtils();

  const update = trpc.admin.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("Setting saved");
      utils.admin.settings.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const rows = ((settings.data as unknown as Array<Record<string, unknown>>) ?? []) as Array<{
    category: string | null;
    settingKey: string;
    settingValue: string | null;
  }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">System Configuration</h1>
      <Card className="border-white/10 bg-card">
        <CardContent className="pt-4 space-y-2">
          {settings.isLoading ? (
            <Skeleton className="h-40 w-full bg-white/5" />
          ) : rows.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No settings.</p>
          ) : (
            rows.map(s => (
              <div
                key={s.settingKey}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/5 bg-accent/30 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">
                    {s.category ?? "general"} · {s.settingKey}
                  </p>
                </div>
                <Input
                  value={entries[s.settingKey] ?? (s.settingValue ?? "")}
                  onChange={e => setEntries(m => ({ ...m, [s.settingKey]: e.target.value }))}
                  className="w-56 bg-background/50 border-white/15 text-xs"
                />
                <Button
                  size="sm"
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate({ key: s.settingKey, value: entries[s.settingKey] ?? s.settingValue ?? "", category: s.category ?? undefined })
                  }
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold"
                >
                  Save
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function DataCenterPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const exportData = trpc.admin.exportData.useMutation({
    onSuccess: data => {
      const payload = data as { rows?: unknown[]; count?: number };
      const blob = new Blob([JSON.stringify(payload.rows ?? [], null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.json";
      a.click();
      URL.revokeObjectURL(url);
      setExporting(null);
      toast.success(`Exported ${payload.count ?? 0} rows`);
    },
    onError: e => {
      toast.error(e.message);
      setExporting(null);
    },
  });

  const tables = [
    { key: "users", label: "Users", desc: "All registered users with roles" },
    { key: "signals", label: "Traffic Signals", desc: "12 Kanpur signal nodes" },
    { key: "hospitals", label: "Hospitals", desc: "Registered ER facilities" },
    { key: "incidents", label: "Incidents", desc: "Reported traffic incidents" },
    { key: "emergencies", label: "Emergencies", desc: "Ambulance requests + corridors" },
    { key: "corridors", label: "Corridors", desc: "Emergency corridor activations" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
        <Database className="h-6 w-6 text-emerald-300" /> Data Center
      </h1>
      <Card className="border-white/10 bg-card">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground mb-3">
            Export any dataset as JSON. Used by the Host control center for reporting and
            offline analysis.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tables.map(t => (
              <button
                key={t.key}
                disabled={exporting !== null}
                onClick={() => {
                  setExporting(t.key);
                  exportData.mutate({ table: t.key as "users" | "signals" | "hospitals" | "incidents" | "emergencies" | "corridors" });
                }}
                className="rounded-lg border border-white/10 bg-accent/30 px-4 py-3 text-left transition-all hover:border-emerald-400/30 active:scale-[0.98] disabled:opacity-50"
              >
                <p className="text-sm font-bold">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
          {exporting && (
            <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5">
              <Clock className="h-3 w-3 animate-spin" /> Exporting {exporting}…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-400/30 text-[10px]">
        <CheckCircle2 className="h-3 w-3 mr-1" /> verified
      </Badge>
    );
  if (status === "rejected" || status === "suspended")
    return (
      <Badge className="bg-red-500/15 text-red-300 border-red-400/30 text-[10px]">
        {status}
      </Badge>
    );
  return (
    <Badge className="bg-amber-500/15 text-amber-300 border-amber-400/30 text-[10px]">
      {status === "under_review" ? "under review" : status}
    </Badge>
  );
}
