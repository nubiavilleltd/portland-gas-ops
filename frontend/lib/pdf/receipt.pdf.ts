import jsPDF from "jspdf";
import {
  PAGE,
  COLORS,
  fmtCurrency,
  fmtDate,
  drawHeader,
  drawTitle,
  drawLabelValue,
  drawDivider,
  drawTotalRow,
  drawFooter,
} from "./builder";
import type { Payment } from "@/lib/modules/payments/types/payments.types";
import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { formatPaymentMethodLabel } from "@/lib/modules/payments/utils";

export interface GenerateReceiptPdfInput {
  payment: Payment;
  invoice: Invoice;
  customer?: any;
  allInvoicePayments: Payment[]; // all payments on the invoice, for cumulative calculation
}

export async function generateReceiptPdf(input: GenerateReceiptPdfInput): Promise<void> {
  const { payment, invoice, customer, allInvoicePayments } = input;
  const { marginLeft: ml, marginRight: mr } = PAGE;

  // ── Calculate cumulative amounts up to and including this payment ──
  // Sort all payments chronologically, find payments up to and including this one
  const sortedPayments = [...allInvoicePayments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );
  const thisPaymentIndex = sortedPayments.findIndex((p) => p.id === payment.id);
  const paymentsUpToThis = sortedPayments.slice(0, thisPaymentIndex + 1);
  const cumulativePaid = paymentsUpToThis.reduce((sum, p) => sum + p.amount, 0);
  const remainingAfterThis = invoice.total_amount - cumulativePaid;
  const isFullySettled = remainingAfterThis <= 0;
  const isPartialPayment = allInvoicePayments.length > 1;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  await drawHeader(doc);

  // ── PAID watermark (only on the final settling payment) ──
  if (isFullySettled) {
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 230, 190);
    doc.saveGraphicsState();
    // @ts-ignore — jsPDF internal for opacity
    doc.internal.write("0.12 g");
    doc.text("PAID", PAGE.width / 2, 160, {
      align: "center",
      angle: 45,
    });
    doc.restoreGraphicsState();
  }

  drawTitle(
    doc,
    isPartialPayment && !isFullySettled ? "PAYMENT RECEIPT (PARTIAL)" : "PAYMENT RECEIPT",
    `Receipt Ref: ${payment.reference}   |   Date: ${fmtDate(payment.paymentDate)}`
  );

  // ── Two-column: RECEIVED FROM / PAYMENT DETAILS ──────────
  let y = 63;
  const col1 = ml;
  const col2 = PAGE.width / 2 + 4;
  const colW = PAGE.width / 2 - ml - 4;

  drawLabelValue(doc, "Received From", customer?.customer_name ?? "—", col1, y, colW);
  drawLabelValue(doc, "Payment Date", fmtDate(payment.paymentDate), col2, y, colW);
  y += 15;

  if (customer?.address_line1) {
    drawLabelValue(doc, "Address", customer.address_line1, col1, y, colW);
  }
  drawLabelValue(doc, "Payment Method", formatPaymentMethodLabel(payment.method), col2, y, colW);
  y += 15;

  if (customer?.email) {
    drawLabelValue(doc, "Email", customer.email, col1, y, colW);
  }
  if (customer?.phone) {
    drawLabelValue(doc, "Phone", customer.phone, col2, y, colW);
  }
  y += 15;

  drawDivider(doc, y - 3);
  y += 8;

  // ── Payment amount highlight ──────────────────────────────
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.mutedText);
  doc.text("AMOUNT RECEIVED", ml, y);
  y += 9;

  // Large prominent amount display
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.purple);
  doc.text(`NGN ${fmtCurrency(payment.amount)}`, ml, y);
  y += 16;

  drawDivider(doc, y - 3);
  y += 8;

  // ── Invoice context (the thread connecting all receipts) ──
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.mutedText);
  doc.text("INVOICE DETAILS", ml, y);
  y += 9;

  drawLabelValue(doc, "Invoice Number", invoice.invoice_number, col1, y, colW);
  drawLabelValue(doc, "Invoice Total", `NGN ${fmtCurrency(invoice.total_amount)}`, col2, y, colW);
  y += 15;

  drawLabelValue(
    doc,
    "Total Paid to Date",
    `NGN ${fmtCurrency(cumulativePaid)}`,
    col1,
    y,
    colW
  );

  // Remaining balance — green if zero, red if outstanding
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.mutedText);
  doc.text("REMAINING BALANCE", col2, y);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    ...(isFullySettled
      ? ([34, 197, 94] as [number, number, number])   // green
      : ([220, 38, 38] as [number, number, number]))  // red
  );
  doc.text(
    isFullySettled ? "NGN 0.00 — FULLY SETTLED" : `NGN ${fmtCurrency(remainingAfterThis)}`,
    col2,
    y + 5
  );
  y += 18;

  // ── If this is one of multiple payments — show all of them ─
  if (isPartialPayment) {
    drawDivider(doc, y - 3);
    y += 8;

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.mutedText);
    doc.text("ALL PAYMENTS ON THIS INVOICE", ml, y);
    y += 6;

    // Simple manual table for payment history
    const tableW = mr - ml;
    const hdrH = 8;
    const rowH = 7;

    doc.setFillColor(...COLORS.headerFill);
    doc.rect(ml, y, tableW, hdrH, "F");
    doc.setDrawColor(...COLORS.lightBorder);
    doc.rect(ml, y, tableW, hdrH, "S");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(90, 90, 90);
    doc.text("Reference", ml + 2, y + 5.5);
    doc.text("Date", ml + 55, y + 5.5);
    doc.text("Method", ml + 95, y + 5.5);
    doc.text("Amount (NGN)", mr - 2, y + 5.5, { align: "right" });
    y += hdrH;

    sortedPayments.forEach((p, idx) => {
      const isCurrentPayment = p.id === payment.id;

      // Highlight current payment row
      if (isCurrentPayment) {
        doc.setFillColor(237, 233, 254); // purple tint
        doc.rect(ml, y, tableW, rowH, "F");
      } else if (idx % 2 === 1) {
        doc.setFillColor(...COLORS.rowAlt);
        doc.rect(ml, y, tableW, rowH, "F");
      }

      doc.setDrawColor(235, 235, 235);
      doc.line(ml, y + rowH, mr, y + rowH);

      doc.setFontSize(8);
      doc.setFont("helvetica", isCurrentPayment ? "bold" : "normal");
      doc.setTextColor(...(isCurrentPayment ? COLORS.purple : COLORS.darkText));

      doc.text(p.reference, ml + 2, y + 5);
      doc.text(fmtDate(p.paymentDate), ml + 55, y + 5);
      doc.text(formatPaymentMethodLabel(p.method), ml + 95, y + 5);
      doc.text(fmtCurrency(p.amount), mr - 2, y + 5, { align: "right" });

      y += rowH;
    });

    y += 4;

    // Running total row
    doc.setFillColor(...COLORS.totalFill);
    doc.rect(ml, y, tableW, 9, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.purple);
    doc.text("TOTAL PAID TO DATE", ml + 2, y + 6);
    doc.text(`NGN ${fmtCurrency(cumulativePaid)}`, mr - 2, y + 6, { align: "right" });
    y += 16;
  }

  // ── Footer ────────────────────────────────────────────────
  drawFooter(
    doc,
    "This is a computer-generated payment receipt. Portland Gas Limited — Internal Operations Platform."
  );

  doc.save(`receipt-${payment.reference}.pdf`);
}