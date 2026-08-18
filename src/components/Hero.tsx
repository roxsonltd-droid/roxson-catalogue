"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

export function Hero() {
  const { lang } = useLang();
  return (
    <header className="hero" id="top">
      <div className="hero-inner">
        <div>
          <p className="hero-eyebrow">{t(lang, "hero.eyebrow")}</p>
          <h1>
            {t(lang, "hero.h1.1")}{" "}
            <em>{t(lang, "hero.h1.2")}</em>{" "}
            {t(lang, "hero.h1.3")}
          </h1>
          <p className="lead">{t(lang, "hero.lead")}</p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#non-insulated">
              {t(lang, "hero.cta.browse")}
            </a>
            <a className="btn btn-ghost" href="#contact">
              {t(lang, "hero.cta.quote")}
            </a>
          </div>
        </div>
        <div className="hero-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-duct.jpg" alt="ARBO flexible ducts" />
        </div>
      </div>
      <div className="hero-stats">
        <div>
          <div className="stat-num">10,000m²</div>
          <div className="stat-label">{t(lang, "hero.stat.factory")}</div>
        </div>
        <div>
          <div className="stat-num">30+</div>
          <div className="stat-label">{t(lang, "hero.stat.exports")}</div>
        </div>
        <div>
          <div className="stat-num">10+</div>
          <div className="stat-label">{t(lang, "hero.stat.certs")}</div>
        </div>
      </div>
    </header>
  );
}
