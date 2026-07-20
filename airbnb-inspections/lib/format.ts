import { SEVERITIES, type DamageSeverity, type InspectionStatus } from "./types";

export function severityLabel(value: DamageSeverity): string {
  return SEVERITIES.find((s) => s.value === value)?.label ?? value;
}

export function statusLabel(status: InspectionStatus): string {
  return status === "complete" ? "Complete" : "In progress";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Melbourne",
  });
}

/** Timestamp burned onto photos, e.g. "19 Jul 2026, 2:34 pm". */
export function photoStamp(date: Date): string {
  return date.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
