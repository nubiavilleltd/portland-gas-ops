import type { Column } from "./data-table";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface CashRequest {
  id: string;
  ref: string;
  title: string;
  department: string;
  amount: number;
  requester: string;
  date: string;
  status: string;
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
}

export const cashRequisitionColumns: Column<CashRequest>[] = [
  {
    key: "ref",
    label: "Reference",
    sortable: true,
    render: (v) => (
      <span className="font-mono text-xs text-brand-text-secondary">{String(v)}</span>
    ),
  },
  {
    key: "title",
    label: "Title",
    sortable: true,
    render: (v) => (
      <span className="font-medium max-w-[200px] truncate block">{String(v)}</span>
    ),
  },
  { key: "department", label: "Department", sortable: true },
  {
    key: "amount",
    label: "Amount",
    sortable: true,
    render: (v) => (
      <span className="font-semibold whitespace-nowrap">{formatCurrency(Number(v))}</span>
    ),
  },
  { key: "requester", label: "Requester", sortable: true },
  {
    key: "date",
    label: "Date",
    sortable: true,
    render: (v) => (
      <span className="text-brand-text-secondary whitespace-nowrap">{formatDate(String(v))}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (v) => <ApprovalBadge status={String(v)} />,
  },
];

export const invoiceColumns: Column<InvoiceRequest>[] = [
  {
    key: "ref",
    label: "Reference",
    sortable: true,
    render: (v) => (
      <span className="font-mono text-xs text-brand-text-secondary">{String(v)}</span>
    ),
  },
  {
    key: "title",
    label: "Title",
    sortable: true,
    render: (v) => (
      <span className="font-medium max-w-[200px] truncate block">{String(v)}</span>
    ),
  },
  { key: "department", label: "Department", sortable: true },
  {
    key: "amount",
    label: "Amount",
    sortable: true,
    render: (v) => (
      <span className="font-semibold whitespace-nowrap">{formatCurrency(Number(v))}</span>
    ),
  },
  { key: "vendor", label: "Vendor", sortable: true },
  {
    key: "invoiceNo",
    label: "Invoice #",
    sortable: true,
    render: (v) => (
      <span className="font-mono text-xs text-brand-text-secondary">{String(v)}</span>
    ),
  },
  {
    key: "date",
    label: "Date",
    sortable: true,
    render: (v) => (
      <span className="text-brand-text-secondary whitespace-nowrap">{formatDate(String(v))}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (v) => <ApprovalBadge status={String(v)} />,
  },
];
