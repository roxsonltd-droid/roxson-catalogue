import { auth } from "@/auth";
import { loadFinalQuotePdf } from "@/lib/quote-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const quoteId = Number((await params).id);
  if (!Number.isInteger(quoteId)) return new Response("Invalid quote id", { status: 400 });

  try {
    const { data, pdf } = await loadFinalQuotePdf(quoteId);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${data.quoteNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    if (message === "QUOTE_NOT_FOUND") return new Response("Quote not found", { status: 404 });
    if (message === "QUOTE_NOT_FINAL") return new Response("Draft quotes cannot be exported as final PDF", { status: 400 });
    if (message === "PDF_INTEGRITY_ERROR") return new Response("PDF INTEGRITY ERROR", { status: 409 });
    console.error("Quote PDF error:", error);
    return new Response("PDF generation failed", { status: 500 });
  }
}
