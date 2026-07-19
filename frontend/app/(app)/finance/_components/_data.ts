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
  requesterId?: string;      // user id of who raised the request
  nextActor?: string;        // current pending step assignee
  currentStepName?: string;  // name of the current pending step
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
    ref: "CRQ-20260512-J1K2",
    title: "Office supplies — Lagos HQ",
    department: "Finance",
    amount: 185000,
    requester: "Joseph Chika",
    jobTitle: "Finance Manager",
    date: "2026-05-12",
    status: "approved",
    currency: "NGN",
    expectedRetirement: "2026-05-19",
    description: "Replenishment of stationery and office consumables for Q2.",
    supportingDocuments: ["stationery-quote.pdf", "vendor-list.xlsx"],
  },
  {
    id: "2",
    ref: "CRQ-20260510-J3L4",
    title: "Equipment maintenance supplies",
    department: "Finance",
    amount: 250000,
    requester: "Joseph Chika",
    jobTitle: "Finance Manager",
    date: "2026-05-10",
    status: "pending",
    currency: "NGN",
    expectedRetirement: "2026-05-17",
    description: "Maintenance supplies for office equipment and IT infrastructure.",
  },
  {
    id: "3",
    ref: "CRQ-20260508-J5M6",
    title: "Training materials — Finance team",
    department: "Finance",
    amount: 120000,
    requester: "Joseph Chika",
    jobTitle: "Finance Manager",
    date: "2026-05-08",
    status: "denied",
    currency: "NGN",
    expectedRetirement: "2026-05-15",
    description: "Professional development materials for finance staff.",
  },
];

export const SEED_INVOICES: InvoiceRequest[] = [
  {
    id: "1",
    ref: "INV-20260512-J1K2",
    title: "Office equipment supplies",
    description: "Office furniture and computer peripherals for finance department.",
    department: "Finance",
    amount: 450000,
    vendor: "TechOffice Solutions Ltd",
    invoiceId: "IID-20260512-J1K2",
    invoiceNo: "TOS-2026-0145",
    requester: "Joseph Chika",
    jobTitle: "Finance Manager",
    date: "2026-05-12",
    status: "approved",
    poNumber: "PO-2026-0425",
    paymentTerms: "Net 30",
    currency: "NGN",
    grossAmount: 495000,
    taxAmount: 45000,
    supportingDocuments: ["TOS-2026-0145.pdf"],
  },
  {
    id: "2",
    ref: "INV-20260510-J3L4",
    title: "Software licenses — Finance systems",
    description: "Annual renewal of accounting and financial management software licenses.",
    department: "Finance",
    amount: 680000,
    vendor: "CloudTech Solutions",
    invoiceId: "IID-20260510-J3L4",
    invoiceNo: "CTS-2026-0234",
    requester: "Joseph Chika",
    jobTitle: "Finance Manager",
    date: "2026-05-10",
    status: "pending",
    poNumber: "PO-2026-0418",
    paymentTerms: "Net 45",
    currency: "NGN",
    grossAmount: 748000,
    taxAmount: 68000,
    supportingDocuments: ["CTS-2026-0234.pdf", "license-agreement.pdf"],
  },
  {
    id: "3",
    ref: "INV-20260508-J5M6",
    title: "Audit services — Q1 2026",
    description: "Professional audit services for Q1 2026 financial statements and compliance review.",
    department: "Finance",
    amount: 950000,
    vendor: "Ernst & Young Nigeria",
    invoiceId: "IID-20260508-J5M6",
    invoiceNo: "EY-2026-0089",
    requester: "Joseph Chika",
    jobTitle: "Finance Manager",
    date: "2026-05-08",
    status: "denied",
    paymentTerms: "Net 30",
    currency: "NGN",
    grossAmount: 1045000,
    taxAmount: 95000,
    supportingDocuments: ["EY-2026-0089.pdf"],
  },
];

export const CASH_STORE: CashRequest[] = [...SEED_CASH_REQUESTS];
export const INVOICE_STORE: InvoiceRequest[] = [...SEED_INVOICES];
