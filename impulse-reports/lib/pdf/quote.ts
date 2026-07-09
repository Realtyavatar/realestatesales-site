import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, type RGB } from "pdf-lib";
import { formatDate, formatMoney } from "@/lib/format";
import type { Job, Quote, QuoteItem, Settings } from "@/lib/types";

const NAVY   = rgb(11 / 255, 37 / 255, 69 / 255);
const ORANGE = rgb(232 / 255, 114 / 255, 12 / 255);
const GRAY   = rgb(0.45, 0.5, 0.56);
const LIGHT  = rgb(0.95, 0.96, 0.97);
const WHITE  = rgb(1, 1, 1);

const PAGE_W  = 595.28;
const PAGE_H  = 841.89;
const MARGIN  = 50;
const CW      = PAGE_W - MARGIN * 2; // content width
const FOOTER_H = 36;

function sanitize(text: string): string {
  return (text ?? "")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "")
    .replace(/\r/g, "");
}

class QuoteBuilder {
  doc!: PDFDocument;
  reg!: PDFFont;
  bold!: PDFFont;
  page!: PDFPage;
  y = 0;

  async init() {
    this.doc  = await PDFDocument.create();
    this.reg  = await this.doc.embedFont(StandardFonts.Helvetica);
    this.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y    = PAGE_H - MARGIN;
  }

  ensure(space: number) {
    if (this.y - space < MARGIN + FOOTER_H) this.newPage();
  }

  wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
    const lines: string[] = [];
    for (const para of sanitize(text).split("\n")) {
      if (!para.trim()) { lines.push(""); continue; }
      let line = "";
      for (const word of para.split(/\s+/)) {
        const cand = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(cand, size) <= maxW || !line) { line = cand; }
        else { lines.push(line); line = word; }
      }
      lines.push(line);
    }
    return lines;
  }

  drawText(text: string, x: number, y: number, size: number, font: PDFFont, color: RGB = NAVY) {
    if (text) this.page.drawText(sanitize(text), { x, y, size, font, color });
  }

  textBlock(text: string, x: number, maxW: number, size: number, font: PDFFont, color: RGB = NAVY): number {
    const lh = size * 1.35;
    let usedH = 0;
    for (const line of this.wrap(text, font, size, maxW)) {
      this.y -= lh; usedH += lh;
      if (line) this.page.drawText(line, { x, y: this.y, size, font, color });
    }
    return usedH;
  }

  // Draw a filled rect
  rect(x: number, y: number, w: number, h: number, color: RGB) {
    this.page.drawRectangle({ x, y, width: w, height: h, color });
  }

  // Horizontal rule
  rule(x: number, y: number, w: number, color: RGB = GRAY) {
    this.page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: 0.5, color });
  }
}

export async function buildQuotePdf(
  quote: Quote,
  job: Job,
  settings: Settings
): Promise<Uint8Array> {
  const items: QuoteItem[] = Array.isArray(quote.items) ? quote.items : [];
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const gst      = subtotal * 0.1;
  const total    = subtotal + gst;

  const b = new QuoteBuilder();
  await b.init();

  /* ── MASTHEAD ─────────────────────────────────────────────── */
  const mastheadH = 80;
  b.rect(0, PAGE_H - mastheadH, PAGE_W, mastheadH, NAVY);
  b.rect(0, PAGE_H - mastheadH - 5, PAGE_W, 5, ORANGE);

  b.drawText(settings.business_name, MARGIN, PAGE_H - 32, 18, b.bold, WHITE);
  const bizLine = [settings.rec_number, settings.phone, settings.email].filter(Boolean).join("  ·  ");
  b.drawText(bizLine, MARGIN, PAGE_H - 50, 9, b.reg, WHITE);
  if (settings.address) b.drawText(settings.address, MARGIN, PAGE_H - 63, 9, b.reg, WHITE);

  // "QUOTATION" label + quote number — right side of masthead
  const qLabel = "QUOTATION";
  const qlW = b.bold.widthOfTextAtSize(qLabel, 14);
  b.drawText(qLabel, PAGE_W - MARGIN - qlW, PAGE_H - 32, 14, b.bold, ORANGE);
  const qNumW = b.reg.widthOfTextAtSize(quote.quote_number, 10);
  b.drawText(quote.quote_number, PAGE_W - MARGIN - qNumW, PAGE_H - 48, 10, b.reg, WHITE);

  /* ── META BLOCK (two columns) ─────────────────────────────── */
  b.y = PAGE_H - mastheadH - 25;

  // Left: prepared for
  const leftX = MARGIN;
  const rightX = PAGE_W / 2 + 10;

  b.drawText("PREPARED FOR", leftX, b.y, 8, b.bold, GRAY);
  b.y -= 14;
  if (job.client_name)   { b.drawText(job.client_name, leftX, b.y, 10, b.bold); b.y -= 13; }
  if (job.site_address)  { b.drawText(job.site_address, leftX, b.y, 9, b.reg, GRAY); b.y -= 12; }
  if (job.client_phone)  { b.drawText(job.client_phone, leftX, b.y, 9, b.reg, GRAY); b.y -= 12; }
  if (job.client_email)  { b.drawText(job.client_email, leftX, b.y, 9, b.reg, GRAY); b.y -= 12; }

  // Right: quote meta
  let ry = PAGE_H - mastheadH - 39;
  const metaLabelW = 70;
  const metaRows: [string, string][] = [
    ["Quote date",  formatDate(quote.quote_date)],
    ["Valid until", quote.expiry_date ? formatDate(quote.expiry_date) : "—"],
    ["Quote no.",   quote.quote_number],
    ["Status",      quote.status.charAt(0).toUpperCase() + quote.status.slice(1)],
  ];
  for (const [label, val] of metaRows) {
    b.drawText(label + ":", rightX, ry, 9, b.bold, GRAY);
    b.drawText(val, rightX + metaLabelW, ry, 9, b.reg);
    ry -= 13;
  }

  b.y = Math.min(b.y, ry) - 16;
  b.rule(MARGIN, b.y, CW);
  b.y -= 16;

  /* ── LINE ITEMS TABLE ─────────────────────────────────────── */
  // Column layout: # | Description | Type | Qty | Unit | Total
  const cols = {
    num:  { x: MARGIN,          w: 20  },
    desc: { x: MARGIN + 20,     w: 200 },
    type: { x: MARGIN + 220,    w: 55  },
    qty:  { x: MARGIN + 275,    w: 35  },
    unit: { x: MARGIN + 310,    w: 70  },
    tot:  { x: MARGIN + 380,    w: 65  },
  };
  const colDefs = [cols.num, cols.desc, cols.type, cols.qty, cols.unit, cols.tot];
  const tableRowH = 20;

  // Header row
  b.ensure(tableRowH + 4);
  b.rect(MARGIN, b.y - tableRowH, CW, tableRowH, NAVY);
  const headers = ["#", "Description", "Type", "Qty", "Unit (ex GST)", "Total (ex GST)"];
  headers.forEach((h, i) => {
    const col = colDefs[i];
    b.drawText(h, col.x + 4, b.y - 14, 8, b.bold, WHITE);
  });
  b.y -= tableRowH;

  // Item rows
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const rowTotal = item.qty * item.unit_price;
    // Wrap description
    const descLines = b.wrap(item.description || "—", b.reg, 9, cols.desc.w - 8);
    const rowH = Math.max(tableRowH, descLines.length * 12 + 8);

    b.ensure(rowH);
    if (idx % 2 === 1) b.rect(MARGIN, b.y - rowH, CW, rowH, LIGHT);

    const ty = b.y - 13;
    b.drawText(String(idx + 1), cols.num.x + 4, ty, 9, b.reg);

    // Multi-line description
    let dy = ty;
    for (const line of descLines) {
      if (line) b.page.drawText(line, { x: cols.desc.x + 4, y: dy, size: 9, font: b.reg, color: NAVY });
      dy -= 12;
    }

    const typeColor = item.is_labour ? NAVY : ORANGE;
    b.drawText(item.is_labour ? "Labour" : "Material", cols.type.x + 4, ty, 9, b.bold, typeColor);

    const qtyStr = item.qty % 1 === 0 ? String(item.qty) : item.qty.toFixed(2);
    const qtyW = b.reg.widthOfTextAtSize(qtyStr, 9);
    b.drawText(qtyStr, cols.qty.x + cols.qty.w - qtyW - 4, ty, 9, b.reg);

    const unitStr = formatMoney(item.unit_price);
    const unitW = b.reg.widthOfTextAtSize(unitStr, 9);
    b.drawText(unitStr, cols.unit.x + cols.unit.w - unitW - 4, ty, 9, b.reg);

    const totStr = formatMoney(rowTotal);
    const totW = b.bold.widthOfTextAtSize(totStr, 9);
    b.drawText(totStr, cols.tot.x + cols.tot.w - totW - 4, ty, 9, b.bold);

    b.y -= rowH;
  }

  b.rule(MARGIN, b.y, CW);
  b.y -= 10;

  /* ── TOTALS ───────────────────────────────────────────────── */
  const totX = PAGE_W - MARGIN - 160;
  const totLabelW = 100;
  const totValX = totX + totLabelW;

  for (const [label, val] of [["Subtotal (ex GST)", formatMoney(subtotal)], ["GST (10%)", formatMoney(gst)]] as [string, string][]) {
    b.ensure(16);
    b.y -= 14;
    b.drawText(label, totX, b.y, 9, b.reg, GRAY);
    const vw = b.reg.widthOfTextAtSize(val, 9);
    b.drawText(val, PAGE_W - MARGIN - vw, b.y, 9, b.reg, GRAY);
  }

  // Total row
  b.ensure(26);
  b.y -= 4;
  b.rect(totX - 4, b.y - 20, PAGE_W - MARGIN - totX + 4, 22, NAVY);
  b.y -= 14;
  b.drawText("TOTAL (inc GST)", totX, b.y, 10, b.bold, WHITE);
  const tvw = b.bold.widthOfTextAtSize(formatMoney(total), 11);
  b.drawText(formatMoney(total), PAGE_W - MARGIN - tvw, b.y, 11, b.bold, ORANGE);
  b.y -= 20;

  /* ── NOTES ────────────────────────────────────────────────── */
  if (quote.notes?.trim()) {
    b.ensure(40);
    b.y -= 16;
    b.drawText("Notes", MARGIN, b.y, 10, b.bold);
    b.y -= 6;
    b.textBlock(quote.notes, MARGIN, CW, 9, b.reg, GRAY);
    b.y -= 8;
  }

  /* ── TERMS ────────────────────────────────────────────────── */
  if (quote.terms?.trim()) {
    b.ensure(40);
    b.y -= 16;
    b.drawText("Terms & Conditions", MARGIN, b.y, 10, b.bold);
    b.y -= 6;
    b.textBlock(quote.terms, MARGIN, CW, 8, b.reg, GRAY);
    b.y -= 12;
  }

  /* ── ACCEPTANCE ───────────────────────────────────────────── */
  b.ensure(60);
  b.y -= 10;
  b.rect(MARGIN, b.y - 50, CW, 52, LIGHT);
  b.y -= 10;
  b.drawText("ACCEPTANCE", MARGIN + 8, b.y, 9, b.bold);
  b.y -= 12;
  b.drawText(
    "By signing below I/we accept the above quote and authorise the works to proceed.",
    MARGIN + 8, b.y, 8, b.reg, GRAY
  );
  b.y -= 20;
  b.rule(MARGIN + 8,        b.y, 120);
  b.rule(PAGE_W - MARGIN - 80, b.y, 72);
  b.y -= 10;
  b.drawText("Client signature", MARGIN + 8,          b.y, 7, b.reg, GRAY);
  b.drawText("Date",              PAGE_W - MARGIN - 80, b.y, 7, b.reg, GRAY);

  /* ── FOOTERS ──────────────────────────────────────────────── */
  const pages = b.doc.getPages();
  pages.forEach((page, i) => {
    page.drawLine({
      start: { x: MARGIN, y: MARGIN + 18 },
      end:   { x: PAGE_W - MARGIN, y: MARGIN + 18 },
      thickness: 0.5, color: GRAY,
    });
    const left = sanitize(`${settings.business_name}  |  REC ${settings.rec_number}${settings.abn ? `  |  ABN ${settings.abn}` : ""}`);
    page.drawText(left, { x: MARGIN, y: MARGIN + 5, size: 7, font: b.reg, color: GRAY });
    const right = sanitize(`${quote.quote_number}  |  Page ${i + 1} of ${pages.length}`);
    const rw = b.reg.widthOfTextAtSize(right, 7);
    page.drawText(right, { x: PAGE_W - MARGIN - rw, y: MARGIN + 5, size: 7, font: b.reg, color: GRAY });
  });

  return b.doc.save();
}

export function quoteFileName(quote: Quote, job: Job): string {
  const slug = sanitize(job.site_address).replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-").slice(0, 40);
  return `Quote-${sanitize(quote.quote_number)}-${slug}.pdf`;
}
