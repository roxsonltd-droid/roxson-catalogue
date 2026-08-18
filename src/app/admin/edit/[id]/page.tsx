import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateProduct } from "@/app/admin/actions";
import { ProductForm } from "@/components/admin/ProductForm";
import type { CategoryData, ProductData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!Number.isFinite(productId)) notFound();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.category.findMany({ orderBy: { num: "asc" } }),
  ]);

  if (!product) notFound();

  const categoryData: CategoryData[] = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    num: c.num,
    titleEn: c.titleEn,
    titleBg: c.titleBg,
    blurbEn: c.blurbEn,
    blurbBg: c.blurbBg,
  }));

  const productData: ProductData = {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    supplierCode: product.supplierCode,
    seriesEn: product.seriesEn,
    seriesBg: product.seriesBg,
    descEn: product.descEn,
    descBg: product.descBg,
    materialEn: product.materialEn,
    materialBg: product.materialBg,
    diameterMin: product.diameterMin,
    diameterMax: product.diameterMax,
    diameterUnit: product.diameterUnit,
    unit: product.unit,
    moq: product.moq,
    packLength: product.packLength,
    layout: product.layout as ProductData["layout"],
    coreEn: product.coreEn,
    coreBg: product.coreBg,
    insulationEn: product.insulationEn,
    insulationBg: product.insulationBg,
    jacketEn: product.jacketEn,
    jacketBg: product.jacketBg,
    applicationEn: product.applicationEn,
    applicationBg: product.applicationBg,
    standardEn: product.standardEn,
    standardBg: product.standardBg,
    standardHighlight: product.standardHighlight,
    imageUrl: product.imageUrl,
    datasheetUrl: product.datasheetUrl,
    searchText: product.searchText,
    order: product.order,
    isActive: product.isActive,
    technicalDataStatus: product.technicalDataStatus,
    categoryId: product.categoryId,
  };

  const updateAction = updateProduct.bind(null, product.id);

  return (
    <>
      <h1>Edit product</h1>
      <p className="admin-sub">
        {product.sku} — {product.seriesEn}
      </p>
      <ProductForm categories={categoryData} product={productData} action={updateAction} />
    </>
  );
}
