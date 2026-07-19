import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from "pdf-lib";
import { formatDateTime, severityLabel, statusLabel } from "@/lib/format";
import type { DamageFlag, DamageSeverity, Inspection, Room } from "@/lib/types";

const INK = rgb(35 / 255, 35 / 255, 35 / 255);
const ROSE = rgb(255 / 255, 56 / 255, 92 / 255);
const GRAY = rgb(0.45, 0.5, 0.56);
const LIGHT = rgb(0.95, 0.96, 0.97);
const RED = rgb(0.8, 0.15, 0.15);
const ORANGE = rgb(0.85, 0.45, 0.05);
const AMBER = rgb(0.7, 0.55, 0.0);
const GREEN = rgb(0.05, 0.55, 0.35);

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 40;

export interface ReportImage {
  bytes: Uint8Array;
  caption?: string;
  takenAt?: string;
}

export interface ReportRoom extends Room {
  reportPhotos: ReportImage[];
  damageFlags: DamageFlag[];
}

export interface ReportData {
  inspection: Inspection;
  rooms: ReportRoom[];
  generalFlags: DamageFlag[]; // property-wide flags (no room)
  generatedAt: Date;
}

function severityColor(severity: DamageSeverity): RGB {
  return severity === "severe" ? RED : severity === "moderate" ? ORANGE : AMBER;
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
    const color = opts.color ?? INK;
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
    this.page.drawRectangle({ x: MARGIN, y: this.y, width: CONTENT_W, height: h, color: INK });
    this.page.drawRectangle({ x: MARGIN, y: this.y, width: 5, height: h, color: ROSE });
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
          color: INK,
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

  drawDamageFlag(flag: DamageFlag, roomLabel?: string) {
    this.ensure(50);
    this.space(6);
    this.y -= 16;
    const chipW = this.chip(
      severityLabel(flag.severity).toUpperCase(),
      MARGIN,
      severityColor(flag.severity)
    );
    this.page.drawText(
      sanitize(
        `${roomLabel ? `${roomLabel} - ` : ""}${flag.description || "Damage (no description)"}`
      ),
      {
        x: MARGIN + chipW + 10,
        y: this.y,
        size: 10,
        font: this.bold,
        color: INK,
      }
    );
    if (flag.notes.trim()) {
      this.space(4);
      this.text(flag.notes, { color: GRAY, x: MARGIN + 8 });
    }
    this.space(2);
    this.text(`Flagged ${formatDateTime(flag.created_at)}`, {
      size: 8,
      color: GRAY,
      x: MARGIN + 8,
    });
  }

  photoGrid(photos: ReportImage[]) {
    return (async () => {
      const gap = 12;
      const cellW = (CONTENT_W - gap) / 2;
      const imgBoxH = 170;
      for (let i = 0; i < photos.length; i += 2) {
        const row = photos.slice(i, i + 2);
        const captionLines = row.map((p) => {
          const parts: string[] = [];
          if (p.takenAt) parts.push(`Taken ${formatDateTime(p.takenAt)}`);
          if (p.caption) parts.push(p.caption);
          return parts.length > 0
            ? this.wrap(parts.join(" - "), this.font, 8, cellW)
            : [];
        });
        const captionH = Math.max(...captionLines.map((l) => l.length), 0) * 11;
        this.ensure(imgBoxH + captionH + 14);
        const rowTop = this.y;
        for (let c = 0; c < row.length; c++) {
          const x = MARGIN + c * (cellW + gap);
          const img = await this.embedImage(row[c].bytes);
          if (img) {
            this.drawImageFitted(img, x, rowTop, cellW, imgBoxH);
          } else {
            this.page.drawRectangle({ x, y: rowTop - 40, width: cellW, height: 40, color: LIGHT });
            this.page.drawText("Photo unavailable", {
              x: x + 10,
              y: rowTop - 25,
              size: 9,
              font: this.font,
              color: GRAY,
            });
          }
        }
        this.y = rowTop - imgBoxH - 4;
        // captions under each cell
        const captionTop = this.y;
        let deepest = captionTop;
        for (let c = 0; c < row.length; c++) {
          const x = MARGIN + c * (cellW + gap);
          let cy = captionTop;
          for (const line of captionLines[c]) {
            cy -= 11;
            if (line) {
              this.page.drawText(line, { x, y: cy, size: 8, font: this.font, color: GRAY });
            }
          }
          deepest = Math.min(deepest, cy);
        }
        this.y = deepest - 10;
      }
    })();
  }

  footerAll(inspection: Inspection, generatedAt: Date) {
    const pages = this.doc.getPages();
    const propertyLabel = sanitize(
      inspection.property_name || inspection.property_address || "Checkout inspection"
    ).slice(0, 60);
    pages.forEach((page, i) => {
      page.drawLine({
        start: { x: MARGIN, y: MARGIN + 18 },
        end: { x: PAGE_W - MARGIN, y: MARGIN + 18 },
        thickness: 0.5,
        color: rgb(0.85, 0.87, 0.9),
      });
      page.drawText(
        sanitize(`Generated ${formatDateTime(generatedAt.toISOString())}`),
        {
          x: MARGIN,
          y: MARGIN + 5,
          size: 8,
          font: this.font,
          color: GRAY,
        }
      );
      const pageLabel = `${propertyLabel}  |  Page ${i + 1} of ${pages.length}`;
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
  const { inspection, rooms, generalFlags, generatedAt } = data;
  const allFlags = [
    ...rooms.flatMap((room) =>
      room.damageFlags.map((flag) => ({ flag, roomLabel: room.name }))
    ),
    ...generalFlags.map((flag) => ({ flag, roomLabel: "Whole property" })),
  ];
  const b = new ReportBuilder();
  await b.init();

  // ---------------------------------------------------------------- cover
  b.newPage();
  b.page.drawRectangle({ x: 0, y: PAGE_H - 190, width: PAGE_W, height: 190, color: INK });
  b.page.drawRectangle({ x: 0, y: PAGE_H - 196, width: PAGE_W, height: 6, color: ROSE });

  b.page.drawText("CHECKOUT INSPECTION REPORT", {
    x: MARGIN,
    y: PAGE_H - 70,
    size: 20,
    font: b.bold,
    color: rgb(1, 1, 1),
  });
  b.page.drawText(
    sanitize(inspection.property_name || inspection.property_address || "Airbnb property"),
    {
      x: MARGIN,
      y: PAGE_H - 100,
      size: 13,
      font: b.font,
      color: rgb(1, 1, 1),
    }
  );
  b.page.drawText(sanitize(`Generated ${formatDateTime(generatedAt.toISOString())}`), {
    x: MARGIN,
    y: PAGE_H - 125,
    size: 11,
    font: b.bold,
    color: ROSE,
  });

  b.y = PAGE_H - 230;
  b.text("Inspection details", { size: 13, font: b.bold });
  b.space(6);
  if (inspection.property_name) b.keyValue("Property", inspection.property_name);
  if (inspection.property_address) b.keyValue("Address", inspection.property_address);
  b.keyValue("Type", "Checkout inspection");
  b.keyValue("Started", formatDateTime(inspection.started_at));
  b.keyValue(
    "Completed",
    inspection.completed_at ? formatDateTime(inspection.completed_at) : "Not yet completed"
  );
  b.keyValue("Status", statusLabel(inspection.status));
  b.keyValue(
    "Damage flags",
    allFlags.length === 0 ? "None" : `${allFlags.length} flagged (see damage register)`
  );

  if (inspection.notes.trim()) {
    b.space(8);
    b.text("Overall notes", { size: 13, font: b.bold });
    b.space(4);
    b.text(inspection.notes, { color: GRAY });
  }

  // ---------------------------------------------------------------- rooms
  for (const room of rooms) {
    const checked = room.checklist.filter((i) => i.checked).length;
    const total = room.checklist.length;
    b.sectionHeading(`${room.name} — ${checked}/${total} items verified`);

    for (const item of room.checklist) {
      b.ensure(20);
      b.y -= 16;
      const chipW = b.chip(
        item.checked ? "DONE" : "NOT DONE",
        MARGIN,
        item.checked ? GREEN : GRAY
      );
      b.page.drawText(sanitize(item.label), {
        x: MARGIN + Math.max(chipW + 10, 70),
        y: b.y,
        size: 10,
        font: b.font,
        color: INK,
      });
    }

    if (room.damageFlags.length > 0) {
      b.space(10);
      b.text("Damage flagged in this room", { size: 11, font: b.bold, color: RED });
      for (const flag of room.damageFlags) {
        b.drawDamageFlag(flag);
      }
    }

    if (room.reportPhotos.length > 0) {
      b.space(10);
      b.text("Photos", { size: 11, font: b.bold });
      b.space(6);
      await b.photoGrid(room.reportPhotos);
    }
  }

  // ------------------------------------------------------- damage register
  b.sectionHeading("Damage register");
  if (allFlags.length === 0) {
    b.text("No damage was flagged during this inspection.", { color: GRAY });
  } else {
    for (const { flag, roomLabel } of allFlags) {
      b.drawDamageFlag(flag, roomLabel);
    }
  }

  b.footerAll(inspection, generatedAt);
  return b.doc.save();
}
