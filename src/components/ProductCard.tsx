"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { Ruler } from "@/components/Ruler";
import { pick, t } from "@/lib/i18n";
import type { InquiryDraftItem, ProductData } from "@/lib/types";

const Check = () => (
  <svg viewBox="0 0 16 16" className="chk">
    <path d="M2 8.5 6 12l8-8" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

function formatDiameter(min: number | null, max: number | null, unit: string): string {
  if (min == null || max == null) return "";
  const suffix = unit === "INCH" ? "″" : " mm";
  return `${min}–${max}${suffix}`;
}

type ProductCardProps = {
  product: ProductData;
  catSlug: string;
  onAddToInquiry: (item: InquiryDraftItem) => void;
};

export function ProductCard({ product, catSlug, onAddToInquiry }: ProductCardProps) {
  const { lang } = useLang();
  const hasDiameterRange = product.diameterMin != null && product.diameterMax != null;
  const [diameter, setDiameter] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">(product.moq ?? 1);

  const diameterSuffix = product.diameterUnit === "INCH" ? "″" : "mm";
  const diameterIsValid = !hasDiameterRange || (
    typeof diameter === "number" &&
    diameter >= product.diameterMin! &&
    diameter <= product.diameterMax!
  );
  const quantityIsValid = typeof quantity === "number" && quantity > 0 && (
    product.moq == null || quantity >= product.moq
  );
  const canAdd = diameterIsValid && quantityIsValid;

  function handleAdd() {
    if (!canAdd || typeof quantity !== "number") return;
    onAddToInquiry({
      productId: product.id,
      sku: product.sku,
      supplierCode: product.supplierCode,
      diameter: typeof diameter === "number" ? diameter : null,
      diameterUnit: product.diameterUnit,
      quantity,
      unit: product.unit,
    });
  }

  const series = pick(lang, product.seriesEn, product.seriesBg);
  const desc = pick(lang, product.descEn, product.descBg);
  const material = pick(lang, product.materialEn, product.materialBg);
  const core = pick(lang, product.coreEn, product.coreBg);
  const insulation = pick(lang, product.insulationEn, product.insulationBg);
  const jacket = pick(lang, product.jacketEn, product.jacketBg);
  const application = pick(lang, product.applicationEn, product.applicationBg);
  const standard = pick(lang, product.standardEn, product.standardBg);

  return (
    <article className="card" data-cat={catSlug} data-search={product.searchText}>
      <div className="card-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={`${product.supplierCode ?? product.sku} ${series}`} loading="lazy" />
      </div>
      <div className="card-body">
        <p className="card-code mono">{product.supplierCode ?? product.sku}</p>
        {product.supplierCode && <p className="card-sku mono">{product.sku}</p>}
        <h3 className="card-series">{series}</h3>
        <p className="card-desc">{desc}</p>

        {product.layout === "layers" && (
          <div className="layers">
            <div className="layer">
              <span className="layer-dot layer-dot--core" />
              <span className="spec-k">{t(lang, "spec.core")}</span>
              <span className="spec-v">{core || "—"}</span>
            </div>
            <div className="layer">
              <span className="layer-dot layer-dot--ins" />
              <span className="spec-k">{t(lang, "spec.insulation")}</span>
              <span className="spec-v">{insulation || "—"}</span>
            </div>
            <div className="layer">
              <span className="layer-dot layer-dot--jacket" />
              <span className="spec-k">{t(lang, "spec.jacket")}</span>
              <span className="spec-v">{jacket || "—"}</span>
            </div>
          </div>
        )}

        {product.layout === "table" && (
          <div className="spec-block spec-block--table">
            <div className="spec-cell">
              <span className="spec-k">{t(lang, "spec.diameter")}</span>
              <span className="spec-v mono">{formatDiameter(product.diameterMin, product.diameterMax, product.diameterUnit)}</span>
            </div>
            <div className="spec-cell">
              <span className="spec-k">{t(lang, "spec.material")}</span>
              <span className="spec-v">{material || "—"}</span>
            </div>
            <div className="spec-cell">
              <span className="spec-k">{t(lang, "spec.application")}</span>
              <span className="spec-v">{application || "—"}</span>
            </div>
            <div className="spec-cell">
              <span className="spec-k">{t(lang, "spec.standard")}</span>
              <span className={`spec-v${product.standardHighlight ? " spec-v--as" : ""}`}>{standard || "—"}</span>
            </div>
          </div>
        )}

        {product.layout === "ruler" && (
          <div className="spec-block">
            <Ruler min={product.diameterMin} max={product.diameterMax} />
            <div className="spec-row">
              <div>
                <span className="spec-k">{t(lang, "spec.diameter")}</span>
                <span className="spec-v mono">{formatDiameter(product.diameterMin, product.diameterMax, product.diameterUnit)}</span>
              </div>
              <div>
                <span className="spec-k">{t(lang, "spec.material")}</span>
                <span className="spec-v">{material || "—"}</span>
              </div>
            </div>
          </div>
        )}

        <div className="badges">
          <span className="badge badge--oem">
            <Check />
            {t(lang, "badge.oem")}
          </span>
          <span className="badge">
            <Check />
            {t(lang, "badge.customLengths")}
          </span>
        </div>

        <div className="rfq-product-controls">
          {hasDiameterRange && (
            <label>
              <span>{lang === "bg" ? "Диаметър" : "Diameter"}</span>
              <span className="rfq-input-with-unit">
                <input
                  type="number"
                  min={product.diameterMin ?? undefined}
                  max={product.diameterMax ?? undefined}
                  step="any"
                  value={diameter}
                  onChange={(event) => setDiameter(event.target.value === "" ? "" : Number(event.target.value))}
                />
                <small>{diameterSuffix}</small>
              </span>
            </label>
          )}

          <label>
            <span>{lang === "bg" ? "Количество" : "Quantity"}</span>
            <span className="rfq-input-with-unit">
              <input
                type="number"
                min={product.moq ?? 0.01}
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value === "" ? "" : Number(event.target.value))}
              />
              <small>{product.unit}</small>
            </span>
          </label>

          {product.moq != null && <p className="rfq-moq">MOQ: {product.moq} {product.unit}</p>}

          <button type="button" className="btn btn-secondary" disabled={!canAdd} onClick={handleAdd}>
            {lang === "bg" ? "Добави към запитване" : "Add to inquiry"}
          </button>
        </div>
      </div>
    </article>
  );
}
