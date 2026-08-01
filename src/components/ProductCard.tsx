"use client";

import { useLang } from "@/components/LanguageProvider";
import { Ruler } from "@/components/Ruler";
import { pick, t } from "@/lib/i18n";
import type { ProductData } from "@/lib/types";

const Check = () => (
  <svg viewBox="0 0 16 16" className="chk">
    <path d="M2 8.5 6 12l8-8" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

function formatDiameter(min: number | null, max: number | null): string {
  if (min == null || max == null) return "";
  return `${min}″–${max}″`;
}

export function ProductCard({ product }: { product: ProductData }) {
  const { lang } = useLang();

  const series = pick(lang, product.seriesEn, product.seriesBg);
  const desc = pick(lang, product.descEn, product.descBg);
  const material = pick(lang, product.materialEn, product.materialBg);
  const core = pick(lang, product.coreEn, product.coreBg);
  const insulation = pick(lang, product.insulationEn, product.insulationBg);
  const jacket = pick(lang, product.jacketEn, product.jacketBg);
  const application = pick(lang, product.applicationEn, product.applicationBg);
  const standard = pick(lang, product.standardEn, product.standardBg);

  return (
    <article className="card" data-cat={product.categoryId} data-search={product.searchText}>
      <div className="card-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={`${product.code} ${series}`} loading="lazy" />
      </div>
      <div className="card-body">
        <p className="card-code mono">{product.code}</p>
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
              <span className="spec-v mono">{formatDiameter(product.diameterMin, product.diameterMax)}</span>
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
                <span className="spec-v mono">{formatDiameter(product.diameterMin, product.diameterMax)}</span>
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
      </div>
    </article>
  );
}
