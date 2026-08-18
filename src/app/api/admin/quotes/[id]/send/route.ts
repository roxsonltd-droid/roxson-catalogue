import { Resend } from "resend";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { loadFinalQuotePdf } from "@/lib/quote-delivery";

export const runtime = "nodejs";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const quoteId = Number((await params).id);
  if (!Number.isInteger(quoteId)) return new Response("Invalid quote id", { status: 400 });

  const formData = await request.formData();
  const recipient = String(formData.get("recipient") ?? "").trim().toLowerCase();
  if (!validEmail(recipient)) return new Response("Invalid recipient", { status: 400 });
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return new Response("Email service is not configured", { status: 503 });

  try {
    const { quote, data, pdf } = await loadFinalQuotePdf(quoteId);
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const { error } = await resend.emails.send({
      from,
      to: recipient,
      replyTo: process.env.CONTACT_EMAIL || "roxson.ltd@gmail.com",
      subject: `${data.quoteNumber} - ROXSON LTD quotation`,
      text: [
        `Dear ${quote.inquiry.contactName},`,
        "",
        `Please find attached our quotation ${data.quoteNumber}.`,
        `Grand total: ${data.currency} ${data.total}`,
        data.validUntil ? `Valid until: ${data.validUntil.toISOString().slice(0, 10)}` : null,
        "",
        "Kind regards,",
        "ROXSON LTD",
      ].filter((line): line is string => line !== null).join("\n"),
      attachments: [{ filename: `${data.quoteNumber}.pdf`, content: pdf }],
    });
    if (error) {
      console.error("Quote email error:", error);
      return new Response("Email delivery failed", { status: 502 });
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.quote.update({ where: { id: quote.id }, data: { emailedAt: now, sentToEmail: recipient } }),
      prisma.inquiry.update({ where: { id: quote.inquiryId }, data: { lastActivityAt: now } }),
      prisma.inquiryActivity.create({
        data: {
          inquiryId: quote.inquiryId,
          type: "QUOTE_EMAILED",
          description: `${data.quoteNumber} emailed to ${recipient}`,
          actor: session.user.name || "Admin",
        },
      }),
    ]);
    return Response.redirect(new URL(`/admin/inquiries/${quote.inquiryId}/quote?quote=${quote.id}`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed";
    if (message === "QUOTE_NOT_FOUND") return new Response("Quote not found", { status: 404 });
    if (message === "QUOTE_NOT_FINAL") return new Response("Only finalized quotes can be emailed", { status: 400 });
    if (message === "PDF_INTEGRITY_ERROR") return new Response("PDF INTEGRITY ERROR", { status: 409 });
    console.error("Quote email error:", error);
    return new Response("Email delivery failed", { status: 500 });
  }
}
