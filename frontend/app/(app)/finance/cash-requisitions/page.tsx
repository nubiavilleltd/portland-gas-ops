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
import FormDatePicker from "@/components/forms/FormDatePicker";
import DataTable from "@/components/ui/DataTable";
import SelectInput from "@/components/forms/SelectInput";
import { cashRequisitionColumns } from "@/components/data-table/columns";
import { useCashRequisitions, useCreateCashRequisition } from "@/lib/modules/cash-requisitions/hooks";
import cashRequisitionsApi from "@/lib/modules/cash-requisitions/api";
import { useMyApprovals } from "@/lib/modules/workflow/queries";
import { useMyEmployee } from "@/lib/modules/employees/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CURRENCY_OPTIONS } from "../_components/_data";

const TODAY = new Date().toISOString().split("T")[0];

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

const schema = z.object({
  title:               z.string().min(3, "Title is required"),
  currency:            z.string().min(1, "Select a currency"),
  amount:              z.string().min(1, "Amount is required"),
  description:         z.string().min(5, "Description is required"),
  expected_retirement: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type View = "list" | "form";

export default function CashRequisitionsPage() {
  const [view, setView] = useState<View>("list");
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);

  const { user: currentUser } = useCurrentUser();
  const { data: myEmployee } = useMyEmployee();
  const createCashRequisition = useCreateCashRequisition();

  const { data: response, isLoading } = useCashRequisitions({
    limit: 100,
    sort_by: "created_at",
    sort_order: "desc",
  });
  const allItems = response?.data || [];

  // "Awaiting my approval" — my-approvals returns requests where the current user
  // is the assignee of the CURRENT step.
  const { data: myApprovals = [] } = useMyApprovals();
  const awaitingIds = new Set(
    myApprovals.filter((a) => a.request_type === "cash_requisition").map((a) => a.request_id)
  );

  const [scope, setScope] = useState<"all" | "awaiting">("all");
  const [activeStatus, setActiveStatus] = useState<string>("");

  const visibleItems = allItems.filter((i) => {
    // "All" = requests I raised; "Awaiting my approval" = requests waiting on me.
    const isMine = !i.requesterId || i.requesterId === currentUser?.id;
    const inScope = scope === "awaiting" ? awaitingIds.has(i.id) : isMine;
    if (!inScope) return false;
    if (activeStatus && i.status !== activeStatus) return false;
    return true;
  });

  const requesterName = myEmployee?.user
    ? `${myEmployee.user.first_name ?? ""} ${myEmployee.user.last_name ?? ""}`.trim()
    : "";

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

      // 1. Create the requisition
      const cr = await createCashRequisition.mutateAsync({
        title: data.title,
        description: data.description,
        amount,
        currency: data.currency,
        expected_retirement: data.expected_retirement || undefined,
      });

      // 2. Upload supporting files (best-effort)
      if (supportingFiles.length > 0 && cr?.id) {
        for (const file of supportingFiles) {
          try {
            await cashRequisitionsApi.uploadDocument(cr.id, file);
          } catch {
            toast.info(`Could not upload ${file.name}. Your request was still saved.`);
          }
        }
      }

      // 3. Submit for approval (enters the workflow)
      if (cr?.id) {
        await cashRequisitionsApi.submitForApproval(cr.id);
      }

      toast.success(`Request submitted for approval — ${cr.reference}`);
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

          {/* Scope filter pills */}
          <div className="mb-3 flex flex-wrap gap-2">
            {([
              { value: "all",      label: "All" },
              { value: "awaiting", label: "Awaiting my approval", count: awaitingIds.size },
            ] as const).map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setScope(pill.value)}
                className={
                  scope === pill.value
                    ? "rounded-lg bg-brand-purple px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm font-medium text-brand-text-secondary hover:bg-gray-50"
                }
              >
                {pill.label}
                {"count" in pill && pill.count > 0 ? (
                  <span
                    className={
                      scope === pill.value
                        ? "ml-2 rounded-full bg-white/25 px-1.5 py-0.5 text-xs"
                        : "ml-2 rounded-full bg-brand-purple/10 px-1.5 py-0.5 text-xs text-brand-purple"
                    }
                  >
                    {pill.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

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

            <FormSection title="Requester Details" description="Your employee information for this cash requisition.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput label="Requester Name" value={requesterName} disabled />
                <FormInput label="Department" value={myEmployee?.department || ""} disabled />
                <FormInput label="Job Title / Role" value={myEmployee?.job_title || ""} disabled />
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
                    onChange: (e) => {
                      e.target.value = applyCommas(e.target.value);
                    },
                  })}
                />
                {/* Expected Retirement Date — hidden for now
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
                    maxFiles={5}
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
