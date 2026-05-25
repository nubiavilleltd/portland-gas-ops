"use client";

import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import DataTable from "@/components/data-table/data-table";
import Modal from "../_components/Modal";
import { createEmployeeColumns } from "../_components/columns";
import {
  EMPLOYEE_STORE,
  HR_DEPT_OPTIONS,
  CATEGORY_OPTIONS,
  GRADE_OPTIONS,
  type Employee,
} from "../_components/_data";

type EmployeeFormState = Partial<Employee>;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEE_STORE);
  const [empModal, setEmpModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState<EmployeeFormState>({});

  const ue = (k: keyof Employee, v: string) => setEmpForm((p) => ({ ...p, [k]: v }));
  const un = (k: keyof Employee, v: string) => setEmpForm((p) => ({ ...p, [k]: v === "" ? undefined : Number(v) }));

  const openAdd  = () => { setEmpForm({}); setEditId(null); setEmpModal(true); };
  const openEdit = (emp: Employee) => { setEmpForm({ ...emp }); setEditId(emp.id); setEmpModal(true); };
  const removeEmp = (id: string) => {
    const idx = EMPLOYEE_STORE.findIndex((e) => e.id === id);
    if (idx !== -1) EMPLOYEE_STORE.splice(idx, 1);
    setEmployees((p) => p.filter((e) => e.id !== id));
  };

  const empColumns = useMemo(() => createEmployeeColumns(openEdit, removeEmp), [employees]);

  const managerOptions = employees.map((e) => ({
    value: e.email,
    label: `${e.firstName} ${e.lastName}`,
  }));

  const saveEmployee = () => {
    if (editId) {
      setEmployees((p) => p.map((e) => (e.id === editId ? { ...e, ...empForm } as Employee : e)));
    } else {
      setEmployees((p) => [...p, { ...empForm, id: String(Date.now()) } as Employee]);
    }
    setEmpModal(false);
    setEmpForm({});
  };

  return (
    <AppLayout pageTitle="Employee Profile">
      <PageHeader
        title="Employee Profile"
        description="Manage employee profiles and records"
        className="mb-6"
      />

      <DataTable
        columns={empColumns}
        data={employees}
        onNewRequest={openAdd}
        newRequestLabel="Add Employee"
        hideStatusFilter
        emptyMessage="No employees yet"
        emptyDescription="Add your first employee to get started"
      />

      {/* ── Add / Edit Employee Modal ── */}
      <Modal
        open={empModal}
        title={editId ? "Edit Employee" : "Add Employee"}
        onClose={() => setEmpModal(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormInput
            label="First Name"
            required
            placeholder="First name"
            value={empForm.firstName ?? ""}
            onChange={(e) => ue("firstName", e.target.value)}
          />
          <FormInput
            label="Last Name"
            required
            placeholder="Last name"
            value={empForm.lastName ?? ""}
            onChange={(e) => ue("lastName", e.target.value)}
          />
          <FormInput
            label="Email"
            required
            type="email"
            placeholder="email@portlandgas.com"
            value={empForm.email ?? ""}
            onChange={(e) => ue("email", e.target.value)}
          />
          <FormInput
            label="Job Title"
            required
            placeholder="e.g. Software Developer"
            value={empForm.title ?? ""}
            onChange={(e) => ue("title", e.target.value)}
          />
          <FormSelect
            label="Department"
            required
            options={HR_DEPT_OPTIONS}
            placeholder="Select department"
            value={empForm.department ?? ""}
            onValueChange={(v) => ue("department", v)}
          />
          <FormSelect
            label="Category"
            required
            options={CATEGORY_OPTIONS}
            placeholder="Select category"
            value={empForm.category ?? ""}
            onValueChange={(v) => ue("category", v)}
          />
          <FormDatePicker
            label="Birthday"
            value={empForm.birthday ?? ""}
            onValueChange={(v) => ue("birthday", v)}
          />
          <FormSelect
            label="Grade Level"
            required
            options={GRADE_OPTIONS}
            placeholder="Select grade level"
            value={empForm.grade ?? ""}
            onValueChange={(v) => ue("grade", v)}
          />
          <FormSelect
            label="Line Manager"
            options={managerOptions}
            placeholder="Select line manager"
            value={empForm.lineManagerEmail ?? ""}
            onValueChange={(email) => {
              const mgr = employees.find((e) => e.email === email);
              setEmpForm((p) => ({
                ...p,
                lineManager: mgr ? `${mgr.firstName} ${mgr.lastName}` : "",
                lineManagerEmail: email,
              }));
            }}
          />
          <FormInput
            label="Line Manager Email"
            type="email"
            value={empForm.lineManagerEmail ?? ""}
            disabled
          />

          <p className="md:col-span-2 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide pt-2 border-t border-brand-border">
            Earnings
          </p>
          <FormInput
            label="Basic Salary"
            type="number"
            min={0}
            placeholder="0"
            value={empForm.basicSalary !== undefined ? String(empForm.basicSalary) : ""}
            onChange={(e) => un("basicSalary", e.target.value)}
          />
          <FormInput
            label="Housing Allowance"
            type="number"
            min={0}
            placeholder="0"
            value={empForm.housingAllowance !== undefined ? String(empForm.housingAllowance) : ""}
            onChange={(e) => un("housingAllowance", e.target.value)}
          />
          <FormInput
            label="Transport Allowance"
            type="number"
            min={0}
            placeholder="0"
            value={empForm.transportAllowance !== undefined ? String(empForm.transportAllowance) : ""}
            onChange={(e) => un("transportAllowance", e.target.value)}
          />
          <FormInput
            label="Meal Allowance"
            type="number"
            min={0}
            placeholder="0"
            value={empForm.mealAllowance !== undefined ? String(empForm.mealAllowance) : ""}
            onChange={(e) => un("mealAllowance", e.target.value)}
          />

          <p className="md:col-span-2 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide pt-2 border-t border-brand-border">
            Deductions
          </p>
          <FormInput
            label="PAYE Tax"
            type="number"
            min={0}
            placeholder="0"
            value={empForm.paye !== undefined ? String(empForm.paye) : ""}
            onChange={(e) => un("paye", e.target.value)}
          />
          <FormInput
            label="Pension"
            type="number"
            min={0}
            placeholder="0"
            value={empForm.pension !== undefined ? String(empForm.pension) : ""}
            onChange={(e) => un("pension", e.target.value)}
          />
          <FormInput
            label="NHF"
            type="number"
            min={0}
            placeholder="0"
            value={empForm.nhf !== undefined ? String(empForm.nhf) : ""}
            onChange={(e) => un("nhf", e.target.value)}
          />
          <FormInput
            label="Loan Repayment"
            type="number"
            min={0}
            placeholder="0"
            value={empForm.loanRepayment !== undefined ? String(empForm.loanRepayment) : ""}
            onChange={(e) => un("loanRepayment", e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-brand-border">
          <Button onClick={saveEmployee}>{editId ? "Update" : "Create"} Employee</Button>
          <Button variant="outline" onClick={() => setEmpModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
