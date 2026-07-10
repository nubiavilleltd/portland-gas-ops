"use client";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  MapPin,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { useIncidentReports } from "@/lib/modules/safety/incidentReport";
import { useSafetyCurrentEmployee } from "@/lib/modules/safety/people";
import { useWorkAuthorizations } from "@/lib/modules/safety/workAuthorization";
import { useWorkCloseouts } from "@/lib/modules/safety/workCloseout";
import { useWorkInitiations } from "@/lib/modules/safety/workInitiation";
import { useMyApprovals } from "@/lib/modules/workflow/queries";
import { cn, toTitleCase } from "@/lib/utils";
import type {
  IncidentHazardReport,
  IncidentHazardStatus,
  WorkAuthorizationRequest,
  WorkAuthorizationStatus,
  WorkCloseOutRequest,
  WorkCloseOutStatus,
  WorkInitiationRequest,
  WorkInitiationStatus,
} from "@/types/safety";

const openIncidentStatuses = new Set<IncidentHazardStatus>([
  "submitted",
  "recommended",
  "pending_hse_verification",
  "not_resolved",
]);
const pendingInitiationStatuses = new Set<WorkInitiationStatus>([
  "submitted",
  "pending",
]);
const pendingAuthorizationStatuses = new Set<WorkAuthorizationStatus>([
  "submitted",
]);
const pendingCloseoutStatuses = new Set<WorkCloseOutStatus>([
  "submitted",
  "pending",
]);

type SafetyActivity = {
  id: string;
  reference: string;
  title: string;
  type: string;
  status: string;
  location: string;
  href: string;
  dateLabel: string;
  sortDate: number;
};

export default function AdminSafetyDashboardPage() {
  const incidentsQuery = useIncidentReports({ limit: 100 });
  const initiationsQuery = useWorkInitiations({ limit: 100 });
  const authorizationsQuery = useWorkAuthorizations({ limit: 100 });
  const closeoutsQuery = useWorkCloseouts({ limit: 100 });
  const approvalsQuery = useMyApprovals();
  const currentEmployeeQuery = useSafetyCurrentEmployee();

  const incidents = incidentsQuery.data ?? [];
  const initiations = initiationsQuery.data ?? [];
  const authorizations = authorizationsQuery.data ?? [];
  const closeouts = closeoutsQuery.data ?? [];
  const approvals = approvalsQuery.data ?? [];
  const currentEmployeeId = currentEmployeeQuery.data?.id;

  const isLoading =
    incidentsQuery.isLoading ||
    initiationsQuery.isLoading ||
    authorizationsQuery.isLoading ||
    closeoutsQuery.isLoading ||
    approvalsQuery.isLoading ||
    currentEmployeeQuery.isLoading;

  const highRiskIncidents = incidents.filter((incident) =>
    ["High", "Critical"].includes(incident.severityEstimate),
  );
  const recommendedIncidents = incidents.filter(
    (incident) => incident.status === "recommended",
  );
  const returnedWork = [
    ...initiations.filter((request) => request.status === "returned"),
    ...authorizations.filter((request) => request.status === "returned"),
    ...closeouts.filter((request) => request.status === "returned"),
  ];
  const exceptionCloseouts = closeouts.filter(
    (request) =>
      request.areaCondition.remainingHazard ||
      !request.completionDetails.completedAsApproved,
  );
  const pendingVerificationIncidents = incidents.filter(
    (incident) => incident.status === "pending_hse_verification",
  );

  const assignedToMeCount = currentEmployeeId
    ? [
        ...initiations.filter((request) =>
          isWorkInitiationAssignedToEmployee(request, currentEmployeeId),
        ),
        ...authorizations.filter((request) =>
          isAuthorizationAssignedToEmployee(request, currentEmployeeId),
        ),
        ...closeouts.filter((request) =>
          isCloseoutAssignedToEmployee(request, currentEmployeeId),
        ),
      ].length
    : 0;

  const locationRows = topCounts([
    ...incidents.map((incident) => incident.location || "Unspecified"),
    ...initiations.map((request) => request.location || "Unspecified"),
    ...authorizations.map((request) => request.workInitiation.location || "Unspecified"),
    ...closeouts.map((request) => request.workAuthorization.location || "Unspecified"),
  ]);
  const recentActivity = buildRecentActivity({
    incidents,
    initiations,
    authorizations,
    closeouts,
  });

  return (
    <AppLayout pageTitle="Admin">
      <PageHeader
        title="Safety Dashboard"
        description="Oversight view for safety workload, risk signals, locations, and recent activity."
      />

      <div className="mt-6 space-y-5">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Open Incidents"
            value={countByStatus(incidents, openIncidentStatuses)}
            subtitle={`${highRiskIncidents.length} high or critical`}
            icon={<ShieldAlert size={20} />}
            tone="red"
            loading={isLoading}
          />
          <MetricCard
            title="Pending Initiations"
            value={countByStatus(initiations, pendingInitiationStatuses)}
            subtitle={`${returnedWork.length} returned across work flows`}
            icon={<ClipboardCheck size={20} />}
            tone="purple"
            loading={isLoading}
          />
          <MetricCard
            title="Pending Authorizations"
            value={countByStatus(authorizations, pendingAuthorizationStatuses)}
            subtitle={`${authorizations.filter((item) => item.status === "approved").length} approved`}
            icon={<ListChecks size={20} />}
            tone="blue"
            loading={isLoading}
          />
          <MetricCard
            title="Pending Close-Outs"
            value={countByStatus(closeouts, pendingCloseoutStatuses)}
            subtitle={`${exceptionCloseouts.length} exception signals`}
            icon={<CheckCircle2 size={20} />}
            tone="green"
            loading={isLoading}
          />
          <MetricCard
            title="Awaiting My Approval"
            value={approvals.length}
            subtitle={`${assignedToMeCount} assigned to me`}
            icon={<UserCheck size={20} />}
            tone="amber"
            loading={isLoading}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <DashboardPanel
            title="Needs Attention"
            description="Risk and workflow signals that should be reviewed first."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <AttentionItem
                label="High / critical incidents"
                value={highRiskIncidents.length}
                href="/safety/incidents"
                tone="red"
              />
              <AttentionItem
                label="Corrective action recommended"
                value={recommendedIncidents.length}
                href="/safety/incidents"
                tone="amber"
              />
              <AttentionItem
                label="Pending HSE verification"
                value={pendingVerificationIncidents.length}
                href="/safety/incidents"
                tone="blue"
              />
              <AttentionItem
                label="Close-out exceptions"
                value={exceptionCloseouts.length}
                href="/safety/work-close-out"
                tone="purple"
              />
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Top Locations"
            description="Most frequent locations across visible safety records."
          >
            <div className="space-y-3">
              {locationRows.length > 0 ? (
                locationRows.map((row) => (
                  <LocationRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    max={locationRows[0]?.value ?? 1}
                  />
                ))
              ) : (
                <EmptyState text="No location data available." />
              )}
            </div>
          </DashboardPanel>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <DashboardPanel
            title="Admin Watchlist"
            description="Records connected to your approvals or operational assignments."
          >
            <div className="grid gap-3">
              <SmallStat
                label="Awaiting my approval"
                value={approvals.length}
                href="/approvals"
              />
              <SmallStat
                label="Assigned to me"
                value={assignedToMeCount}
                href="/safety/work-initiation"
              />
              <SmallStat
                label="Returned work"
                value={returnedWork.length}
                href="/safety/work-initiation"
              />
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Recent Safety Activity"
            description="Latest visible records across Safety processes."
          >
            <div className="divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 8).map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className="grid gap-2 bg-white px-4 py-3 transition hover:bg-gray-50 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-brand-text-secondary">
                          {item.type}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-brand-text-secondary">
                          {toTitleCase(item.status)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-brand-text-primary">
                        {item.reference} - {item.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-text-secondary">
                        <MapPin size={12} />
                        <span className="truncate">{item.location || "Unspecified"}</span>
                      </p>
                    </div>
                    <p className="text-xs text-brand-text-secondary md:text-right">
                      {item.dateLabel}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="bg-white p-4">
                  <EmptyState text="No recent safety activity." />
                </div>
              )}
            </div>
          </DashboardPanel>
        </section>
      </div>
    </AppLayout>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  tone,
  loading,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  tone: "red" | "purple" | "blue" | "green" | "amber";
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 md:rounded-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-brand-text-secondary">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-brand-text-primary">
            {loading ? "..." : value}
          </p>
          <p className="mt-1 truncate text-xs text-brand-text-secondary">{subtitle}</p>
        </div>
        <div className={cn("rounded-xl p-2.5", toneClasses[tone])}>{icon}</div>
      </div>
    </div>
  );
}

function DashboardPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-brand-border bg-white md:rounded-2xl">
      <div className="border-b border-brand-border bg-gray-50 px-4 py-4 md:px-5">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        <p className="mt-1 text-sm text-brand-text-secondary">{description}</p>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function AttentionItem({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone: "red" | "amber" | "blue" | "purple";
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-brand-border px-4 py-3 transition hover:border-brand-purple hover:bg-gray-50"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-text-primary">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold", textToneClasses[tone])}>
          {value}
        </p>
      </div>
      <ArrowRight className="shrink-0 text-brand-text-secondary" size={18} />
    </Link>
  );
}

function LocationRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-brand-text-primary">{label}</p>
        <p className="text-sm text-brand-text-secondary">{value}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand-purple"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-brand-border px-4 py-3 transition hover:border-brand-purple hover:bg-gray-50"
    >
      <span className="text-sm font-medium text-brand-text-primary">{label}</span>
      <span className="rounded-full bg-brand-purple-faint px-3 py-1 text-sm font-semibold text-brand-purple">
        {value}
      </span>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-brand-text-secondary">{text}</p>;
}

function countByStatus<T extends { status: string }>(
  items: T[],
  statuses: Set<string>,
) {
  return items.filter((item) => statuses.has(item.status)).length;
}

function topCounts(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const label = value.trim() || "Unspecified";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 5);
}

function buildRecentActivity({
  incidents,
  initiations,
  authorizations,
  closeouts,
}: {
  incidents: IncidentHazardReport[];
  initiations: WorkInitiationRequest[];
  authorizations: WorkAuthorizationRequest[];
  closeouts: WorkCloseOutRequest[];
}): SafetyActivity[] {
  return [
    ...incidents.map((item) => ({
      id: item.id,
      reference: item.reference ?? "Incident",
      title: item.title,
      type: "Incident",
      status: item.status,
      location: item.location,
      href: `/safety/incidents/${item.id}`,
      dateLabel: item.reporter.reportDate,
      sortDate: toSortTime(item.reportedAtRaw ?? item.reporter.reportDate),
    })),
    ...initiations.map((item) => ({
      id: item.id,
      reference: item.reference ?? "Work Initiation",
      title: item.title,
      type: "Initiation",
      status: item.status,
      location: item.location,
      href: `/safety/work-initiation/${item.id}`,
      dateLabel: item.requester.requestDate,
      sortDate: toSortTime(item.requester.requestDate),
    })),
    ...authorizations.map((item) => ({
      id: item.id,
      reference: item.reference ?? "Work Authorization",
      title: item.workInitiation.title,
      type: "Authorization",
      status: item.status,
      location: item.workInitiation.location,
      href: `/safety/work-authorization/${item.id}`,
      dateLabel: item.requester.requestDate,
      sortDate: toSortTime(item.requestedAtRaw ?? item.requester.requestDate),
    })),
    ...closeouts.map((item) => ({
      id: item.id,
      reference: item.reference ?? "Close-Out",
      title: item.title,
      type: "Close-Out",
      status: item.status,
      location: item.workAuthorization.location,
      href: `/safety/work-close-out/${item.id}`,
      dateLabel: item.requester.requestDate,
      sortDate: toSortTime(item.requester.requestDate),
    })),
  ].sort((a, b) => b.sortDate - a.sortDate);
}

function toSortTime(value?: string | null) {
  if (!value) return 0;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function isWorkInitiationAssignedToEmployee(
  request: WorkInitiationRequest,
  employeeId: string,
) {
  return (
    request.assignment.assignedSupervisorId === employeeId ||
    Boolean(request.assignment.assignedWorkerIds?.includes(employeeId))
  );
}

function isAuthorizationAssignedToEmployee(
  request: WorkAuthorizationRequest,
  employeeId: string,
) {
  return (
    request.workInitiation.assignedSupervisorId === employeeId ||
    Boolean(request.workInitiation.assignedWorkerIds?.includes(employeeId))
  );
}

function isCloseoutAssignedToEmployee(
  request: WorkCloseOutRequest,
  employeeId: string,
) {
  return (
    request.workAuthorization.supervisorId === employeeId ||
    Boolean(request.workAuthorization.assignedWorkerIds?.includes(employeeId))
  );
}

const toneClasses = {
  red: "bg-red-50 text-red-700",
  purple: "bg-brand-purple-faint text-brand-purple",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
};

const textToneClasses = {
  red: "text-red-700",
  amber: "text-amber-700",
  blue: "text-blue-700",
  purple: "text-brand-purple",
};
