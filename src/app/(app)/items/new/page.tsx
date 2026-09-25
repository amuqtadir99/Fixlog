import { NewItemWizard } from "@/components/features/new-item-wizard";
import { PageHeader } from "@/components/ui/card";
import { getToday } from "@/server/today";

export const metadata = { title: "Add item" };

export default async function NewItemPage() {
  const today = await getToday();
  return (
    <>
      <PageHeader
        title="Add an item"
        description="Choose what it is — we'll suggest a maintenance plan you can tweak."
      />
      <NewItemWizard today={today} />
    </>
  );
}
