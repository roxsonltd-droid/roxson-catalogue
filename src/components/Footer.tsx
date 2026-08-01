"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import type { CategoryData } from "@/lib/types";

const CERTS = ["ETL Intertek", "ISO 9001", "CE", "RoHS", "REACH", "AS 4254"];

export function Footer({ categories }: { categories: CategoryData[] }) {
  const { lang } = useLang();
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <span className="foot-name">ROXSON LTD</span>
            <p>{t(lang, "footer.brand")}</p>
            <div className="foot-contact">
              <a href="mailto:roxson.ltd@gmail.com">✉ roxson.ltd@gmail.com</a>
              <span>{t(lang, "footer.location")}</span>
            </div>
          </div>
          <div className="foot-links">
            <h5>{t(lang, "footer.catalogue")}</h5>
            {categories.map((c) => (
              <a key={c.slug} href={`#${c.slug}`}>
                {String(c.num).padStart(2, "0")} — {lang === "bg" ? c.titleBg : c.titleEn}
              </a>
            ))}
          </div>
          <div>
            <h5>{t(lang, "footer.certifications")}</h5>
            <div className="certs">
              {CERTS.map((c) => (
                <span className="cert-pill" key={c}>
                  {c}
                </span>
              ))}
            </div>
            <h5 style={{ marginTop: 22 }}>{t(lang, "footer.manufacturedBy")}</h5>
            <p style={{ margin: "7px 0 10px", color: "#c7cfda", fontSize: 13, fontWeight: 600 }}>
              {t(lang, "footer.madeIn")}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arbo-logo.jpg" alt="ARBO" />
          </div>
        </div>
        <div className="foot-bottom">
          <span>{t(lang, "footer.copyright")}</span>
          <span>{t(lang, "footer.distributor")}</span>
        </div>
      </div>
    </footer>
  );
}
