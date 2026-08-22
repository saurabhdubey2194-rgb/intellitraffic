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
        {/* Model Performance */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
            <CardDescription>Accuracy metrics for core detection engines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { name: 'Video GAN Detection', score: 98.2 },
              { name: 'Audio Splicing Engine', score: 96.5 },
              { name: 'Image Artifact Scan', score: 94.8 },
              { name: 'Text Scam Classifier', score: 92.1 },
            ].map((model, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span>{model.name}</span>
                  <span className="text-emerald-500">{model.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${model.score}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
            <CardDescription>Recent suspicious activity and system warnings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-12 w-full animate-pulse bg-muted/50 rounded-lg" />)
              ) : stats?.recentAlerts && stats.recentAlerts.length > 0 ? (
                stats.recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/40">
                    <Badge variant={alert.action.includes('FAILED') ? 'destructive' : 'secondary'}>
                      {alert.action.replace('fs_', '').replace('_', ' ')}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{alert.details || 'No details provided'}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg border-border/40">
                  No recent security alerts.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* API Usage Monitoring */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>API Usage Monitoring</CardTitle>
            <CardDescription>Live traffic and endpoint performance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-10 w-full animate-pulse bg-muted/50 rounded-lg" />)
              ) : stats?.apiUsage && stats.apiUsage.length > 0 ? (
                stats.apiUsage.map((usage: any) => (
                  <div key={usage.id} className="flex items-center justify-between p-2 rounded border border-border/20 text-[10px]">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{usage.method}</Badge>
                      <span className="font-medium text-muted-foreground">{usage.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={usage.statusCode >= 400 ? 'text-red-500' : 'text-emerald-500'}>
                        {usage.statusCode}
                      </span>
                      <span className="text-muted-foreground">{usage.responseTime}ms</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg border-border/40">
                  No API usage recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Activity Placeholder */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>Resource Monitoring</CardTitle>
            <CardDescription>CPU, Memory, and Storage distribution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { name: 'Forensic Engine CPU', score: 45.2, color: 'bg-blue-500' },
              { name: 'Database Memory', score: 62.5, color: 'bg-emerald-500' },
              { name: 'S3 Storage Bucket', score: 12.8, color: 'bg-amber-500' },
              { name: 'Network Ingress', score: 28.1, color: 'bg-indigo-500' },
            ].map((res, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span>{res.name}</span>
                  <span className="text-muted-foreground">{res.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${res.color} rounded-full`} style={{ width: `${res.score}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Failed Job Review */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>Failed Job Review</CardTitle>
            <CardDescription>Recent processing errors requiring attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-12 w-full animate-pulse bg-muted/50 rounded-lg" />)
              ) : stats?.failedJobs && stats.failedJobs.length > 0 ? (
                stats.failedJobs.map((job: any) => (
                  <div key={job.id} className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{job.mediaName}</p>
                        <p className="text-[10px] text-muted-foreground">User: {job.userName}</p>
                      </div>
                      <Badge variant="destructive" className="text-[10px] h-5">FAILED</Badge>
                    </div>
                    <p className="text-[10px] text-red-500 font-mono line-clamp-1">{job.errorMessage}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg border-border/40">
                  No failed jobs recorded.
                </div>
              )}
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
