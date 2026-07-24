"use client";

import { useState, useEffect, useRef } from "react";
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
import SelectInput from "@/components/forms/SelectInput";
import DataTable from "@/components/ui/DataTable";
import { invoiceColumns } from "@/components/data-table/columns";
import { useInvoices, useCreateInvoice, usePoOptions, useVendorOptions } from "@/lib/modules/invoices-processing/hooks";
import invoicesApi from "@/lib/modules/invoices-processing/api";
import { useApproverPicker } from "@/lib/modules/workflow/useApproverPicker";
import WorkflowApproversSection from "@/components/ui/WorkflowApproversSection";
import { useQueryClient } from "@tanstack/react-query";
import { useMyEmployee } from "@/lib/modules/employees/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CURRENCY_OPTIONS, genRef } from "../_components/_data";

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
  vendor_name:    z.string().min(1, "Select a vendor"),
  po_number:      z.string().optional(),
  invoice_number: z.string().min(1, "Invoice number is required"),
  title:          z.string().min(2, "Title is required"),
  description:    z.string().optional(),
  gross_amount:   z.string().min(1, "Amount is required"),
  tax_amount:     z.string().optional(),
  net_amount:     z.string().min(1, "Amount is required"),
  currency:       z.string().min(1, "Select a currency"),
});

type FormData = z.infer<typeof schema>;
type View = "list" | "form";

export default function InvoicesPage() {
  const [view, setView] = useState<View>("list");
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [invoiceId] = useState(() => genRef("IID"));

  const { user: currentUser } = useCurrentUser();
  const { data: myEmployee } = useMyEmployee();
  const queryClient = useQueryClient();
  const createInvoice = useCreateInvoice();
  // Approver picks for any requester_pick steps on the invoice workflow.
  const approverPicker = useApproverPicker("invoice");
  // Reuse the draft on retry if only the submit step failed (avoids duplicates).
  const draftRef = useRef<{ id: string; reference?: string } | null>(null);

  const { data: response, isLoading } = useInvoices({ limit: 100, sort_by: "created_at", sort_order: "desc" });
  const allItems = response?.data || [];

  const [activeStatus, setActiveStatus] = useState<string>("");

  const visibleItems = allItems.filter((i) => {
    // Only the requests I raised. Approvals awaiting me are in the sidebar
    // "My Approvals" section.
    const isMine = !i.requesterId || i.requesterId === currentUser?.id;
    if (!isMine) return false;
    if (activeStatus && i.status !== activeStatus) return false;
    return true;
  });

  // Real dropdown sources
  const { data: vendors = [] } = useVendorOptions();
  const { data: poOptions = [] } = usePoOptions();
  const vendorOptions = vendors.map((v) => ({ value: v.name, label: v.name }));
  const poOptionsList = poOptions.map((p) => ({ value: p.reference, label: p.reference }));

  const requesterName = myEmployee?.user
    ? `${myEmployee.user.first_name ?? ""} ${myEmployee.user.last_name ?? ""}`.trim()
    : "";

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { formState: { errors, isSubmitting } } = form;

  // Auto-calc net = gross − tax
  const watchGross = form.watch("gross_amount");
  const watchTax   = form.watch("tax_amount");
  useEffect(() => {
    const gross = parseFloat((watchGross ?? "").replace(/,/g, ""));
    if (isNaN(gross)) return;
    const tax = parseFloat((watchTax ?? "").replace(/,/g, ""));
    const net = isNaN(tax) || watchTax === "" ? gross : gross - tax;
    form.setValue("net_amount", applyCommas(net.toFixed(2)), { shouldValidate: true });
  }, [watchGross, watchTax, form]);

  async function onSubmit(data: FormData) {
    try {
      const gross = parseFloat(data.gross_amount.replace(/,/g, ""));
      const tax = data.tax_amount ? parseFloat(data.tax_amount.replace(/,/g, "")) : 0;
      const net = parseFloat(data.net_amount.replace(/,/g, ""));
      if (!net || net <= 0) {
        toast.error("Enter a valid net payable amount");
        return;
      }

      // Every requester_pick step on the workflow must have an approver chosen.
      const picksError = approverPicker.validate();
      if (picksError) {
        toast.error(picksError);
        return;
      }

      // Create — or reuse a draft from a failed attempt.
      let inv: { id: string; reference?: string };
      if (draftRef.current) {
        inv = draftRef.current;
      } else {
        const created = await createInvoice.mutateAsync({
          invoice_id: invoiceId,
          invoice_number: data.invoice_number,
          title: data.title,
          description: data.description,
          vendor: data.vendor_name,
          po_number: data.po_number || undefined,
          gross_amount: gross,
          tax_amount: tax,
          amount: net,
          currency: data.currency,
        });
        draftRef.current = { id: created.id, reference: created.reference };
        inv = draftRef.current;
      }

      if (supportingFiles.length > 0 && inv?.id) {
        for (const file of supportingFiles) {
          try {
            await invoicesApi.uploadDocument(inv.id, file);
          } catch {
            toast.info(`Could not upload ${file.name}. Your invoice was still saved.`);
          }
        }
      }

      if (inv?.id) await invoicesApi.submitForApproval(inv.id, approverPicker.picksPayload);
      draftRef.current = null; // fully submitted — next request is fresh

      // Refetch AFTER the workflow starts so the list shows Next Actor now.
      queryClient.invalidateQueries({ queryKey: ["invoices-processing"] });

      toast.success(`Invoice submitted for approval${inv.reference ? ` — ${inv.reference}` : ""}`);
      form.reset();
      setSupportingFiles([]);
      setView("list");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (error instanceof Error ? error.message : "Failed to submit invoice");
      toast.error(message);
    }
  }

  function goBack() {
    draftRef.current = null; // abandon any half-created draft
    setView("list");
    form.reset();
    setSupportingFiles([]);
  }

  return (
    <AppLayout pageTitle="Invoice Processing">

      {/* ── LIST ── */}
      {view === "list" && (
        <>
          <PageHeader
            title="Invoice Processing"
            description="Manage supplier invoices and payment approvals"
            action={
              <Button leftIcon={<Plus size={16} />} onClick={() => { draftRef.current = null; setView("form"); }}>
                New Invoice
              </Button>
            }
            className="mb-6"
          />

          <div className="w-full overflow-hidden">
            <DataTable
              columns={invoiceColumns}
              data={visibleItems}
              isLoading={isLoading}
              rowHref={(row) => `/finance/invoices/${row.id}`}
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
              emptyMessage="No invoices yet"
              emptyDescription="Submit your first invoice to get started"
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
            Back to Invoice Processing
          </button>

          <PageHeader
            title="New Invoice"
            description="Log and process a supplier invoice for payment approval"
            className="mb-6"
          />

          <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full space-y-5">

            <FormSection title="Requester Details" description="Your employee information for this invoice request.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput label="Requester Name"  value={requesterName} disabled />
                <FormInput label="Department"       value={myEmployee?.department || ""} disabled />
                <FormInput label="Job Title / Role" value={myEmployee?.job_title || ""} disabled />
                <FormDatePicker label="Request Date" value={TODAY} disabled />
              </div>
            </FormSection>

            <FormSection title="Request Details" description="Vendor and invoice details for this payment request.">
              <div className="space-y-6">

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Vendor Details</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormSelect
                      label="Vendor / Supplier Name"
                      required
                      options={vendorOptions}
                      sortOptions={false}
                      placeholder="Select vendor"
                      error={errors.vendor_name?.message}
                      {...form.register("vendor_name")}
                    />
                    <FormSelect
                      label="Purchase Order Number"
                      options={poOptionsList}
                      sortOptions={false}
                      placeholder="Select PO (optional)"
                      {...form.register("po_number")}
                    />
                    <FormInput
                      label="Invoice Number"
                      required
                      placeholder="e.g. TE-2026-0587"
                      error={errors.invoice_number?.message}
                      {...form.register("invoice_number")}
                    />
                    <FormInput label="Invoice ID" value={invoiceId} disabled />
                  </div>
                </div>

                <div className="border-t border-brand-border pt-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Invoice Details</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <FormInput
                        label="Title / Purpose"
                        required
                        placeholder="e.g. Diesel supply — May batch"
                        error={errors.title?.message}
                        {...form.register("title")}
                      />
                    </div>
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
                      label="Gross Amount"
                      required
                      placeholder="0.00"
                      error={errors.gross_amount?.message}
                      {...form.register("gross_amount", {
                        onChange: (e) => { e.target.value = applyCommas(e.target.value); },
                      })}
                    />
                    <FormInput
                      label="VAT / WHT Amount"
                      placeholder="0.00 (optional)"
                      {...form.register("tax_amount", {
                        onChange: (e) => { e.target.value = applyCommas(e.target.value); },
                      })}
                    />
                    <FormInput
                      label="Net Payable"
                      required
                      placeholder="0.00"
                      error={errors.net_amount?.message}
                      {...form.register("net_amount", {
                        onChange: (e) => { e.target.value = applyCommas(e.target.value); },
                      })}
                    />
                    <div className="md:col-span-2">
                      <FormTextarea
                        label="Description of Goods / Services"
                        placeholder="What was supplied or performed?"
                        rows={3}
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
                        hint="Attach the scanned or digital invoice and any supporting documents (optional)"
                      />
                    </div>
                  </div>
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
