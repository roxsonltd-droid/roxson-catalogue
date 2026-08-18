import Link from "next/link";
import { Prisma, type InquiryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const statuses: InquiryStatus[] = ["NEW", "REVIEWING", "QUOTED", "NEGOTIATING", "WON", "LOST"];
const closedStatuses: InquiryStatus[] = ["WON", "LOST"];

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export default async function InquiriesPage({ searchParams }: {
  searchParams: Promise<{ status?: string; customer?: string; country?: string; followUp?: string }>;
}) {
  const filters = await searchParams;
  const status = statuses.includes(filters.status as InquiryStatus) ? filters.status as InquiryStatus : null;
  const customer = filters.customer?.trim() || "";
  const country = filters.country?.trim() || "";
  const followUp = filters.followUp === "overdue" ? "overdue" : filters.followUp === "scheduled" ? "scheduled" : "";
  const today = startOfToday();
  const conditions: Prisma.InquiryWhereInput[] = [
    ...(status ? [{ status }] : []),
    ...(country ? [{ country: { equals: country, mode: "insensitive" as const } }] : []),
    ...(customer ? [{ OR: [
      { company: { contains: customer, mode: "insensitive" as const } },
      { contactName: { contains: customer, mode: "insensitive" as const } },
      { email: { contains: customer, mode: "insensitive" as const } },
    ] }] : []),
    ...(followUp === "overdue" ? [{ nextActionAt: { lt: today }, status: { notIn: closedStatuses } }] : []),
    ...(followUp === "scheduled" ? [{ nextActionAt: { not: null }, status: { notIn: closedStatuses } }] : []),
  ];
  const where: Prisma.InquiryWhereInput = { AND: conditions };

  const [inquiries, grouped, countries] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { lastActivityAt: "desc" },
      include: {
        items: { select: { id: true } },
        quotes: {
          where: { status: { in: ["DRAFT", "SENT", "ACCEPTED"] } },
          orderBy: { version: "desc" },
          take: 1,
          select: { id: true, version: true, status: true, currency: true, total: true },
        },
      },
    }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.inquiry.findMany({ where: { country: { not: null } }, distinct: ["country"], select: { country: true }, orderBy: { country: "asc" } }),
  ]);
  const counts = new Map(grouped.map((row) => [row.status, row._count._all]));

  return (
    <>
      <div className="pipeline-head">
        <div><h1>Sales Pipeline</h1><p className="admin-sub">RFQ activity, active quotations and next customer actions.</p></div>
        <Link className="btn btn-secondary" href="/admin/inquiries">Clear filters</Link>
      </div>
      <div className="pipeline-cards">
        {statuses.map((item) => <Link className={`pipeline-card pipeline-${item.toLowerCase()}`} href={`/admin/inquiries?status=${item}`} key={item}><span>{item}</span><strong>{counts.get(item) ?? 0}</strong></Link>)}
      </div>
      <form className="pipeline-filters" method="get">
        <label>Customer<input name="customer" defaultValue={customer} placeholder="Company, contact or email" /></label>
        <label>Status<select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Country<select name="country" defaultValue={country}><option value="">All countries</option>{countries.map(({ country: value }) => value && <option key={value}>{value}</option>)}</select></label>
        <label>Follow-up<select name="followUp" defaultValue={followUp}><option value="">All</option><option value="overdue">Overdue</option><option value="scheduled">Scheduled</option></select></label>
        <button className="btn btn-primary" type="submit">Filter</button>
      </form>
      <div className="pipeline-table-wrap">
        <table className="admin-table pipeline-table">
          <thead><tr><th>Deal</th><th>Status</th><th>Active quote</th><th>Value</th><th>Next action</th><th>Last activity</th></tr></thead>
          <tbody>
            {inquiries.map((inquiry) => {
              const quote = inquiry.quotes[0];
              const overdue = inquiry.nextActionAt && inquiry.nextActionAt < today && !["WON", "LOST"].includes(inquiry.status);
              return <tr key={inquiry.id}>
                <td><Link className="pipeline-deal-link" href={`/admin/inquiries/${inquiry.id}`}>{inquiry.company || inquiry.contactName}</Link><small className="pipeline-meta">RFQ-{String(inquiry.id).padStart(6, "0")} · {inquiry.country || "No country"} · {inquiry.items.length} items</small></td>
                <td><span className={`status-pill status-${inquiry.status.toLowerCase()}`}>{inquiry.status}</span></td>
                <td>{quote ? <Link href={`/admin/inquiries/${inquiry.id}/quote?quote=${quote.id}`}>V{quote.version} · {quote.status}</Link> : "—"}</td>
                <td className="mono">{quote ? `${quote.currency} ${quote.total.toFixed(2)}` : "—"}</td>
                <td className={overdue ? "pipeline-overdue" : ""}>{inquiry.nextAction || "—"}{inquiry.nextActionAt && <small className="pipeline-meta">{inquiry.nextActionAt.toLocaleDateString("en-GB")}{overdue ? " · overdue" : ""}</small>}</td>
                <td>{inquiry.lastActivityAt.toLocaleDateString("en-GB")}<small className="pipeline-meta">{inquiry.lastActivityAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</small></td>
              </tr>;
            })}
            {inquiries.length === 0 && <tr><td colSpan={6}>No deals match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
