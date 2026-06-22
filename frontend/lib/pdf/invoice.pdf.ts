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
  drawTable,
  drawTotalRow,
  drawFooter,
  type TableColumn,
} from "./builder";
import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import type { Order, OrderLineItem } from "@/lib/modules/orders/types/orders.types";
import type { Customer } from "@/lib/modules/customers/types/customer.types";
import type { Payment } from "@/lib/modules/payments/types/payments.types";
import { COMPANY_BANK_DETAILS } from "@/config/company.config";
import { toTitleCase } from "../utils";

export interface GenerateInvoicePdfInput {
  invoice: Invoice;
  order?: Order;
  customer?: Customer;
  payments: Payment[];
  amountPaid: number;
  productUnitMap: Map<string, string>; // product_id → unit label, for quantity formatting
}

export async function generateInvoicePdf(input: GenerateInvoicePdfInput): Promise<void> {
  const { invoice, order, customer, payments, amountPaid, productUnitMap } = input;
  const { marginLeft: ml, marginRight: mr } = PAGE;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  await drawHeader(doc);

  drawTitle(
    doc,
    "INVOICE",
    `Invoice No: ${invoice.invoice_number}   |   Issued: ${fmtDate(invoice.issued_date)}`
  );

  // ── Two-column: BILL TO / INVOICE DETAILS ──────────────
  let y = 63;
  const col1 = ml;
  const col2 = PAGE.width / 2 + 4;
  const colW = PAGE.width / 2 - ml - 4;

  drawLabelValue(doc, "Bill To", customer?.name ?? "—", col1, y, colW);
  drawLabelValue(doc, "Due Date", fmtDate(invoice.due_date), col2, y, colW);
  y += 15;

  if (customer?.address) {
    drawLabelValue(doc, "Address", customer.address, col1, y, colW);
  }
  if (order?.order_number) {
    drawLabelValue(doc, "Order Number", order.order_number, col2, y, colW);
  }
  y += 15;

  if (customer?.email) {
    drawLabelValue(doc, "Email", customer.email, col1, y, colW);
  }
  if (customer?.phone) {
    drawLabelValue(doc, "Phone", customer.phone, col2, y, colW);
  }
  y += 15;

  drawDivider(doc, y - 3);
  y += 6;

  // ── Line items table ────────────────────────────────────
  const lineItems = order?.order_items ?? [];

  const columns: TableColumn<OrderLineItem>[] = [
    {
      header: "Product",
      width: 70,
      align: "left",
      render: (item) => item.product_name,
    },
    {
      header: "Qty",
      width: 30,
      align: "center",
      render: (item) => {
        const unit = productUnitMap.get(item.product_id) ?? "";
        return `${item.quantity.toLocaleString()} ${unit}`.trim();
      },
    },
    {
      header: "Unit Price (NGN)",
      width: 37,
      align: "right",
      render: (item) => fmtCurrency(item.unit_price),
    },
    {
      header: "Total (NGN)",
      width: 37,
      align: "right",
      render: (item) => fmtCurrency(item.total),
    },
  ];

  y = drawTable(doc, columns, lineItems, y);
  y += 2;

  y = drawTotalRow(doc, "GRAND TOTAL", `NGN ${fmtCurrency(invoice.total_amount)}`, y, 0);
  y += 12;

  // ── Payment summary ──────────────────────────────────────
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.mutedText);
  doc.text("PAYMENT SUMMARY", ml, y);
  y += 9;

  const balance = invoice.total_amount - amountPaid;

  drawLabelValue(doc, "Amount Paid", `NGN ${fmtCurrency(amountPaid)}`, col1, y, colW);
  drawLabelValue(
    doc,
    "Balance Due",
    `NGN ${fmtCurrency(balance)}`,
    col2,
    y,
    colW
  );
  y += 18;

  // ── Payment history (only if payments exist) ────────────
  if (payments.length > 0) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.mutedText);
    doc.text("PAYMENT HISTORY", ml, y);
    y += 6;

    const paymentColumns: TableColumn<Payment>[] = [
      {
        header: "Reference",
        width: 50,
        align: "left",
        render: (p) => p.payment_reference,
      },
      {
        header: "Date",
        width: 40,
        align: "center",
        render: (p) => fmtDate(p.payment_date),
      },
      {
        header: "Method",
        width: 44,
        align: "center",
        render: (p) => toTitleCase(p.payment_method.replace("_", " ")),
      },
      {
        header: "Amount (NGN)",
        width: 40,
        align: "right",
        render: (p) => fmtCurrency(p.amount),
      },
    ];

    y = drawTable(doc, paymentColumns, payments, y);
    y += 10;
  }

  drawDivider(doc, y - 3);
  y += 6;

  // ── Payment instructions ─────────────────────────────────
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.mutedText);
  doc.text("PAYMENT INSTRUCTIONS", ml, y);
  y += 9;

  drawLabelValue(doc, "Bank Name", COMPANY_BANK_DETAILS.bankName, col1, y, colW);
  drawLabelValue(doc, "Account Name", COMPANY_BANK_DETAILS.accountName, col2, y, colW);
  y += 15;

  drawLabelValue(doc, "Account Number", COMPANY_BANK_DETAILS.accountNumber, col1, y, colW);

  // ── Footer ────────────────────────────────────────────────
  drawFooter(
    doc,
    "This is a computer-generated invoice. Portland Gas Limited — Internal Operations Platform."
  );

  doc.save(`${invoice.invoice_number}.pdf`);
}