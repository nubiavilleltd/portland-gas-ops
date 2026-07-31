"use client";

import { useState } from "react";
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
import DataTable from "@/components/ui/DataTable";
import SelectInput from "@/components/forms/SelectInput";
import { cashRequisitionColumns } from "@/components/data-table/columns";
import { useCashRequisitions, useCreateCashRequisition } from "@/lib/modules/cash-requisitions/hooks";
import cashRequisitionsApi from "@/lib/modules/cash-requisitions/api";
import { useApproverPicker } from "@/lib/modules/workflow/useApproverPicker";
import WorkflowApproversSection from "@/components/ui/WorkflowApproversSection";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CURRENCY_OPTIONS } from "../_components/_data";
import { minChars, minCharsHint } from "@/lib/utils/form-validation";

function applyCommas(raw: string): string {
  const clean = raw.replace(/[^0-9.]/g, "");
  const [int, dec] = clean.split(".");
  const formatted = (int || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${formatted}.${dec}` : formatted;
}

const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "returned",    label: "Returned" },
  { value: "approved",    label: "Approved" },
  { value: "denied",      label: "Denied" },
];

// Minimums live here so the schema and the on-field hints stay in step.
const TITLE_MIN = 3;
const DESCRIPTION_MIN = 5;

const schema = z.object({
  title:               minChars(TITLE_MIN, "Title"),
  currency:            z.string().min(1, "Select a currency"),
  amount:              z.string().min(1, "Amount is required"),
  description:         minChars(DESCRIPTION_MIN, "Description"),
  expected_retirement: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type View = "list" | "form";

export default function CashRequisitionsPage() {
  const [view, setView] = useState<View>("list");
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);

  const { user: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const createCashRequisition = useCreateCashRequisition();
  // Workflow-driven approver picks for any requester_pick steps on the
  // cash_requisition workflow (reads the active workflow config).
  const approverPicker = useApproverPicker("cash_requisition");

  const { data: response, isLoading } = useCashRequisitions({
    limit: 100,
    sort_by: "created_at",
    sort_order: "desc",
  });
  const allItems = response?.data || [];

  const [activeStatus, setActiveStatus] = useState<string>("");

  const visibleItems = allItems.filter((i) => {
    // Only the requests I raised. Requests awaiting my approval are in the
    // sidebar "My Approvals" section.
    const isMine = !i.requesterId || i.requesterId === currentUser?.id;
    if (!isMine) return false;
    if (activeStatus && i.status !== activeStatus) return false;
    return true;
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { formState: { errors, isSubmitting } } = form;
  // Expected Retirement Date is hidden for now:
  // const watchRetirement = form.watch("expected_retirement");

  async function onSubmit(data: FormData) {
    try {
      const amount = parseFloat(data.amount.replace(/,/g, ""));
      if (!amount || amount <= 0) {
        toast.error("Enter a valid amount");
        return;
      }

      // Every requester_pick step on the workflow must have an approver chosen.
      const picksError = approverPicker.validate();
      if (picksError) {
        toast.error(picksError);
        return;
      }

      // 1. Create AND enter the workflow in a single call. The server does both
      //    in one transaction, so a failure leaves nothing behind — retrying can
      //    no longer pile up rows that read "Pending" but sit in no workflow.
      const cr = await createCashRequisition.mutateAsync({
        title: data.title,
        description: data.description,
        amount,
        currency: data.currency,
        expected_retirement: data.expected_retirement || undefined,
        picked_approvers: approverPicker.picksPayload,
        submit_for_approval: true,
      });

      // 2. Upload supporting files (best-effort — the request is already lodged)
      if (supportingFiles.length > 0 && cr?.id) {
        for (const file of supportingFiles) {
          try {
            await cashRequisitionsApi.uploadDocument(cr.id, file);
          } catch {
            toast.info(`Could not upload ${file.name}. Your request was still saved.`);
          }
        }
      }

      // Awaited so the list isn't shown until fresh data is in cache — otherwise
      // it paints the pre-refetch snapshot and Next Actor reads "—".
      await queryClient.invalidateQueries({ queryKey: ["cash-requisitions"] });
      toast.success(`Request submitted for approval${cr.reference ? ` — ${cr.reference}` : ""}`);
      form.reset();
      setSupportingFiles([]);
      setView("list");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (error instanceof Error ? error.message : "Failed to submit cash requisition");
      toast.error(message);
    }
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
              data={visibleItems}
              isLoading={isLoading}
              rowHref={(row) => `/finance/cash-requisitions/${row.id}`}
              toolbarActions={
                <div className="w-52 shrink-0">
                  <SelectInput
                    placeholder="All Statuses"
                    sortOptions={false}
                    value={activeStatus}
                    onValueChange={(v) => setActiveStatus(v)}
                    options={STATUS_OPTIONS}
                  />
                </div>
              }
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

            {/* No Requester Details block — the server derives the requester from
                the session, and the detail page shows it. Matches Supply Chain. */}
            <FormSection title="Request Details" description="Details about the cash being requested.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Title / Purpose"
                  required
                  placeholder="Brief title for this request"
                  hint={minCharsHint(TITLE_MIN)}
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
                    onChange: (e) => {
                      e.target.value = applyCommas(e.target.value);
                    },
                  })}
                />
                {/* Expected Retirement Date — hidden for now.
                    To restore: re-add the FormDatePicker import and a TODAY const.
                <FormDatePicker
                  label="Expected Retirement Date"
                  min={TODAY}
                  hint="When the cash is expected to be accounted for (optional)"
                  {...form.register("expected_retirement")}
                  value={form.watch("expected_retirement") ?? ""}
                />
                */}
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Description / Justification"
                    required
                    placeholder="Describe what is needed and why..."
                    rows={4}
                    hint={minCharsHint(DESCRIPTION_MIN)}
                    error={errors.description?.message}
                    {...form.register("description")}
                  />
                </div>
                <div className="md:col-span-2">
                  <FileDropzone
                    label="Supporting Documents"
                    value={supportingFiles}
                    onChange={setSupportingFiles}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    maxFiles={5}
                    hint="Attach quotes, receipts, or any relevant documents (optional)"
                  />
                </div>
              </div>
            </FormSection>

            <WorkflowApproversSection {...approverPicker} />

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
