import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { companyProfile } from "@/lib/company-profile";

export type QuotePdfData = {
  quoteNumber: string;
  currency: string;
  company: string | null;
  contactName: string;
  email: string;
  country: string | null;
  createdAt: Date;
  sentAt: Date | null;
  validUntil: Date | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  notes: string | null;
  subtotal: string;
  freight: string;
  discount: string;
  total: string;
  items: Array<{
    sku: string;
    supplierCode: string | null;
    description: string;
    diameter: number | null;
    diameterUnit: "MM" | "INCH" | null;
    quantity: string;
    unit: string;
    unitPrice: string;
    lineTotal: string;
    notes: string | null;
  }>;
};

const WIDTH = 595.28;
const HEIGHT = 841.89;
const MARGIN = 42;
const NAVY = rgb(0.055, 0.122, 0.22);
const BLUE = rgb(0.055, 0.42, 0.68);
const LIGHT = rgb(0.94, 0.96, 0.98);
const GRAY = rgb(0.35, 0.39, 0.44);

function clean(value: string | null | undefined) {
  return (value ?? "").replace(/[\u2010-\u2015]/g, "-").replace(/[^\x20-\x7E]/g, "?");
}

function date(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "-";
}

function fit(value: string, font: PDFFont, size: number, width: number) {
  const safe = clean(value);
  if (font.widthOfTextAtSize(safe, size) <= width) return safe;
  let text = safe;
  while (text.length > 1 && font.widthOfTextAtSize(`${text}...`, size) > width) text = text.slice(0, -1);
  return `${text}...`;
}

function footer(page: PDFPage, font: PDFFont, pageNumber: number) {
  page.drawLine({ start: { x: MARGIN, y: 30 }, end: { x: WIDTH - MARGIN, y: 30 }, thickness: 0.5, color: LIGHT });
  page.drawText(`${companyProfile.legalName} | ${companyProfile.website} | ${companyProfile.email}`, { x: MARGIN, y: 17, size: 7.5, font, color: GRAY });
  page.drawText(`Page ${pageNumber}`, { x: WIDTH - MARGIN - 34, y: 17, size: 7.5, font, color: GRAY });
}

export async function generateQuotePdf(data: QuotePdfData): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await readFile(join(process.cwd(), "public", "roxson-logo.jpg"))
    .then((bytes) => pdf.embedJpg(bytes))
    .catch(() => null);
  const fixedDate = data.sentAt ?? data.createdAt;
  pdf.setTitle(data.quoteNumber);
  pdf.setAuthor("ROXSON LTD");
  pdf.setSubject("B2B quotation");
  pdf.setCreator("ROXSON LTD Quote System");
  pdf.setProducer("ROXSON LTD Quote System");
  pdf.setCreationDate(data.createdAt);
  pdf.setModificationDate(fixedDate);

  let pageNumber = 0;
  let page: PDFPage;
  let y: number;
  const newPage = () => {
    page = pdf.addPage([WIDTH, HEIGHT]);
    pageNumber += 1;
    footer(page, regular, pageNumber);
    y = HEIGHT - MARGIN;
    return page;
  };
  newPage();

  page!.drawRectangle({ x: 0, y: HEIGHT - 118, width: WIDTH, height: 118, color: NAVY });
  if (logo) {
    const width = 215;
    const height = width * (logo.height / logo.width);
    page!.drawImage(logo, { x: MARGIN, y: HEIGHT - 24 - height, width, height });
  } else {
    page!.drawText("ROXSON LTD", { x: MARGIN, y: HEIGHT - 66, size: 24, font: bold, color: rgb(1, 1, 1) });
  }
  page!.drawText("QUOTATION", { x: WIDTH - MARGIN - 105, y: HEIGHT - 59, size: 15, font: bold, color: rgb(1, 1, 1) });
  page!.drawText(data.quoteNumber, { x: WIDTH - MARGIN - 105, y: HEIGHT - 80, size: 9, font: regular, color: rgb(0.75, 0.84, 0.92) });
  y = HEIGHT - 148;

  const info = [
    ["Customer", data.company || data.contactName],
    ["Contact", data.contactName],
    ["Email", data.email],
    ["Country", data.country || "-"],
  ];
  const dates = [
    ["Quote date", date(data.sentAt ?? data.createdAt)],
    ["Valid until", date(data.validUntil)],
  ];
  page!.drawText("CUSTOMER", { x: MARGIN, y, size: 8, font: bold, color: BLUE });
  page!.drawText("DETAILS", { x: 350, y, size: 8, font: bold, color: BLUE });
  y -= 18;
  info.forEach(([label, value], index) => {
    page!.drawText(`${label}:`, { x: MARGIN, y: y - index * 15, size: 8, font: bold, color: GRAY });
    page!.drawText(fit(value, regular, 8, 205), { x: 98, y: y - index * 15, size: 8, font: regular, color: NAVY });
  });
  dates.forEach(([label, value], index) => {
    page!.drawText(`${label}:`, { x: 350, y: y - index * 15, size: 8, font: bold, color: GRAY });
    page!.drawText(value, { x: 423, y: y - index * 15, size: 8, font: regular, color: NAVY });
  });
  y -= 82;

  const drawTableHeader = () => {
    page!.drawRectangle({ x: MARGIN, y: y - 18, width: WIDTH - MARGIN * 2, height: 22, color: NAVY });
    const labels: Array<[string, number]> = [["SKU / ARBO", 46], ["Description", 135], ["Diameter", 315], ["Qty", 370], ["Unit price", 425], ["Total", 492]];
    labels.forEach(([label, x]) => page!.drawText(label, { x, y: y - 11, size: 7.5, font: bold, color: rgb(1, 1, 1) }));
    y -= 24;
  };
  drawTableHeader();

  for (let index = 0; index < data.items.length; index += 1) {
    if (y < 92) {
      newPage();
      page!.drawText(data.quoteNumber, { x: MARGIN, y, size: 9, font: bold, color: NAVY });
      y -= 24;
      drawTableHeader();
    }
    const item = data.items[index];
    if (index % 2 === 0) page!.drawRectangle({ x: MARGIN, y: y - 28, width: WIDTH - MARGIN * 2, height: 31, color: LIGHT });
    const diameter = item.diameter == null ? "-" : `${item.diameter} ${item.diameterUnit === "INCH" ? "in" : "mm"}`;
    page!.drawText(fit(item.sku, bold, 7.5, 82), { x: 46, y: y - 9, size: 7.5, font: bold, color: NAVY });
    page!.drawText(fit(item.supplierCode || "-", regular, 6.5, 82), { x: 46, y: y - 20, size: 6.5, font: regular, color: GRAY });
    page!.drawText(fit(item.description, regular, 7.5, 170), { x: 135, y: y - 14, size: 7.5, font: regular, color: NAVY });
    page!.drawText(diameter, { x: 315, y: y - 14, size: 7.5, font: regular, color: NAVY });
    page!.drawText(`${item.quantity} ${clean(item.unit)}`, { x: 370, y: y - 14, size: 7.5, font: regular, color: NAVY });
    page!.drawText(`${data.currency} ${item.unitPrice}`, { x: 425, y: y - 14, size: 7.5, font: regular, color: NAVY });
    page!.drawText(`${data.currency} ${item.lineTotal}`, { x: 492, y: y - 14, size: 7.5, font: bold, color: NAVY });
    y -= 31;
  }

  if (y < 210) newPage();
  y -= 16;
  const totals: Array<[string, string, boolean]> = [
    ["Subtotal", data.subtotal, false],
    ["Freight", data.freight, false],
    ["Discount", `-${data.discount}`, false],
    ["GRAND TOTAL", data.total, true],
  ];
  totals.forEach(([label, value, strong]) => {
    if (strong) page!.drawRectangle({ x: 350, y: y - 7, width: WIDTH - MARGIN - 350, height: 24, color: NAVY });
    page!.drawText(label, { x: 360, y, size: strong ? 9 : 8, font: bold, color: strong ? rgb(1, 1, 1) : GRAY });
    page!.drawText(`${data.currency} ${value}`, { x: 476, y, size: strong ? 9 : 8, font: bold, color: strong ? rgb(1, 1, 1) : NAVY });
    y -= strong ? 35 : 18;
  });

  const terms = [
    ["Payment terms", data.paymentTerms],
    ["Delivery terms", data.deliveryTerms],
    ["Notes", data.notes],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  for (const [label, value] of terms) {
    page!.drawText(label.toUpperCase(), { x: MARGIN, y, size: 7.5, font: bold, color: BLUE });
    y -= 13;
    page!.drawText(fit(value, regular, 8, WIDTH - MARGIN * 2), { x: MARGIN, y, size: 8, font: regular, color: NAVY });
    y -= 22;
  }

  if (y < 100) newPage();
  page!.drawText("SUPPLIER AND PAYMENT DETAILS", { x: MARGIN, y, size: 7.5, font: bold, color: BLUE });
  y -= 15;
  page!.drawText(companyProfile.legalName, { x: MARGIN, y, size: 8, font: bold, color: NAVY });
  page!.drawText(companyProfile.address, { x: 145, y, size: 8, font: regular, color: NAVY });
  y -= 14;
  page!.drawText("Company No.", { x: MARGIN, y, size: 8, font: bold, color: GRAY });
  page!.drawText(companyProfile.companyNumber, { x: 145, y, size: 8, font: regular, color: NAVY });
  y -= 14;
  page!.drawText("VAT No.", { x: MARGIN, y, size: 8, font: bold, color: GRAY });
  page!.drawText(companyProfile.vatNumber, { x: 145, y, size: 8, font: regular, color: NAVY });
  y -= 14;
  page!.drawText("Contact", { x: MARGIN, y, size: 8, font: bold, color: GRAY });
  page!.drawText(companyProfile.contactName, { x: 145, y, size: 8, font: regular, color: NAVY });
  y -= 14;
  page!.drawText("Account holder", { x: MARGIN, y, size: 8, font: bold, color: GRAY });
  page!.drawText(companyProfile.accountHolder, { x: 145, y, size: 8, font: regular, color: NAVY });
  y -= 14;
  page!.drawText("Bank", { x: MARGIN, y, size: 8, font: bold, color: GRAY });
  page!.drawText(companyProfile.bankName, { x: 145, y, size: 8, font: regular, color: NAVY });
  y -= 14;
  page!.drawText("BIC / SWIFT", { x: MARGIN, y, size: 8, font: bold, color: GRAY });
  page!.drawText(companyProfile.bic, { x: 145, y, size: 8, font: regular, color: NAVY });
  y -= 14;
  page!.drawText("IBAN", { x: MARGIN, y, size: 8, font: bold, color: GRAY });
  page!.drawText(companyProfile.iban, { x: 145, y, size: 8, font: regular, color: NAVY });

  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}
