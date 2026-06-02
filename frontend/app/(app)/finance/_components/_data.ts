export const DEPARTMENTS = [
  "Finance", "Operations", "Marketing", "HR", "IT",
  "Sales", "Procurement", "Admin", "Safety", "Engineering",
] as const;

export const APPROVERS: Record<string, { lineManager: string; financeReview: string }> = {
  Finance:     { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
  Operations:  { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
  Marketing:   { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
  HR:          { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
  IT:          { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
  Sales:       { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
  Procurement: { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
  Admin:       { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
  Safety:      { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
  Engineering: { lineManager: "Samuel Eze", financeReview: "Oluwaseun Sowemimo" },
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

export const VENDOR_OPTIONS = [
  { value: "Total Energies Nigeria", label: "Total Energies Nigeria" },
  { value: "SafeGuard Supplies Ltd", label: "SafeGuard Supplies Ltd" },
  { value: "Atlas Copco Nigeria",    label: "Atlas Copco Nigeria" },
  { value: "Dangote PPE Supplies",   label: "Dangote PPE Supplies" },
  { value: "TechHub IT Solutions",   label: "TechHub IT Solutions" },
  { value: "Swift Logistics Ltd",    label: "Swift Logistics Ltd" },
];

export const PURCHASE_ORDERS: { value: string; label: string; title: string }[] = [
  { value: "PR-2025-001", label: "PR-2025-001", title: "Generator fuel supply — Q2 2025" },
  { value: "PR-2025-002", label: "PR-2025-002", title: "PPE restock — safety helmets and gloves" },
  { value: "PR-2025-003", label: "PR-2025-003", title: "IT equipment upgrade — 3 laptops" },
];

export function genRef(prefix: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
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
  jobTitle?: string;
  date: string;
  status: string;
  currency?: string;
  expectedRetirement?: string;
  description?: string;
  supportingDocuments?: string[];
}

export interface InvoiceRequest {
  id: string;
  ref: string;
  title: string;
  description?: string;
  department: string;
  amount: number;
  vendor: string;
  invoiceId?: string;
  invoiceNo: string;
  requester: string;
  jobTitle?: string;
  date: string;
  status: string;
  poNumber?: string;
  paymentTerms?: string;
  currency?: string;
  grossAmount?: number;
  taxAmount?: number;
  supportingDocuments?: string[];
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
    jobTitle: "Administrative Officer",
    date: "2026-05-10",
    status: "pending",
    currency: "NGN",
    expectedRetirement: "2026-05-17",
    description: "Replenishment of stationery and office consumables for Q2.",
    supportingDocuments: ["stationery-quote.pdf", "vendor-list.xlsx"],
  },
  {
    id: "2",
    ref: "CRQ-20260507-C3D4",
    title: "Generator fuel — Q2 2026",
    department: "Operations",
    amount: 4500000,
    requester: "Ngozi Ibe",
    jobTitle: "Operations Manager",
    date: "2026-05-07",
    status: "approved",
    currency: "NGN",
    expectedRetirement: "2026-05-14",
    description: "Diesel procurement for all generator sets across operational sites.",
  },
  {
    id: "3",
    ref: "CRQ-20260503-E5F6",
    title: "Staff transport — site visit PH",
    department: "Engineering",
    amount: 320000,
    requester: "Emeka Udoh",
    jobTitle: "Senior Engineer",
    date: "2026-05-03",
    status: "in_progress",
    currency: "NGN",
    expectedRetirement: "2026-05-10",
    description: "Transportation for engineering team to Port Harcourt depot inspection.",
    supportingDocuments: ["travel-itinerary.pdf"],
  },
  {
    id: "4",
    ref: "CRQ-20260428-G7H8",
    title: "Safety training materials",
    department: "Safety",
    amount: 150000,
    requester: "David Okeke",
    jobTitle: "HSE Officer",
    date: "2026-04-28",
    status: "draft",
    currency: "NGN",
    expectedRetirement: "2026-05-05",
    description: "Printed manuals and PPE for Q2 safety induction program.",
  },
];

export const SEED_INVOICES: InvoiceRequest[] = [
  {
    id: "1",
    ref: "INV-20260512-X1Y2",
    title: "Diesel supply — May batch",
    description: "Supply of automotive gas oil (AGO) for all operational generator sets and vehicles across Lagos and PH sites for the month of May 2026.",
    department: "Operations",
    amount: 7800000,
    vendor: "Total Energies Nigeria",
    invoiceId: "IID-20260512-A1B2",
    invoiceNo: "TE-2026-0587",
    requester: "Ada Nwosu",
    jobTitle: "Operations Manager",
    date: "2026-05-12",
    status: "pending",
    poNumber: "PO-2026-0312",
    paymentTerms: "Net 30",
    currency: "NGN",
    grossAmount: 8580000,
    taxAmount: 780000,
    supportingDocuments: ["TE-2026-0587-invoice.pdf", "delivery-note.pdf"],
  },
  {
    id: "2",
    ref: "INV-20260509-Z3A4",
    title: "PPE restock — Apapa terminal",
    description: "Restocking of personal protective equipment including hard hats, safety boots, reflective vests, and gloves for the Apapa terminal workforce.",
    department: "Safety",
    amount: 820000,
    vendor: "SafeGuard Supplies Ltd",
    invoiceId: "IID-20260509-C3D4",
    invoiceNo: "SG-4421",
    requester: "Emeka Obi",
    jobTitle: "HSE Officer",
    date: "2026-05-09",
    status: "approved",
    paymentTerms: "Net 15",
    currency: "NGN",
    grossAmount: 820000,
    supportingDocuments: ["SG-4421.pdf"],
  },
  {
    id: "3",
    ref: "INV-20260505-B5C6",
    title: "Compressor parts — PH depot",
    description: "Supply of replacement parts for Atlas Copco GA55 rotary screw compressors at the Port Harcourt depot, including air filters, oil separators, and drive belts.",
    department: "Engineering",
    amount: 2100000,
    vendor: "Atlas Copco Nigeria",
    invoiceId: "IID-20260505-E5F6",
    invoiceNo: "AC-NG-1190",
    requester: "Joseph Chika",
    jobTitle: "Finance Manager",
    date: "2026-05-05",
    status: "in_progress",
    poNumber: "PO-2026-0295",
    paymentTerms: "Net 45",
    currency: "NGN",
    grossAmount: 2310000,
    taxAmount: 210000,
    supportingDocuments: ["AC-NG-1190.pdf", "PO-2026-0295.pdf"],
  },
];

export const CASH_STORE: CashRequest[] = [...SEED_CASH_REQUESTS];
export const INVOICE_STORE: InvoiceRequest[] = [...SEED_INVOICES];
