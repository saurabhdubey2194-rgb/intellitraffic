import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Activity, AlertTriangle, Cpu, HardDrive, Database, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: usersData, isLoading: usersLoading } = trpc.admin.listUsers.useQuery({ limit: 5 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Command Center</h1>
        <p className="text-muted-foreground">System-wide monitoring, analytics, and infrastructure health.</p>
      </div>

      {/* Infrastructure Health */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HealthCard title="Total Users" value={statsLoading ? "..." : stats?.totalUsers?.toString() || "0"} icon={Users} status="normal" />
        <HealthCard title="Total Analyses" value={statsLoading ? "..." : stats?.totalAnalyses?.toString() || "0"} icon={Activity} status="normal" />
        <HealthCard title="Active Cases" value={statsLoading ? "..." : stats?.totalCases?.toString() || "0"} icon={Shield} status="normal" />
        <HealthCard title="System Uptime" value={statsLoading ? "..." : stats?.systemHealth || "99.9%"} icon={Cpu} status="normal" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Activity */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>Live processing throughput and error rates.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-border/20">
            <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-20">
              <Activity className="h-16 w-16" />
              <p className="text-sm font-medium">Throughput Visualization</p>
            </div>
          </CardContent>
        </Card>

        {/* User Management Overview */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>User Overview</CardTitle>
            <CardDescription>Recent registrations and verification status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell colSpan={3} className="h-10 animate-pulse bg-muted/50 rounded" />
                    </TableRow>
                  ))
                ) : usersData?.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                ) : (
                  usersData?.rows.map((user: any) => (
                    <TableRow key={user.id} className="border-border/20">
                      <TableCell className="font-medium text-sm">{user.name || user.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{user.role}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${user.verificationStatus === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="capitalize">{user.verificationStatus}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HealthCard({ title, value, icon: Icon, status }: { title: string, value: string, icon: any, status: "normal" | "warning" | "critical" }) {
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`h-1.5 w-1.5 rounded-full ${status === 'normal' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-[10px] font-medium uppercase text-muted-foreground">{status}</span>
        </div>
      </CardContent>
    </Card>
  );
}
