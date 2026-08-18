import { DiameterUnit, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import seedData from "./seed-data.json";

const prisma = new PrismaClient();

function productSlug(sku: string): string {
  return sku
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateProductIdentities() {
  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();
  const supplierCodeCounts = new Map<string, number>();

  for (const product of seedData.products) {
    if (seenSkus.has(product.sku)) {
      throw new Error(`Duplicate SKU in seed data: ${product.sku}`);
    }
    seenSkus.add(product.sku);

    const slug = productSlug(product.sku);
    if (!slug) {
      throw new Error(`SKU does not produce a valid slug: ${product.sku}`);
    }
    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate product slug in seed data: ${slug}`);
    }
    seenSlugs.add(slug);

    if (!Object.values(DiameterUnit).includes(product.diameterUnit as DiameterUnit)) {
      throw new Error(`Invalid diameter unit for ${product.sku}: ${product.diameterUnit}`);
    }

    supplierCodeCounts.set(
      product.supplierCode,
      (supplierCodeCounts.get(product.supplierCode) ?? 0) + 1
    );
  }

  for (const [supplierCode, count] of supplierCodeCounts) {
    if (count > 1) {
      console.warn(
        `Supplier code ${supplierCode} is used by ${count} ROXSON products`
      );
    }
  }
}

async function main() {
  validateProductIdentities();

  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const configuredAdminPassword = process.env.ADMIN_PASSWORD;
  const adminPassword = configuredAdminPassword ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { username: adminUsername },
    update: configuredAdminPassword ? { passwordHash } : {},
    create: { username: adminUsername, passwordHash },
  });

  for (const cat of seedData.categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        num: cat.num,
        titleEn: cat.titleEn,
        titleBg: cat.titleBg,
        blurbEn: cat.blurbEn,
        blurbBg: cat.blurbBg,
      },
      create: {
        slug: cat.slug,
        num: cat.num,
        titleEn: cat.titleEn,
        titleBg: cat.titleBg,
        blurbEn: cat.blurbEn,
        blurbBg: cat.blurbBg,
      },
    });
  }

  const categoryBySlug = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id])
  );

  for (const p of seedData.products) {
    const categoryId = categoryBySlug.get(p.categorySlug);
    if (categoryId == null) {
      console.warn(`skip product ${p.sku}: unknown category ${p.categorySlug}`);
      continue;
    }
    const data = {
      sku: p.sku,
      slug: productSlug(p.sku),
      supplierCode: p.supplierCode,
      seriesEn: p.seriesEn,
      seriesBg: p.seriesBg,
      descEn: p.descEn,
      descBg: p.descBg,
      materialEn: p.materialEn,
      materialBg: p.materialBg,
      diameterMin: p.diameterMin,
      diameterMax: p.diameterMax,
      diameterUnit: p.diameterUnit as DiameterUnit,
      layout: p.layout,
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
      categoryId,
    };
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: data,
      create: data,
    });
  }

  const count = await prisma.product.count();
  console.log(`Seeded ${seedData.categories.length} categories, ${count} products, 1 admin (${adminUsername}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
