"use client";

import { useActionState, useEffect } from "react";
import { FormMessage } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Asset } from "@/lib/types";
import { updateAsset } from "@/server/actions/assets";
import { AssetDetailFields } from "./asset-fields";

function EditForm({ asset, close }: { asset: Asset; close: () => void }) {
  const [state, action] = useActionState(updateAsset.bind(null, asset.id), null);
  useEffect(() => {
    if (state?.ok) close();
  }, [state, close]);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="category" value={asset.category} />
      <input type="hidden" name="item_type" value={asset.item_type} />
      <AssetDetailFields asset={asset} errors={state?.fieldErrors} />
      <FormMessage state={state && !state.ok ? state : null} />
      <div className="flex justify-end">
        <SubmitButton>Save item</SubmitButton>
      </div>
    </form>
  );
}

export function EditAssetButton({ asset }: { asset: Asset }) {
  return (
    <Modal title="Edit item" trigger="Edit">
      {(close) => <EditForm asset={asset} close={close} />}
    </Modal>
  );
}
