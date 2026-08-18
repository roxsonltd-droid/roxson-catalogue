"use client";

import { useLang } from "@/components/LanguageProvider";

type Props = { count: number; onClick: () => void };

export function InquiryButton({ count, onClick }: Props) {
  const { lang } = useLang();
  if (count === 0) return null;

  return (
    <button
      type="button"
      className="inquiry-floating-btn"
      onClick={onClick}
      aria-label={lang === "bg" ? "Отвори запитването" : "Open inquiry"}
    >
      <span>{lang === "bg" ? "Запитване" : "Inquiry"}</span>
      <span className="inquiry-floating-count">{count}</span>
    </button>
  );
}
