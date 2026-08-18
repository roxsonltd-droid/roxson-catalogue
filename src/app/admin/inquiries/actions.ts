"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user.name || "Admin";
}

async function serializableTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002");
      if (!retryable || attempt === maxAttempts) throw error;
    }
  }
  throw new Error("Transaction retry limit exceeded");
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function money(formData: FormData, key: string): Prisma.Decimal {
  const value = text(formData, key).replace(",", ".") || "0";
  const result = new Prisma.Decimal(value);
  if (!result.isFinite() || result.isNegative()) throw new Error(`Invalid ${key}`);
  return result;
}

function positiveDecimal(formData: FormData, key: string): Prisma.Decimal {
  const result = money(formData, key);
  if (result.isZero()) throw new Error(`Invalid ${key}`);
  return result;
}

export async function saveQuoteDraft(inquiryId: number, quoteId: number | null, formData: FormData) {
  const actor = await requireAdmin();

  const savedQuoteId = await serializableTransaction(async (tx) => {
    const existingQuote = quoteId == null
      ? null
      : await tx.quote.findFirst({
          where: { id: quoteId, inquiryId, status: "DRAFT" },
          include: { items: true },
        });
    if (quoteId != null && !existingQuote) throw new Error("Draft quote not found");

    const inquiry = await tx.inquiry.findUnique({
      where: { id: inquiryId },
      include: { items: { include: { product: true } }, quotes: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!inquiry) throw new Error("Inquiry not found");

    const sourceItems = existingQuote
      ? existingQuote.items.map((item) => ({
          key: item.id,
          productId: item.productId,
          sku: item.sku,
          supplierCode: item.supplierCode,
          description: item.description,
          diameter: item.diameter,
          diameterUnit: item.diameterUnit,
          unit: item.unit,
        }))
      : inquiry.items.map((item) => ({
          key: item.id,
          productId: item.productId,
          sku: item.product.sku,
          supplierCode: item.product.supplierCode,
          description: item.product.seriesEn,
          diameter: item.diameter,
          diameterUnit: item.diameterUnit,
          unit: item.unit,
        }));

    const items = sourceItems.map((item) => {
      const quantity = positiveDecimal(formData, `quantity-${item.key}`);
      const unitPrice = money(formData, `unitPrice-${item.key}`);
      return {
        productId: item.productId,
        sku: item.sku,
        supplierCode: item.supplierCode,
        description: item.description,
        diameter: item.diameter,
        diameterUnit: item.diameterUnit,
        quantity,
        unit: item.unit,
        unitPrice,
        lineTotal: quantity.mul(unitPrice).toDecimalPlaces(2),
        notes: text(formData, `notes-${item.key}`) || null,
      };
    });

    const subtotal = items.reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0));
    const freight = money(formData, "freight").toDecimalPlaces(2);
    const discount = money(formData, "discount").toDecimalPlaces(2);
    const total = subtotal.add(freight).sub(discount).toDecimalPlaces(2);
    if (total.isNegative()) throw new Error("Discount exceeds quote value");

    const currency = text(formData, "currency").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid currency");
    const validUntilRaw = text(formData, "validUntil");
    const validUntil = validUntilRaw ? new Date(`${validUntilRaw}T00:00:00.000Z`) : null;
    if (validUntil && Number.isNaN(validUntil.getTime())) throw new Error("Invalid validity date");

    const quoteData = {
      currency,
      subtotal,
      freight,
      discount,
      total,
      validUntil,
      paymentTerms: text(formData, "paymentTerms") || null,
      deliveryTerms: text(formData, "deliveryTerms") || null,
      notes: text(formData, "notes") || null,
    };

    if (existingQuote) {
      await tx.quoteItem.deleteMany({ where: { quoteId: existingQuote.id } });
      await tx.quote.update({
        where: { id: existingQuote.id },
        data: { ...quoteData, items: { create: items } },
      });
      const now = new Date();
      await tx.inquiry.update({ where: { id: inquiryId }, data: { lastActivityAt: now } });
      await tx.inquiryActivity.create({
        data: { inquiryId, type: "QUOTE_UPDATED", description: `Quote V${existingQuote.version} draft updated`, actor },
      });
      return existingQuote.id;
    }

    const version = (inquiry.quotes[0]?.version ?? 0) + 1;
    const quote = await tx.quote.create({
      data: { inquiryId, version, ...quoteData, items: { create: items } },
    });
    const now = new Date();
    await tx.inquiry.update({ where: { id: inquiryId }, data: { status: "REVIEWING", lastActivityAt: now } });
    await tx.inquiryActivity.create({
      data: { inquiryId, type: "QUOTE_CREATED", description: `Quote V${version} draft created`, actor },
    });
    return quote.id;
  });

  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}/quote?quote=${savedQuoteId}`);
}

export async function markQuoteSent(inquiryId: number, quoteId: number) {
  const actor = await requireAdmin();
  await serializableTransaction(async (tx) => {
    const quote = await tx.quote.findFirst({ where: { id: quoteId, inquiryId, status: "DRAFT" } });
    if (!quote) throw new Error("Draft quote not found");
    await tx.quote.updateMany({
      where: { inquiryId, status: "SENT", id: { not: quoteId } },
      data: { status: "SUPERSEDED" },
    });
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: "SENT", sentAt: new Date() },
    });
    const now = new Date();
    await tx.inquiry.update({ where: { id: inquiryId }, data: { status: "QUOTED", lastActivityAt: now } });
    await tx.inquiryActivity.create({
      data: { inquiryId, type: "QUOTE_FINALIZED", description: `Quote V${quote.version} finalized`, actor },
    });
  });
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}`);
}

const inquiryStatuses = ["NEW", "REVIEWING", "QUOTED", "NEGOTIATING", "WON", "LOST"] as const;

export async function updateInquiryStatus(inquiryId: number, formData: FormData) {
  const actor = await requireAdmin();
  const status = text(formData, "status");
  if (!inquiryStatuses.includes(status as (typeof inquiryStatuses)[number])) throw new Error("Invalid status");

  await serializableTransaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: inquiryId }, select: { status: true } });
    if (!inquiry) throw new Error("Inquiry not found");
    if (inquiry.status === status) return;
    const now = new Date();
    await tx.inquiry.update({ where: { id: inquiryId }, data: { status: status as typeof inquiry.status, lastActivityAt: now } });
    await tx.inquiryActivity.create({
      data: { inquiryId, type: "STATUS_CHANGED", description: `Status changed from ${inquiry.status} to ${status}`, actor },
    });
  });
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}`);
}

export async function updateNextAction(inquiryId: number, formData: FormData) {
  const actor = await requireAdmin();
  const nextAction = text(formData, "nextAction") || null;
  const dateRaw = text(formData, "nextActionAt");
  const nextActionAt = dateRaw ? new Date(`${dateRaw}T00:00:00.000Z`) : null;
  if (nextActionAt && Number.isNaN(nextActionAt.getTime())) throw new Error("Invalid next action date");
  const now = new Date();

  await prisma.$transaction([
    prisma.inquiry.update({ where: { id: inquiryId }, data: { nextAction, nextActionAt, lastActivityAt: now } }),
    prisma.inquiryActivity.create({
      data: {
        inquiryId,
        type: "NEXT_ACTION_UPDATED",
        description: nextAction ? `Next action set: ${nextAction}${nextActionAt ? ` (${dateRaw})` : ""}` : "Next action cleared",
        actor,
      },
    }),
  ]);
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}`);
}

export async function addInquiryNote(inquiryId: number, formData: FormData) {
  const actor = await requireAdmin();
  const body = text(formData, "body");
  if (!body || body.length > 5000) throw new Error("Invalid note");
  const now = new Date();

  await prisma.$transaction([
    prisma.inquiryNote.create({ data: { inquiryId, body, author: actor } }),
    prisma.inquiryActivity.create({
      data: { inquiryId, type: "NOTE_ADDED", description: "Sales note added", actor },
    }),
    prisma.inquiry.update({ where: { id: inquiryId }, data: { lastActivityAt: now } }),
  ]);
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}`);
}
