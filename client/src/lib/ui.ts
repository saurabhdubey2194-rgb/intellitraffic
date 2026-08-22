/** FakeShield AI frontend UI helpers — labels, colors, and role metadata. */

export const ROLE_LABEL: Record<string, string> = {
  user: "User",
  investigator: "Investigator",
  admin: "Administrator",
};

export const ROLE_ICON: Record<string, string> = {
  user: "User",
  investigator: "Shield",
  admin: "Crown",
};

export function verificationLabel(status?: string | null): string {
  switch (status) {
    case "pending":
      return "Pending Review";
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "suspended":
      return "Suspended";
    default:
      return status || "Unknown";
  }
}

export function verificationColor(status?: string | null): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-300 border-amber-400/30";
    case "verified":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
    case "rejected":
    case "suspended":
      return "bg-red-500/15 text-red-300 border-red-400/30";
    default:
      return "bg-white/5 text-slate-300 border-white/10";
  }
}

export function riskLevelLabel(level?: string | null): string {
  switch (level) {
    case "low":
      return "Low Risk";
    case "moderate":
      return "Moderate Risk";
    case "high":
      return "High Risk";
    case "critical":
      return "Critical Risk";
    default:
      return level || "Unknown";
  }
}

export function riskLevelColor(level?: string | null): string {
  switch (level) {
    case "low":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
    case "moderate":
      return "bg-amber-500/15 text-amber-300 border-amber-400/30";
    case "high":
      return "bg-orange-500/15 text-orange-300 border-orange-400/30";
    case "critical":
      return "bg-red-500/15 text-red-300 border-red-400/30";
    default:
      return "bg-white/5 text-slate-300 border-white/10";
  }
}

export function analysisStatusLabel(status?: string | null): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "preprocessing":
      return "Preprocessing";
    case "analyzing":
      return "Analyzing";
    case "generating_report":
      return "Generating Report";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status || "Unknown";
  }
}
