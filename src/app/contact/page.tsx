import type { Metadata } from "next";
import { ContactPage } from "@/components/ContactPage";
import { prisma } from "@/lib/db";
import type { CategoryData } from "@/lib/types";

export const metadata: Metadata = {
  title: "Contact — ROXSON LTD · ARBO Flexible Duct Catalogue",
  description: "Contact ROXSON LTD, official ARBO distributor for Bulgaria — request a quote for flexible duct systems.",
};

export default async function ContactRoute() {
  const categories = await prisma.category.findMany({ orderBy: { num: "asc" } });

  const categoryData: CategoryData[] = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    num: c.num,
    titleEn: c.titleEn,
    titleBg: c.titleBg,
    blurbEn: c.blurbEn,
    blurbBg: c.blurbBg,
  }));

  return <ContactPage categories={categoryData} />;
}
