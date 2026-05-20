import { FileText, RotateCcw, XCircle, Clock } from "lucide-react";

type Actor = "initiator" | "line-manager" | "finance" | "treasury" | "system";

const ACTORS: Record<Actor, { label: string; bg: string }> = {
  initiator:      { label: "Initiator / AP",     bg: "bg-violet-500"  },
  "line-manager": { label: "Line Manager",        bg: "bg-blue-500"    },
  finance:        { label: "Finance Review",      bg: "bg-emerald-500" },
  treasury:       { label: "Treasury / Payments", bg: "bg-amber-500"   },
  system:         { label: "System",              bg: "bg-slate-500"   },
};

function Arrow() {
  return (
    <div className="flex justify-center my-0.5">
      <svg width="14" height="28" viewBox="0 0 14 28" aria-hidden="true">
        <line x1="7" y1="0" x2="7" y2="22" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        <polygon points="7,28 2,20 12,20" fill="#cbd5e1" />
      </svg>
    </div>
  );
}

function StartNode({ label }: { label: string }) {
  return (
    <div className="bg-brand-purple rounded-2xl px-6 py-4 text-white shadow-md w-72 mx-auto text-center">
      <p className="font-bold text-sm">{label}</p>
    </div>
  );
}

function EndNode({ label }: { label: string }) {
  return (
    <div className="bg-emerald-600 rounded-2xl px-6 py-4 text-white shadow-md w-72 mx-auto text-center">
      <p className="font-bold text-sm">{label}</p>
    </div>
  );
}

function FlowBox({ actor, title, subtitle }: { actor: Actor; title: string; subtitle: string }) {
  const a = ACTORS[actor];
  return (
    <div className={`${a.bg} rounded-2xl px-6 py-5 text-white shadow-md w-72 mx-auto text-center`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1.5">{a.label}</p>
      <p className="font-bold text-sm leading-snug">{title}</p>
      <p className="text-xs mt-2 opacity-80 italic leading-relaxed">{subtitle}</p>
    </div>
  );
}

function DecisionStep({
  actor, title, subtitle, approvedLabel, rejectedLabel,
}: {
  actor: Actor; title: string; subtitle: string;
  approvedLabel: string; rejectedLabel: string;
}) {
  const a = ACTORS[actor];
  return (
    <div className="w-72 mx-auto shadow-md rounded-2xl overflow-hidden">
      <div className={`${a.bg} px-6 py-5 text-white text-center`}>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1.5">{a.label}</p>
        <p className="font-bold text-sm leading-snug">{title}</p>
        <p className="text-xs mt-2 opacity-80 italic leading-relaxed">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2">
        <div className="bg-green-500 px-3 py-3 text-white text-center border-r border-white/20">
          <p className="text-[10px] font-bold uppercase tracking-wider">✓ Approved</p>
          <p className="text-[11px] mt-1.5 opacity-90 italic leading-snug">{approvedLabel}</p>
        </div>
        <div className="bg-red-500 px-3 py-3 text-white text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider">✗ Rejected</p>
          <p className="text-[11px] mt-1.5 opacity-90 italic leading-snug">{rejectedLabel}</p>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {(Object.entries(ACTORS) as [Actor, (typeof ACTORS)[Actor]][]).map(([key, a]) => (
        <span key={key} className="inline-flex items-center gap-1.5 text-xs text-brand-text-secondary">
          <span className={`w-3 h-3 rounded-full ${a.bg}`} />
          {a.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 text-xs text-brand-text-secondary">
        <span className="w-3 h-3 rounded-sm bg-green-500" />
        Approved path
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs text-brand-text-secondary">
        <span className="w-3 h-3 rounded-sm bg-red-500" />
        Rejected path
      </span>
    </div>
  );
}

export default function InvoiceProcessMap() {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-brand-border bg-gray-50/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center shrink-0">
            <FileText size={15} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-brand-text-primary">Invoice Processing — Process Map</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              End-to-end workflow from invoice receipt to vendor payment
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Legend />

        <div className="max-w-sm mx-auto">
          <StartNode label="Invoice Received from Vendor" />
          <Arrow />

          <FlowBox
            actor="initiator"
            title="Log Invoice Details"
            subtitle="Enter vendor, invoice number, PO number, amounts, VAT/WHT, and payment terms"
          />
          <Arrow />

          <FlowBox
            actor="initiator"
            title="GRN & Documentation Check"
            subtitle="Attach Goods Received Note, invoice copy, and verify PO amounts match"
          />
          <Arrow />

          <FlowBox
            actor="initiator"
            title="Submit for Approval"
            subtitle="System generates unique reference: INV-YYYYMMDD-XXXX"
          />
          <Arrow />

          <DecisionStep
            actor="line-manager"
            title="Line Manager Review"
            subtitle="Confirm goods receipt, verify vendor and invoice amounts"
            approvedLabel="Forwarded to Finance Review"
            rejectedLabel="Returned to initiator with comments"
          />
          <Arrow />

          <DecisionStep
            actor="finance"
            title="Finance Review"
            subtitle="Validate amounts, tax deductions, GL account, and vendor registration"
            approvedLabel="Forwarded to Treasury for payment"
            rejectedLabel="Returned — may require vendor re-invoice"
          />
          <Arrow />

          <FlowBox
            actor="treasury"
            title="Payment Scheduling"
            subtitle="Payment date calculated per agreed terms: Net 15 / 30 / 45 / 60 or Immediate"
          />
          <Arrow />

          <FlowBox
            actor="treasury"
            title="Payment Released"
            subtitle="Bank transfer initiated, WHT remitted to FIRS, remittance advice sent to vendor"
          />
          <Arrow />

          <FlowBox
            actor="system"
            title="Invoice Closed"
            subtitle="All documents archived, vendor ledger updated, parties notified"
          />
          <Arrow />

          <EndNode label="Process Complete — Invoice Paid" />

          <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-blue-600 shrink-0" />
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Payment Terms Reference</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                { label: "Net 15",     desc: "Payment due 15 days from invoice date" },
                { label: "Net 30",     desc: "Payment due 30 days from invoice date" },
                { label: "Net 45",     desc: "Payment due 45 days from invoice date" },
                { label: "Net 60",     desc: "Payment due 60 days from invoice date" },
                { label: "Immediate",  desc: "Payment processed same day as approval" },
                { label: "On Receipt", desc: "Payment on confirmed goods/service receipt" },
              ].map((t) => (
                <div key={t.label} className="flex items-start gap-2 text-xs text-blue-800">
                  <span className="font-semibold shrink-0 w-16">{t.label}</span>
                  <span className="text-blue-700">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
            <RotateCcw size={15} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Rejection / Return Flow</p>
              <p className="text-xs text-red-700 mt-1">
                Rejection at any stage returns the invoice to the Initiator with written comments.
                Common causes: missing GRN, amount mismatch, incorrect PO reference, or unapproved vendor.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <XCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Tax & Compliance</p>
              <p className="text-xs text-amber-700 mt-1">
                All invoices are subject to WHT deduction at source per FIRS regulations. Vendors are issued
                a WHT credit note. VAT-registered vendors must include VAT on invoices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
