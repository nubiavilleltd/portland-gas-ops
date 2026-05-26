"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import DataTable from "@/components/data-table/data-table";
import { cashRequisitionColumns } from "@/components/data-table/columns";
import WorkflowPath from "../_components/WorkflowPath";
import ApprovalStepper from "../_components/ApprovalStepper";
import ActivityHistory from "../_components/ActivityHistory";
import {
  DEPT_OPTIONS,
  CURRENCY_OPTIONS,
  genRef,
  SEED_CASH_REQUESTS,
  CASH_STORE,
  type CashRequest,
} from "../_components/_data";

const TODAY = new Date().toISOString().split("T")[0];

const CURRENT_USER = {
  name: "Joseph Chika",
  department: "Finance",
  role: "Finance Manager",
};

const schema = z.object({
  title:               z.string().min(3, "Title is required"),
  currency:            z.string().min(1, "Select a currency"),
  amount:              z.string().min(1, "Amount is required"),
  description:         z.string().min(5, "Description is required"),
});

type FormData = z.infer<typeof schema>;

type View = "list" | "form" | "submitted";

interface SubmittedInfo {
  ref: string;
  requester: string;
  department: string;
  submittedAt: Date;
}

const APPROVAL_ROUTE = ["Initiator (You)", "Line Manager", "Finance Review", "Processed"];

export default function CashRequisitionsPage() {
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<CashRequest[]>(SEED_CASH_REQUESTS);
  const [submitted, setSubmitted] = useState<SubmittedInfo | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { formState: { errors, isSubmitting } } = form;

  function onSubmit(data: FormData) {
    const ref = genRef("CRQ");
    const newItem: CashRequest = {
      id: ref,
      ref,
      title: data.title,
      department: CURRENT_USER.department,
      amount: parseFloat(data.amount),
      requester: CURRENT_USER.name,
      jobTitle: CURRENT_USER.role,
      date: TODAY,
      status: "pending",
      currency: data.currency,
      description: data.description,
      supportingDocuments: supportingFiles.length > 0
        ? supportingFiles.map((f) => f.name)
        : undefined,
    };
    CASH_STORE.unshift(newItem);
    setItems((prev) => [newItem, ...prev]);
    setSubmitted({
      ref,
      requester: CURRENT_USER.name,
      department: CURRENT_USER.department,
      submittedAt: new Date(),
    });
    setView("submitted");
  }

  function goBack() {
    setView("list");
    form.reset();
    setSupportingFiles([]);
    setSubmitted(null);
  }

  return (
    <AppLayout pageTitle="Cash Requisition">

      {/* ── LIST ── */}
      {view === "list" && (
        <>
          <PageHeader
            title="Cash Requisitions"
            description="Manage cash requests and approvals"
            action={
              <Button leftIcon={<Plus size={16} />} onClick={() => setView("form")}>
                New Request
              </Button>
            }
            className="mb-6"
          />
          <DataTable
            columns={cashRequisitionColumns}
            data={items}
            rowHref={(row) => `/finance/cash-requisitions/${row.id}`}
            emptyMessage="No cash requisitions yet"
            emptyDescription="Submit your first cash request to get started"
          />
        </>
      )}

      {/* ── FORM ── */}
      {view === "form" && (
        <>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
          >
            <ArrowLeft size={16} />
            Back to Cash Requisitions
          </button>

          <PageHeader
            title="New Cash Requisition"
            description="Request petty cash or operational funds"
            className="mb-6"
          />

          <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full space-y-5">

            <FormSection title="Requester Details" description="Your employee information for this cash requisition.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput label="Requester Name" value={CURRENT_USER.name} disabled />
                <FormInput label="Department" value={CURRENT_USER.department} disabled />
                <FormInput label="Job Title / Role" value={CURRENT_USER.role} disabled />
                <FormDatePicker label="Request Date" value={TODAY} disabled />
              </div>
            </FormSection>

            <FormSection title="Request Details" description="Details about the cash being requested.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Title / Purpose"
                  required
                  placeholder="Brief title for this request"
                  error={errors.title?.message}
                  {...form.register("title")}
                />
                <FormSelect
                  label="Currency"
                  required
                  options={CURRENCY_OPTIONS}
                  sortOptions={false}
                  placeholder="Select currency"
                  error={errors.currency?.message}
                  {...form.register("currency")}
                />
                <FormInput
                  label="Amount Requested"
                  type="number"
                  required
                  placeholder="0.00"
                  error={errors.amount?.message}
                  {...form.register("amount")}
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Description / Justification"
                    required
                    placeholder="Describe what is needed and why..."
                    rows={4}
                    error={errors.description?.message}
                    {...form.register("description")}
                  />
                </div>
                <div className="md:col-span-2">
                  <FileDropzone
                    label="Supporting Documents"
                    value={supportingFiles}
                    onChange={setSupportingFiles}
                    accept="image/*,.pdf,.doc,.docx"
                    maxFiles={10}
                    hint="Attach quotes, receipts, or any relevant documents (optional)"
                  />
                </div>
              </div>
            </FormSection>

            <section className="rounded-xl border border-brand-border bg-gray-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">
                Approval Route
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {APPROVAL_ROUTE.map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                        i === 0
                          ? "bg-brand-purple-faint text-brand-purple border-brand-purple-mid"
                          : "bg-white text-brand-text-secondary border-brand-border"
                      }`}
                    >
                      {step}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="text-brand-text-secondary text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
                Submit for Approval
              </Button>
            </div>
          </form>
        </>
      )}

      {/* ── SUBMITTED ── */}
      {view === "submitted" && submitted && (
        <>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
          >
            <ArrowLeft size={16} />
            Back to Cash Requisitions
          </button>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-green-800">Request Submitted Successfully</h2>
              <p className="text-sm text-green-700 mt-0.5">
                Reference:{" "}
                <span className="font-mono font-bold">{submitted.ref}</span> — Your request has been routed to the first approver.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ApprovalStepper currentStep={1} />
            <WorkflowPath
              initiator={submitted.requester}
              department={submitted.department}
              currentStep={1}
            />
            <ActivityHistory
              initiator={submitted.requester}
              department={submitted.department}
              submittedAt={submitted.submittedAt}
            />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={goBack}>View All Requests</Button>
            <Button
              variant="outline"
              onClick={() => { form.reset(); setSupportingFiles([]); setView("form"); }}
            >
              Submit Another
            </Button>
          </div>
        </>
      )}
    </AppLayout>
  );
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white shadow-sm">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        {description && (
          <p className="text-sm text-brand-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 pt-5 pb-6">
        {children}
      </div>
    </section>
  );
}
