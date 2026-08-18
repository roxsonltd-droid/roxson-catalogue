import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { addInquiryNote, updateInquiryStatus, updateNextAction } from "../actions";

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
      notes: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!inquiry) notFound();
  const statusAction = updateInquiryStatus.bind(null, id);
  const nextActionAction = updateNextAction.bind(null, id);
  const noteAction = addInquiryNote.bind(null, id);

  return (
    <>
      <div className="admin-detail-head">
        <div><Link href="/admin/inquiries">← Sales Pipeline</Link><p className="mono">RFQ-{String(id).padStart(6, "0")}</p><h1>{inquiry.company || inquiry.contactName}</h1><p className="admin-sub">Last activity {inquiry.lastActivityAt.toLocaleString("en-GB")}</p></div>
        <Link className="btn btn-secondary" href={`/admin/inquiries/${id}/quote`}>Create Quote</Link>
      </div>

      <div className="deal-controls-grid">
        <form className="admin-card deal-control" action={statusAction}>
          <h2>Pipeline stage</h2>
          <label>Status<select name="status" defaultValue={inquiry.status}>{["NEW", "REVIEWING", "QUOTED", "NEGOTIATING", "WON", "LOST"].map((status) => <option key={status}>{status}</option>)}</select></label>
          <button className="btn btn-primary" type="submit">Update status</button>
        </form>
        <form className="admin-card deal-control" action={nextActionAction}>
          <h2>Next action</h2>
          <label>Action<input name="nextAction" defaultValue={inquiry.nextAction ?? ""} placeholder="Call customer, confirm freight..." maxLength={500} /></label>
          <label>Follow-up date<input name="nextActionAt" type="date" defaultValue={inquiry.nextActionAt?.toISOString().slice(0, 10) ?? ""} /></label>
          <button className="btn btn-primary" type="submit">Save next action</button>
        </form>
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

      <div className="deal-history-grid">
        <section>
          <h2>Sales notes</h2>
          <form className="admin-card deal-note-form" action={noteAction}>
            <textarea name="body" rows={4} maxLength={5000} placeholder="Add a factual sales note..." required />
            <button className="btn btn-primary" type="submit">Add note</button>
          </form>
          <div className="deal-notes">
            {inquiry.notes.map((note) => <article className="admin-card" key={note.id}><p>{note.body}</p><small>{note.author || "Admin"} · {note.createdAt.toLocaleString("en-GB")}</small></article>)}
            {inquiry.notes.length === 0 && <p className="admin-sub">No sales notes yet.</p>}
          </div>
        </section>
        <section>
          <h2>Activity</h2>
          <div className="admin-card activity-timeline">
            {inquiry.activities.map((activity) => <div className="activity-entry" key={activity.id}><span className="activity-dot" /><div><strong>{activity.description}</strong><small>{activity.actor || "System"} · {activity.createdAt.toLocaleString("en-GB")}</small></div></div>)}
            {inquiry.activities.length === 0 && <p>No recorded activity yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
