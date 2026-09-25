import { z } from "zod";
import { CATEGORY_IDS, getItemType } from "./catalog";
import { INTERVAL_UNITS, PRIORITIES, TASK_STATUSES } from "./domain";

/** Empty form fields become null; everything else is trimmed and length-capped. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const requiredText = (max: number, label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max);

const optionalDate = z
  .union([z.iso.date(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

const slug = z.string().regex(/^[a-z_]{2,40}$/);

export const idSchema = z.uuid();

const intervalFields = {
  interval_value: z
    .union([z.literal(""), z.null(), z.coerce.number().int().min(1).max(1000)])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  interval_unit: z
    .union([z.enum(INTERVAL_UNITS), z.literal(""), z.literal("none"), z.null()])
    .optional()
    .transform((v) => (v === "" || v === "none" || v == null ? null : v)),
};

const bothOrNeither = (v: { interval_value: number | null; interval_unit: string | null }) =>
  (v.interval_value === null) === (v.interval_unit === null);
const intervalMessage = {
  message: "Set both a repeat interval and unit, or neither",
  path: ["interval_value"],
};

export const taskTemplateSelection = z.object({
  title: requiredText(160, "Title"),
  interval_value: z.number().int().min(1).max(1000),
  interval_unit: z.enum(INTERVAL_UNITS),
  priority: z.enum(PRIORITIES),
  next_due_on: z.iso.date(),
});

export const assetSchema = z
  .object({
    name: requiredText(120, "Name"),
    category: z.enum(CATEGORY_IDS),
    item_type: slug,
    location: optionalText(120),
    brand: optionalText(120),
    model: optionalText(120),
    serial_number: optionalText(120),
    purchased_on: optionalDate,
    warranty_until: optionalDate,
    notes: optionalText(4000),
  })
  .refine((v) => Boolean(getItemType(v.category, v.item_type)), {
    message: "Pick a type from the list",
    path: ["item_type"],
  });

export const createAssetSchema = z.object({
  asset: assetSchema,
  tasks: z.array(taskTemplateSelection).max(20).default([]),
});

export const taskSchema = z
  .object({
    asset_id: idSchema,
    title: requiredText(160, "Title"),
    description: optionalText(4000),
    ...intervalFields,
    next_due_on: optionalDate,
    priority: z.enum(PRIORITIES).default("medium"),
    status: z.enum(TASK_STATUSES).default("pending"),
  })
  .refine(bothOrNeither, intervalMessage);

export const updateTaskSchema = z
  .object({
    title: requiredText(160, "Title"),
    description: optionalText(4000),
    ...intervalFields,
    next_due_on: optionalDate,
    priority: z.enum(PRIORITIES),
  })
  .refine(bothOrNeither, intervalMessage);

export const statusSchema = z.object({
  id: idSchema,
  status: z.enum(TASK_STATUSES),
});

const costCents = z
  .union([z.literal(""), z.null(), z.coerce.number().min(0).max(1_000_000_000)])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Math.round(v * 100)));

const currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code")
  .default("USD");

export const completeTaskSchema = z.object({
  task_id: idSchema,
  performed_on: z.iso.date(),
  performed_by: optionalText(120),
  cost: costCents,
  currency,
  reading: optionalText(60),
  notes: optionalText(4000),
});

export const serviceLogSchema = z.object({
  asset_id: idSchema,
  title: requiredText(160, "Title"),
  performed_on: z.iso.date(),
  performed_by: optionalText(120),
  cost: costCents,
  currency,
  reading: optionalText(60),
  notes: optionalText(4000),
});

export const commentSchema = z.object({
  task_id: idSchema,
  body: requiredText(2000, "Comment"),
});

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function formDataToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  }
  return out;
}

export function validationError(error: z.ZodError): ActionState {
  return {
    ok: false,
    message: "Please fix the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}
