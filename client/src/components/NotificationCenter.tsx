import { Bell, Check, Info, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          Notifications
          {unreadCount > 0 && (
            <span className="text-[10px] text-muted-foreground font-normal">
              {unreadCount} unread
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
          ) : notifications?.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications?.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!n.read ? 'bg-blue-500/5' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex items-center gap-2 w-full">
                  {getIcon(n.type)}
                  <span className="font-bold text-xs truncate flex-1">{n.title}</span>
                  {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-xs font-medium text-blue-500 focus:text-blue-500">
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
