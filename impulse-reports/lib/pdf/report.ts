import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from "pdf-lib";
import { VARIATION_AUTHORISATION_TEXT } from "@/lib/legal";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  jobTypeLabel,
  severityLabel,
  statusLabel,
} from "@/lib/format";
import type { Board, Job, Settings, Variation } from "@/lib/types";

const NAVY = rgb(11 / 255, 37 / 255, 69 / 255);
const ORANGE = rgb(232 / 255, 114 / 255, 12 / 255);
const GRAY = rgb(0.45, 0.5, 0.56);
const LIGHT = rgb(0.95, 0.96, 0.97);
const RED = rgb(0.8, 0.15, 0.15);
const GREEN = rgb(0.05, 0.55, 0.35);

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 40;

export interface ReportImage {
  bytes: Uint8Array;
  caption?: string;
}

export interface ReportBoard extends Board {
  reportPhotos: ReportImage[];
}

export interface ReportVariation extends Variation {
  signatureBytes: Uint8Array | null;
}

export interface ReportData {
  settings: Settings;
  logoBytes: Uint8Array | null;
  job: Job;
  boards: ReportBoard[];
  variations: ReportVariation[];
}

// Helvetica (WinAnsi) can't encode every unicode char — swap the common
// typographic ones and drop the rest rather than crashing report generation.
function sanitize(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "")
    .replace(/\r/g, "");
}

class ReportBuilder {
  doc!: PDFDocument;
  font!: PDFFont;
  bold!: PDFFont;
  page!: PDFPage;
  y = 0;

  async init() {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensure(space: number) {
    if (this.y - space < MARGIN + FOOTER_H) this.newPage();
  }

  wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const paragraph of sanitize(text).split("\n")) {
      if (!paragraph.trim()) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
          line = candidate;
        } else {
          lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  text(
    text: string,
    opts: {
      size?: number;
      font?: PDFFont;
      color?: RGB;
      x?: number;
      maxWidth?: number;
      lineGap?: number;
    } = {}
  ) {
    const size = opts.size ?? 10;
    const font = opts.font ?? this.font;
    const color = opts.color ?? NAVY;
    const x = opts.x ?? MARGIN;
    const maxWidth = opts.maxWidth ?? PAGE_W - x - MARGIN;
    const lineHeight = size * 1.35 + (opts.lineGap ?? 0);
    for (const line of this.wrap(text, font, size, maxWidth)) {
      this.ensure(lineHeight);
      this.y -= lineHeight;
      if (line) this.page.drawText(line, { x, y: this.y, size, font, color });
    }
  }

  space(h: number) {
    this.ensure(h);
    this.y -= h;
  }

  sectionHeading(title: string) {
    this.ensure(60);
    this.space(14);
    const h = 26;
    this.y -= h;
    this.page.drawRectangle({ x: MARGIN, y: this.y, width: CONTENT_W, height: h, color: NAVY });
    this.page.drawRectangle({ x: MARGIN, y: this.y, width: 5, height: h, color: ORANGE });
    this.page.drawText(sanitize(title), {
      x: MARGIN + 14,
      y: this.y + 8,
      size: 12,
      font: this.bold,
      color: rgb(1, 1, 1),
    });
    this.space(10);
  }

  keyValue(key: string, value: string) {
    const size = 10;
    const keyW = 130;
    const lines = this.wrap(value || "-", this.font, size, CONTENT_W - keyW);
    const lineHeight = size * 1.4;
    this.ensure(lineHeight * lines.length + 4);
    this.y -= lineHeight;
    this.page.drawText(sanitize(key), {
      x: MARGIN,
      y: this.y,
      size,
      font: this.bold,
      color: GRAY,
    });
    let first = true;
    for (const line of lines) {
      if (!first) {
        this.ensure(lineHeight);
        this.y -= lineHeight;
      }
      if (line) {
        this.page.drawText(line, {
          x: MARGIN + keyW,
          y: this.y,
          size,
          font: this.font,
          color: NAVY,
        });
      }
      first = false;
    }
    this.space(4);
  }

  chip(label: string, x: number, color: RGB): number {
    const size = 8;
    const padX = 6;
    const w = this.bold.widthOfTextAtSize(label, size) + padX * 2;
    const h = 14;
    this.page.drawRectangle({ x, y: this.y - 3, width: w, height: h, color });
    this.page.drawText(label, {
      x: x + padX,
      y: this.y,
      size,
      font: this.bold,
      color: rgb(1, 1, 1),
    });
    return w;
  }

  async embedImage(bytes: Uint8Array): Promise<PDFImage | null> {
    // Sniff format: JPEG starts FF D8, PNG starts 89 50 4E 47
    try {
      if (bytes[0] === 0xff && bytes[1] === 0xd8) return await this.doc.embedJpg(bytes);
      if (bytes[0] === 0x89 && bytes[1] === 0x50) return await this.doc.embedPng(bytes);
      return null;
    } catch {
      return null;
    }
  }

  drawImageFitted(
    img: PDFImage,
    x: number,
    yTop: number,
    boxW: number,
    boxH: number
  ): { w: number; h: number } {
    const dims = img.scale(1);
    const scale = Math.min(boxW / dims.width, boxH / dims.height, 1);
    const w = dims.width * scale;
    const h = dims.height * scale;
    this.page.drawImage(img, { x, y: yTop - h, width: w, height: h });
    return { w, h };
  }

  footerAll(settings: Settings, job: Job) {
    const pages = this.doc.getPages();
    pages.forEach((page, i) => {
      const text = sanitize(
        `${settings.business_name} - ${settings.rec_number}${settings.phone ? ` - ${settings.phone}` : ""}`
      );
      page.drawLine({
        start: { x: MARGIN, y: MARGIN + 18 },
        end: { x: PAGE_W - MARGIN, y: MARGIN + 18 },
        thickness: 0.5,
        color: rgb(0.85, 0.87, 0.9),
      });
      page.drawText(text, {
        x: MARGIN,
        y: MARGIN + 5,
        size: 8,
        font: this.font,
        color: GRAY,
      });
      const pageLabel = `${sanitize(job.site_address).slice(0, 60)}  |  Page ${i + 1} of ${pages.length}`;
      const w = this.font.widthOfTextAtSize(pageLabel, 8);
      page.drawText(pageLabel, {
        x: PAGE_W - MARGIN - w,
        y: MARGIN + 5,
        size: 8,
        font: this.font,
        color: GRAY,
      });
    });
  }
}

export async function buildReportPdf(data: ReportData): Promise<Uint8Array> {
  const { settings, job, boards, variations } = data;
  const b = new ReportBuilder();
  await b.init();

  // ---------------------------------------------------------------- cover
  b.newPage();
  // Navy masthead
  b.page.drawRectangle({ x: 0, y: PAGE_H - 190, width: PAGE_W, height: 190, color: NAVY });
  b.page.drawRectangle({ x: 0, y: PAGE_H - 196, width: PAGE_W, height: 6, color: ORANGE });

  let mastY = PAGE_H - 60;

  // Logo — top-right of masthead
  const logo = data.logoBytes ? await b.embedImage(data.logoBytes) : null;
  if (logo) {
    const dims = logo.scale(1);
    const maxLogoH = 100;
    const maxLogoW = 180;
    const scale = Math.min(maxLogoW / dims.width, maxLogoH / dims.height, 1);
    const logoW = dims.width * scale;
    const logoH = dims.height * scale;
    b.page.drawImage(logo, {
      x: PAGE_W - MARGIN - logoW,
      y: PAGE_H - 190 / 2 - logoH / 2, // vertically centred in masthead
      width: logoW,
      height: logoH,
    });
  }

  // Business name — always on the left
  b.page.drawText(sanitize(settings.business_name), {
    x: MARGIN,
    y: mastY,
    size: 20,
    font: b.bold,
    color: rgb(1, 1, 1),
  });
  mastY -= 26;
  b.page.drawText(sanitize(`${settings.rec_number}${settings.abn ? `  |  ABN ${settings.abn}` : ""}`), {
    x: MARGIN,
    y: mastY,
    size: 10,
    font: b.font,
    color: rgb(1, 1, 1),
  });
  mastY -= 30;
  b.page.drawText(`ELECTRICAL ${jobTypeLabel(job.job_type).toUpperCase()} REPORT`, {
    x: MARGIN,
    y: mastY,
    size: 17,
    font: b.bold,
    color: ORANGE,
  });

  b.y = PAGE_H - 230;
  b.text("Report details", { size: 13, font: b.bold });
  b.space(6);
  b.keyValue("Site address", job.site_address);
  b.keyValue("Client", job.client_name);
  b.keyValue("Phone", job.client_phone);
  b.keyValue("Email", job.client_email);
  b.keyValue("Job type", jobTypeLabel(job.job_type));
  b.keyValue("Date", formatDate(job.job_date));
  b.keyValue("Status", statusLabel(job.status));
  if (job.notes.trim()) {
    b.space(8);
    b.text("Notes", { size: 13, font: b.bold });
    b.space(4);
    b.text(job.notes, { color: GRAY });
  }

  b.space(12);
  b.text("Prepared by", { size: 13, font: b.bold });
  b.space(4);
  b.keyValue("Business", settings.business_name);
  b.keyValue("Registration", settings.rec_number);
  if (settings.abn) b.keyValue("ABN", settings.abn);
  if (settings.phone) b.keyValue("Phone", settings.phone);
  if (settings.email) b.keyValue("Email", settings.email);
  if (settings.address) b.keyValue("Address", settings.address);

  // ---------------------------------------------------------------- boards
  for (const board of boards) {
    b.sectionHeading(`Board: ${board.name || "Unnamed board"}`);
    b.keyValue("Location", board.location);
    b.keyValue("Rating", board.rating_amps ? `${board.rating_amps} A` : "-");
    b.keyValue("Fault level", board.fault_level);
    if (board.earth_location) b.keyValue("Main earth", board.earth_location);

    if (board.checklist.length > 0) {
      b.space(6);
      b.text("Checklist", { size: 11, font: b.bold });
      b.space(4);
      for (const item of board.checklist) {
        b.ensure(20);
        b.y -= 16;
        const result = item.result;
        const label = result === "pass" ? "PASS" : result === "fail" ? "FAIL" : result === "na" ? "N/A" : "NOT CHECKED";
        const color = result === "pass" ? GREEN : result === "fail" ? RED : GRAY;
        const chipW = b.chip(label, MARGIN, color);
        b.page.drawText(sanitize(item.label), {
          x: MARGIN + Math.max(chipW + 10, 80),
          y: b.y,
          size: 10,
          font: b.font,
          color: NAVY,
        });
      }
    }

    if (board.has_defects) {
      b.space(10);
      b.ensure(40);
      b.y -= 20;
      const chipW = b.chip("DEFECT", MARGIN, RED);
      b.page.drawText(sanitize(severityLabel(board.defect_severity)), {
        x: MARGIN + chipW + 10,
        y: b.y,
        size: 10,
        font: b.bold,
        color: RED,
      });
      b.space(4);
      b.text(board.defect_description || "No description provided.", { color: NAVY });
    }

    if (board.reportPhotos.length > 0) {
      b.space(10);
      b.text("Photos", { size: 11, font: b.bold });
      b.space(6);
      const gap = 12;
      const cellW = (CONTENT_W - gap) / 2;
      const imgBoxH = 170;
      for (let i = 0; i < board.reportPhotos.length; i += 2) {
        const row = board.reportPhotos.slice(i, i + 2);
        const captionLines = row.map((p) =>
          p.caption ? b.wrap(p.caption, b.font, 8, cellW) : []
        );
        const captionH = Math.max(...captionLines.map((l) => l.length), 0) * 11;
        b.ensure(imgBoxH + captionH + 14);
        const rowTop = b.y;
        for (let c = 0; c < row.length; c++) {
          const x = MARGIN + c * (cellW + gap);
          const img = await b.embedImage(row[c].bytes);
          if (img) {
            b.drawImageFitted(img, x, rowTop, cellW, imgBoxH);
          } else {
            b.page.drawRectangle({ x, y: rowTop - 40, width: cellW, height: 40, color: LIGHT });
            b.page.drawText("Photo unavailable", {
              x: x + 10,
              y: rowTop - 25,
              size: 9,
              font: b.font,
              color: GRAY,
            });
          }
        }
        b.y = rowTop - imgBoxH - 4;
        // captions under each cell
        const captionTop = b.y;
        let deepest = captionTop;
        for (let c = 0; c < row.length; c++) {
          const x = MARGIN + c * (cellW + gap);
          let cy = captionTop;
          for (const line of captionLines[c]) {
            cy -= 11;
            if (line) {
              b.page.drawText(line, { x, y: cy, size: 8, font: b.font, color: GRAY });
            }
          }
          deepest = Math.min(deepest, cy);
        }
        b.y = deepest - 10;
      }
    }
  }

  // ------------------------------------------------------- defects register
  b.sectionHeading("Defects register");
  const defectBoards = boards.filter((board) => board.has_defects);
  if (defectBoards.length === 0) {
    b.text("No defects were recorded for this job.", { color: GRAY });
  } else {
    for (const board of defectBoards) {
      b.ensure(50);
      b.space(6);
      b.y -= 16;
      const chipW = b.chip(severityLabel(board.defect_severity).toUpperCase(), MARGIN, RED);
      b.page.drawText(sanitize(`${board.name || "Unnamed board"}${board.location ? ` - ${board.location}` : ""}`), {
        x: MARGIN + chipW + 10,
        y: b.y,
        size: 10,
        font: b.bold,
        color: NAVY,
      });
      b.space(4);
      b.text(board.defect_description || "No description provided.", { color: NAVY });
    }
  }

  // -------------------------------------------------------- recommendations
  b.sectionHeading("Recommendations");
  b.text(job.recommendations.trim() || "No recommendations were recorded for this job.", {
    color: job.recommendations.trim() ? NAVY : GRAY,
  });

  // ------------------------------------------------------------- variations
  if (variations.length > 0) {
    b.sectionHeading("Authorised variations / extra works");
    for (const [i, variation] of variations.entries()) {
      b.space(6);
      b.text(`Variation ${i + 1}`, { size: 12, font: b.bold });
      b.space(4);
      b.keyValue("Description", variation.description);
      b.keyValue(
        "Agreed price",
        variation.pricing_mode === "hourly"
          ? `${formatMoney(variation.hourly_rate_ex_gst)}/hour ex GST`
          : `${formatMoney(variation.price_ex_gst)} ex GST`
      );
      b.keyValue("Date", formatDate(variation.variation_date));
      b.space(6);
      b.text("Client authorisation", { size: 10, font: b.bold });
      b.space(2);
      for (const line of VARIATION_AUTHORISATION_TEXT) {
        b.text(`- ${line}`, { size: 8.5, color: GRAY });
      }

      if (variation.signed_at) {
        b.space(8);
        b.keyValue("Signed by", variation.signer_name);
        b.keyValue("Signed at", formatDateTime(variation.signed_at));
        if (variation.signatureBytes) {
          const img = await b.embedImage(variation.signatureBytes);
          if (img) {
            b.ensure(90);
            const top = b.y;
            const { h } = b.drawImageFitted(img, MARGIN, top, 220, 80);
            b.y = top - h;
            b.page.drawLine({
              start: { x: MARGIN, y: b.y - 2 },
              end: { x: MARGIN + 220, y: b.y - 2 },
              thickness: 0.75,
              color: NAVY,
            });
            b.space(14);
          }
        }
      } else {
        b.space(6);
        b.text("NOT YET SIGNED", { size: 10, font: b.bold, color: RED });
        b.space(4);
      }
    }
  }

  b.footerAll(settings, job);
  return b.doc.save();
}
