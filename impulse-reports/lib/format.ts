import { JOB_TYPES, SEVERITIES, type DefectSeverity, type JobStatus } from "./types";

export function jobTypeLabel(value: string): string {
  return JOB_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function severityLabel(value: DefectSeverity | null): string {
  return SEVERITIES.find((s) => s.value === value)?.label ?? "—";
}

export function statusLabel(status: JobStatus): string {
  return status === "draft" ? "Draft" : status === "in_progress" ? "In Progress" : "Complete";
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

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);
}
