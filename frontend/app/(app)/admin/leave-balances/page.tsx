"use client";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/data-table";
import {
  EMPLOYEE_STORE,
  calcLeaveBalance,
} from "../_components/_data";

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
  annual: BalanceInfo;
  sick: BalanceInfo;
  casual: BalanceInfo;
  maternity: BalanceInfo;
  paternity: BalanceInfo;
  compassionate: BalanceInfo;
  study: BalanceInfo;
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

const columns: Column<LeaveBalanceRow>[] = [
  {
    key: "name",
    label: "Employee",
    sortable: true,
    render: (v, row) => (
      <Link
        href={`/admin/leave-balances/${row.id}`}
        className="font-medium text-brand-purple hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {String(v)}
        <span className="block text-xs text-brand-text-secondary font-normal">{row.title}</span>
      </Link>
    ),
  },
  { key: "department", label: "Department", sortable: true },
  {
    key: "annual",
    label: "Annual Leave",
    render: (v) => <BalancePill bal={v as BalanceInfo} />,
  },
  {
    key: "sick",
    label: "Sick Leave",
    render: (v) => <BalancePill bal={v as BalanceInfo} />,
  },
  {
    key: "casual",
    label: "Casual Leave",
    render: (v) => <BalancePill bal={v as BalanceInfo} />,
  },
  {
    key: "maternity",
    label: "Maternity Leave",
    render: (v) => <BalancePill bal={v as BalanceInfo} />,
  },
  {
    key: "paternity",
    label: "Paternity Leave",
    render: (v) => <BalancePill bal={v as BalanceInfo} />,
  },
  {
    key: "compassionate",
    label: "Compassionate",
    render: (v) => <BalancePill bal={v as BalanceInfo} />,
  },
  {
    key: "study",
    label: "Study Leave",
    render: (v) => <BalancePill bal={v as BalanceInfo} />,
  },
];

function buildRows(): LeaveBalanceRow[] {
  return EMPLOYEE_STORE.map((emp) => {
    const name = `${emp.firstName} ${emp.lastName}`;
    const bal = (type: string) => calcLeaveBalance(name, type, YEAR);
    return {
      id: emp.id,
      name,
      title: emp.title,
      department: emp.department,
      annual:       bal("Annual Leave"),
      sick:         bal("Sick Leave"),
      casual:       bal("Casual Leave"),
      maternity:    bal("Maternity Leave"),
      paternity:    bal("Paternity Leave"),
      compassionate: bal("Compassionate Leave"),
      study:        bal("Study Leave"),
    };
  });
}

export default function LeaveBalancesPage() {
  const rows = buildRows();

  return (
    <AppLayout pageTitle="Leave Balances">
      <PageHeader
        title="Leave Balances"
        description={`Annual leave entitlement and usage — ${YEAR}`}
        className="mb-6"
      />
      <DataTable
        columns={columns}
        data={rows}
        hideStatusFilter
        newRequestLabel=""
        rowHref={(row) => `/admin/leave-balances/${row.id}`}
        emptyMessage="No employees found"
        emptyDescription="Add employees to track leave balances"
      />
    </AppLayout>
  );
}
