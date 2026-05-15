"use client";

import { Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProcurementRequest } from "@/types";

const MOCK: ProcurementRequest[] = [
  { id: "1", reference: "PRQ-20240510-A1B2", title: "Generator fuel supply — Q3 2024", description: null, department: "operations", estimated_amount: 4500000, status: "pending", vendor_name: "Total Energies Nigeria", vendor_contact: null, required_by: "2024-07-01", created_by: "user-1", is_active: true, created_at: "2024-05-10", updated_at: null },
  { id: "2", reference: "PRQ-20240508-C3D4", title: "Safety PPE restock — Apapa terminal", description: null, department: "safety", estimated_amount: 820000, status: "approved", vendor_name: "SafeGuard Supplies Ltd", vendor_contact: null, required_by: "2024-05-25", created_by: "user-2", is_active: true, created_at: "2024-05-08", updated_at: null },
  { id: "3", reference: "PRQ-20240505-E5F6", title: "Compressor maintenance parts — PH depot", description: null, department: "engineering", estimated_amount: 2100000, status: "in_progress", vendor_name: "Atlas Copco Nigeria", vendor_contact: null, required_by: "2024-06-10", created_by: "user-3", is_active: true, created_at: "2024-05-05", updated_at: null },
  { id: "4", reference: "PRQ-20240501-G7H8", title: "Office consumables — Lagos HQ", description: null, department: "it", estimated_amount: 150000, status: "draft", vendor_name: null, vendor_contact: null, required_by: null, created_by: "user-4", is_active: true, created_at: "2024-05-01", updated_at: null },
];

const columns: Column<ProcurementRequest>[] = [
  { key: "reference", label: "Reference" },
  { key: "title", label: "Title" },
  { key: "department", label: "Department", render: (v) => <span className="capitalize">{String(v)}</span> },
  { key: "estimated_amount", label: "Estimated Amount", render: (v) => v ? formatCurrency(Number(v)) : "—" },
  { key: "vendor_name", label: "Vendor" },
  { key: "required_by", label: "Required By", render: (v) => formatDate(v as string) },
  { key: "status", label: "Status", render: (v) => <ApprovalBadge status={v as ProcurementRequest["status"]} /> },
];

export default function ProcurementPage() {
  return (
    <AppLayout pageTitle="Procurement">
      <PageHeader
        title="Purchase Requests"
        description="Manage purchase requisitions and vendor approvals"
        action={
          <Button href="/procurement/new" leftIcon={<Plus size={16} />}>
            New Request
          </Button>
        }
        className="mb-6"
      />
      <DataTable columns={columns} data={MOCK} rowHref={(row) => `/procurement/${row.id}`} />
    </AppLayout>
  );
}
