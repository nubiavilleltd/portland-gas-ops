"use client";

import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import { BackButton } from "@/components/ui/BackButton";
import DataTable from "@/components/data-table/data-table";
import { createEmployeeColumns } from "../_components/columns";
import type { Employee } from "../_components/_data";
import { useEmployees } from "@/lib/modules/employees/hooks";
import type { EmployeeListItem } from "@/lib/modules/employees/types";

function toRow(e: EmployeeListItem): Employee {
  const mgrUser = e.operating_manager?.user;
  const managerName = mgrUser
    ? `${mgrUser.first_name ?? ""} ${mgrUser.last_name ?? ""}`.trim()
    : "";
  return {
    id:                 e.id,
    firstName:          e.user?.first_name  ?? "",
    lastName:           e.user?.last_name   ?? "",
    email:              e.user?.email       ?? "",
    title:              e.job_title         ?? "—",
    department:         e.department        ?? "—",
    birthday:           e.birthday          ?? "",
    category:           e.employment_type   ?? "—",
    grade:              "",
    lineManager:        managerName         || undefined,
    lineManagerEmail:   undefined,
    basicSalary:        e.basic_salary        ? Number(e.basic_salary)        : undefined,
    housingAllowance:   e.housing_allowance   ? Number(e.housing_allowance)   : undefined,
    transportAllowance: e.transport_allowance ? Number(e.transport_allowance) : undefined,
    mealAllowance:      e.meal_allowance      ? Number(e.meal_allowance)      : undefined,
    paye:               e.paye               ? Number(e.paye)               : undefined,
    pension:            e.pension            ? Number(e.pension)            : undefined,
    nhf:                e.nhf               ? Number(e.nhf)               : undefined,
    loanRepayment:      e.loan_outstanding   ? Number(e.loan_outstanding)  : undefined, // shown as "Outstanding Amount"
  };
}

export default function EmployeesPage() {
  const { data: employees = [], isLoading } = useEmployees({ limit: 200 });
  const rows = useMemo(() => employees.map(toRow), [employees]);

  const empColumns = useMemo(() => createEmployeeColumns(), []);

  return (
    <AppLayout pageTitle="Employee Profile">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="Employee Profiles"
        description="View and manage employee profiles and records"
        // Add Employee button intentionally hidden — use Account Management to create employees
        className="mb-6"
      />

      <DataTable
        columns={empColumns}
        data={rows}
        hideStatusFilter
        isLoading={isLoading}
        emptyMessage="No employees yet"
        emptyDescription="Create employee accounts from Account Management to get started"
        rowHref={(row) => `/admin/employees/${row.id}`}
      />
    </AppLayout>
  );
}
