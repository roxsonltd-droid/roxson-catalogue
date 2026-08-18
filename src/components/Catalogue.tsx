"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Capabilities } from "@/components/Capabilities";
import { CategorySection } from "@/components/CategorySection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { InquiryDrawer } from "@/components/InquiryDrawer";
import { InquiryButton } from "@/components/InquiryButton";
import { useLang } from "@/components/LanguageProvider";
import { t, searchCountLabel } from "@/lib/i18n";
import type { CatalogueData, InquiryDraftItem, ProductData } from "@/lib/types";

export function Catalogue({ data }: { data: CatalogueData }) {
  const { lang } = useLang();
  const [query, setQuery] = useState("");
  const [inquiryItems, setInquiryItems] = useState<InquiryDraftItem[]>([]);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryReference, setInquiryReference] = useState<string | null>(null);

  function addToInquiry(item: InquiryDraftItem) {
    setInquiryReference(null);
    setInquiryItems((current) => {
      const existingIndex = current.findIndex(
        (existing) =>
          existing.productId === item.productId &&
          existing.diameter === item.diameter &&
          existing.diameterUnit === item.diameterUnit
      );

      if (existingIndex === -1) return [...current, item];

      return current.map((existing, index) =>
        index === existingIndex
          ? { ...existing, quantity: existing.quantity + item.quantity }
          : existing
      );
    });
    setInquiryOpen(true);
  }

  function removeInquiryItem(index: number) {
    setInquiryItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function inquirySuccess(reference: string) {
    setInquiryReference(reference);
    setInquiryItems([]);
    setShowInquiryForm(false);
  }

  const productsByCategory = useMemo(() => {
    const map = new Map<number, ProductData[]>();
    for (const category of data.categories) map.set(category.id, []);
    for (const product of data.products) {
      const list = map.get(product.categoryId);
      if (list) list.push(product);
    }
    return map;
  }, [data]);

  const q = query.trim().toLowerCase();
  const visibleByCategory = useMemo(() => {
    const result = new Map<number, ProductData[]>();
    for (const [categoryId, products] of productsByCategory) {
      const visible = q ? products.filter((p) => p.searchText.includes(q)) : products;
      result.set(categoryId, visible);
    }
    return result;
  }, [productsByCategory, q]);

  const visibleTotal = useMemo(() => {
    let total = 0;
    for (const list of visibleByCategory.values()) total += list.length;
    return total;
  }, [visibleByCategory]);

  const resultLabel = q ? searchCountLabel(lang, visibleTotal) : null;

  return (
    <>
      <Header
        categories={data.categories}
        searchValue={query}
        onSearchChange={setQuery}
        resultLabel={resultLabel}
        onNavigate={() => {}}
      />
      <Hero />

      <section className="toc wrap" data-inquiry-items={inquiryItems.length}>
        <h3 className="cap-title">{t(lang, "toc.title")}</h3>
        <div className="toc-grid">
          {data.categories.map((c) => (
            <a className="toc-card" href={`#${c.slug}`} key={c.slug}>
              <span className="toc-num mono">{String(c.num).padStart(2, "0")}</span>
              <span className="toc-name">{lang === "bg" ? c.titleBg : c.titleEn}</span>
              <span className="toc-count mono">
                {productsByCategory.get(c.id)?.length} {t(lang, "toc.sku")}
              </span>
            </a>
          ))}
        </div>
      </section>

      <Capabilities />

      {data.categories.map((c) => {
        const products = visibleByCategory.get(c.id) ?? [];
        if (q && products.length === 0) return null;
        return (
          <CategorySection
            key={c.slug}
            category={c}
            products={products}
            total={productsByCategory.get(c.id)?.length ?? 0}
            alt={c.num % 2 === 0}
            onAddToInquiry={addToInquiry}
          />
        );
      })}

      <p className="empty-state" id="emptyState" style={q && visibleTotal === 0 ? { display: "block" } : undefined}>
        {t(lang, "search.empty")}
      </p>

      <ContactSection />

      <Footer categories={data.categories} />
      <BackToTop />

      <InquiryButton
        count={inquiryItems.length}
        onClick={() => {
          setInquiryOpen(true);
          setShowInquiryForm(false);
          setInquiryReference(null);
        }}
      />

      <InquiryDrawer
        items={inquiryItems}
        products={data.products}
        open={inquiryOpen}
        onClose={() => {
          setInquiryOpen(false);
          setShowInquiryForm(false);
        }}
        onRemove={removeInquiryItem}
        onContinue={() => setShowInquiryForm(true)}
        showForm={showInquiryForm}
        reference={inquiryReference}
        onSuccess={inquirySuccess}
        onBackToItems={() => setShowInquiryForm(false)}
      />
    </>
  );
}
