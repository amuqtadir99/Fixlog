import { Field, Input, Textarea } from "@/components/ui/form";
import type { Asset } from "@/lib/types";
import type { ActionState } from "@/lib/validation";

/** Shared detail fields for creating and editing an item. */
export function AssetDetailFields({ asset, errors }: { asset?: Partial<Asset>; errors?: ActionState["fieldErrors"] }) {
  const e = errors ?? {};
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor="name" errors={e.name} className="sm:col-span-2">
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          defaultValue={asset?.name}
          placeholder="e.g. Kitchen fridge"
        />
      </Field>
      <Field label="Location / room" htmlFor="location" errors={e.location}>
        <Input
          id="location"
          name="location"
          maxLength={120}
          defaultValue={asset?.location ?? ""}
          placeholder="Garage"
        />
      </Field>
      <Field label="Brand" htmlFor="brand" errors={e.brand}>
        <Input id="brand" name="brand" maxLength={120} defaultValue={asset?.brand ?? ""} />
      </Field>
      <Field label="Model" htmlFor="model" errors={e.model}>
        <Input id="model" name="model" maxLength={120} defaultValue={asset?.model ?? ""} />
      </Field>
      <Field label="Serial number" htmlFor="serial_number" errors={e.serial_number}>
        <Input id="serial_number" name="serial_number" maxLength={120} defaultValue={asset?.serial_number ?? ""} />
      </Field>
      <Field label="Purchased on" htmlFor="purchased_on" errors={e.purchased_on}>
        <Input id="purchased_on" name="purchased_on" type="date" defaultValue={asset?.purchased_on ?? ""} />
      </Field>
      <Field label="Warranty until" htmlFor="warranty_until" errors={e.warranty_until}>
        <Input id="warranty_until" name="warranty_until" type="date" defaultValue={asset?.warranty_until ?? ""} />
      </Field>
      <Field label="Notes" htmlFor="notes" errors={e.notes} className="sm:col-span-2">
        <Textarea id="notes" name="notes" maxLength={4000} defaultValue={asset?.notes ?? ""} />
      </Field>
    </div>
  );
}
