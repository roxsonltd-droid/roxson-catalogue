import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { generateQuotePdf, type QuotePdfData } from "@/lib/quote-pdf";

const FINAL_STATUSES = ["SENT", "SUPERSEDED", "ACCEPTED", "REJECTED", "EXPIRED"] as const;

export async function loadFinalQuotePdf(quoteId: number) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: { orderBy: { id: "asc" } }, inquiry: true },
  });
  if (!quote) throw new Error("QUOTE_NOT_FOUND");
  if (!(FINAL_STATUSES as readonly string[]).includes(quote.status)) throw new Error("QUOTE_NOT_FINAL");

  const data: QuotePdfData = {
    quoteNumber: `ROX-Q-${String(quote.inquiryId).padStart(6, "0")}-V${quote.version}`,
    currency: quote.currency,
    company: quote.inquiry.company,
    contactName: quote.inquiry.contactName,
    email: quote.inquiry.email,
    country: quote.inquiry.country,
    createdAt: quote.createdAt,
    sentAt: quote.sentAt,
    validUntil: quote.validUntil,
    paymentTerms: quote.paymentTerms,
    deliveryTerms: quote.deliveryTerms,
    notes: quote.notes,
    subtotal: quote.subtotal.toFixed(2),
    freight: quote.freight.toFixed(2),
    discount: quote.discount.toFixed(2),
    total: quote.total.toFixed(2),
    items: quote.items.map((item) => ({
      sku: item.sku,
      supplierCode: item.supplierCode,
      description: item.description,
      diameter: item.diameter,
      diameterUnit: item.diameterUnit,
      quantity: item.quantity.toString(),
      unit: item.unit,
      unitPrice: item.unitPrice.toFixed(4),
      lineTotal: item.lineTotal.toFixed(2),
      notes: item.notes,
    })),
  };
  const pdf = await generateQuotePdf(data);
  const hash = createHash("sha256").update(pdf).digest("hex");

  if (quote.pdfHash && quote.pdfHash !== hash) throw new Error("PDF_INTEGRITY_ERROR");
  if (!quote.pdfHash) {
    const stored = await prisma.quote.updateMany({ where: { id: quote.id, pdfHash: null }, data: { pdfHash: hash } });
    if (stored.count === 0) {
      const current = await prisma.quote.findUnique({ where: { id: quote.id }, select: { pdfHash: true } });
      if (current?.pdfHash !== hash) throw new Error("PDF_INTEGRITY_ERROR");
    }
  }

  return { quote, data, pdf, hash };
}
