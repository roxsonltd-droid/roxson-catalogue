import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function diameter(value: number | null, unit: "MM" | "INCH") {
  if (value == null) return "—";
  return unit === "INCH" ? `${value}″` : `${value} mm`;
}

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      quotes: { orderBy: { version: "desc" }, include: { _count: { select: { items: true } } } },
    },
  });
  if (!inquiry) notFound();

  return (
    <>
      <div className="admin-detail-head">
        <div><p className="mono">RFQ-{String(id).padStart(6, "0")}</p><h1>{inquiry.company || inquiry.contactName}</h1><p className="admin-sub">{inquiry.status}</p></div>
        <Link className="btn btn-secondary" href={`/admin/inquiries/${id}/quote`}>Create Quote</Link>
      </div>

      <div className="admin-card inquiry-contact-summary">
        <p><strong>Contact:</strong> {inquiry.contactName}</p><p><strong>Email:</strong> {inquiry.email}</p>
        <p><strong>Phone:</strong> {inquiry.phone || "—"}</p><p><strong>Country:</strong> {inquiry.country || "—"}</p>
        {inquiry.message && <p className="full"><strong>Message:</strong> {inquiry.message}</p>}
      </div>

      <h2>Products</h2>
      <div className="admin-card">
        {inquiry.items.map((item) => (
          <div className="inquiry-admin-item" key={item.id}>
            <div><strong>{item.product.sku}</strong><br /><span>ARBO: {item.product.supplierCode || "—"}</span></div>
            <div>{item.product.seriesEn}</div><div className="mono">{diameter(item.diameter, item.diameterUnit)}</div>
            <div className="mono">{item.quantity} {item.unit}</div>
          </div>
        ))}
      </div>

      <h2>Quotes</h2>
      <div className="admin-card">
        {inquiry.quotes.map((quote) => (
          <div className="inquiry-admin-item" key={quote.id}>
            <Link href={`/admin/inquiries/${id}/quote?quote=${quote.id}`}><strong>ROX-Q-{String(id).padStart(6, "0")}-V{quote.version}</strong></Link>
            <div>{quote.status}</div><div>{quote._count.items} items</div>
            <div className="mono">{quote.currency} {quote.total.toFixed(2)}</div>
          </div>
        ))}
        {inquiry.quotes.length === 0 && <p>No quotes created.</p>}
      </div>
    </>
  );
}
