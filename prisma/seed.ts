import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import seedData from "./seed-data.json";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { username: adminUsername },
    update: { passwordHash },
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
      console.warn(`skip product ${p.code}: unknown category ${p.categorySlug}`);
      continue;
    }
    const data = {
      code: p.code,
      seriesEn: p.seriesEn,
      seriesBg: p.seriesBg,
      descEn: p.descEn,
      descBg: p.descBg,
      materialEn: p.materialEn,
      materialBg: p.materialBg,
      diameterMin: p.diameterMin,
      diameterMax: p.diameterMax,
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
    const existing = await prisma.product.findFirst({ where: { order: p.order } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
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
