import { Catalogue } from "@/components/Catalogue";
import { prisma } from "@/lib/db";
import type { CatalogueData } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { num: "asc" } }),
    prisma.product.findMany({ orderBy: { order: "asc" } }),
  ]);

  const data: CatalogueData = {
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      num: c.num,
      titleEn: c.titleEn,
      titleBg: c.titleBg,
      blurbEn: c.blurbEn,
      blurbBg: c.blurbBg,
    })),
    products: products.map((p) => ({
      id: p.id,
      code: p.code,
      seriesEn: p.seriesEn,
      seriesBg: p.seriesBg,
      descEn: p.descEn,
      descBg: p.descBg,
      materialEn: p.materialEn,
      materialBg: p.materialBg,
      diameterMin: p.diameterMin,
      diameterMax: p.diameterMax,
      layout: p.layout as "ruler" | "layers" | "table",
      coreEn: p.coreEn,
      coreBg: p.coreBg,
      insulationEn: p.insulationEn,
      insulationBg: p.insulationBg,
      jacketEn: p.jacketEn,
      jacketBg: p.jacketBg,
      applicationEn: p.applicationEn,
      applicationBg: p.applicationBg,
      standardEn: p.standardEn,
      standardBg: p.standardBg,
      standardHighlight: p.standardHighlight,
      imageUrl: p.imageUrl,
      searchText: p.searchText,
      order: p.order,
      categoryId: p.categoryId,
    })),
  };

  return <Catalogue data={data} />;
}
