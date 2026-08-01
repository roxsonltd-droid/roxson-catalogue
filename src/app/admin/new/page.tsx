import { prisma } from "@/lib/db";
import { createProduct } from "@/app/admin/actions";
import { ProductForm } from "@/components/admin/ProductForm";
import type { CategoryData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, categories] = await Promise.all([
    searchParams,
    prisma.category.findMany({ orderBy: { num: "asc" } }),
  ]);

  const categoryData: CategoryData[] = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    num: c.num,
    titleEn: c.titleEn,
    titleBg: c.titleBg,
    blurbEn: c.blurbEn,
    blurbBg: c.blurbBg,
  }));

  const preselect = category ? categoryData.find((c) => c.slug === category) : undefined;
  const product = preselect
    ? {
        id: 0,
        code: "",
        seriesEn: "",
        seriesBg: "",
        descEn: "",
        descBg: "",
        materialEn: "",
        materialBg: "",
        diameterMin: null,
        diameterMax: null,
        layout: "ruler" as const,
        coreEn: "",
        coreBg: "",
        insulationEn: "",
        insulationBg: "",
        jacketEn: "",
        jacketBg: "",
        applicationEn: "",
        applicationBg: "",
        standardEn: "",
        standardBg: "",
        standardHighlight: false,
        imageUrl: "",
        searchText: "",
        order: 0,
        categoryId: preselect.id,
      }
    : null;

  return (
    <>
      <h1>Add product</h1>
      <p className="admin-sub">Create a new catalogue entry.</p>
      <ProductForm categories={categoryData} product={product} action={createProduct} />
    </>
  );
}
