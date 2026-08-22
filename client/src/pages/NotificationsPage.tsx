import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle2, Clock, Shield, Trash2, ArrowRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery({ limit: 50 });
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    }
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("All notifications marked as verified");
    }
  });

  const deleteNotification = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("Notification purged from registry");
    }
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead.mutate({ id: notification.id });
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="space-y-12 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Bell className="h-3 w-3" />
            Neural Alerts
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">System <span className="text-primary">Notifications</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Real-time alerts from the neural detection engine and forensic registry.</p>
        </div>
        
        <Button 
          variant="outline" 
          className="h-12 px-6 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white"
          onClick={() => markAllAsRead.mutate()}
          disabled={markAllAsRead.isPending}
        >
          {markAllAsRead.isPending ? "Clearing..." : "Mark All As Read"}
        </Button>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl">
        <CardHeader className="p-8 border-b border-white/5">
          <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Alert Registry</CardTitle>
          <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">A chronological log of all platform interactions and detections.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="py-40 text-center space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative h-24 w-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 mx-auto group hover:scale-110 transition-transform duration-500">
                  <Bell className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold font-rajdhani uppercase tracking-tight text-2xl text-white">Registry Clear</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">No neural alerts are currently indexed in your notification stream.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((n: any) => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`p-8 flex items-start justify-between gap-6 transition-all cursor-pointer group ${
                    !n.read ? "bg-primary/[0.02] hover:bg-primary/[0.04]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-6">
                    <div className={`mt-1 h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                      !n.read 
                        ? "bg-primary/10 border-primary/20 text-primary group-hover:bg-primary/20" 
                        : "bg-white/5 border-white/5 text-muted-foreground group-hover:border-white/10"
                    }`}>
                      {n.type === 'alert' ? <Shield className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`font-rajdhani text-lg font-bold tracking-tight uppercase transition-colors ${
                          !n.read ? "text-white group-hover:text-primary" : "text-muted-foreground group-hover:text-white"
                        }`}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase tracking-widest max-w-xl">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(n.createdAt), "MMM d, HH:mm")}
                        </span>
                        {n.link && (
                          <span className="flex items-center gap-1.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-3 w-3" />
                            View Evidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all" onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification.mutate({ id: n.id });
                    }} disabled={deleteNotification.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
