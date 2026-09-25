import type { IntervalUnit, Priority } from "./catalog";
import type { TaskStatus } from "./domain";

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: string;
  item_type: string;
  location: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchased_on: string | null;
  warranty_until: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type AssetRef = Pick<Asset, "id" | "name" | "category" | "item_type">;

export interface Task {
  id: string;
  asset_id: string;
  title: string;
  description: string | null;
  interval_value: number | null;
  interval_unit: IntervalUnit | null;
  next_due_on: string | null;
  last_completed_on: string | null;
  priority: Priority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface TaskWithAsset extends Task {
  asset: AssetRef;
}

export interface ServiceLog {
  id: string;
  asset_id: string;
  task_id: string | null;
  title: string;
  performed_on: string;
  performed_by: string | null;
  cost_cents: number | null;
  currency: string;
  reading: string | null;
  notes: string | null;
  created_at: string;
}

export interface ServiceLogWithAsset extends ServiceLog {
  asset: AssetRef;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  created_at: string;
}
