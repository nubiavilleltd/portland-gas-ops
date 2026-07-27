"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable from "@/components/data-table/data-table";
import { createEmployeeColumns } from "../_components/columns";
import { EMPLOYEE_STORE, type Employee } from "../_components/_data";

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEE_STORE);

  const removeEmp = (id: string) => {
    const idx = EMPLOYEE_STORE.findIndex((e) => e.id === id);
    if (idx !== -1) EMPLOYEE_STORE.splice(idx, 1);
    setEmployees((p) => p.filter((e) => e.id !== id));
  };

  const empColumns = useMemo(() => createEmployeeColumns(removeEmp), [employees]);

  return (
    <AppLayout pageTitle="Employee Profile">
      <PageHeader
        title="Employee Profile"
        description="Manage employee profiles and records"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={() => router.push("/hr-management/employees/new")}>
            Add Employee
          </Button>
        }
        className="mb-6"
      />

      <DataTable
        columns={empColumns}
        data={employees}
        hideStatusFilter
        emptyMessage="No employees yet"
        emptyDescription="Add your first employee to get started"
      />
    </AppLayout>
  );
}
