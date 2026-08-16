import RoleShell from "@/components/RoleShell";
import { Badge } from "@/components/ui/badge";
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
  Ambulance,
  Activity,
  CheckCircle2,
  Clock,
  HeartPulse,
  Radar,
  RefreshCw,
  Server,
  ShieldCheck,
  Signal,
  Siren,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BAR_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#3b82f6", "#22c55e", "#94a3b8"];

export default function DashboardHost() {
  const stats = trpc.admin.stats.useQuery(undefined, {
    retry: 1,
    refetchInterval: 30000,
  });
  const emergencyStats = trpc.admin.emergencyStats.useQuery(undefined, {
    retry: 1,
    refetchInterval: 30000,
  });
  const health = trpc.admin.systemHealth.useQuery(undefined, { retry: 1 });
  const incidents = trpc.admin.incidents.useQuery(undefined, { retry: 1 });
  const corridors = trpc.admin.corridors.useQuery(undefined, { retry: 1 });

  const s = stats.data as {
    totalUsers: number;
    publicUsers: number;
    verifiedAmbulances: number;
    policeStations: number;
    hospitals: number;
    activeEmergencies: number;
    activeCorridors: number;
    trafficIncidents: number;
    pendingVerifications: number;
  } | null;

  const eStats = emergencyStats.data as Record<string, number> | null;
  const chartData = eStats
    ? Object.entries(eStats).map(([status, count]) => ({
        name: (status as string).replace("_", " "),
        value: count,
      }))
    : [];

  const dbOk = ((health.data as unknown as { database?: string | boolean } | null)?.database ?? "online") === "online";

  const incidentRows = ((incidents.data as unknown as { rows?: Array<Record<string, unknown>> })?.rows ??
    (incidents.data as unknown as Array<Record<string, unknown>>) ??
    []) as Array<{ status: string; type: string }>;

  const corridorRows = ((corridors.data as unknown as Array<Record<string, unknown>>) ?? []) as Array<{
    corridorId: string;
    status: string;
  }>;

  return (
      <>
            <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Signal className="h-6 w-6 text-emerald-300" /> Host Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              City-wide view of traffic, emergencies, and corridor activations.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold">
            <span className={`h-2 w-2 rounded-full ${dbOk ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className={dbOk ? "text-emerald-300" : "text-red-300"}>
              {dbOk ? "SYSTEM ONLINE" : "DB OFFLINE"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Registered users" value={s?.totalUsers ?? 0} tone="blue" />
          <StatCard icon={Ambulance} label="Ambulance drivers" value={s?.verifiedAmbulances ?? 0} tone="red" />
          <StatCard icon={HeartPulse} label="Hospitals online" value={s?.hospitals ?? 0} tone="rose" />
          <StatCard icon={ShieldCheck} label="Police officers" value={s?.policeStations ?? 0} tone="indigo" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-red-400/25 bg-red-500/5 md:col-span-1">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2 text-red-300">
                <Siren className="h-4 w-4" /> Active Emergencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-red-300">{s?.activeEmergencies ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Approved, corridor-active or in-transit requests
              </p>
            </CardContent>
          </Card>
          <Card className="border-emerald-400/25 bg-emerald-500/5 md:col-span-1">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-300">
                <Activity className="h-4 w-4" /> Active Corridors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-emerald-300">{s?.activeCorridors ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Predictive corridors preparing or active
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-card md:col-span-1">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2">
                <Radar className="h-4 w-4 text-amber-300" /> Open Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black">{s?.trafficIncidents ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Reported / investigating / verified
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Emergency request pipeline</CardTitle>
              <CardDescription className="text-xs">
                Distribution of ambulance requests by lifecycle stage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emergencyStats.isLoading ? (
                <Skeleton className="h-44 w-full bg-white/5" />
              ) : chartData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">
                  No emergency requests yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0c1a33",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">System health</CardTitle>
              <CardDescription className="text-xs">Live status of core services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <HealthRow icon={Server} label="Database" ok={dbOk} />
              <HealthRow icon={Signal} label="Traffic signal network" ok={!!s} />
              <HealthRow icon={RefreshCw} label="Prediction engine" ok={!!s} />
              <HealthRow
                icon={Clock}
                label="Pending verifications"
                ok={(s?.pendingVerifications ?? 0) < 10}
                detail={`${s?.pendingVerifications ?? 0} waiting`}
              />
            </CardContent>
          </Card>
        </div>

        {corridorRows.length > 0 && (
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent corridors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {corridorRows.slice(0, 5).map(c => (
                <div
                  key={c.corridorId}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-accent/30 px-3 py-1.5"
                >
                  <p className="text-xs font-mono font-bold">{c.corridorId}</p>
                  <Badge className="bg-white/10 text-slate-200 border-0 text-[10px]">
                    {(c.status ?? "").replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "blue" | "red" | "rose" | "indigo";
}) {
  const tones: Record<string, string> = {
    blue: "text-blue-300",
    red: "text-red-300",
    rose: "text-rose-300",
    indigo: "text-indigo-300",
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

function HealthRow({
  icon: Icon,
  label,
  ok,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-accent/30 px-3 py-2">
      <span className="text-xs font-semibold flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </span>
      <span className={`text-[10px] font-black ${ok ? "text-emerald-300" : "text-red-300"}`}>
        {ok ? (detail ? `UP — ${detail}` : "UP") : "DEGRADED"}
      </span>
    </div>
  );
}
