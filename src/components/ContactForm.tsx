"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { sendContactEmail } from "@/app/contact/actions";

export function ContactForm() {
  const { lang } = useLang();
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await sendContactEmail(formData);
    setPending(false);
    if (result.ok) {
      setStatus("ok");
      e.currentTarget.reset();
    } else {
      setStatus("err");
      setError(result.error ?? null);
    }
  }

  return (
    <div className="contact-card">
      <h3 style={{ fontSize: 18, marginBottom: 16 }}>{t(lang, "contact.form.title")}</h3>

      {status === "ok" && <div className="form-status ok">{t(lang, "contact.ok")}</div>}
      {status === "err" && <div className="form-status err">{error ?? t(lang, "contact.err")}</div>}

      <form onSubmit={onSubmit}>
        <div className="form-field">
          <label htmlFor="name">{t(lang, "contact.name")} *</label>
          <input id="name" name="name" type="text" required autoComplete="name" />
        </div>
        <div className="form-field">
          <label htmlFor="email">{t(lang, "contact.email")} *</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="form-field">
          <label htmlFor="company">{t(lang, "contact.company")}</label>
          <input id="company" name="company" type="text" autoComplete="organization" />
        </div>
        <div className="form-field">
          <label htmlFor="message">{t(lang, "contact.message")} *</label>
          <textarea id="message" name="message" rows={6} required />
        </div>
        <button className="btn btn-secondary" type="submit" disabled={pending}>
          {pending ? "…" : t(lang, "contact.submit")}
        </button>
      </form>
    </div>
  );
}
