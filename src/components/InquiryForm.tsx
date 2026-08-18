"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import type { InquiryDraftItem } from "@/lib/types";

type Props = {
  items: InquiryDraftItem[];
  onSuccess: (reference: string) => void;
  onCancel: () => void;
};

export function InquiryForm({ items, onSuccess, onCancel }: Props) {
  const { lang } = useLang();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      company: String(formData.get("company") ?? "").trim(),
      contactName: String(formData.get("contactName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      country: String(formData.get("country") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      items: items.map(({ productId, diameter, quantity }) => ({ productId, diameter, quantity })),
    };

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { reference?: string; error?: string };
      if (!response.ok || !result.reference) {
        setError(result.error ?? (lang === "bg" ? "Запитването не беше изпратено." : "Unable to send inquiry."));
        return;
      }
      onSuccess(result.reference);
    } catch {
      setError(lang === "bg" ? "Няма връзка със сървъра." : "Unable to connect to the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="inquiry-form" onSubmit={onSubmit}>
      <h3>{lang === "bg" ? "Данни за запитването" : "Inquiry details"}</h3>
      <div className="inquiry-form-grid">
        <label><span>{lang === "bg" ? "Фирма" : "Company"}</span><input name="company" type="text" autoComplete="organization" /></label>
        <label><span>{lang === "bg" ? "Лице за контакт *" : "Contact person *"}</span><input name="contactName" type="text" required autoComplete="name" /></label>
        <label><span>Email *</span><input name="email" type="email" required autoComplete="email" /></label>
        <label><span>{lang === "bg" ? "Телефон" : "Phone"}</span><input name="phone" type="tel" autoComplete="tel" /></label>
        <label><span>{lang === "bg" ? "Държава" : "Country"}</span><input name="country" type="text" autoComplete="country-name" /></label>
        <label className="inquiry-form-full">
          <span>{lang === "bg" ? "Допълнителна информация" : "Additional information"}</span>
          <textarea name="message" rows={4} />
        </label>
      </div>
      {error && <div className="form-status err">{error}</div>}
      <div className="inquiry-form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={pending}>{lang === "bg" ? "Назад" : "Back"}</button>
        <button type="submit" className="btn btn-secondary" disabled={pending || items.length === 0}>
          {pending ? (lang === "bg" ? "Изпращане…" : "Sending…") : (lang === "bg" ? "Изпрати запитването" : "Send inquiry")}
        </button>
      </div>
    </form>
  );
}
