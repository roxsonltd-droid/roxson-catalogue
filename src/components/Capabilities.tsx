"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

const ICONS = [
  <svg key="layers" viewBox="0 0 24 24" fill="none">
    <path d="M4 7l8-4 8 4-8 4-8-4z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 12l8 4 8-4M4 17l8 4 8-4" stroke="currentColor" strokeWidth="1.6" />
  </svg>,
  <svg key="box" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="7" width="18" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 7l9-4 9 4" stroke="currentColor" strokeWidth="1.6" />
  </svg>,
  <svg key="tag" viewBox="0 0 24 24" fill="none">
    <path d="M4 5h16v5H4zM4 14h10v5H4z" stroke="currentColor" strokeWidth="1.6" />
  </svg>,
  <svg key="pin" viewBox="0 0 24 24" fill="none">
    <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
  </svg>,
];

const CAP_KEYS = ["1", "2", "3", "4"] as const;
type CapKey = (typeof CAP_KEYS)[number];
type CapI18nKey = `cap.${CapKey}.${"h" | "p"}`;

function capT(lang: "en" | "bg", item: CapKey, part: "h" | "p") {
  return t(lang, `cap.${item}.${part}` as CapI18nKey);
}

export function Capabilities() {
  const { lang } = useLang();
  return (
    <section className="capabilities wrap">
      <h3 className="cap-title">{t(lang, "cap.title")}</h3>
      <div className="cap-grid">
        {CAP_KEYS.map((item, i) => (
          <div className="cap" key={item}>
            {ICONS[i]}
            <h4>{capT(lang, item, "h")}</h4>
            <p>{capT(lang, item, "p")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
