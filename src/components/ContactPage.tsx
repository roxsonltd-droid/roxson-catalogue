"use client";

import { useLang } from "@/components/LanguageProvider";
import { Header } from "@/components/Header";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { t } from "@/lib/i18n";
import type { CategoryData } from "@/lib/types";

export function ContactPage({ categories }: { categories: CategoryData[] }) {
  const { lang } = useLang();
  return (
    <>
      <Header
        categories={categories}
        searchValue=""
        onSearchChange={() => {}}
        resultLabel={null}
        onNavigate={() => {}}
        showSearch={false}
      />
      <div className="page-hero">
        <div className="wrap">
          <h1>{t(lang, "contact.title")}</h1>
          <p>{t(lang, "contact.subtitle")}</p>
        </div>
      </div>
      <div className="wrap">
        <div className="contact-grid">
          <div>
            <ContactForm />
          </div>
          <div className="contact-card">
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>{t(lang, "contact.info.title")}</h3>
            <div className="foot-contact" style={{ color: "var(--ink)" }}>
              <a href="mailto:roxson.ltd@gmail.com">✉ roxson.ltd@gmail.com</a>
              <span>{t(lang, "footer.location")}</span>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--steel)", marginTop: 24, lineHeight: 1.6 }}>
              {t(lang, "contact.info.hours")}: {t(lang, "contact.info.hours.v")}
            </p>
          </div>
        </div>
      </div>
      <Footer categories={categories} />
    </>
  );
}
