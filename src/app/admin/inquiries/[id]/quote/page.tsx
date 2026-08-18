import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { markQuoteSent, saveQuoteDraft } from "../../actions";

export const dynamic = "force-dynamic";

function dateValue(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ quote?: string }>;
}) {
  const inquiryId = Number((await params).id);
  const requestedQuoteId = Number((await searchParams).quote || 0) || null;
  if (!Number.isInteger(inquiryId)) notFound();

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      items: { include: { product: true } },
      quotes: { orderBy: { version: "desc" }, include: { items: true } },
    },
  });
  if (!inquiry) notFound();

  const quote = requestedQuoteId
    ? inquiry.quotes.find((candidate) => candidate.id === requestedQuoteId)
    : inquiry.quotes.find((candidate) => candidate.status === "DRAFT") ?? null;
  if (requestedQuoteId && !quote) notFound();

  const rows = quote
    ? quote.items.map((item) => ({
        key: item.id,
        sku: item.sku,
        supplierCode: item.supplierCode,
        description: item.description,
        diameter: item.diameter,
        diameterUnit: item.diameterUnit,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toFixed(2),
        notes: item.notes ?? "",
      }))
    : inquiry.items.map((item) => ({
        key: item.id,
        sku: item.product.sku,
        supplierCode: item.product.supplierCode,
        description: item.product.seriesEn,
        diameter: item.diameter,
        diameterUnit: item.diameterUnit,
        quantity: String(item.quantity),
        unit: item.unit,
        unitPrice: "0",
        lineTotal: "0.00",
        notes: item.notes ?? "",
      }));

  const version = quote?.version ?? ((inquiry.quotes[0]?.version ?? 0) + 1);
  const editable = !quote || quote.status === "DRAFT";
  const saveAction = saveQuoteDraft.bind(null, inquiryId, quote?.id ?? null);
  const sentAction = quote ? markQuoteSent.bind(null, inquiryId, quote.id) : null;

  return (
    <>
      <div className="admin-detail-head">
        <div>
          <Link href={`/admin/inquiries/${inquiryId}`}>← RFQ-{String(inquiryId).padStart(6, "0")}</Link>
          <h1>ROX-Q-{String(inquiryId).padStart(6, "0")}-V{version}</h1>
          <p className="admin-sub">{quote?.status ?? "NEW DRAFT"}</p>
        </div>
        <div className="form-actions">
          {quote?.status === "DRAFT" && sentAction && <form action={sentAction}><button className="btn btn-primary" type="submit">Finalize Quote</button></form>}
          {quote && quote.status !== "DRAFT" && (
            <>
              <a className="btn btn-secondary" href={`/api/admin/quotes/${quote.id}/pdf`} target="_blank">Download PDF</a>
              <form action={`/api/admin/quotes/${quote.id}/send`} method="post">
                <input type="hidden" name="recipient" value={inquiry.email} />
                <button className="btn btn-primary" type="submit">Send by Email</button>
              </form>
            </>
          )}
        </div>
      </div>

      <form action={saveAction}>
        <div className="admin-card quote-settings-grid">
          <label>Currency<input name="currency" defaultValue={quote?.currency ?? "EUR"} maxLength={3} disabled={!editable} required /></label>
          <label>Freight<input name="freight" type="number" step="0.01" min="0" defaultValue={quote?.freight.toString() ?? "0"} disabled={!editable} /></label>
          <label>Discount<input name="discount" type="number" step="0.01" min="0" defaultValue={quote?.discount.toString() ?? "0"} disabled={!editable} /></label>
          <label>Valid until<input name="validUntil" type="date" defaultValue={dateValue(quote?.validUntil)} disabled={!editable} /></label>
          <label className="full">Payment terms<input name="paymentTerms" defaultValue={quote?.paymentTerms ?? ""} placeholder="30% advance / 70% before shipment" disabled={!editable} /></label>
          <label className="full">Delivery terms<input name="deliveryTerms" defaultValue={quote?.deliveryTerms ?? ""} placeholder="EXW / FOB / CIF / DDP" disabled={!editable} /></label>
          <label className="full">Notes<textarea name="notes" rows={3} defaultValue={quote?.notes ?? ""} disabled={!editable} /></label>
        </div>

        <div className="admin-card quote-items">
          {rows.map((row) => (
            <div className="quote-item-row" key={row.key}>
              <div><strong>{row.sku}</strong><br /><small>ARBO: {row.supplierCode || "—"}</small><br />{row.description}</div>
              <div><small>Diameter</small><br /><span className="mono">{row.diameter == null ? "—" : `${row.diameter}${row.diameterUnit === "INCH" ? "″" : " mm"}`}</span></div>
              <label>Quantity<input name={`quantity-${row.key}`} type="number" step="0.001" min="0.001" defaultValue={row.quantity} disabled={!editable} required /></label>
              <div><small>Unit</small><br />{row.unit}</div>
              <label>Unit price<input name={`unitPrice-${row.key}`} type="number" step="0.0001" min="0" defaultValue={row.unitPrice} disabled={!editable} required /></label>
              <div><small>Line total</small><br /><span className="mono">{quote?.currency ?? "EUR"} {row.lineTotal}</span></div>
              <label className="full">Item notes<input name={`notes-${row.key}`} defaultValue={row.notes} disabled={!editable} /></label>
            </div>
          ))}
        </div>

        {quote && (
          <div className="admin-card quote-totals">
            <p><span>Subtotal</span><strong>{quote.currency} {quote.subtotal.toFixed(2)}</strong></p>
            <p><span>Freight</span><strong>{quote.currency} {quote.freight.toFixed(2)}</strong></p>
            <p><span>Discount</span><strong>− {quote.currency} {quote.discount.toFixed(2)}</strong></p>
            <p className="total"><span>Total</span><strong>{quote.currency} {quote.total.toFixed(2)}</strong></p>
            {quote.sentAt && <p><span>Finalized</span><strong>{quote.sentAt.toLocaleString("en-GB")}</strong></p>}
            {quote.emailedAt && <p><span>Emailed</span><strong>{quote.sentToEmail} · {quote.emailedAt.toLocaleString("en-GB")}</strong></p>}
          </div>
        )}

        {editable && <div className="form-actions"><button className="btn btn-secondary" type="submit">{quote ? "Recalculate & Save Draft" : "Create Draft"}</button></div>}
      </form>
    </>
  );
}
