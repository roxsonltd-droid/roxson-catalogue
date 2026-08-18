"use client";

import { useRouter } from "next/navigation";
import { deleteProduct } from "@/app/admin/actions";

export function DeleteButton({ id, sku }: { id: number; sku: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!window.confirm(`Delete product "${sku}"? This cannot be undone.`)) return;
    const result = await deleteProduct(id);
    if (result.ok) {
      router.refresh();
    } else {
      window.alert(result.error ?? "Delete failed.");
    }
  }

  return (
    <button type="button" className="danger" onClick={onDelete}>
      Delete
    </button>
  );
}
