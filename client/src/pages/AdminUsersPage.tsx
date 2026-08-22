import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, UserCheck, UserX, Shield, MoreHorizontal, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery({ limit: 50 });

  const handleAction = (action: string, userName: string) => {
    toast.info(`Neural command '${action}' issued for node: ${userName}`);
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Shield className="h-3 w-3" />
            Admin Command Center
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">User <span className="text-primary">Management</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Manage platform nodes, roles, and neural access permissions.</p>
        </div>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Platform Nodes</CardTitle>
              <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">A comprehensive list of all registered neural identities.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Search identities..." className="pl-10 h-10 w-[200px] md:w-[300px] bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 text-white" />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-white/10 hover:bg-white/5">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity Node</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Role</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initialization</TableHead>
                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Command</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={5} className="h-16 px-8">
                      <div className="h-4 w-full bg-white/5 animate-pulse rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                users?.rows.map((user: any) => (
                  <TableRow key={user.id} className="border-white/5 group hover:bg-white/5 transition-all">
                    <TableCell className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[10px] uppercase tracking-widest text-white group-hover:text-primary transition-colors">{user.name}</span>
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-white/10 ${
                        user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                        user.role === 'investigator' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        'text-muted-foreground'
                      }`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Active Node
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400"
                          onClick={() => handleAction("VERIFY", user.name)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-lg hover:bg-blue-500/10 hover:text-blue-400"
                          onClick={() => handleAction("ELEVATE", user.name)}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => handleAction("TERMINATE", user.name)}
                        >
                          <UserX className="h-4 w-4" />
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
