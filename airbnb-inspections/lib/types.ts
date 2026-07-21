export type InspectionStatus = "in_progress" | "complete";
export type DamageSeverity = "minor" | "moderate" | "severe";
export type RoomType =
  | "bedroom"
  | "bathroom"
  | "powder"
  | "kitchen"
  | "living"
  | "outdoor"
  | "backyard";

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface Inspection {
  id: string;
  property_name: string;
  property_address: string;
  inspection_type: string; // 'checkout' (the only type today)
  status: InspectionStatus;
  notes: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  inspection_id: string;
  room_type: RoomType;
  name: string;
  checklist: ChecklistItem[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  inspection_id: string;
  room_id: string;
  storage_path: string;
  caption: string;
  taken_at: string; // capture time — also burned into the image itself
  sort_order: number;
  created_at: string;
}

export interface DamageFlag {
  id: string;
  inspection_id: string;
  room_id: string | null; // null = property-wide / general damage
  description: string;
  severity: DamageSeverity;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const SEVERITIES: { value: DamageSeverity; label: string }[] = [
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];
