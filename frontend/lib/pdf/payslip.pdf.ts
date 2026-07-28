import jsPDF from "jspdf";
import {
  PAGE,
  COLORS,
  fmtCurrency,
  drawHeader,
  drawTitle,
  drawLabelValue,
  drawDivider,
  drawTable,
  drawTotalRow,
  drawFooter,
  type TableColumn,
} from "./builder";

/** Minimal payslip shape the PDF needs — satisfied by both the API display shape and
 * the pages' PaySlip type. Loan context is optional (only structured loans set it). */
export interface PayslipPdfInput {
  employee: string;
  empId: string;
  department: string;
  period: string;
  basic: number;
  housing: number;
  transport: number;
  meal: number;
  paye: number;
  pension: number;
  nhf: number;
  loan: number;
  net: number;
  loan_description?: string | null;
  loan_total?: number | null;
  loan_outstanding?: number | null;
}

type AmountRow = { label: string; value: number };

function amountColumns(sectionLabel: string): TableColumn<AmountRow>[] {
  const labelW = 120;
  return [
    { header: sectionLabel, width: labelW, align: "left", render: (r) => r.label },
    {
      header: "Amount (NGN)",
      width: PAGE.marginRight - PAGE.marginLeft - labelW,
      align: "right",
      render: (r) => fmtCurrency(r.value),
    },
  ];
}

/** Build a payslip PDF document using the shared lib/pdf builder (same look as
 * invoices/receipts). Returns the jsPDF doc so callers can save it or bundle it. */
export async function buildPayslipDoc(slip: PayslipPdfInput): Promise<jsPDF> {
  const { marginLeft: ml, width } = PAGE;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  await drawHeader(doc);
  drawTitle(doc, "PAY SLIP", `${slip.employee}   |   ${slip.empId}   |   ${slip.period}`);

  // ── Two-column info grid ──────────────────────────────────
  let y = 63;
  const col1 = ml;
  const col2 = width / 2 + 4;
  const colW = width / 2 - ml - 4;
  drawLabelValue(doc, "Employee", slip.employee, col1, y, colW);
  drawLabelValue(doc, "Employee ID", slip.empId, col2, y, colW);
  y += 14;
  drawLabelValue(doc, "Department", slip.department, col1, y, colW);
  drawLabelValue(doc, "Pay Period", slip.period, col2, y, colW);
  y += 13;
  drawDivider(doc, y - 3);
  y += 6;

  const gross = slip.basic + slip.housing + slip.transport + slip.meal;
  const ded = slip.paye + slip.pension + slip.nhf + slip.loan;

  // ── Earnings ──────────────────────────────────────────────
  y = drawTable(doc, amountColumns("Earnings"), [
    { label: "Basic Salary", value: slip.basic },
    { label: "Housing Allowance", value: slip.housing },
    { label: "Transport Allowance", value: slip.transport },
    { label: "Meal Allowance", value: slip.meal },
  ], y);
  y = drawTotalRow(doc, "Total Earnings", `NGN ${fmtCurrency(gross)}`, y, 0);
  y += 8;

  // ── Deductions ────────────────────────────────────────────
  y = drawTable(doc, amountColumns("Deductions"), [
    { label: "PAYE Tax", value: slip.paye },
    { label: "Pension", value: slip.pension },
    { label: "NHF", value: slip.nhf },
    { label: "Loan Repayment", value: slip.loan },
  ], y);
  y = drawTotalRow(doc, "Total Deductions", `NGN ${fmtCurrency(ded)}`, y, 0);
  y += 8;

  // ── Loan context (only when a structured loan was deducted) ─
  if (slip.loan_description && slip.loan > 0) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.mutedText);
    doc.text("LOAN", ml, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.darkText);
    doc.text(slip.loan_description, ml, y);
    y += 5;
    if (slip.loan_total != null && slip.loan_outstanding != null) {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.mutedText);
      doc.text(
        `Outstanding after this payment: NGN ${fmtCurrency(slip.loan_outstanding)} of NGN ${fmtCurrency(slip.loan_total)} total`,
        ml,
        y
      );
      y += 6;
    }
    y += 2;
  }

  // ── Net pay highlight ─────────────────────────────────────
  y = drawTotalRow(doc, "NET PAY", `NGN ${fmtCurrency(slip.net)}`, y, 0);

  drawFooter(
    doc,
    "This is a computer-generated payslip. Portland Gas Limited — Internal Operations Platform."
  );

  return doc;
}

function safe(s: string): string {
  return s.replace(/\s+/g, "_");
}

/** Build and download a single payslip PDF. */
export async function generatePayslipPdf(slip: PayslipPdfInput): Promise<void> {
  const doc = await buildPayslipDoc(slip);
  doc.save(`${safe(slip.employee)}_${safe(slip.period)}.pdf`);
}
