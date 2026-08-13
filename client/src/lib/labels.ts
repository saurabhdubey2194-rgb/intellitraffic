import {
  EMERGENCY_STATUS,
  INCIDENT_TYPES,
  PRIORITY,
  ROLE,
  SIGNAL_PREP,
  TRAFFIC_LEVEL,
} from "@shared/intellitraffic";

// ---------- Incident ----------
export function incidentColor(type?: string | null): string {
  const map: Record<string, string> = {
    accident: "bg-red-500",
    road_blockage: "bg-orange-500",
    construction: "bg-purple-500",
    waterlogging: "bg-sky-500",
    broken_signal: "bg-slate-400",
    heavy_congestion: "bg-amber-500",
    other: "bg-slate-500",
  };
  return map[type ?? "other"] ?? "bg-slate-500";
}

export function incidentTypeLabel(type?: string | null): string {
  const map: Record<string, string> = {
    accident: "Accident",
    road_blockage: "Road Blockage",
    waterlogging: "Waterlogging",
    construction: "Construction",
    broken_signal: "Broken Signal",
    heavy_congestion: "Heavy Congestion",
    other: "Other",
  };
  return map[type ?? "other"] ?? (type ?? "Incident");
}

export function incidentTypes(): string[] {
  return [...INCIDENT_TYPES];
}

// ---------- Traffic ----------
export function trafficColor(level?: string | null): string {
  const map: Record<string, string> = {
    low: "#22c55e",
    moderate: "#f59e0b",
    heavy: "#f97316",
    severe: "#ef4444",
  };
  return map[level ?? "moderate"] ?? "#f59e0b";
}

export function trafficLevelLabel(level?: string | null): string {
  const map: Record<string, string> = {
    low: "Low Traffic",
    moderate: "Moderate",
    heavy: "Heavy Traffic",
    severe: "Severe Congestion",
  };
  return map[level ?? "moderate"] ?? (level ?? "Moderate");
}

export function trafficLevels(): string[] {
  return [...TRAFFIC_LEVEL];
}

// ---------- Emergency ----------
export function emergencyStatusLabel(status?: string | null): string {
  const map: Record<string, string> = {
    submitted: "Pending Police Verification",
    approved: "Approved",
    corridor_active: "Emergency Corridor Active",
    rejected: "Rejected",
    arrived: "Arrived at Hospital",
    completed: "Completed",
  };
  return map[status ?? ""] ?? (status ?? "Unknown");
}

export function emergencyStatusColor(status?: string | null): string {
  const map: Record<string, string> = {
    submitted: "#f59e0b",
    approved: "#3b82f6",
    corridor_active: "#dc2626",
    rejected: "#6b7280",
    arrived: "#22c55e",
    completed: "#22c55e",
  };
  return map[status ?? ""] ?? "#6b7280";
}

export function emergencyStatuses(): string[] {
  return [...EMERGENCY_STATUS];
}

export function priorityLabel(p?: string | null): string {
  const map: Record<string, string> = {
    high: "High",
    critical: "Critical",
    extreme: "Extreme",
  };
  return map[p ?? ""] ?? (p ?? "High");
}

export function priorityColor(p?: string | null): string {
  const map: Record<string, string> = {
    high: "#3b82f6",
    critical: "#f59e0b",
    extreme: "#dc2626",
  };
  return map[p ?? ""] ?? "#3b82f6";
}

export function priorities(): string[] {
  return [...PRIORITY];
}

// ---------- Signal corridor phase ----------
export function signalPrepLabel(phase?: string | null): string {
  const map: Record<string, string> = {
    normal: "Normal",
    monitoring: "Monitoring",
    preparing: "Preparing Green",
    ready: "Green Wave Active",
  };
  return map[phase ?? "normal"] ?? (phase ?? "Normal");
}

export function signalPrepColor(phase?: string | null): string {
  const map: Record<string, string> = {
    normal: "#64748b",
    monitoring: "#3b82f6",
    preparing: "#f59e0b",
    ready: "#22c55e",
  };
  return map[phase ?? "normal"] ?? "#64748b";
}

export function signalPrepPhases(): string[] {
  return [...SIGNAL_PREP];
}

// ---------- Roles ----------
export function roleLabel(role?: string | null): string {
  const map: Record<string, string> = {
    public: "Public",
    ambulance: "Ambulance",
    police: "Police",
    hospital: "Hospital",
    host: "Host / Admin",
    admin: "Host / Admin",
  };
  return map[role ?? ""] ?? (role ?? "Public");
}

export function roles(): string[] {
  return [...ROLE];
}

// ---------- Severity ----------
export function severityLabel(sev?: string | null): string {
  const map: Record<string, string> = {
    info: "Info",
    warning: "Warning",
    urgent: "Urgent",
  };
  return map[sev ?? "info"] ?? (sev ?? "Info");
}

export function severityColor(sev?: string | null): string {
  const map: Record<string, string> = {
    info: "bg-blue-500/15 text-blue-300 border-blue-400/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    urgent: "bg-red-500/15 text-red-300 border-red-400/30",
  };
  return map[sev ?? "info"] ?? map.info;
}

// ---------- Verification ----------
export function verificationStatusLabel(v?: string | null): string {
  const map: Record<string, string> = {
    verified: "Verified",
    rejected: "Rejected",
    under_review: "Under Review",
    suspended: "Suspended",
  };
  return map[v ?? ""] ?? (v ?? "Pending");
}

export function verificationStatusColor(v?: string | null): string {
  const map: Record<string, string> = {
    verified: "#22c55e",
    rejected: "#ef4444",
    under_review: "#f59e0b",
    suspended: "#6b7280",
  };
  return map[v ?? ""] ?? "#f59e0b";
}

// ---------- Corridor ----------
export function corridorStatusLabel(status?: string | null): string {
  const map: Record<string, string> = {
    preparing: "Preparing",
    active: "Active",
    closed: "Closed",
  };
  return map[status ?? ""] ?? (status ?? "—");
}

export function corridorStatusColor(status?: string | null): string {
  const map: Record<string, string> = {
    preparing: "#f59e0b",
    active: "#dc2626",
    closed: "#22c55e",
  };
  return map[status ?? ""] ?? "#6b7280";
}

// ---------- Format helpers ----------
export function formatEta(sec?: number | null): string {
  if (sec == null || sec <= 0) return "—";
  const m = Math.round(sec / 60);
  if (m < 1) return "<1 min";
  return `${m} min`;
}

export function formatDistance(km?: number | null): string {
  if (km == null) return "";
  return `${km.toFixed(1)} km away`;
}
