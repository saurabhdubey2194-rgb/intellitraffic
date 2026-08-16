import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { emergencyStatusColor, incidentTypeLabel, trafficColor, verificationLabel } from "@/lib/ui";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  Ambulance as AmbulanceIcon,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GitBranch,
  Hospital as HospitalIcon,
  MapPin,
  Route as RouteIcon,
  Search,
  Siren,
  Signal as SignalIcon,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type HistoryScope = "public" | "ambulance" | "police" | "hospital" | "admin" | "emergencies" | "corridors" | "signals";

const ACTION_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  ROUTE_SEARCH: { icon: RouteIcon, color: "bg-sky-500/15 text-sky-400 border-sky-400/40", label: "Route Search" },
  ROUTE_SAVED: { icon: RouteIcon, color: "bg-sky-500/15 text-sky-400 border-sky-400/40", label: "Route Saved" },
  INCIDENT_REPORTED: { icon: AlertTriangle, color: "bg-amber-500/15 text-amber-500 border-amber-400/40", label: "Incident Reported" },
  INCIDENT_STATUS_UPDATE: { icon: AlertTriangle, color: "bg-amber-500/15 text-amber-500 border-amber-400/40", label: "Incident Updated" },
  INCIDENT_REPORT: { icon: AlertTriangle, color: "bg-amber-500/15 text-amber-500 border-amber-400/40", label: "Incident Report" },
  EMERGENCY_TRIP_CREATED: { icon: Siren, color: "bg-red-500/15 text-red-500 border-red-400/40", label: "Trip Started" },
  EMERGENCY_CREATED: { icon: Siren, color: "bg-red-500/15 text-red-500 border-red-400/40", label: "Emergency Created" },
  EMERGENCY_APPROVED: { icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-500 border-emerald-400/40", label: "Emergency Approved" },
  EMERGENCY_REJECTED: { icon: XCircle, color: "bg-rose-500/15 text-rose-500 border-rose-400/40", label: "Emergency Rejected" },
  CORRIDOR_ACTIVATED: { icon: GitBranch, color: "bg-emerald-500/15 text-emerald-500 border-emerald-400/40", label: "Corridor Activated" },
  CORRIDOR_PROGRESS: { icon: GitBranch, color: "bg-blue-500/15 text-blue-400 border-blue-400/40", label: "Corridor Progress" },
  HOSPITAL_ARRIVAL: { icon: HospitalIcon, color: "bg-emerald-500/15 text-emerald-500 border-emerald-400/40", label: "Hospital Arrival" },
  EMERGENCY_COMPLETED: { icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-500 border-emerald-400/40", label: "Emergency Completed" },
  USER_REGISTRATION: { icon: Users, color: "bg-violet-500/15 text-violet-400 border-violet-400/40", label: "Registration" },
  AMBULANCE_REGISTRATION: { icon: AmbulanceIcon, color: "bg-violet-500/15 text-violet-400 border-violet-400/40", label: "Ambulance Registration" },
  HOSPITAL_REGISTRATION: { icon: HospitalIcon, color: "bg-violet-500/15 text-violet-400 border-violet-400/40", label: "Hospital Registration" },
  POLICE_REGISTRATION: { icon: Users, color: "bg-violet-500/15 text-violet-400 border-violet-400/40", label: "Police Registration" },
  VERIFICATION_DECISION: { icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-500 border-emerald-400/40", label: "Verification" },
  VERIFICATION_APPROVED: { icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-500 border-emerald-400/40", label: "Verification Approved" },
  VERIFICATION_REJECTED: { icon: XCircle, color: "bg-rose-500/15 text-rose-500 border-rose-400/40", label: "Verification Rejected" },
  PROFILE_UPDATE: { icon: Users, color: "bg-slate-500/15 dark:dark:text-slate-300 text-slate-600 text-slate-600 dark:border-slate-400/40 border-slate-400/40", label: "Profile Update" },
  SIGNAL_SIMULATION: { icon: SignalIcon, color: "bg-cyan-500/15 text-cyan-500 border-cyan-400/40", label: "Signal Simulation" },
  ADMIN_ACTION: { icon: Activity, color: "bg-orange-500/15 text-orange-400 border-orange-400/40", label: "Admin Action" },
  DEMO_EMERGENCY_SIMULATED: { icon: Siren, color: "bg-red-500/15 text-red-500 border-red-400/40", label: "Demo Emergency" },
  LOGIN: { icon: Activity, color: "bg-slate-500/15 dark:dark:text-slate-300 text-slate-600 text-slate-600 dark:border-slate-400/40 border-slate-400/40", label: "Login" },
};

function actionMeta(actionType: string) {
  return ACTION_META[actionType] ?? { icon: Activity, color: "bg-slate-500/15 dark:dark:text-slate-300 text-slate-600 text-slate-600 dark:border-slate-400/40 border-slate-400/40", label: actionType };
}

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: "text-emerald-500 bg-emerald-500/15 border-emerald-400/40",
  COMPLETED: "text-emerald-500 bg-emerald-500/15 border-emerald-400/40",
  ACTIVE: "text-blue-400 bg-blue-500/15 border-blue-400/40",
  APPROVED: "text-emerald-500 bg-emerald-500/15 border-emerald-400/40",
  PENDING: "text-amber-500 bg-amber-500/15 border-amber-400/40",
  REJECTED: "text-rose-500 bg-rose-500/15 border-rose-400/40",
  FAILED: "text-rose-500 bg-rose-500/15 border-rose-400/40",
  ARRIVED: "text-cyan-500 bg-cyan-500/15 border-cyan-400/40",
  REPORTED: "text-amber-500 bg-amber-500/15 border-amber-400/40",
};

const ROLE_COLOR: Record<string, string> = {
  public: "text-sky-400",
  ambulance: "text-red-500",
  police: "text-amber-500",
  hospital: "text-emerald-500",
  host: "text-violet-400",
  admin: "text-violet-400",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate<T extends { activityId?: string; actionType?: string; actionDescription?: string | null; status?: string; location?: string | null; entityId?: string | null; createdAt?: Date | string | null }>(rows: T[]) {
  const groups: Record<string, T[]> = {};
  for (const r of rows) {
    const key = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Unknown";
    (groups[key] ??= []).push(r);
  }
  return groups;
}

/** ---------- Admin activity center ---------- */
function AdminActivityCenter() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const list = trpc.history.list.useQuery({
    limit: 200,
  });
  const stats = trpc.history.stats.useQuery(undefined, { refetchInterval: 30000 });
  const recent = trpc.history.recent.useQuery({ limit: 8 });

  type ActivityRow = { activityId: string; userId?: number | null; userRole?: string | null; userName?: string | null; userEmail?: string | null; actionType: string; actionDescription?: string | null; entityType?: string | null; entityId?: string | null; status: string; location?: string | null; metadata?: unknown; createdAt: Date | string };
  const rows = ((list.data as unknown as { rows?: ActivityRow[] })?.rows ?? []) as ActivityRow[];

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (roleFilter !== "all" && r.userRole !== roleFilter) return false;
      if (actionFilter !== "all" && r.actionType !== actionFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (locationFilter !== "all" && (r.location ?? "") !== locationFilter) return false;
      if (search && !JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, roleFilter, actionFilter, statusFilter, locationFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const actionTypes = useMemo(() => Array.from(new Set(rows.map(r => r.actionType))).sort(), [rows]);
  const locations = useMemo(() => Array.from(new Set(rows.map(r => r.location ?? "").filter(Boolean))).sort(), [rows]);

  const chartData = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const role = (r.userRole ?? "unknown").replace(/^admin$/, "host");
      const bucket = map.get(role) ?? { public: 0, ambulance: 0, police: 0, hospital: 0, host: 0, admin: 0 };
      bucket[role as keyof typeof bucket] = (bucket[role as keyof typeof bucket] ?? 0) + 1;
      map.set(role, bucket);
    }
    return Array.from(map.entries()).map(([k, v]) => ({ role: k, ...v }));
  }, [rows]);

  function downloadCSV() {
    const header = ["activityId", "createdAt", "userRole", "userName", "userEmail", "actionType", "status", "location", "description"];
    const lines = filtered.map(r =>
      header
        .map(h => {
          const v = String((r as Record<string, unknown>)[h] ?? "");
          return `"${v.replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const blob = new Blob([header.join(",") + "\n" + lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intellitraffic-activity-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statCards = [
    { label: "Total Activities", value: rows.length, icon: Activity, tone: "text-violet-400" },
    { label: "Today", value: stats.data?.today ?? 0, icon: Calendar, tone: "text-emerald-500" },
    { label: "Police Actions", value: rows.filter(r => r.userRole === "police").length, icon: CheckCircle2, tone: "text-amber-500" },
    { label: "Emergency Events", value: rows.filter(r => r.actionType.startsWith("EMERGENCY") || r.actionType.startsWith("CORRIDOR") || r.actionType === "HOSPITAL_ARRIVAL").length, icon: Siren, tone: "text-red-500" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className="dark:border-white/10 dark:bg-white/5 border-border bg-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide dark:text-slate-400 text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
                </div>
                <s.icon className="h-8 w-8 text-foreground/15" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.data?.today && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm">
          <span className="font-semibold text-emerald-500">Today, IntelliTraffic processed {stats.data.today} actions.</span>{" "}
          <span className="dark:text-slate-300 text-slate-600">Real records from the platform's activity engine — not fabricated data.</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Activities by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="role" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0c1a33", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="public" name="Public" stackId="a" fill="#38bdf8" />
                <Bar dataKey="ambulance" name="Ambulance" stackId="a" fill="#f87171" />
                <Bar dataKey="police" name="Police" stackId="a" fill="#fbbf24" />
                <Bar dataKey="hospital" name="Hospital" stackId="a" fill="#34d399" />
                <Bar dataKey="host" name="Host" stackId="a" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Live Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.data?.map(r => {
              const meta = actionMeta(r.actionType);
              return (
                <div key={r.activityId} className="flex items-start gap-2.5 border-b border-white/5 pb-3 last:border-0">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.color}`}>
                    <meta.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{r.actionDescription ?? r.actionType}</p>
                    <p className="text-[11px] dark:text-slate-400 text-muted-foreground">
                      {r.userName ?? "System"} · {fmtTime(String(r.createdAt))}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-sm font-semibold text-foreground">Activity Log</CardTitle>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={downloadCSV} className="border-emerald-400/40 text-emerald-500 hover:bg-emerald-500/10">
                <Download className="mr-1 h-3.5 w-3.5" /> CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `intellitraffic-activity-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="border-sky-400/40 text-sky-400 hover:bg-sky-500/10"
              >
                <FileText className="mr-1 h-3.5 w-3.5" /> JSON
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 md:grid-cols-5">
            <div className="relative col-span-2 md:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <Input
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search…"
                className="pl-8 text-xs"
              />
            </div>
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(0); }}>
              <SelectTrigger className="text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="ambulance">Ambulance</SelectItem>
                <SelectItem value="police">Police</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="host">Host</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
              <SelectTrigger className="text-xs"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actionTypes.map(t => (
                  <SelectItem key={t} value={t}>
                    {actionMeta(t).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Array.from(new Set(rows.map(r => r.status))).map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={v => { setLocationFilter(v); setPage(0); }}>
              <SelectTrigger className="text-xs"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map(l => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 bg-muted" />
              ))}
            </div>
          ) : pageRows.length === 0 ? (
            <p className="py-10 text-center text-sm dark:text-slate-400 text-muted-foreground">No activities match your filters.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs">Activity</TableHead>
                    <TableHead className="text-xs">Actor</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-right text-xs">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map(r => {
                    const meta = actionMeta(r.actionType);
                    return (
                      <TableRow key={r.activityId} className="border-white/5">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${meta.color}`}>
                              <meta.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-foreground">{meta.label}</p>
                              <p className="truncate max-w-[280px] text-[11px] dark:text-slate-400 text-muted-foreground">{r.actionDescription}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className={`font-medium ${ROLE_COLOR[r.userRole ?? ""] ?? "dark:text-slate-300 text-slate-600"}`}>{r.userName ?? "System"}</p>
                          <p className="text-[10px] uppercase text-slate-500">{r.userRole ?? "system"}</p>
                        </TableCell>
                        <TableCell>
                        <Badge variant="outline" className={`border-[0.5px] text-[10px] ${STATUS_COLOR[r.status ?? ""] ?? "dark:text-slate-300 text-slate-600 border-slate-400/40"}`}>
                          {r.status ?? "—"}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-xs dark:text-slate-300 text-slate-600">
                          {r.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-500" /> {r.location}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs dark:text-slate-400 text-muted-foreground">{fmtTime(String(r.createdAt))}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-3 text-xs dark:text-slate-400 text-muted-foreground">
                <span>
                  {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-xs">
                    Prev
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="text-xs">
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** ---------- Trip / corridor / signal history ---------- */
function TripsCorridorsSignals() {
  const trips = trpc.history.trips.useQuery();
  const corridors = trpc.history.corridors.useQuery();
  const events = trpc.signalsSimulation.history.useQuery({ limit: 30 });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Completed Trips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trips.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 bg-muted" />)
            ) : (trips.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs dark:text-slate-400 text-muted-foreground">No completed trips yet.</p>
            ) : (
              (trips.data ?? []).map(t => (
                <div key={t.id ?? t.requestId} className="border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{t.requestId}</p>
                    <Badge variant="outline" className={`border-[0.5px] text-[10px] ${emergencyStatusColor(t.status)}`}>
                      {t.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] dark:text-slate-400 text-muted-foreground">
                    {t.distanceKm?.toFixed(1)} km · ETA {Math.round((t.etaSec ?? 0) / 60)} min · {new Date(t.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Green Corridors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {corridors.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 bg-muted" />)
            ) : (corridors.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs dark:text-slate-400 text-muted-foreground">No corridor history yet.</p>
            ) : (
              (corridors.data ?? []).map(c => (
                <div key={c.id ?? c.corridorId} className="border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{c.corridorId}</p>
                    <Badge variant="outline" className={`border-[0.5px] text-[10px] ${emergencyStatusColor(c.status)}`}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] dark:text-slate-400 text-muted-foreground">
                    {c.signalsPrepared ?? 0}/{c.totalSignals ?? 0} signals · ~{c.estimatedTimeSavedMin ?? 0} min saved
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, c.progressPct ?? 0)}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Signal Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 bg-muted" />)
            ) : (events.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs dark:text-slate-400 text-muted-foreground">No signal events yet.</p>
            ) : (
              (events.data ?? []).map(e => (
                <div key={e.id} className="border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">Signal #{e.signalId}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${e.phase === "green" ? "bg-green-500/20 text-green-300" : e.phase === "red" ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"}`}>
                      {e.phase}
                    </span>
                  </div>
                  <p className="text-[10px] dark:text-slate-400 text-muted-foreground">{(e.previousPhase ?? "-")} → {e.phase} · {(e.optimizedDurationSec ?? e.normalDurationSec) ?? 0}s</p>
                  <p className="text-[10px] text-slate-500">{fmtTime(String(e.createdAt))}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** ---------- Role history (public / ambulance / police / hospital) ---------- */
function RoleHistory({ scope }: { scope: "public" | "ambulance" | "police" | "hospital" }) {
  const list = trpc.history.list.useQuery({ limit: 200 });
  const incidents = trpc.traffic.incidents.useQuery();

  type ActivityRow = { activityId: string; userId?: number | null; userRole?: string | null; userName?: string | null; userEmail?: string | null; actionType: string; actionDescription?: string | null; entityType?: string | null; entityId?: string | null; status: string; location?: string | null; metadata?: unknown; createdAt: Date | string };
  const listRows = ((list.data as unknown as { rows?: ActivityRow[] })?.rows ?? []) as ActivityRow[];
  type IncidentRow = { id?: number; reportId?: string | null; type?: string | null; description?: string | null; district?: string | null; status?: string | null; createdAt?: Date | string | null; lat?: number | null; lng?: number | null };
  const incidentRows = ((incidents.data as unknown as { rows?: IncidentRow[] })?.rows ?? []) as IncidentRow[];

  const grouped = useMemo(() => groupByDate(listRows), [listRows]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/emergency-history">
          <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card transition-colors hover:border-red-400/40">
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/15 text-red-500">
                <Siren className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Emergency History</p>
                <p className="text-[11px] dark:text-slate-400 text-muted-foreground">Trips, corridors, arrivals</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/corridor-history">
          <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card transition-colors hover:border-emerald-400/40">
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Corridor History</p>
                <p className="text-[11px] dark:text-slate-400 text-muted-foreground">Green corridors & signals</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/signal-history">
          <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card transition-colors hover:border-cyan-400/40">
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-500">
                <SignalIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Signal History</p>
                <p className="text-[11px] dark:text-slate-400 text-muted-foreground">AI signal optimization log</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {incidentRows.length > 0 && (
        <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Your Reported Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {incidentRows.map(inc => (
              <div key={inc.id ?? inc.reportId} className="flex items-center gap-3 border-b border-white/5 pb-2.5 last:border-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{incidentTypeLabel(inc.type)}</p>
                  <p className="truncate text-[11px] dark:text-slate-400 text-muted-foreground">
                    {inc.reportId} · {inc.district} · {inc.createdAt ? new Date(inc.createdAt).toLocaleString("en-IN") : ""}
                  </p>
                </div>
                <Badge variant="outline" className={`ml-auto shrink-0 border-[0.5px] text-[10px] ${STATUS_COLOR[(inc.status ?? "").toUpperCase()] ?? "dark:text-slate-300 text-slate-600 border-slate-400/40"}`}>
                  {inc.status ?? "—"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="dark:border-white/10 dark:bg-white/5 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 bg-muted" />)}
            </div>
          ) : listRows.length === 0 ? (
            <p className="py-10 text-center text-sm dark:text-slate-400 text-muted-foreground">No activity recorded yet. Start exploring — your actions will appear here.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([date, rows]) => (
                <div key={date}>
                  <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide dark:text-slate-400 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {date}
                  </p>
                  <div className="space-y-2">
                    {rows.map(r => {
                      const meta = actionMeta(r.actionType);
                      return (
                        <div key={r.activityId} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${meta.color}`}>
                            <meta.icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">{r.actionDescription ?? meta.label}</p>
                            <p className="text-[11px] dark:text-slate-400 text-muted-foreground">
                              {r.entityId} · {fmtTime(String(r.createdAt))}
                            </p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 border-[0.5px] text-[10px] ${STATUS_COLOR[r.status] ?? "dark:text-slate-300 text-slate-600 border-slate-400/40"}`}>
                            {r.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function HistoryPage({ scope }: { scope: HistoryScope }) {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">
          {scope === "admin"
            ? "Activity Center"
            : scope === "emergencies" || scope === "corridors" || scope === "signals"
              ? "History — " + (scope === "emergencies" ? "Emergencies & Trips" : scope === "corridors" ? "Green Corridors" : "Signal Events")
              : "Activity History"}
        </h1>
        <p className="text-xs dark:text-slate-400 text-muted-foreground">
          {scope === "admin"
            ? "Full platform activity across every role — persistent, searchable, exportable."
            : "Everything that has happened in your IntelliTraffic journey, recorded permanently."}
        </p>
      </div>
      {scope === "admin" ? <AdminActivityCenter /> : scope === "emergencies" || scope === "corridors" || scope === "signals" ? <TripsCorridorsSignals /> : <RoleHistory scope={scope} />}
    </div>
  );
}
