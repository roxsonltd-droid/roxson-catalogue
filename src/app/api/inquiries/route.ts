import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const inquirySchema = z.object({
  company: optionalText(200),
  contactName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: optionalText(80),
  country: optionalText(120),
  message: optionalText(4000),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    diameter: z.number().positive().nullable(),
    quantity: z.number().positive(),
  })).min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid inquiry data." }, { status: 400 });
    }
    const input = parsed.data;
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });
    const productMap = new Map(products.map((product) => [product.id, product]));

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
    }

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      const hasRange = product.diameterMin != null && product.diameterMax != null;
      if (hasRange && (item.diameter == null || item.diameter < product.diameterMin! || item.diameter > product.diameterMax!)) {
        return NextResponse.json({ error: `Invalid diameter for ${product.sku}.` }, { status: 400 });
      }
      if (product.moq != null && item.quantity < product.moq) {
        return NextResponse.json({ error: `Quantity below MOQ for ${product.sku}.` }, { status: 400 });
      }
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        company: input.company || null,
        contactName: input.contactName,
        email: input.email.toLowerCase(),
        phone: input.phone || null,
        country: input.country || null,
        message: input.message || null,
        items: {
          create: input.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: product.id,
              diameter: item.diameter,
              diameterUnit: product.diameterUnit,
              quantity: item.quantity,
              unit: product.unit,
            };
          }),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({
      ok: true,
      id: inquiry.id,
      reference: `RFQ-${String(inquiry.id).padStart(6, "0")}`,
    });
  } catch (error) {
    console.error("Inquiry creation failed:", error);
    return NextResponse.json({ error: "Unable to create inquiry." }, { status: 500 });
  }
}
