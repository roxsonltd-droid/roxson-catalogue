"use client";

import { useEffect } from "react";
import { useLang } from "@/components/LanguageProvider";
import type { InquiryDraftItem, ProductData } from "@/lib/types";

type InquiryDrawerProps = {
  items: InquiryDraftItem[];
  products: ProductData[];
  open: boolean;
  onClose: () => void;
  onRemove: (index: number) => void;
  onContinue: () => void;
};

function formatDiameter(
  diameter: number | null,
  unit: InquiryDraftItem["diameterUnit"]
): string {
  if (diameter == null) return "—";
  return unit === "INCH" ? `${diameter}″` : `${diameter} mm`;
}

export function InquiryDrawer({
  items,
  products,
  open,
  onClose,
  onRemove,
  onContinue,
}: InquiryDrawerProps) {
  const { lang } = useLang();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className={`inquiry-layer${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className="inquiry-backdrop"
        onClick={onClose}
        aria-label={lang === "bg" ? "Затвори запитването" : "Close inquiry"}
        tabIndex={open ? 0 : -1}
      />

      <aside className="inquiry-drawer" role="dialog" aria-modal="true" aria-labelledby="inquiry-title">
        <header className="inquiry-drawer-head">
          <div>
            <p className="mono">RFQ</p>
            <h2 id="inquiry-title">{lang === "bg" ? "Вашето запитване" : "Your inquiry"}</h2>
            <span>{items.length} {lang === "bg" ? "позиции" : "items"}</span>
          </div>
          <button
            type="button"
            className="inquiry-close"
            onClick={onClose}
            aria-label={lang === "bg" ? "Затвори" : "Close"}
          >
            ×
          </button>
        </header>

        <div className="inquiry-drawer-body">
          {items.length === 0 ? (
            <p className="inquiry-empty">
              {lang === "bg" ? "Все още няма добавени продукти." : "No products have been added yet."}
            </p>
          ) : (
            <div className="inquiry-items">
              {items.map((item, index) => {
                const product = products.find((candidate) => candidate.id === item.productId);
                const series = product
                  ? (lang === "bg" ? product.seriesBg : product.seriesEn)
                  : item.sku;

                return (
                  <article
                    className="inquiry-item"
                    key={`${item.productId}-${item.diameterUnit}-${item.diameter ?? "none"}`}
                  >
                    <div className="inquiry-item-head">
                      <div>
                        <p className="mono inquiry-item-sku">{item.sku}</p>
                        {item.supplierCode && <p className="mono inquiry-item-supplier">ARBO: {item.supplierCode}</p>}
                      </div>
                      <button
                        type="button"
                        className="inquiry-remove"
                        onClick={() => onRemove(index)}
                        aria-label={lang === "bg" ? "Премахни продукта" : "Remove product"}
                      >
                        ×
                      </button>
                    </div>

                    <h3>{series}</h3>

                    <dl className="inquiry-item-specs">
                      <div>
                        <dt>{lang === "bg" ? "Диаметър" : "Diameter"}</dt>
                        <dd className="mono">{formatDiameter(item.diameter, item.diameterUnit)}</dd>
                      </div>
                      <div>
                        <dt>{lang === "bg" ? "Количество" : "Quantity"}</dt>
                        <dd className="mono">{item.quantity} {item.unit}</dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="inquiry-drawer-foot">
            <button type="button" className="btn btn-secondary inquiry-submit" onClick={onContinue}>
              {lang === "bg" ? "Продължи към запитване" : "Continue to inquiry"}
            </button>
            <p className="inquiry-note">
              {lang === "bg"
                ? "Това не е поръчка. Ще подготвим индивидуална B2B оферта."
                : "This is not an order. We will prepare an individual B2B quotation."}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
