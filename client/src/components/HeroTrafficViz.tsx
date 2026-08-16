/**
 * Animated hero visualization: a top-down abstract corridor of signal dots
 * that flip to green in sequence (predictive green-corridor effect), with
 * flowing traffic particles along lanes. Pure CSS/DOM, no canvas dependency.
 */
export function HeroTrafficViz() {
  return (
    <div
      className="relative w-full max-w-md rounded-3xl border border-white/10 bg-card/60 backdrop-blur p-5 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Grid backdrop */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Signal corridor */}
      <div className="relative space-y-4">
        {[0, 1, 2, 3].map(row => (
          <div key={row} className="flex items-center justify-between px-2">
            {[0, 1, 2, 3, 4].map(col => (
              <span
                key={col}
                className="signal-dot block h-3 w-3 rounded-full bg-slate-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                style={{
                  animation: `signalWave 4s ease-in-out ${row * 0.35 + col * 0.22}s infinite`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Ambulance particle moving across */}
      <div className="absolute left-2 right-2 top-1/2 h-4 -translate-y-1/2">
        <div className="ambulance-pulse relative flex h-full items-center">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400/30 via-emerald-400/60 to-emerald-400/30" />
        </div>
        <span className="absolute top-1/2 -translate-y-1/2 flex h-6 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 text-[8px] font-bold ambulance-slide">
          SOS
        </span>
      </div>

      <div className="relative mt-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Corridor prepared
        </span>
        <span className="text-emerald-300">ETA −3 min</span>
      </div>
    </div>
  );
}
