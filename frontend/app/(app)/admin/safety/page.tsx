"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import PageHeader from "@/components/ui/PageHeader";
import { useSafetyDashboard } from "@/lib/modules/safety/dashboard";
import { getSafetyDisplayStatus } from "@/lib/modules/safety/presentation";
import type {
  SafetyDashboardOngoingWorkItem,
  SafetyDashboardQueueItem,
  SafetyDashboardTrendRow,
} from "@/lib/modules/safety/dashboard";
import { cn, formatDateTime } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gauge,
  ListChecks,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

const PENDING_QUEUE_PAGE_SIZE = 5;
const ONGOING_WORK_PAGE_SIZE = 6;

export default function AdminSafetyDashboardPage() {
  const { data: dashboard, isLoading, isError } = useSafetyDashboard();

  return (
    <AppLayout pageTitle="Admin">
      <PageHeader
        title="Safety Dashboard"
        description="Live HSE source of truth for open safety work, risk signals, close-out quality, and current field activity."
      />

      {isLoading ? <DashboardSkeleton /> : null}

      {isError ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load the safety dashboard right now.
        </div>
      ) : null}

      {dashboard ? (
        <>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <DashboardMetric
              label="Pending HSE Requests"
              value={dashboard.metrics.pending_hse_requests}
              helper="Incident reviews, authorizations, and close-outs awaiting HSE"
              icon={<ShieldAlert size={20} />}
              tone="amber"
            />
            <DashboardMetric
              label="Clean Close-Outs"
              value={dashboard.metrics.clean_close_outs}
              helper="Approved work with compliant authorization and no close-out exception"
              icon={<CheckCircle2 size={20} />}
              tone="green"
            />
            <DashboardMetric
              label="Unsuccessful Close-Outs"
              value={dashboard.metrics.unsuccessful_close_outs}
              helper="Exception close-outs acknowledged for audit, not counted as successful"
              icon={<ShieldAlert size={20} />}
              tone="orange"
            />
            <DashboardMetric
              label="Works With Hazards"
              value={dashboard.metrics.works_with_hazards}
              helper="Close-outs with remaining hazards, deviations, or HSE corrective action"
              icon={<AlertTriangle size={20} />}
              tone="red"
            />
            <DashboardMetric
              label="End-to-End Compliance"
              value={`${dashboard.metrics.end_to_end_compliance_rate}%`}
              helper={`${dashboard.metrics.compliant_close_outs} of ${dashboard.metrics.approved_close_outs} approved close-outs fully compliant`}
              icon={<ShieldCheck size={20} />}
              tone="blue"
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <TrendPanel
              title="Most Reported Hazard Types"
              description="Based on live incident and hazard report records."
              rows={dashboard.top_hazard_types}
            />
            <TrendPanel
              title="Most Reported Locations"
              description="Shows where repeat safety signals are clustering."
              rows={dashboard.top_hazard_locations}
            />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
            <PendingHseQueue items={dashboard.pending_hse_queue} />

            <section className="rounded-xl border border-brand-border bg-white">
              <div className="border-b border-brand-border px-5 py-4">
                <h2 className="text-base font-semibold text-brand-text-primary">
                  Safety Attention
                </h2>
                <p className="mt-1 text-sm text-brand-text-secondary">
                  Signals HSE should keep watching after work moves forward.
                </p>
              </div>
              <div className="grid gap-3 p-5">
                <SignalRow
                  icon={<Flame size={18} />}
                  label="Gas, fire, or environmental concerns"
                  value={dashboard.safety_attention.gas_fire_environmental_concerns}
                  href="/safety/incidents"
                />
                <SignalRow
                  icon={<ListChecks size={18} />}
                  label="Open corrective-action records"
                  value={dashboard.safety_attention.open_corrective_actions}
                  href="/safety/incidents"
                />
                <SignalRow
                  icon={<Gauge size={18} />}
                  label="Approved close-outs reviewed"
                  value={dashboard.safety_attention.approved_close_outs_reviewed}
                  href="/safety/work-close-out"
                />
              </div>
            </section>
          </div>

          <OngoingWorkPanel items={dashboard.ongoing_work} />
        </>
      ) : null}
    </AppLayout>
  );
}

function PendingHseQueue({ items }: { items: SafetyDashboardQueueItem[] }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(
    () =>
      filterBySearch(items, search, (item) => [
        item.reference,
        item.type,
        item.title,
        item.detail,
        item.location,
      ]),
    [items, search],
  );
  const pageCount = getPageCount(filteredItems.length, PENDING_QUEUE_PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = useMemo(
    () => paginateItems(filteredItems, currentPage, PENDING_QUEUE_PAGE_SIZE),
    [filteredItems, currentPage],
  );

  return (
    <section className="rounded-xl border border-brand-border bg-white">
      <div className="flex flex-col gap-2 border-b border-brand-border px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-text-primary">
            Pending HSE Queue
          </h2>
          <p className="mt-1 text-sm text-brand-text-secondary">
            Only requests currently waiting for HSE action are shown here.
          </p>
        </div>
        <span className="w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
          {items.length} open
        </span>
      </div>

      <div className="border-b border-brand-border px-5 py-3">
        <DashboardSearch
          value={search}
          placeholder="Search pending HSE requests"
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-5">
          <p className="rounded-lg border border-dashed border-brand-border bg-gray-50 p-4 text-sm text-brand-text-secondary">
            {items.length === 0
              ? "No requests are pending HSE review right now."
              : "No pending HSE requests match your search."}
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[28rem] overflow-y-auto">
            <div className="divide-y divide-brand-border">
              {paginatedItems.map((request) => (
                <Link
                  key={`${request.type}-${request.id}`}
                  href={request.href}
                  className="grid gap-3 px-5 py-4 transition-colors hover:bg-gray-50 md:grid-cols-[1fr_150px_120px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-brand-text-secondary">
                        {request.reference}
                      </span>
                      <StatusPill label={request.type} tone="blue" />
                    </div>
                    <p
                      className="mt-2 truncate text-sm font-semibold text-brand-text-primary"
                      title={request.title}
                    >
                      {request.title}
                    </p>
                    <p
                      className="mt-1 truncate text-xs text-brand-text-secondary"
                      title={request.detail}
                    >
                      {request.detail}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-secondary">
                      Location
                    </p>
                    <p
                      className="mt-1 truncate text-sm text-brand-text-primary"
                      title={request.location}
                    >
                      {request.location}
                    </p>
                  </div>
                  <div className="flex items-center md:justify-end">
                    <span className="text-sm font-medium text-brand-purple">
                      Review
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <PaginationFooter
            page={currentPage}
            pageCount={pageCount}
            total={filteredItems.length}
            pageSize={PENDING_QUEUE_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}

function OngoingWorkPanel({ items }: { items: SafetyDashboardOngoingWorkItem[] }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(
    () =>
      filterBySearch(items, search, (item) => [
        item.reference,
        item.current_stage,
        item.status,
        item.title,
        item.location,
        item.exact_work_area,
        item.supervisor,
        ...item.assigned_workers,
      ]),
    [items, search],
  );
  const pageCount = getPageCount(filteredItems.length, ONGOING_WORK_PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = useMemo(
    () => paginateItems(filteredItems, currentPage, ONGOING_WORK_PAGE_SIZE),
    [filteredItems, currentPage],
  );

  return (
    <section className="mt-5 rounded-xl border border-brand-border bg-white">
      <div className="flex flex-col gap-2 border-b border-brand-border px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-text-primary">
            Ongoing Work
          </h2>
          <p className="mt-1 text-sm text-brand-text-secondary">
            Approved work authorizations currently in execution or close-out review.
          </p>
        </div>
        <span className="w-fit rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
          {items.length} active
        </span>
      </div>

      <div className="border-b border-brand-border px-5 py-3">
        <DashboardSearch
          value={search}
          placeholder="Search ongoing work"
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-5">
          <p className="rounded-lg border border-dashed border-brand-border bg-gray-50 p-4 text-sm text-brand-text-secondary">
            {items.length === 0
              ? "No active authorized work is in progress right now."
              : "No ongoing work matches your search."}
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[34rem] overflow-y-auto">
            <div className="grid gap-3 p-5 xl:grid-cols-2">
              {paginatedItems.map((item) => (
                <Link
                  key={`${item.current_stage}-${item.id}`}
                  href={item.href}
                  className="rounded-lg border border-brand-border p-4 transition-colors hover:border-brand-purple hover:bg-brand-purple-faint"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-brand-text-secondary">
                          {item.reference}
                        </span>
                        <StatusPill label={item.current_stage} tone="green" />
                        <ApprovalBadge
                          status={getSafetyDisplayStatus(item.status)}
                        />
                      </div>
                      <p
                        className="mt-2 truncate text-sm font-semibold text-brand-text-primary"
                        title={item.title}
                      >
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    <InfoLine
                      icon={<MapPin size={15} />}
                      label="Location"
                      value={
                        item.exact_work_area
                          ? `${item.location} · ${item.exact_work_area}`
                          : item.location
                      }
                    />
                    <InfoLine
                      icon={<UserRound size={15} />}
                      label="Supervisor"
                      value={item.supervisor || "-"}
                    />
                    <InfoLine
                      icon={<UsersRound size={15} />}
                      label="Workers"
                      value={
                        item.assigned_workers.length > 0
                          ? item.assigned_workers.join(", ")
                          : "-"
                      }
                    />
                    <InfoLine
                      icon={<Gauge size={15} />}
                      label="Planned"
                      value={formatPlannedWindow(item)}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <PaginationFooter
            page={currentPage}
            pageCount={pageCount}
            total={filteredItems.length}
            pageSize={ONGOING_WORK_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}

function DashboardSearch({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary"
      />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-brand-border bg-white pl-9 pr-10 text-sm text-brand-text-primary outline-none transition placeholder:text-brand-text-secondary focus:border-transparent focus:ring-2 focus:ring-brand-purple"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-brand-text-secondary transition-colors hover:bg-gray-100 hover:text-brand-text-primary"
          aria-label={`Clear ${placeholder.toLowerCase()}`}
          title="Clear search"
        >
          <X size={15} />
        </button>
      ) : null}
    </div>
  );
}

function PaginationFooter({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-brand-border px-5 py-3 text-sm text-brand-text-secondary sm:flex-row sm:items-center sm:justify-between">
      <span>
        {start}-{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-brand-text-secondary transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-16 text-center text-xs font-medium text-brand-text-primary">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(page + 1, pageCount))}
          disabled={page >= pageCount}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-brand-text-secondary transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function DashboardMetric({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  tone: "amber" | "green" | "red" | "blue" | "orange";
}) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    green: "bg-green-50 text-green-700 ring-green-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
  }[tone];

  return (
    <section className="rounded-xl border border-brand-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-brand-text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-brand-text-primary">{value}</p>
        </div>
        <span className={cn("rounded-lg p-2 ring-1", toneClass)}>{icon}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-brand-text-secondary">{helper}</p>
    </section>
  );
}

function SignalRow({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-lg border border-brand-border px-3 py-3 transition-colors hover:border-brand-purple hover:bg-brand-purple-faint"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-brand-text-secondary">
          {icon}
        </span>
        <span className="line-clamp-2 text-sm font-medium text-brand-text-primary">
          {label}
        </span>
      </span>
      <span className="text-lg font-semibold text-brand-text-primary">{value}</span>
    </Link>
  );
}

function TrendPanel({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: SafetyDashboardTrendRow[];
}) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return (
    <section className="rounded-xl border border-brand-border bg-white">
      <div className="border-b border-brand-border px-5 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        <p className="mt-1 text-sm text-brand-text-secondary">{description}</p>
      </div>
      <div className="space-y-4 p-5">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-brand-border bg-gray-50 p-4 text-sm text-brand-text-secondary">
            No reports available yet.
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-brand-text-primary">
                  {row.label}
                </p>
                <p className="text-sm font-semibold text-brand-text-primary">{row.value}</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-brand-purple"
                  style={{ width: `${Math.max((row.value / maxValue) * 100, 12)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-2">
      <span className="mt-0.5 shrink-0 text-brand-text-secondary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-brand-text-secondary">
          {label}
        </span>
        <span className="block truncate text-sm text-brand-text-primary" title={value}>
          {value}
        </span>
      </span>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "amber" | "blue" | "red" | "green" | "gray";
}) {
  const toneClass = {
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
  }[tone];

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", toneClass)}>
      {label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl border border-brand-border bg-white"
          />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-brand-border bg-white" />
        <div className="h-64 animate-pulse rounded-xl border border-brand-border bg-white" />
      </div>
    </div>
  );
}

function getPageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

function paginateItems<T>(items: T[], page: number, pageSize: number) {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function filterBySearch<T>(
  items: T[],
  search: string,
  getValues: (item: T) => Array<string | null | undefined>,
) {
  const query = search.trim().toLowerCase();
  if (!query) return items;

  return items.filter((item) =>
    getValues(item).some((value) => String(value ?? "").toLowerCase().includes(query)),
  );
}

function formatPlannedWindow(item: SafetyDashboardOngoingWorkItem) {
  if (!item.planned_start_at && !item.planned_end_at) return "-";
  if (!item.planned_end_at) return formatDateTime(item.planned_start_at ?? null);
  return `${formatDateTime(item.planned_start_at ?? null)} - ${formatDateTime(
    item.planned_end_at,
  )}`;
}
