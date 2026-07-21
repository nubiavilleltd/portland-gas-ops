import jsPDF from "jspdf";
import type { ProcurementRequest, PurchaseOrder } from "@/types";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "Not specified";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function cap(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

async function loadImageAsBase64(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
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

function raiserName(req: ProcurementRequest): string {
  const u = req.raiser?.user;
  if (u) return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;
  return req.raiser?.employee_no ?? "—";
}

function issuerName(po: PurchaseOrder | undefined): string {
  if (!po?.issuer) return "";
  const u = po.issuer.user;
  if (u) return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;
  return po.issuer.employee_no ?? "";
}

export async function generatePO(req: ProcurementRequest, po?: PurchaseOrder): Promise<void> {
  const logoDataUrl = await loadImageAsBase64("/Portland-gas-logo.png");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const ml = 14;
  const mr = pageW - ml;
  const purple: [number, number, number] = [124, 58, 237];
  const darkText: [number, number, number] = [26, 26, 26];
  const mutedText: [number, number, number] = [120, 120, 120];
  const lightBorder: [number, number, number] = [220, 220, 220];

  // ── Header ──────────────────────────────────────────────────────────────────
  if (logoDataUrl) {
    const logoH = 15;
    const logoW = (logoDataUrl.width / logoDataUrl.height) * logoH;
    doc.addImage(logoDataUrl.dataUrl, "PNG", ml, 10, logoW, logoH);
  } else {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text("Portland Gas Limited", ml, 20);
  }

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text("Clean Energy | CNG | LPG | EV Charging", ml, 28);

  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text("2B Water Corporation Road, Victoria Island, Lagos", mr, 14, { align: "right" });
  doc.text("Tel: +234 (0) 800 PORTLAND  |  info@portlandgasltd.com", mr, 19, { align: "right" });
  doc.text("www.portlandgasltd.com", mr, 24, { align: "right" });

  // Divider
  doc.setDrawColor(...lightBorder);
  doc.line(ml, 33, mr, 33);

  // ── PURCHASE ORDER title ────────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...purple);
  doc.text("PURCHASE ORDER", ml, 44);

  const reference = po?.po_number ?? req.reference;
  const today = fmtDate(new Date().toISOString());
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text(`Reference: ${reference}   |   Date: ${today}`, ml, 51);

  doc.setDrawColor(...lightBorder);
  doc.line(ml, 56, mr, 56);

  // ── Two-column info grid ────────────────────────────────────────────────────
  let y = 63;
  const col1 = ml;
  const col2 = pageW / 2 + 4;
  const colW = pageW / 2 - ml - 4;

  function labelValue(label: string, value: string, x: number, yy: number): void {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mutedText);
    doc.text(label.toUpperCase(), x, yy);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkText);
    const lines = doc.splitTextToSize(value || "—", colW);
    doc.text(lines[0] ?? "—", x, yy + 5);
  }

  const vendor = req.vendor;
  const categoryLabel = req.category ? cap(req.category) : "—";
  const titleStr = `${categoryLabel} Request`;

  labelValue("Request Title", titleStr, col1, y);
  labelValue("Vendor", vendor?.name ?? "Not specified", col2, y);
  y += 15;

  labelValue("Category", categoryLabel, col1, y);
  if (vendor?.address) labelValue("Address", vendor.address, col2, y);
  y += 15;

  labelValue("Required By", fmtDate(req.required_by), col1, y);
  if (vendor?.phone) labelValue("Phone", vendor.phone, col2, y);
  y += 15;

  labelValue("Raised By", raiserName(req), col1, y);
  if (vendor?.email) labelValue("Email", vendor.email, col2, y);
  y += 15;

  // ── Justification ───────────────────────────────────────────────────────────
  if (req.description) {
    doc.setDrawColor(...lightBorder);
    doc.line(ml, y - 3, mr, y - 3);

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mutedText);
    doc.text("JUSTIFICATION / PURPOSE", ml, y + 3);
    y += 9;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(req.description, mr - ml);
    doc.text(lines, ml, y);
    y += lines.length * 4.8 + 8;
  } else {
    y += 5;
  }

  // ── Line Items Table ────────────────────────────────────────────────────────
  const isService = req.category === "services";
  const tableW = mr - ml;

  const cw = [80, 20, 22, 26, 26];
  const cx = [ml];
  cw.slice(0, -1).forEach((w, i) => cx.push(cx[i] + w));

  const hdrH = 9;
  const rowH = 8;

  doc.setFillColor(245, 245, 255);
  doc.rect(ml, y, tableW, hdrH, "F");
  doc.setDrawColor(...lightBorder);
  doc.rect(ml, y, tableW, hdrH, "S");

  const hdrLabels = [
    "Description",
    isService ? "Duration" : "Qty",
    "Unit",
    isService ? "Rate (NGN)" : "Unit Cost (NGN)",
    "Total (NGN)",
  ];
  const hdrAlign: Array<"left" | "center" | "right"> = ["left", "center", "center", "right", "right"];

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(90, 90, 90);

  hdrLabels.forEach((h, i) => {
    const tx =
      hdrAlign[i] === "right"  ? cx[i] + cw[i] - 2 :
      hdrAlign[i] === "center" ? cx[i] + cw[i] / 2 :
      cx[i] + 2;
    doc.text(h, tx, y + 6, { align: hdrAlign[i] });
  });

  y += hdrH;

  req.items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(252, 252, 252);
      doc.rect(ml, y, tableW, rowH, "F");
    }
    doc.setDrawColor(235, 235, 235);
    doc.line(ml, y + rowH, ml + tableW, y + rowH);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkText);

    const descLines = doc.splitTextToSize(item.description, cw[0] - 4);
    doc.text(descLines[0], cx[0] + 2, y + 5.5);
    doc.text(String(item.quantity), cx[1] + cw[1] / 2, y + 5.5, { align: "center" });
    doc.text(cap(item.unit ?? ""), cx[2] + cw[2] / 2, y + 5.5, { align: "center" });
    doc.text(fmt(Number(item.unit_price ?? 0)), cx[3] + cw[3] - 2, y + 5.5, { align: "right" });
    doc.text(fmt(Number(item.total_price ?? 0)), cx[4] + cw[4] - 2, y + 5.5, { align: "right" });

    y += rowH;
  });

  // Total row
  const grandTotal = req.items.reduce((sum, item) => sum + Number(item.total_price ?? 0), 0);
  doc.setFillColor(237, 233, 254);
  doc.rect(ml, y, tableW, rowH + 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...purple);
  doc.text("ESTIMATED TOTAL", cx[0] + 2, y + 6.5);
  doc.text(`NGN ${fmt(grandTotal)}`, cx[4] + cw[4] - 2, y + 6.5, { align: "right" });

  y += rowH + 2 + 16;

  // ── Signatures ──────────────────────────────────────────────────────────────
  const sigLineW = 72;
  const s1x = ml;
  const s2x = pageW / 2 + 4;

  // Left — Raised By (the requester)
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text("Raised By", s1x, y);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkText);
  doc.text(raiserName(req), s1x, y + 6);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(today, s1x, y + 12);

  doc.setDrawColor(...lightBorder);
  doc.line(s1x, y + 22, s1x + sigLineW, y + 22);
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text("Signature", s1x, y + 27);

  // Right — Authorised By (the PO issuer / procurement officer)
  const authorisedBy = issuerName(po);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text("Authorised By", s2x, y);

  if (authorisedBy) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text(authorisedBy, s2x, y + 6);
  }

  doc.setDrawColor(...lightBorder);
  doc.line(s2x, y + 22, s2x + sigLineW, y + 22);
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text("Signature & Date", s2x, y + 27);

  // ── Footer ──────────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text(
    "This is a computer-generated Purchase Order. Portland Gas Limited — Internal Operations Platform.",
    pageW / 2,
    pageH - 10,
    { align: "center" }
  );
  doc.text("Page 1", pageW / 2, pageH - 6, { align: "center" });

  doc.save(`${reference}.pdf`);
}
