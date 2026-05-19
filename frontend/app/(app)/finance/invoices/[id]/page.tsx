"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  User,
  Building2,
  Calendar,
  Hash,
  Truck,
  CreditCard,
  FileText,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SEED_INVOICES } from "../../_components/_data";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const record = SEED_INVOICES.find((r) => r.id === id);

  return (
    <AppLayout pageTitle="Invoice Processing">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Invoices
      </button>

      {!record ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
          <p className="text-brand-text-primary font-semibold">Record not found</p>
          <p className="text-brand-text-secondary text-sm mt-1">
            No invoice found for ID <span className="font-mono">{id}</span>.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl space-y-5">
          {/* Header card */}
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm">
            <div className="h-1.5 w-full bg-linear-to-r from-brand-purple to-brand-purple-light" />
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-brand-text-secondary">{record.ref}</p>
                  <h1 className="text-lg font-semibold text-brand-text-primary mt-1">
                    {record.title}
                  </h1>
                </div>
                <ApprovalBadge status={record.status} className="self-start" />
              </div>
            </div>
          </div>

          {/* Vendor & Invoice */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-5">
              Vendor & Invoice
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <DetailField
                icon={<Truck size={15} />}
                label="Vendor"
                value={record.vendor}
              />
              <DetailField
                icon={<FileText size={15} />}
                label="Invoice Number"
                value={record.invoiceNo}
                mono
              />
              <DetailField
                icon={<Calendar size={15} />}
                label="Invoice Date"
                value={formatDate(record.date)}
              />
              {record.poNumber && (
                <DetailField
                  icon={<Hash size={15} />}
                  label="Purchase Order"
                  value={record.poNumber}
                  mono
                />
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-5">
              Payment Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <DetailField
                icon={<Banknote size={15} />}
                label="Net Payable"
                value={formatCurrency(record.amount)}
                highlight
              />
              {record.paymentTerms && (
                <DetailField
                  icon={<CreditCard size={15} />}
                  label="Payment Terms"
                  value={record.paymentTerms}
                />
              )}
              <DetailField
                icon={<Building2 size={15} />}
                label="Department"
                value={record.department}
              />
              <DetailField
                icon={<User size={15} />}
                label="Submitted By"
                value={record.requester}
              />
            </div>
          </div>

          {/* Approval status */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">
              Approval Status
            </p>
            <ApprovalRoute status={record.status} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function DetailField({
  icon,
  label,
  value,
  mono = false,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary mb-1">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <p
        className={`text-sm ${highlight ? "font-bold text-brand-text-primary" : "text-brand-text-primary"} ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

const STEPS = ["Initiator", "Line Manager", "Finance Review", "Processed"] as const;

const STEP_MAP: Record<string, number> = {
  draft: 0,
  pending: 1,
  in_progress: 2,
  approved: 3,
  rejected: 1,
};

function ApprovalRoute({ status }: { status: string }) {
  const activeStep = STEP_MAP[status] ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((step, i) => {
        const done = i < activeStep;
        const current = i === activeStep && status !== "rejected";
        const rejected = status === "rejected" && i === activeStep;

        return (
          <div key={step} className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                rejected
                  ? "bg-red-50 text-red-700 border-red-200"
                  : done
                  ? "bg-green-50 text-green-700 border-green-200"
                  : current
                  ? "bg-brand-purple-faint text-brand-purple border-brand-purple-mid"
                  : "bg-white text-brand-text-secondary border-brand-border"
              }`}
            >
              {step}
            </span>
            {i < STEPS.length - 1 && (
              <span className="text-brand-text-secondary text-xs">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
