"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Eye, Download, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormTextarea from "@/components/forms/FormTextarea";
import FormFileUpload from "@/components/forms/FormFileUpload";
import Modal from "../_components/Modal";
import { SEED_EMPLOYEE_RECORDS, SEED_EMPLOYEES, type EmployeeRecord } from "../_components/_data";

const SEL =
  "w-full rounded-lg border border-brand-border bg-white px-3 h-10 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition appearance-none";

const DOC_TYPES = [
  "Employment Contract",
  "ID / Passport Copy",
  "Certificates",
  "Safety Certification",
  "Disciplinary Record",
  "Other",
];

const EMPLOYEE_NAMES = SEED_EMPLOYEES.map((e) => `${e.firstName} ${e.lastName}`);

type FormState = {
  employee?: string;
  docType?: string;
  notes?: string;
};

export default function EmployeeRecordsPage() {
  const [records, setRecords] = useState<EmployeeRecord[]>(SEED_EMPLOYEE_RECORDS);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormState>({});

  const u = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const filtered = records.filter((r) =>
    `${r.employee} ${r.docType} ${r.fileName}`.toLowerCase().includes(search.toLowerCase())
  );

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

  const remove = (id: string) => setRecords((p) => p.filter((r) => r.id !== id));

  return (
    <AppLayout pageTitle="Employee Records">
      <Link href="/hr-management" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
        <ArrowLeft size={16} /> Back to HR Management
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader title="Employee Records" description="Centralised document vault for all employee records" />
        <Button onClick={() => { setModal(true); setForm({}); }} className="flex items-center gap-2 shrink-0">
          <Plus size={15} /> Upload Document
        </Button>
      </div>

      <div className="flex-1 relative mb-5">
        <input
          className="w-full rounded-xl border border-brand-border bg-brand-card px-4 py-2.5 pl-9 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple-mid focus:border-brand-purple transition"
          placeholder="Search by employee, document type, file name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-brand-border bg-gray-50/60 text-left">
                {["Employee", "Document Type", "File Name", "Upload Date", "Uploaded By", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-brand-border hover:bg-gray-50/50 transition">
                  <td className="px-5 py-3 font-medium text-brand-text-primary">{r.employee}</td>
                  <td className="px-5 py-3 text-brand-text-secondary">{r.docType}</td>
                  <td className="px-5 py-3 font-mono text-xs text-brand-text-secondary">{r.fileName}</td>
                  <td className="px-5 py-3 text-brand-text-secondary">{r.uploadDate}</td>
                  <td className="px-5 py-3 text-brand-text-secondary">{r.uploadedBy}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-text-secondary transition" title="View">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="Download">
                        <Download size={14} />
                      </button>
                      <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-brand-text-secondary text-sm">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} title="Upload Document" onClose={() => setModal(false)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Employee <span className="text-red-500">*</span></label>
            <select className={SEL} value={form.employee ?? ""} onChange={(e) => u("employee", e.target.value)}>
              <option value="">— Select employee —</option>
              {EMPLOYEE_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Document Type <span className="text-red-500">*</span></label>
            <select className={SEL} value={form.docType ?? ""} onChange={(e) => u("docType", e.target.value)}>
              <option value="">— Select type —</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
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
