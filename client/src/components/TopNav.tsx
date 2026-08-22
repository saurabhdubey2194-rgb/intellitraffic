import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Shield, User, LogOut, LayoutDashboard, Bell, ChevronDown, Activity, ShieldCheck, Zap, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { NotificationCenter } from "./NotificationCenter";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";

export function TopNav() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  const getDashboardPath = () => {
    if (!user) return "/dashboard";
    if (user.role === "admin") return "/admin";
    if (user.role === "investigator") return "/investigator";
    return "/dashboard";
  };

  return (
    <nav className="h-20 border-b border-white/5 bg-black/95 backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-xl sticky top-0 z-50 w-full">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="container h-full flex items-center justify-between gap-8">
        <div className="flex items-center gap-12 flex-1">
          <a
            onClick={() => setLocation("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 blur-lg bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Shield className="h-5 w-5 text-primary relative z-10" />
            </div>
            <span className="font-rajdhani text-2xl font-bold tracking-tighter hidden sm:block uppercase">
              Fake<span className="text-primary">Shield</span>
            </span>
          </a>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl relative group">
            <div className="absolute inset-0 blur-xl bg-primary/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search neural patterns, forensic reports, deepfake tools..."
              className="pl-12 h-12 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest placeholder:text-muted-foreground/50 focus:border-primary/30 transition-all relative z-10"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors relative z-20" />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary/10 hover:bg-primary/20 text-primary text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all relative z-20 border border-primary/20">
              Execute Search
            </button>
          </form>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation(getDashboardPath())} className="h-10 px-4 rounded-xl hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Console
            </Button>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <NotificationCenter />
            <ThemeToggle className="!border-none !bg-transparent hover:!bg-white/5 h-10 w-10 rounded-xl" />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-white/5 p-1.5 rounded-2xl transition-all group border border-transparent hover:border-white/5">
                  <div className="relative">
                    <Avatar className="h-9 w-9 border border-primary/20 rounded-xl">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black uppercase">
                        {user.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 border-2 border-black rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-[10px] font-black leading-none uppercase tracking-widest">{user.name}</p>
                    <p className="text-[8px] text-primary mt-1 font-black uppercase tracking-[0.2em] opacity-80">{user.role}</p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 mt-4 border-white/5 bg-black/95 backdrop-blur-xl p-2 rounded-2xl shadow-2xl shadow-primary/10">
                <div className="px-3 py-4 mb-2 border-b border-white/5">
                  <div className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-1">Identity Node</div>
                  <div className="text-[10px] font-bold text-white uppercase tracking-widest truncate">{user.email}</div>
                </div>
                <DropdownMenuItem onClick={() => setLocation("/profile")} className="rounded-xl cursor-pointer gap-3 py-3 text-[10px] font-bold uppercase tracking-widest focus:bg-primary/10 focus:text-primary">
                  <User className="h-4 w-4" />
                  Profile Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/history")} className="rounded-xl cursor-pointer gap-3 py-3 text-[10px] font-bold uppercase tracking-widest focus:bg-primary/10 focus:text-primary">
                  <Activity className="h-4 w-4" />
                  Forensic History
                </DropdownMenuItem>
	                {(user.role === 'admin' || user.role === 'investigator') && (
	                  <DropdownMenuItem onClick={() => setLocation("/investigator")} className="rounded-xl cursor-pointer gap-3 py-3 text-[10px] font-bold uppercase tracking-widest focus:bg-primary/10 focus:text-primary">
	                    <ShieldCheck className="h-4 w-4" />
	                    Case Management
	                  </DropdownMenuItem>
	                )}
                <DropdownMenuItem onClick={() => setLocation("/settings")} className="rounded-xl cursor-pointer gap-3 py-3 text-[10px] font-bold uppercase tracking-widest focus:bg-primary/10 focus:text-primary">
                  <Settings className="h-4 w-4" />
                  Platform Settings
                </DropdownMenuItem>
                <div className="h-px bg-white/5 my-2" />
                <DropdownMenuItem onClick={() => logout()} className="rounded-xl cursor-pointer gap-3 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 focus:bg-red-500/10 focus:text-red-400">
                  <LogOut className="h-4 w-4" />
                  Terminate Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => setLocation("/signin")} className="h-10 px-6 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
              Access Console
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
