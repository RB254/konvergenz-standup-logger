import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { WeatherWidget } from "./WeatherWidget";
import logo from "@/assets/konvergenz-logo.svg.asset.json";

export function TopNav() {
  const { username, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-[color:var(--primary-deep)] text-white shadow-[var(--shadow-elevated)]">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white p-1.5">
            <img src={logo.url} alt="Konvergenz" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-wide text-white uppercase">
              Konvergenz Team Standup Logger
            </div>
            <div className="text-[11px] font-medium tracking-[0.18em] text-white/70 uppercase">
              Async updates · Live productivity
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WeatherWidget />
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20 md:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--brand-red)] text-[10px] font-bold text-white">
              {(username ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-white">{username}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            aria-label="Sign out"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
