export type JobStatus = "draft" | "in_progress" | "complete";
export type DefectSeverity = "safety" | "non_compliance" | "recommendation";
export type ChecklistResult = "pass" | "fail" | "na" | null;

export interface ChecklistItem {
  id: string;
  label: string;
  result: ChecklistResult;
}

export interface Settings {
  id: boolean;
  business_name: string;
  rec_number: string;
  abn: string;
  phone: string;
  email: string;
  address: string;
  logo_path: string | null;
  default_checklist: { label: string }[];
  updated_at: string;
}

export interface Job {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  site_address: string;
  job_type: string;
  job_date: string;
  notes: string;
  recommendations: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  job_id: string;
  name: string;
  location: string;
  rating_amps: string;
  fault_level: string;
  checklist: ChecklistItem[];
  has_defects: boolean;
  defect_description: string;
  defect_severity: DefectSeverity | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  job_id: string;
  board_id: string;
  storage_path: string;
  caption: string;
  sort_order: number;
  created_at: string;
}

export type VariationPricing = "fixed" | "hourly";

export interface Variation {
  id: string;
  job_id: string;
  description: string;
  pricing_mode: VariationPricing;
  price_ex_gst: number | null;
  hourly_rate_ex_gst: number | null;
  variation_date: string;
  signer_name: string;
  signed_at: string | null;
  signature_path: string | null;
  created_at: string;
  updated_at: string;
}

export const JOB_TYPES: { value: string; label: string }[] = [
  { value: "surge_protection", label: "Surge protection" },
  { value: "switchboard_upgrade", label: "Switchboard upgrade" },
  { value: "safety_check", label: "Safety check" },
  { value: "general", label: "General" },
];

export const SEVERITIES: { value: DefectSeverity; label: string }[] = [
  { value: "safety", label: "Safety issue" },
  { value: "non_compliance", label: "Non-compliance" },
  { value: "recommendation", label: "Recommendation" },
];
