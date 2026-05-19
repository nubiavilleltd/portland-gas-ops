export const DEPARTMENTS = [
  "Finance", "Operations", "Marketing", "HR", "IT",
  "Sales", "Procurement", "Admin", "Safety", "Engineering",
] as const;

export const APPROVERS: Record<string, { lineManager: string; financeReview: string }> = {
  Finance:     { lineManager: "Magdalene Edozie",  financeReview: "Oluwaseun Sowemimo" },
  Operations:  { lineManager: "Johnson Ibikunle",  financeReview: "Oluwaseun Sowemimo" },
  Marketing:   { lineManager: "Chioma Okafor",     financeReview: "Oluwaseun Sowemimo" },
  HR:          { lineManager: "Adaeze Nwosu",      financeReview: "Oluwaseun Sowemimo" },
  IT:          { lineManager: "Emeka Udoh",        financeReview: "Oluwaseun Sowemimo" },
  Sales:       { lineManager: "Bola Adeyemi",      financeReview: "Oluwaseun Sowemimo" },
  Procurement: { lineManager: "Ifeanyi Chukwu",    financeReview: "Oluwaseun Sowemimo" },
  Admin:       { lineManager: "Grace Obi",         financeReview: "Oluwaseun Sowemimo" },
  Safety:      { lineManager: "David Okeke",       financeReview: "Oluwaseun Sowemimo" },
  Engineering: { lineManager: "Samuel Eze",        financeReview: "Oluwaseun Sowemimo" },
};

export const DEPT_OPTIONS = DEPARTMENTS.map((d) => ({ value: d, label: d }));

export const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
];

export const PRIORITY_OPTIONS = [
  { value: "Low",    label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High",   label: "High" },
  { value: "Urgent", label: "Urgent — Escalate immediately" },
];

export const PAYMENT_TERMS_OPTIONS = [
  { value: "Net 15",     label: "Net 15" },
  { value: "Net 30",     label: "Net 30" },
  { value: "Net 45",     label: "Net 45" },
  { value: "Net 60",     label: "Net 60" },
  { value: "Immediate",  label: "Immediate" },
  { value: "On Receipt", label: "On Receipt" },
];

export const GRN_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No",  label: "No" },
  { value: "N/A", label: "N/A — Not Applicable" },
];

export function genRef(prefix: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `${prefix}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${hex}`;
}

// ── Shared types ──────────────────────────────────────────────────────────────

export interface CashRequest {
  id: string;
  ref: string;
  title: string;
  department: string;
  amount: number;
  requester: string;
  date: string;
  status: string;
  budgetCode?: string;
  priority?: string;
  description?: string;
}

export interface InvoiceRequest {
  id: string;
  ref: string;
  title: string;
  department: string;
  amount: number;
  vendor: string;
  invoiceNo: string;
  requester: string;
  date: string;
  status: string;
  poNumber?: string;
  paymentTerms?: string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export const SEED_CASH_REQUESTS: CashRequest[] = [
  {
    id: "1",
    ref: "CRQ-20260510-A1B2",
    title: "Office supplies — Lagos HQ",
    department: "Admin",
    amount: 185000,
    requester: "Joseph Chika",
    date: "2026-05-10",
    status: "pending",
    budgetCode: "OPEX-2026-ADM",
    priority: "Medium",
    description: "Replenishment of stationery and office consumables for Q2.",
  },
  {
    id: "2",
    ref: "CRQ-20260507-C3D4",
    title: "Generator fuel — Q2 2026",
    department: "Operations",
    amount: 4500000,
    requester: "Ngozi Ibe",
    date: "2026-05-07",
    status: "approved",
    budgetCode: "OPEX-2026-OPS",
    priority: "High",
    description: "Diesel procurement for all generator sets across operational sites.",
  },
  {
    id: "3",
    ref: "CRQ-20260503-E5F6",
    title: "Staff transport — site visit PH",
    department: "Engineering",
    amount: 320000,
    requester: "Emeka Udoh",
    date: "2026-05-03",
    status: "in_progress",
    budgetCode: "OPEX-2026-ENG",
    priority: "Medium",
    description: "Transportation for engineering team to Port Harcourt depot inspection.",
  },
  {
    id: "4",
    ref: "CRQ-20260428-G7H8",
    title: "Safety training materials",
    department: "Safety",
    amount: 150000,
    requester: "David Okeke",
    date: "2026-04-28",
    status: "draft",
    budgetCode: "OPEX-2026-SAF",
    priority: "Low",
    description: "Printed manuals and PPE for Q2 safety induction program.",
  },
];

export const SEED_INVOICES: InvoiceRequest[] = [
  {
    id: "1",
    ref: "INV-20260512-X1Y2",
    title: "Diesel supply — May batch",
    department: "Operations",
    amount: 7800000,
    vendor: "Total Energies Nigeria",
    invoiceNo: "TE-2026-0587",
    requester: "Ada Nwosu",
    date: "2026-05-12",
    status: "pending",
    poNumber: "PO-2026-0312",
    paymentTerms: "Net 30",
  },
  {
    id: "2",
    ref: "INV-20260509-Z3A4",
    title: "PPE restock — Apapa terminal",
    department: "Safety",
    amount: 820000,
    vendor: "SafeGuard Supplies Ltd",
    invoiceNo: "SG-4421",
    requester: "Emeka Obi",
    date: "2026-05-09",
    status: "approved",
    paymentTerms: "Net 15",
  },
  {
    id: "3",
    ref: "INV-20260505-B5C6",
    title: "Compressor parts — PH depot",
    department: "Engineering",
    amount: 2100000,
    vendor: "Atlas Copco Nigeria",
    invoiceNo: "AC-NG-1190",
    requester: "Joseph Chika",
    date: "2026-05-05",
    status: "in_progress",
    poNumber: "PO-2026-0295",
    paymentTerms: "Net 45",
  },
];
