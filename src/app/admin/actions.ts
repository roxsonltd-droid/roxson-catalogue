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
const DIAMETER_UNITS = ["MM", "INCH"] as const;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  sku: string;
  supplierCode: string | null;
  seriesEn: string;
  descEn: string;
  materialEn: string;
  coreEn: string;
  insulationEn: string;
  jacketEn: string;
  applicationEn: string;
  standardEn: string;
}): string {
  return [values.sku, values.supplierCode, values.seriesEn, values.descEn, values.materialEn, values.coreEn, values.insulationEn, values.jacketEn, values.applicationEn, values.standardEn]
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
  const diameterUnit = str(formData, "diameterUnit");
  return {
    sku: str(formData, "sku"),
    slug: slugify(str(formData, "slug") || str(formData, "sku")),
    supplierCode: str(formData, "supplierCode") || null,
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
    diameterUnit: DIAMETER_UNITS.includes(diameterUnit as (typeof DIAMETER_UNITS)[number])
      ? (diameterUnit as (typeof DIAMETER_UNITS)[number])
      : "INCH",
    unit: str(formData, "unit") || "m",
    moq: num(formData, "moq"),
    packLength: num(formData, "packLength"),
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
    datasheetUrl: str(formData, "datasheetUrl") || null,
    order: int(formData, "order", 0),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const data = collectProductData(formData);
  if (!data.sku || !data.slug || !data.categoryId || !data.seriesEn) {
    return { ok: false, error: "SKU, slug, category and series name are required." };
  }

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return { ok: false, error: "Category not found." };

  const image = await readImage(formData, "");
  if (image.error) return { ok: false, error: image.error };
  if (!image.url) return { ok: false, error: "An image is required." };

  const conflict = await prisma.product.findFirst({
    where: { OR: [{ sku: data.sku }, { slug: data.slug }] },
  });
  if (conflict) return { ok: false, error: "A product with this SKU or slug already exists." };

  const product = await prisma.product.create({ data: { ...data, searchText: buildSearchText(data), imageUrl: image.url } });

  revalidatePath("/");
  return { ok: true, productId: product.id };
}

export async function updateProduct(id: number, formData: FormData): Promise<ActionResult> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Product not found." };

  const data = collectProductData(formData);
  if (!data.sku || !data.slug || !data.categoryId || !data.seriesEn) {
    return { ok: false, error: "SKU, slug, category and series name are required." };
  }

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return { ok: false, error: "Category not found." };

  const conflict = await prisma.product.findFirst({
    where: { id: { not: id }, OR: [{ sku: data.sku }, { slug: data.slug }] },
  });
  if (conflict) return { ok: false, error: "A product with this SKU or slug already exists." };

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

export async function deactivateProduct(id: number): Promise<ActionResult> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Product not found." };

  await prisma.product.update({ where: { id }, data: { isActive: false } });

  revalidatePath("/");
  return { ok: true };
}
