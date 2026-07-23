"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/data-table";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { formatDate } from "@/lib/utils";
import { useEmployee } from "@/lib/modules/employees/hooks";
import { useLeaveRequests } from "@/lib/modules/leave-requests/hooks";
import type { LeaveRequest } from "@/app/(app)/hr-management/_components/_data";

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
      <span className="whitespace-nowrap text-brand-text-secondary">{formatDate(String(v))}</span>
    ),
  },
  {
    key: "endDate",
    label: "End Date",
    render: (v) => (
      <span className="whitespace-nowrap text-brand-text-secondary">{formatDate(String(v))}</span>
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
    key: "reliever",
    label: "Reliever",
    render: (v) =>
      v ? (
        <span className="whitespace-nowrap text-brand-text-secondary">{String(v)}</span>
      ) : (
        <span className="text-brand-text-secondary">—</span>
      ),
  },
  {
    key: "nextActor",
    label: "Next Approver",
    render: (v, row) => {
      // A returned request sits with the requester, mirroring the detail header.
      const isReturned = row.status === "returned";
      const actorName = isReturned ? (row.requester ?? row.employee) : v;
      const actorRole = isReturned ? "Requester" : row.currentStepName;
      return actorName ? (
        <span className="whitespace-nowrap text-brand-text-primary">
          {String(actorName)}
          {actorRole ? (
            <span className="block text-[11px] text-brand-text-secondary">{actorRole}</span>
          ) : null}
        </span>
      ) : (
        <span className="text-brand-text-secondary">—</span>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    render: (_, row) => <ApprovalBadge status={row.status} />,
  },
];

export default function EmployeeLeaveRequestsPage() {
  const { employeeId } = useParams<{ employeeId: string }>();

  const { data: employee } = useEmployee(employeeId);
  const { data: requestsResponse, isLoading } = useLeaveRequests({
    employee_id: employeeId,
    limit: 100,
  });
  const requests = requestsResponse?.data ?? [];

  const employeeName = employee?.user
    ? `${employee.user.first_name ?? ""} ${employee.user.last_name ?? ""}`.trim()
    : "";

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
            ? `${employee.job_title ?? "—"} · ${employee.department ?? "—"} — leave request history`
            : "Leave request history"
        }
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        hideStatusFilter
        newRequestLabel=""
        rowHref={(row) => `/hr-management/leave-requests/${row.id}`}
        emptyMessage="No leave requests found"
        emptyDescription={`${employeeName || "This employee"} has not submitted any leave requests yet`}
      />
    </AppLayout>
  );
}
