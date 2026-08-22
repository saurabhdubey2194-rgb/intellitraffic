import { Bell, Check, Info, AlertTriangle, XCircle, ExternalLink, Zap, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { toast } from "sonner";

export function NotificationCenter() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery({ limit: 10 });
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    }
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleNotificationClick = (n: any) => {
    if (!n.read) {
      markAsRead.mutate({ id: n.id });
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-white/5 transition-all group">
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <div className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 mt-4 border-white/5 bg-black/95 backdrop-blur-xl p-2 rounded-2xl shadow-2xl shadow-primary/10">
        <DropdownMenuLabel className="px-3 py-4 flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-1">Alert Center</div>
            <div className="text-[10px] font-bold text-white uppercase tracking-widest">Neural Notifications</div>
          </div>
          {unreadCount > 0 && (
            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-primary/20 text-primary bg-primary/5">
              {unreadCount} New
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <div className="max-h-96 overflow-y-auto py-2">
          {isLoading ? (
            <div className="p-12 text-center space-y-4">
              <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto" />
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Syncing with Node...</p>
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <Shield className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Zero alerts detected</p>
            </div>
          ) : (
            notifications?.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={`flex flex-col items-start gap-2 p-4 rounded-xl cursor-pointer transition-all mb-1 ${!n.read ? 'bg-primary/5 border border-primary/10' : 'hover:bg-white/5 border border-transparent'}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-white truncate">{n.title}</p>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter mt-0.5">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),0.5)]" />}
                </div>
                <p className="text-[9px] font-medium text-muted-foreground line-clamp-2 leading-relaxed pl-11">
                  {n.message}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem 
          onClick={() => navigate("/notifications")}
          className="justify-center py-3 text-[10px] font-black uppercase tracking-widest text-primary focus:bg-primary/10 focus:text-primary rounded-xl cursor-pointer mt-1"
        >
          View Full Neural Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
