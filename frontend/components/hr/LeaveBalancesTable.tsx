"use client";

import Link from "next/link";
import DataTable from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/data-table";
import { useAllLeaveBalances } from "@/lib/modules/leave-balances/hooks";
import { useLeaveTypes } from "@/lib/modules/leave-types/hooks";

const YEAR = new Date().getFullYear();

interface BalanceInfo {
  remaining: number;
  entitlement: number;
  used: number;
}

interface LeaveBalanceRow {
  id: string;
  name: string;
  title: string;
  department: string;
  balances: Record<number, BalanceInfo>;
}

function BalancePill({ bal }: { bal: BalanceInfo }) {
  const pct = bal.entitlement > 0 ? (bal.remaining / bal.entitlement) * 100 : 100;
  const color =
    pct <= 20
      ? "text-red-600 bg-red-50 border-red-200"
      : pct <= 50
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-green-700 bg-green-50 border-green-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${color}`}>
      {bal.remaining}/{bal.entitlement} days
    </span>
  );
}

/**
 * All-employees leave-balance table. Columns are built dynamically from the
 * active leave types, so adding/removing a type in setup flows through without
 * code changes. `rowHref` differs per surface (HR -> employee profile,
 * admin -> per-employee detail page).
 */
export default function LeaveBalancesTable({
  rowHref,
}: {
  rowHref: (row: LeaveBalanceRow) => string;
}) {
  const { data: balances = [], isLoading } = useAllLeaveBalances(YEAR);
  const { data: leaveTypesResponse } = useLeaveTypes({ limit: 100, is_active: true });
  const leaveTypes = leaveTypesResponse?.data || [];

  const rows: LeaveBalanceRow[] = balances.map((emp) => ({
    id: emp.employee_id,
    name: emp.name,
    title: emp.job_title ?? "",
    department: emp.department ?? "—",
    balances: Object.fromEntries(
      emp.balances.map((b) => [
        b.leave_type_id,
        { entitlement: b.entitlement, used: b.used, remaining: Math.max(0, b.remaining) },
      ]),
    ),
  }));

  const columns: Column<LeaveBalanceRow>[] = [
    {
      key: "name",
      label: "Employee",
      sortable: true,
      render: (v, row) => (
        <Link
          href={rowHref(row)}
          className="font-medium text-brand-purple hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(v)}
          {row.title && (
            <span className="block text-xs text-brand-text-secondary font-normal">{row.title}</span>
          )}
        </Link>
      ),
    },
    { key: "department", label: "Department", sortable: true },
    ...leaveTypes.map((lt) => ({
      key: `lt_${lt.id}`,
      label: lt.leave_type_name,
      render: (_v: unknown, row: LeaveBalanceRow) => {
        const bal = row.balances[lt.id];
        return bal ? <BalancePill bal={bal} /> : <span className="text-brand-text-secondary">—</span>;
      },
    })),
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      hideStatusFilter
      newRequestLabel=""
      rowHref={rowHref}
      emptyMessage="No employees found"
      emptyDescription="Add employees to track leave balances"
    />
  );
}
