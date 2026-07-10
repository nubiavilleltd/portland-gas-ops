import { COMPANY_INFO } from "@/config/company.config";
import jsPDF from "jspdf";

// ── Shared color palette ─────────────────────────────────
export const COLORS = {
  purple: [124, 58, 237] as [number, number, number],
  darkText: [26, 26, 26] as [number, number, number],
  mutedText: [120, 120, 120] as [number, number, number],
  lightBorder: [220, 220, 220] as [number, number, number],
  rowAlt: [252, 252, 252] as [number, number, number],
  headerFill: [245, 245, 245] as [number, number, number],
  totalFill: [237, 233, 254] as [number, number, number],
};

// ── Shared layout constants ──────────────────────────────
export const PAGE = {
  width: 210,
  height: 297,
  marginLeft: 18,
  get marginRight() {
    return this.width - this.marginLeft;
  },
};

// ── Formatting helpers ───────────────────────────────────
export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Image loading ─────────────────────────────────────────
export async function loadImageAsBase64(
  url: string
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 1, height: 1 });
      img.src = dataUrl;
    });
    return { dataUrl, ...dims };
  } catch {
    return null;
  }
}

// ── Document header (logo + company info) ───────────────
export async function drawHeader(doc: jsPDF): Promise<void> {
  const { marginLeft: ml, marginRight: mr } = PAGE;
  const logoDataUrl = await loadImageAsBase64(COMPANY_INFO.logoPath);

  if (logoDataUrl) {
    const logoH = 15;
    const logoW = (logoDataUrl.width / logoDataUrl.height) * logoH;
    doc.addImage(logoDataUrl.dataUrl, "PNG", ml, 10, logoW, logoH);
  } else {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.darkText);
    doc.text(COMPANY_INFO.name, ml, 20);
  }

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.mutedText);
  doc.text(COMPANY_INFO.tagline, ml, 28);

  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.mutedText);
  doc.text(COMPANY_INFO.address, mr, 14, { align: "right" });
  doc.text(`Tel: ${COMPANY_INFO.phone}  |  ${COMPANY_INFO.email}`, mr, 19, { align: "right" });
  doc.text(COMPANY_INFO.website, mr, 24, { align: "right" });

  drawDivider(doc, 33);
}

// ── Footer ────────────────────────────────────────────────
export function drawFooter(doc: jsPDF, disclaimer: string, pageLabel = "Page 1"): void {
  const { width: pageW, height: pageH } = PAGE;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.mutedText);
  doc.text(disclaimer, pageW / 2, pageH - 10, { align: "center" });
  doc.text(pageLabel, pageW / 2, pageH - 6, { align: "center" });
}

// ── Divider line ──────────────────────────────────────────
export function drawDivider(doc: jsPDF, y: number): void {
  const { marginLeft: ml, marginRight: mr } = PAGE;
  doc.setDrawColor(...COLORS.lightBorder);
  doc.line(ml, y, mr, y);
}

// ── Document title block ─────────────────────────────────
export function drawTitle(
  doc: jsPDF,
  title: string,
  subtitle: string,
  titleY = 44,
  subtitleY = 51,
  dividerY = 56
): void {
  const { marginLeft: ml } = PAGE;

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.purple);
  doc.text(title, ml, titleY);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.mutedText);
  doc.text(subtitle, ml, subtitleY);

  drawDivider(doc, dividerY);
}

// ── Label/value pair (two-column info grid) ──────────────
export function drawLabelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number
): void {
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.mutedText);
  doc.text(label.toUpperCase(), x, y);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkText);
  const lines = doc.splitTextToSize(value || "—", maxWidth);
  doc.text(lines[0] ?? "—", x, y + 5);
}

// ── Generic table renderer ───────────────────────────────
export interface TableColumn<T> {
  header: string;
  width: number; // mm
  align: "left" | "center" | "right";
  render: (row: T) => string;
}

export function drawTable<T>(
  doc: jsPDF,
  columns: TableColumn<T>[],
  rows: T[],
  startY: number
): number {
  const { marginLeft: ml, marginRight: mr } = PAGE;
  const tableW = mr - ml;
  const hdrH = 9;
  const rowH = 8;

  const cx: number[] = [ml];
  columns.slice(0, -1).forEach((col, i) => cx.push(cx[i] + col.width));

  let y = startY;

  // Header
  doc.setFillColor(...COLORS.headerFill);
  doc.rect(ml, y, tableW, hdrH, "F");
  doc.setDrawColor(...COLORS.lightBorder);
  doc.rect(ml, y, tableW, hdrH, "S");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(90, 90, 90);

  columns.forEach((col, i) => {
    const tx =
      col.align === "right" ? cx[i] + col.width - 2 :
      col.align === "center" ? cx[i] + col.width / 2 :
      cx[i] + 2;
    doc.text(col.header, tx, y + 6, { align: col.align });
  });

  y += hdrH;

  // Rows
  rows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(...COLORS.rowAlt);
      doc.rect(ml, y, tableW, rowH, "F");
    }
    doc.setDrawColor(235, 235, 235);
    doc.line(ml, y + rowH, ml + tableW, y + rowH);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.darkText);

    columns.forEach((col, i) => {
      const text = col.render(row);
      const tx =
        col.align === "right" ? cx[i] + col.width - 2 :
        col.align === "center" ? cx[i] + col.width / 2 :
        cx[i] + 2;

      if (col.align === "left") {
        const lines = doc.splitTextToSize(text, col.width - 4);
        doc.text(lines[0] ?? "", tx, y + 5.5);
      } else {
        doc.text(text, tx, y + 5.5, { align: col.align });
      }
    });

    y += rowH;
  });

  return y; // returns the y position after the table, for continued layout
}

// ── Total / summary highlight row ────────────────────────
export function drawTotalRow(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  labelWidth: number
): number {
  const { marginLeft: ml, marginRight: mr } = PAGE;
  const tableW = mr - ml;
  const rowH = 8;

  doc.setFillColor(...COLORS.totalFill);
  doc.rect(ml, y, tableW, rowH + 2, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.purple);
  doc.text(label, ml + 2, y + 6.5);
  doc.text(value, mr - 2, y + 6.5, { align: "right" });

  return y + rowH + 2;
}