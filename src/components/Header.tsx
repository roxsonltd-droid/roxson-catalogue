"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { t, type Lang } from "@/lib/i18n";
import type { CategoryData } from "@/lib/types";

type HeaderProps = {
  categories: CategoryData[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  resultLabel: string | null;
  onNavigate: () => void;
  showSearch?: boolean;
};

export function Header({ categories, searchValue, onSearchChange, resultLabel, onNavigate, showSearch = true }: HeaderProps) {
  const { lang, setLang } = useLang();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navRef.current?.querySelectorAll(".navlink").forEach((l) => {
              l.classList.toggle("active", (l as HTMLElement).dataset.nav === entry.target.id);
            });
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    categories.forEach((c) => {
      const el = document.getElementById(c.slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  const switchLang = (next: Lang) => setLang(next);

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <a href="#top" className="brand" onClick={onNavigate}>
          <span className="brand-word">
            <span className="name">ROXSON LTD</span>
            <span className="tag">{t(lang, "footer.location").replace("📍 ", "")}</span>
          </span>
          <span className="brand-div" />
          <span className="brand-sub">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arbo-logo.jpg" alt="ARBO" />
          </span>
        </a>
        <nav className="navlinks" ref={navRef}>
          {categories.map((c) => (
            <a key={c.slug} href={`#${c.slug}`} className="navlink" data-nav={c.slug} onClick={onNavigate}>
              <span className="mono navnum">{String(c.num).padStart(2, "0")}</span>
              <span>{lang === "bg" ? c.titleBg : c.titleEn}</span>
            </a>
          ))}
          <Link href="/contact" className="navlink" data-nav="contact" onClick={onNavigate}>
            <span className="navnum">→</span>
            <span>{t(lang, "nav.contact")}</span>
          </Link>
        </nav>
        <div className="lang-switch" role="group" aria-label="Language / Език">
          <button
            className={`lang-btn${lang === "en" ? " active" : ""}`}
            type="button"
            onClick={() => switchLang("en")}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
          <button
            className={`lang-btn${lang === "bg" ? " active" : ""}`}
            type="button"
            onClick={() => switchLang("bg")}
            aria-pressed={lang === "bg"}
          >
            BG
          </button>
        </div>
        {showSearch && (
          <div className="searchwrap">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id="search"
              type="text"
              placeholder={t(lang, "search.placeholder")}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {showSearch && (
          <span className="result-count" id="resultCount" style={resultLabel == null ? { display: "none" } : { display: "inline" }}>
            {resultLabel}
          </span>
        )}
      </div>
    </div>
  );
}
