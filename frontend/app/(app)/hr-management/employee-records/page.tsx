"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormFileUpload from "@/components/forms/FormFileUpload";
import DataTable from "@/components/data-table/data-table";
import Modal from "../_components/Modal";
import { createEmployeeRecordColumns } from "../_components/columns";
import { SEED_EMPLOYEE_RECORDS, SEED_EMPLOYEES, type EmployeeRecord } from "../_components/_data";

const DOC_TYPE_OPTIONS = [
  "Employment Contract",
  "ID / Passport Copy",
  "Certificates",
  "Safety Certification",
  "Disciplinary Record",
  "Other",
].map((t) => ({ value: t, label: t }));

const EMPLOYEE_OPTIONS = SEED_EMPLOYEES.map((e) => {
  const name = `${e.firstName} ${e.lastName}`;
  return { value: name, label: name };
});

type FormState = { employee?: string; docType?: string; notes?: string };

export default function EmployeeRecordsPage() {
  const [records, setRecords] = useState<EmployeeRecord[]>(SEED_EMPLOYEE_RECORDS);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormState>({});

  const u = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const remove = (id: string) => setRecords((p) => p.filter((r) => r.id !== id));
  const columns = useMemo(() => createEmployeeRecordColumns(remove), [records]);

  const upload = () => {
    setRecords((p) => [
      {
        id: String(Date.now()),
        employee: form.employee || "—",
        docType: form.docType || "Other",
        fileName: `${(form.employee || "document").replace(/\s+/g, "_")}_${form.docType?.replace(/\s+/g, "_") || "doc"}.pdf`,
        uploadDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        uploadedBy: "HR Admin",
      },
      ...p,
    ]);
    setModal(false);
    setForm({});
  };

  return (
    <AppLayout pageTitle="Employee Records">
      <Link href="/hr-management" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
        <ArrowLeft size={16} /> Back to HR Management
      </Link>

      <PageHeader title="Employee Records" description="Centralised document vault for all employee records" className="mb-6" />

      <DataTable
        columns={columns}
        data={records}
        onNewRequest={() => { setModal(true); setForm({}); }}
        newRequestLabel="Upload Document"
        hideStatusFilter
        emptyMessage="No records yet"
        emptyDescription="Upload your first employee document to get started"
      />

      <Modal open={modal} title="Upload Document" onClose={() => setModal(false)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormSelect
            label="Employee"
            required
            options={EMPLOYEE_OPTIONS}
            placeholder="Select employee"
            value={form.employee ?? ""}
            onValueChange={(v) => u("employee", v)}
          />
          <FormSelect
            label="Document Type"
            required
            options={DOC_TYPE_OPTIONS}
            placeholder="Select type"
            value={form.docType ?? ""}
            onValueChange={(v) => u("docType", v)}
          />
          <div className="md:col-span-2">
            <FormFileUpload label="Upload File" required hint="PDF, DOC, JPG — max 10 MB" />
          </div>
          <div className="md:col-span-2">
            <FormTextarea label="Notes" placeholder="Optional notes about this document…" rows={3} value={form.notes ?? ""} onChange={(e) => u("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-brand-border">
          <Button onClick={upload}>Upload</Button>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
