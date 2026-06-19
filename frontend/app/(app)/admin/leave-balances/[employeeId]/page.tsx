"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/data-table";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import {
  EMPLOYEE_STORE,
  LEAVE_STORE,
  fmtDate,
  type LeaveRequest,
} from "../../_components/_data";

const columns: Column<LeaveRequest>[] = [
  {
    key: "ref",
    label: "Reference",
    render: (v) => (
      <span className="font-mono text-xs text-brand-text-secondary">{String(v)}</span>
    ),
  },
  { key: "type", label: "Leave Type", sortable: true },
  {
    key: "days",
    label: "Days",
    sortable: true,
    render: (v) => <span className="font-semibold text-brand-text-primary">{String(v)}</span>,
  },
  {
    key: "startDate",
    label: "Start Date",
    sortable: true,
    render: (v) => (
      <span className="whitespace-nowrap text-brand-text-secondary">{fmtDate(String(v))}</span>
    ),
  },
  {
    key: "endDate",
    label: "End Date",
    render: (v) => (
      <span className="whitespace-nowrap text-brand-text-secondary">{fmtDate(String(v))}</span>
    ),
  },
  {
    key: "date",
    label: "Requested",
    render: (v) => (
      <span className="whitespace-nowrap text-brand-text-secondary">{String(v)}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (_, row) => <ApprovalBadge status={row.status} />,
  },
];

export default function EmployeeLeaveRequestsPage() {
  const { employeeId } = useParams<{ employeeId: string }>();

  const employee = EMPLOYEE_STORE.find((e) => e.id === employeeId);
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : "";
  const requests = LEAVE_STORE.filter((r) => r.employee === employeeName);

  return (
    <AppLayout pageTitle="Leave Requests">
      <Link
        href="/admin/leave-balances"
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Leave Balances
      </Link>

      <PageHeader
        title={employeeName || "Employee"}
        description={
          employee
            ? `${employee.title} · ${employee.department} — leave request history`
            : "Leave request history"
        }
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={requests}
        hideStatusFilter
        newRequestLabel=""
        rowHref={(row) => `/admin/leave-requests/${row.id}`}
        emptyMessage="No leave requests found"
        emptyDescription={`${employeeName} has not submitted any leave requests yet`}
      />
    </AppLayout>
  );
}
