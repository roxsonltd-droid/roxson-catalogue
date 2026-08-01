"use client";

import { ProductCard } from "@/components/ProductCard";
import { useLang } from "@/components/LanguageProvider";
import { countLabel } from "@/lib/i18n";
import type { CategoryData, ProductData } from "@/lib/types";

type CategorySectionProps = {
  category: CategoryData;
  products: ProductData[];
  total: number;
  alt: boolean;
};

export function CategorySection({ category, products, total, alt }: CategorySectionProps) {
  const { lang } = useLang();
  return (
    <section className={`cat${alt ? " alt" : ""}`} id={category.slug} data-cat-section={category.slug}>
      <div className="wrap">
        <div className="cat-head">
          <span className="cat-num">{String(category.num).padStart(2, "0")}</span>
          <div>
            <h2>{lang === "bg" ? category.titleBg : category.titleEn}</h2>
            <p className="cat-blurb">{lang === "bg" ? category.blurbBg : category.blurbEn}</p>
          </div>
          <span className="cat-count">{countLabel(lang, total)}</span>
        </div>
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
