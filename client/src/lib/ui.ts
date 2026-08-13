/** IntelliTraffic frontend UI helpers — labels, colors, and role metadata. */

export const ROLE_LABEL: Record<string, string> = {
  public: "Public",
  ambulance: "Ambulance",
  police: "Police",
  hospital: "Hospital",
  host: "Host/Admin",
  admin: "Host/Admin",
};

export const ROLE_ICON: Record<string, string> = {
  public: "User",
  ambulance: "Ambulance",
  police: "Shield",
  hospital: "Hospital",
  host: "Crown",
  admin: "Crown",
};

export function verificationLabel(status?: string | null): string {
  switch (status) {
    case "pending":
      return "Pending Verification";
    case "under_review":
      return "Under Review";
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "suspended":
      return "Suspended";
    case "expired":
      return "Expired";
    default:
      return status || "Unknown";
  }
}

export function verificationColor(status?: string | null): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-300 border-amber-400/30";
    case "under_review":
      return "bg-blue-500/15 text-blue-300 border-blue-400/30";
    case "verified":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
    case "rejected":
    case "suspended":
    case "expired":
      return "bg-red-500/15 text-red-300 border-red-400/30";
    default:
      return "bg-white/5 text-slate-300 border-white/10";
  }
}

export function incidentTypeLabel(type?: string | null): string {
  switch (type) {
    case "accident":
      return "Accident";
    case "road_blockage":
      return "Road Blockage";
    case "waterlogging":
      return "Waterlogging";
    case "construction":
      return "Construction";
    case "broken_signal":
      return "Broken Signal";
    case "heavy_congestion":
      return "Heavy Congestion";
    default:
      return type || "Other";
  }
}

export function trafficLevelLabel(level?: string | null): string {
  switch (level) {
    case "low":
      return "Low";
    case "moderate":
      return "Moderate";
    case "heavy":
      return "Heavy";
    case "severe":
      return "Severe";
    default:
      return level || "—";
  }
}

export function trafficColor(level?: string | null): string {
  switch (level) {
    case "low":
      return "#22c55e";
    case "moderate":
      return "#f59e0b";
    case "heavy":
      return "#f97316";
    case "severe":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

export function emergencyStatusLabel(status?: string | null): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "under_verification":
      return "Under Verification";
    case "approved":
      return "Approved";
    case "corridor_active":
      return "Corridor Active";
    case "in_transit":
      return "In Transit";
    case "arrived":
      return "Arrived at Hospital";
    case "completed":
      return "Completed";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "Unknown";
  }
}

export function emergencyStatusColor(status?: string | null): string {
  switch (status) {
    case "submitted":
    case "under_verification":
      return "bg-amber-500/15 text-amber-300 border-amber-400/30";
    case "approved":
      return "bg-blue-500/15 text-blue-300 border-blue-400/30";
    case "corridor_active":
    case "in_transit":
      return "bg-red-500/15 text-red-300 border-red-400/30";
    case "arrived":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
    case "completed":
      return "bg-slate-500/15 text-slate-300 border-slate-400/30";
    case "rejected":
    case "cancelled":
      return "bg-red-500/15 text-red-300 border-red-400/30";
    default:
      return "bg-white/5 text-slate-300 border-white/10";
  }
}

/** Signal corridor preparation state labels (predictive corridor). */
export function signalPrepLabel(state?: string | null): string {
  switch (state) {
    case "ready":
      return "READY — Cleared";
    case "preparing":
      return "PREPARING";
    case "monitoring":
      return "MONITORING";
    default:
      return "NORMAL";
  }
}

export function signalPrepColor(state?: string | null): string {
  switch (state) {
    case "ready":
      return "#22c55e";
    case "preparing":
      return "#f59e0b";
    case "monitoring":
      return "#3b82f6";
    default:
      return "#94a3b8";
  }
}
