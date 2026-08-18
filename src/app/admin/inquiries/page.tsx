import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, quotes: { orderBy: { version: "desc" }, take: 1 } },
  });

  return (
    <>
      <h1>Inquiries</h1>
      <p className="admin-sub">{inquiries.length} B2B requests.</p>
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead><tr><th>Reference</th><th>Company</th><th>Items</th><th>Quantity</th><th>Status</th><th>Latest quote</th><th>Date</th></tr></thead>
          <tbody>
            {inquiries.map((inquiry) => {
              const units = new Set(inquiry.items.map((item) => item.unit));
              const quantity = inquiry.items.reduce((sum, item) => sum + item.quantity, 0);
              const latest = inquiry.quotes[0];
              return (
                <tr key={inquiry.id}>
                  <td><Link className="mono" href={`/admin/inquiries/${inquiry.id}`}>RFQ-{String(inquiry.id).padStart(6, "0")}</Link></td>
                  <td>{inquiry.company || inquiry.contactName}<br /><small>{inquiry.country || "—"}</small></td>
                  <td>{inquiry.items.length}</td>
                  <td className="mono">{quantity} {units.size === 1 ? [...units][0] : "mixed"}</td>
                  <td>{inquiry.status}</td>
                  <td>{latest ? `V${latest.version} · ${latest.status}` : "—"}</td>
                  <td>{inquiry.createdAt.toLocaleDateString("en-GB")}</td>
                </tr>
              );
            })}
            {inquiries.length === 0 && <tr><td colSpan={7}>No inquiries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
