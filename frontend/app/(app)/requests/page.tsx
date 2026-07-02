"use client";

import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import SelectInput from "@/components/forms/SelectInput";
import { useProcurementList } from "@/lib/modules/procurement";
import { useAssetRequests } from "@/lib/modules/assets";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ProcessType =
  | "procurement"
  | "asset_request"
  | "leave"
  | "work_initiation"
  | "work_authorization"
  | "incident_hazard"
  | "work_closeout";

interface UnifiedRequest {
  id: string;
  reference: string;
  process: ProcessType;
  title: string;
  status: string;
  submitted_at: string;
  href: string;
}

// ── Process config ─────────────────────────────────────────────────────────────

const PROCESS_CONFIG: Record<ProcessType, { label: string; badge: string }> = {
  procurement:        { label: "Procurement",        badge: "bg-purple-100 text-purple-700" },
  asset_request:      { label: "Asset Request",      badge: "bg-blue-100 text-blue-700" },
  leave:              { label: "Leave",              badge: "bg-green-100 text-green-700" },
  work_initiation:    { label: "Work Initiation",    badge: "bg-orange-100 text-orange-700" },
  work_authorization: { label: "Work Authorization", badge: "bg-amber-100 text-amber-700" },
  incident_hazard:    { label: "Incident / Hazard",  badge: "bg-red-100 text-red-700" },
  work_closeout:      { label: "Work Close-Out",     badge: "bg-teal-100 text-teal-700" },
};

const PROCESS_OPTIONS = Object.entries(PROCESS_CONFIG).map(([value, { label }]) => ({ value, label }));

// ── Status normaliser ──────────────────────────────────────────────────────────

type NormalisedStatus = "pending" | "approved" | "rejected" | "all";

function normaliseStatus(status: string): Exclude<NormalisedStatus, "all"> {
  const s = status.toLowerCase();
  if (["pending", "submitted", "draft", "pending_approval", "in_progress", "recommended"].includes(s)) return "pending";
  if (["approved", "ordered", "delivered", "returned", "resolved", "closed"].includes(s)) return "approved";
  return "rejected";
}


// ── Static demo data ───────────────────────────────────────────────────────────

const DEMO_LEAVE: UnifiedRequest[] = [
  { id: "lr-001", reference: "LR-2025-001", process: "leave", title: "Annual Leave — 5 days",          status: "approved",         submitted_at: "2025-04-02", href: "/hr-management/leave-requests/lr-001" },
  { id: "lr-002", reference: "LR-2025-002", process: "leave", title: "Sick Leave — 2 days",            status: "pending",          submitted_at: "2025-05-10", href: "/hr-management/leave-requests/lr-002" },
  { id: "lr-003", reference: "LR-2025-003", process: "leave", title: "Compassionate Leave — 3 days",   status: "rejected",         submitted_at: "2025-03-18", href: "/hr-management/leave-requests/lr-003" },
];

const DEMO_WORK_INITIATION: UnifiedRequest[] = [
  { id: "wi-001", reference: "WI-2025-001", process: "work_initiation", title: "Pipeline Valve Replacement — Lekki Depot",  status: "approved",         submitted_at: "2025-04-15", href: "/safety/work-initiation/wi-001" },
  { id: "wi-002", reference: "WI-2025-002", process: "work_initiation", title: "Generator Servicing — Head Office",         status: "pending", submitted_at: "2025-05-05", href: "/safety/work-initiation/wi-002" },
  { id: "wi-003", reference: "WI-2025-003", process: "work_initiation", title: "Compressor Unit Inspection — Apapa Plant",  status: "submitted",        submitted_at: "2025-05-14", href: "/safety/work-initiation/wi-003" },
];

const DEMO_WORK_AUTHORIZATION: UnifiedRequest[] = [
  { id: "wa-001", reference: "WA-2025-001", process: "work_authorization", title: "Hot Work Permit — Lekki Depot",        status: "approved",  submitted_at: "2025-04-16", href: "/safety/work-authorization/wa-001" },
  { id: "wa-002", reference: "WA-2025-002", process: "work_authorization", title: "Confined Space Entry — Apapa Plant",   status: "submitted", submitted_at: "2025-05-06", href: "/safety/work-authorization/wa-002" },
  { id: "wa-003", reference: "WA-2025-003", process: "work_authorization", title: "Electrical Isolation — Head Office",   status: "returned",  submitted_at: "2025-05-13", href: "/safety/work-authorization/wa-003" },
];

const DEMO_INCIDENTS: UnifiedRequest[] = [
  { id: "ih-001", reference: "IH-2025-001", process: "incident_hazard", title: "Near-Miss: Gas Leak at Valve Station",      status: "resolved",    submitted_at: "2025-03-28", href: "/safety/incidents/ih-001" },
  { id: "ih-002", reference: "IH-2025-002", process: "incident_hazard", title: "Hazard: Exposed Electrical Wiring — Store", status: "recommended", submitted_at: "2025-05-02", href: "/safety/incidents/ih-002" },
];

const DEMO_CLOSEOUT: UnifiedRequest[] = [
  { id: "wc-001", reference: "WC-2025-001", process: "work_closeout", title: "Close-Out: Pipeline Valve Replacement", status: "approved",  submitted_at: "2025-04-20", href: "/safety/work-close-out/wc-001" },
  { id: "wc-002", reference: "WC-2025-002", process: "work_closeout", title: "Close-Out: Generator Servicing",        status: "submitted", submitted_at: "2025-05-08", href: "/safety/work-close-out/wc-002" },
];

// ── Table columns ──────────────────────────────────────────────────────────────

const COLUMNS: Column<UnifiedRequest>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (v) => (
      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-brand-text-primary">
        {String(v)}
      </span>
    ),
  },
  {
    key: "process",
    label: "Process",
    render: (_, row) => {
      const cfg = PROCESS_CONFIG[row.process];
      return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>
          {cfg.label}
        </span>
      );
    },
  },
  {
    key: "title",
    label: "Title / Summary",
    render: (v) => (
      <span className="block truncate max-w-xs text-brand-text-primary" title={String(v)}>
        {String(v)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (v) => <ApprovalBadge status={String(v)} />,
  },
  {
    key: "submitted_at",
    label: "Date Submitted",
    render: (v) => (
      <span className="text-xs text-brand-text-secondary whitespace-nowrap">
        {formatDate(String(v))}
      </span>
    ),
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MyRequestsPage() {
  const [activeStatus, setActiveStatus] = useState<NormalisedStatus>("all");
  const [activeProcess, setActiveProcess] = useState("");
  const [search, setSearch] = useState("");

  const { data: procurements = [], isLoading: loadingProcurement } = useProcurementList();
  const { data: assetRequests = [], isLoading: loadingAssets }      = useAssetRequests();

  const isLoading = loadingProcurement || loadingAssets;

  const procurementRows: UnifiedRequest[] = procurements.map((p) => ({
    id:           p.id,
    reference:    p.reference,
    process:      "procurement" as ProcessType,
    title:        p.title,
    status:       p.status,
    submitted_at: p.created_at,
    href:         `/procurement/${p.id}`,
  }));

  const assetRows: UnifiedRequest[] = assetRequests.map((r) => ({
    id:           r.id,
    reference:    r.reference,
    process:      "asset_request" as ProcessType,
    title:        r.purpose,
    status:       r.status,
    submitted_at: r.created_at,
    href:         `/assets/requests/${r.id}`,
  }));

  const allRequests = useMemo(() => [
    ...procurementRows,
    ...assetRows,
    ...DEMO_LEAVE,
    ...DEMO_WORK_INITIATION,
    ...DEMO_WORK_AUTHORIZATION,
    ...DEMO_INCIDENTS,
    ...DEMO_CLOSEOUT,
  ].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [procurements, assetRequests]);

  const filtered = useMemo(() => {
    let list = allRequests;
    if (activeProcess) list = list.filter((r) => r.process === activeProcess);
    if (activeStatus !== "all") list = list.filter((r) => normaliseStatus(r.status) === activeStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        r.reference.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        PROCESS_CONFIG[r.process].label.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allRequests, activeProcess, activeStatus, search]);

  return (
    <AppLayout pageTitle="My Requests">
      <PageHeader
        title="My Requests"
        description="Track all your submissions across every workflow"
        className="mb-6"
      />

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, title, status…"
            className="w-full pl-9 pr-4 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          />
        </div>
        <div className="w-52 shrink-0">
          <SelectInput
            placeholder="All Processes"
            sortOptions={false}
            value={activeProcess}
            onValueChange={setActiveProcess}
            options={PROCESS_OPTIONS}
          />
        </div>
        <div className="w-44 shrink-0">
          <SelectInput
            placeholder="All Statuses"
            sortOptions={false}
            value={activeStatus === "all" ? "" : activeStatus}
            onValueChange={(v) => setActiveStatus((v || "all") as NormalisedStatus)}
            options={[
              { value: "pending",  label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
        </div>
      </div>

      {/* ── Count ───────────────────────────────────────────────────────────── */}
      <p className="text-xs text-brand-text-secondary mb-4">
        {!isLoading && `${filtered.length} request${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : (
        <DataTable
          columns={COLUMNS}
          data={filtered}
          rowHref={(row) => row.href}
          searchable={false}
          showStatusFilter={false}
          emptyMessage="No requests found"
          emptyDescription="Try adjusting your filters"
        />
      )}
    </AppLayout>
  );
}
