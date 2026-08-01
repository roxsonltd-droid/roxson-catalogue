"use client";

import { useLang } from "@/components/LanguageProvider";
import { ContactForm } from "@/components/ContactForm";
import { t } from "@/lib/i18n";

export function ContactSection() {
  const { lang } = useLang();
  return (
    <section className="contact-section wrap" id="contact">
      <h3 className="cap-title">{t(lang, "contact.title")}</h3>
      <p className="contact-lead">{t(lang, "contact.subtitle")}</p>
      <div className="contact-grid">
        <ContactForm />
        <div className="contact-card">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>{t(lang, "contact.info.title")}</h3>
          <div className="foot-contact" style={{ color: "var(--ink)" }}>
            <a href="mailto:roxson.ltd@gmail.com">✉ roxson.ltd@gmail.com</a>
            <a href="tel:+359894762270">☎ {t(lang, "footer.phone")}</a>
            <span>{t(lang, "footer.location")}</span>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--steel)", marginTop: 24, lineHeight: 1.6 }}>
            {t(lang, "contact.info.hours")}: {t(lang, "contact.info.hours.v")}
          </p>
        </div>
      </div>
    </section>
  );
}
