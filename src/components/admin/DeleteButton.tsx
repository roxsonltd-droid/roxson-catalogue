"use client";

import { useRouter } from "next/navigation";
import { deleteProduct } from "@/app/admin/actions";

export function DeleteButton({ id, code }: { id: number; code: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!window.confirm(`Delete product "${code}"? This cannot be undone.`)) return;
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
