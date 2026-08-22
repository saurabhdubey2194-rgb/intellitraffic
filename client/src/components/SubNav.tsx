import { useLocation } from "wouter";
import { Shield, Zap, Lock, Globe, Star, Menu } from "lucide-react";
import { toast } from "sonner";

export const SUB_NAV_ITEMS = [
  { label: "Neural Features", path: "/features", icon: <Zap className="h-3 w-3" /> },
  { label: "Video Forensic", path: "/analyze?type=video" },
  { label: "Audio Analysis", path: "/analyze?type=audio" },
  { label: "SMS Verification", path: "/analyze?type=text" },
  { label: "URL Security", path: "/analyze?type=url" },
  { label: "Threat Index", path: "/threat-intelligence", icon: <Globe className="h-3 w-3" /> },
  { label: "Case Manager", path: "/investigator", icon: <Shield className="h-3 w-3" /> },
  { label: "API Console", path: "/settings", icon: <Lock className="h-3 w-3" /> },
  { label: "Subscription", path: "/pricing", icon: <Star className="h-3 w-3" /> },
];

export function SubNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="h-12 border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-20 z-40 hidden md:block overflow-hidden">
      <div className="container h-full flex items-center gap-8 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setLocation("/analyze")}
          className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-[0.2em] hover:text-primary transition-colors shrink-0"
        >
          <Menu className="h-4 w-4" />
          Neural Menu
        </button>
        
        <div className="h-4 w-px bg-white/10 shrink-0" />
        
        {SUB_NAV_ITEMS.map((item, i) => {
          // Improved active state logic to handle query params
          const isActive = location.split('?')[0] === item.path.split('?')[0] && 
                           (item.path.includes('?') ? location.includes(item.path.split('?')[1]) : true);
          
          return (
            <button
              key={i}
              onClick={() => setLocation(item.path)}
              className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] whitespace-nowrap transition-all hover:text-primary group shrink-0 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.icon && <span className="opacity-50 group-hover:opacity-100 transition-opacity">{item.icon}</span>}
              {item.label}
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),0.8)] ml-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
