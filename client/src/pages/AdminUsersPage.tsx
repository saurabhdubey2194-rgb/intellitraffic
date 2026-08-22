import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreHorizontal, UserCheck, UserX, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function AdminUsersPage() {
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery({ limit: 50 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage platform users, roles, and access permissions.</p>
      </div>

      <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Platform Users</CardTitle>
              <CardDescription>A list of all registered users and their current status.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-9 w-[200px] md:w-[300px] bg-white/5 border-border/40" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-12 animate-pulse bg-white/5" />
                  </TableRow>
                ))
              ) : (
                users?.rows.map((user: any) => (
                  <TableRow key={user.id} className="border-border/20 group hover:bg-white/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${
                        user.role === 'admin' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' : 
                        user.role === 'investigator' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 
                        'border-border/50'
                      }`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Verify User">
                          <UserCheck className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Manage Role">
                          <Shield className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Suspend User">
                          <UserX className="h-4 w-4 text-red-500" />
                        </Button>
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
  );
}
