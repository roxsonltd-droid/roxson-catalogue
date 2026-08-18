"use client";

import { useRouter } from "next/navigation";
import { deactivateProduct } from "@/app/admin/actions";

export function DeleteButton({ id, sku }: { id: number; sku: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!window.confirm(`Deactivate product "${sku}"?`)) return;
    const result = await deactivateProduct(id);
    if (result.ok) {
      router.refresh();
    } else {
      window.alert(result.error ?? "Deactivation failed.");
    }
  }

  return (
    <button type="button" className="danger" onClick={onDelete}>
      Deactivate
    </button>
  );
}
