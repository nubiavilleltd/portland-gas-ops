"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
  SEED_EMPLOYEES,
  HR_DEPT_OPTIONS,
  CATEGORY_OPTIONS,
  GRADE_OPTIONS,
  type Employee,
} from "../_components/_data";

type FormState = Partial<Employee>;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({});

  const u = (k: keyof Employee, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => { setForm({}); setEditId(null); setModal(true); };
  const openEdit = (emp: Employee) => { setForm({ ...emp }); setEditId(emp.id); setModal(true); };
  const remove = (id: string) => setEmployees((p) => p.filter((e) => e.id !== id));

  const columns = useMemo(() => createEmployeeColumns(openEdit, remove), [employees]);

  const save = () => {
    if (editId) {
      setEmployees((p) => p.map((e) => (e.id === editId ? { ...e, ...form } as Employee : e)));
    } else {
      setEmployees((p) => [...p, { ...form, id: String(Date.now()) } as Employee]);
    }
    setModal(false);
    setForm({});
  };

  return (
    <AppLayout pageTitle="Employee Profile">
      <Link href="/hr-management" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
        <ArrowLeft size={16} /> Back to HR Management
      </Link>

      <PageHeader
        title="Employee Profile"
        description="Manage employee profiles and records"
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={employees}
        onNewRequest={openAdd}
        newRequestLabel="Add Employee"
        emptyMessage="No employees yet"
        emptyDescription="Add your first employee to get started"
      />

      <Modal
        open={modal}
        title={editId ? "Edit Employee" : "Add Employee"}
        onClose={() => setModal(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormInput
            label="First Name"
            required
            placeholder="First name"
            value={form.firstName ?? ""}
            onChange={(e) => u("firstName", e.target.value)}
          />
          <FormInput
            label="Last Name"
            required
            placeholder="Last name"
            value={form.lastName ?? ""}
            onChange={(e) => u("lastName", e.target.value)}
          />
          <FormInput
            label="Email"
            required
            type="email"
            placeholder="email@portlandgas.com"
            value={form.email ?? ""}
            onChange={(e) => u("email", e.target.value)}
          />
          <FormInput
            label="Job Title"
            required
            placeholder="e.g. Software Developer"
            value={form.title ?? ""}
            onChange={(e) => u("title", e.target.value)}
          />

          <FormSelect
            label="Department"
            required
            options={HR_DEPT_OPTIONS}
            placeholder="Select department"
            value={form.department ?? ""}
            onValueChange={(v) => u("department", v)}
          />

          <FormSelect
            label="Category"
            required
            options={CATEGORY_OPTIONS}
            placeholder="Select category"
            value={form.category ?? ""}
            onValueChange={(v) => u("category", v)}
          />

          <FormDatePicker
            label="Birthday"
            value={form.birthday ?? ""}
            onValueChange={(v) => u("birthday", v)}
          />

          <FormSelect
            label="Grade Level"
            required
            options={GRADE_OPTIONS}
            placeholder="Select grade level"
            value={form.grade ?? ""}
            onValueChange={(v) => u("grade", v)}
          />
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-brand-border">
          <Button onClick={save}>{editId ? "Update" : "Create"} Employee</Button>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
