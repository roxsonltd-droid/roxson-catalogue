"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { uploadImage, deleteImage, isConfigured } from "@/lib/cloudinary";

export type ActionResult = {
  ok: boolean;
  error?: string;
  productId?: number;
};

const LAYOUTS = ["ruler", "layers", "table"];

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

function num(formData: FormData, key: string): number | null {
  const raw = str(formData, key);
  if (!raw) return null;
  const parsed = parseFloat(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function int(formData: FormData, key: string, fallback: number): number {
  const raw = str(formData, key);
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildSearchText(values: {
  code: string;
  seriesEn: string;
  descEn: string;
  materialEn: string;
  coreEn: string;
  insulationEn: string;
  jacketEn: string;
  applicationEn: string;
  standardEn: string;
}): string {
  return [values.code, values.seriesEn, values.descEn, values.materialEn, values.coreEn, values.insulationEn, values.jacketEn, values.applicationEn, values.standardEn]
    .join(" ")
    .toLowerCase();
}

async function readImage(formData: FormData, fallbackUrl: string): Promise<{ url: string; error?: string }> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!isConfigured()) {
      return { url: "", error: "Cloudinary is not configured. Add CLOUDINARY_* variables to .env." };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { url: "", error: "Image is larger than 10 MB." };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const url = await uploadImage(buffer);
      return { url };
    } catch (e) {
      return { url: "", error: `Image upload failed: ${(e as Error).message}` };
    }
  }
  return { url: fallbackUrl };
}

function collectProductData(formData: FormData) {
  const layout = str(formData, "layout");
  return {
    code: str(formData, "code"),
    categoryId: int(formData, "categoryId", 0),
    layout: LAYOUTS.includes(layout) ? layout : "ruler",
    seriesEn: str(formData, "seriesEn"),
    seriesBg: str(formData, "seriesBg"),
    descEn: str(formData, "descEn"),
    descBg: str(formData, "descBg"),
    materialEn: str(formData, "materialEn"),
    materialBg: str(formData, "materialBg"),
    diameterMin: num(formData, "diameterMin"),
    diameterMax: num(formData, "diameterMax"),
    coreEn: str(formData, "coreEn"),
    coreBg: str(formData, "coreBg"),
    insulationEn: str(formData, "insulationEn"),
    insulationBg: str(formData, "insulationBg"),
    jacketEn: str(formData, "jacketEn"),
    jacketBg: str(formData, "jacketBg"),
    applicationEn: str(formData, "applicationEn"),
    applicationBg: str(formData, "applicationBg"),
    standardEn: str(formData, "standardEn"),
    standardBg: str(formData, "standardBg"),
    standardHighlight: formData.get("standardHighlight") === "on",
    order: int(formData, "order", 0),
  };
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const data = collectProductData(formData);
  if (!data.code || !data.categoryId || !data.seriesEn) {
    return { ok: false, error: "Code, category and series name are required." };
  }

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return { ok: false, error: "Category not found." };

  const image = await readImage(formData, "");
  if (image.error) return { ok: false, error: image.error };
  if (!image.url) return { ok: false, error: "An image is required." };

  const product = await prisma.product.create({
    data: {
      ...data,
      searchText: buildSearchText(data),
      imageUrl: image.url,
      categoryId: data.categoryId,
    },
  });

  revalidatePath("/");
  return { ok: true, productId: product.id };
}

export async function updateProduct(id: number, formData: FormData): Promise<ActionResult> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Product not found." };

  const data = collectProductData(formData);
  if (!data.code || !data.categoryId || !data.seriesEn) {
    return { ok: false, error: "Code, category and series name are required." };
  }

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return { ok: false, error: "Category not found." };

  const image = await readImage(formData, existing.imageUrl);
  if (image.error) return { ok: false, error: image.error };

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      searchText: buildSearchText(data),
      imageUrl: image.url,
      categoryId: data.categoryId,
    },
  });

  if (image.url !== existing.imageUrl && existing.imageUrl.startsWith("http")) {
    await deleteImage(existing.imageUrl);
  }

  revalidatePath("/");
  return { ok: true, productId: product.id };
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Product not found." };

  await prisma.product.delete({ where: { id } });
  if (existing.imageUrl.startsWith("http")) await deleteImage(existing.imageUrl);

  revalidatePath("/");
  return { ok: true };
}
