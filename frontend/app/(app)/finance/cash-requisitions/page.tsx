"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
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
import { formatNumber } from "@/lib/utils/format-number";
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

type View = "list" | "form";

export default function CashRequisitionsPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<CashRequest[]>(() =>
    SEED_CASH_REQUESTS.filter((item) => item.requester === CURRENT_USER.name)
  );
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
    toast.success(`Request submitted successfully — Reference: ${ref}`);
    form.reset();
    setSupportingFiles([]);
    setTimeout(() => location.reload(), 800);
  }

  function goBack() {
    setView("list");
    form.reset();
    setSupportingFiles([]);
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
          <div className="w-full overflow-hidden">
            <DataTable
              columns={cashRequisitionColumns}
              data={items}
              rowHref={(row) => `/finance/cash-requisitions/${row.id}`}
              emptyMessage="No cash requisitions yet"
              emptyDescription="Submit your first cash request to get started"
            />
          </div>
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
                  required
                  placeholder="0.00"
                  error={errors.amount?.message}
                  {...form.register("amount", {
                    onBlur: (e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      const numValue = parseFloat(rawValue) || 0;
                      e.target.value = formatNumber(numValue);
                    },
                  })}
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

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
                Submit for Approval
              </Button>
            </div>
          </form>
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
