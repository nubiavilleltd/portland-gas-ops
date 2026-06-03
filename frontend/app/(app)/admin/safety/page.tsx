"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import {
  getAdminIncidentHref,
  getAdminWorkAuthorizationHref,
  getAdminWorkCloseOutHref,
  isExceptionWorkCloseOut,
} from "@/lib/safety-demo-routing";
import { useSafetyDemoData } from "@/lib/safety-demo-store";
import type {
  IncidentHazardReport,
  WorkAuthorizationRequest,
  WorkCloseOutRequest,
} from "@/types/safety";
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Gauge,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

const severityRank: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

type PendingHseRequest = {
  id: string;
  type: "Incident Review" | "Work Authorization" | "Close-Out Verification";
  title: string;
  location: string;
  href: string;
  detail: string;
  sortScore: number;
};

export default function AdminSafetyDashboardPage() {
  const { incidentHazards, workAuthorizations, workCloseOuts } = useSafetyDemoData();

  const pendingHseRequests = getPendingHseRequests({
    incidentHazards,
    workAuthorizations,
    workCloseOuts,
  });
  const approvedCloseOuts = workCloseOuts.filter((request) => request.status === "approved");
  const acknowledgedCloseOuts = workCloseOuts.filter(
    (request) => request.status === "acknowledged",
  );
  const successfulCloseOuts = approvedCloseOuts.filter(isCleanCloseOut);
  const worksWithHazards = workCloseOuts.filter(hasCloseOutHazard);
  const compliantEndToEnd = approvedCloseOuts.filter((closeOut) =>
    isCompliantEndToEnd(closeOut, workAuthorizations),
  );
  const gasOrFireConcerns = incidentHazards.filter(
    (report) => report.gasFireEnvironmentalConcern,
  );
  const openCorrectiveActions = incidentHazards.filter(
    (report) => report.status === "recommended" || report.status === "resolved",
  );
  const topHazardTypes = getTopCounts(
    incidentHazards
      .filter((report) => report.status !== "draft")
      .map((report) => report.reportType || "Unclassified"),
  );
  const topHazardLocations = getTopCounts(
    incidentHazards
      .filter((report) => report.status !== "draft")
      .map((report) => report.location || "Unspecified"),
  );
  const complianceRate =
    approvedCloseOuts.length > 0
      ? Math.round((compliantEndToEnd.length / approvedCloseOuts.length) * 100)
      : 0;

  return (
    <AppLayout pageTitle="Admin">
      <PageHeader
        title="Safety Dashboard"
        description="Admin source of truth for HSE queue, close-out quality, corrective actions, and hazard patterns"
      />

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <DashboardMetric
          label="Pending HSE Requests"
          value={pendingHseRequests.length}
          helper="Incident reviews, authorizations, and close-outs awaiting HSE"
          icon={<ShieldAlert size={20} />}
          tone="amber"
        />
        <DashboardMetric
          label="Clean Close-Outs"
          value={successfulCloseOuts.length}
          helper="Approved work with no incident, no deviation, and no remaining hazard"
          icon={<CheckCircle2 size={20} />}
          tone="green"
        />
        <DashboardMetric
          label="Unsuccessful Close-Outs"
          value={acknowledgedCloseOuts.length}
          helper="Exception close-outs acknowledged for audit, not counted as successful"
          icon={<ShieldAlert size={20} />}
          tone="orange"
        />
        <DashboardMetric
          label="Works With Hazards"
          value={worksWithHazards.length}
          helper="Close-outs that recorded incidents, deviations, or remaining hazards"
          icon={<AlertTriangle size={20} />}
          tone="red"
        />
        <DashboardMetric
          label="End-to-End Compliance"
          value={`${complianceRate}%`}
          helper={`${compliantEndToEnd.length} of ${approvedCloseOuts.length} approved close-outs fully compliant`}
          icon={<ShieldCheck size={20} />}
          tone="blue"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <TrendPanel
          title="Most Reported Hazard Types"
          description="Based on submitted, recommended, resolved, and closed incident reports."
          rows={topHazardTypes}
        />
        <TrendPanel
          title="Most Reported Locations"
          description="Shows where repeat safety signals are clustering."
          rows={topHazardLocations}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
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
              {pendingHseRequests.length} open
            </span>
          </div>

          {pendingHseRequests.length === 0 ? (
            <div className="p-5">
              <p className="rounded-lg border border-dashed border-brand-border bg-gray-50 p-4 text-sm text-brand-text-secondary">
                No requests are pending HSE review right now.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {pendingHseRequests.map((request) => (
                <Link
                  key={`${request.type}-${request.id}`}
                  href={request.href}
                  className="grid gap-3 px-5 py-4 transition-colors hover:bg-gray-50 md:grid-cols-[1fr_150px_120px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-brand-text-secondary">
                        {request.id}
                      </span>
                      <StatusPill label={request.type} tone="blue" />
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm font-semibold text-brand-text-primary">
                      {request.title}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-brand-text-secondary">
                      {request.detail}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-secondary">
                      Location
                    </p>
                    <p className="mt-1 text-sm text-brand-text-primary">{request.location}</p>
                  </div>
                  <div className="flex items-center md:justify-end">
                    <span className="text-sm font-medium text-brand-purple">Review</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

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
              value={gasOrFireConcerns.length}
              href="/admin/safety/incidents"
            />
            <SignalRow
              icon={<ListChecks size={18} />}
              label="Open corrective-action records"
              value={openCorrectiveActions.length}
              href="/admin/safety/incidents"
            />
            <SignalRow
              icon={<Gauge size={18} />}
              label="Approved close-outs reviewed"
              value={approvedCloseOuts.length}
              href="/admin/safety/work-close-out"
            />
          </div>
        </section>
      </div>

    </AppLayout>
  );
}

function getPendingHseRequests({
  incidentHazards,
  workAuthorizations,
  workCloseOuts,
}: {
  incidentHazards: IncidentHazardReport[];
  workAuthorizations: WorkAuthorizationRequest[];
  workCloseOuts: WorkCloseOutRequest[];
}) {
  const incidentReviews: PendingHseRequest[] = incidentHazards
    .filter((report) => report.status === "submitted")
    .map((report) => ({
      id: report.id,
      type: "Incident Review",
      title: report.title || "Untitled incident or hazard report",
      location: report.location || "-",
      href: getAdminIncidentHref(report),
      detail: report.gasFireEnvironmentalConcern
        ? "Gas, fire, or environmental concern flagged"
        : report.reportType || "Awaiting HSE review",
      sortScore: severityRank[report.severityEstimate] ?? 0,
    }));

  const authorizationReviews: PendingHseRequest[] = workAuthorizations
    .filter((request) => request.status === "submitted")
    .map((request) => ({
      id: request.id,
      type: "Work Authorization",
      title: request.workInitiation.title,
      location: request.workInitiation.location,
      href: getAdminWorkAuthorizationHref(request),
      detail: getRiskSummary(request),
      sortScore: getAuthorizationSortScore(request),
    }));

  const closeOutReviews: PendingHseRequest[] = workCloseOuts
    .filter(
      (request) =>
        request.status === "pending_approval" &&
        Boolean(request.operationsHeadApproval) &&
        !request.hseApproval,
    )
    .map((request) => ({
      id: request.id,
      type: "Close-Out Verification",
      title: request.title,
      location: request.workAuthorization.location,
      href: getAdminWorkCloseOutHref(request),
      detail: hasCloseOutHazard(request)
        ? "Close-out has hazard, deviation, or monitoring concern"
        : "Operations has approved; HSE verification is pending",
      sortScore: hasCloseOutHazard(request) ? 3 : 1,
    }));

  return [...incidentReviews, ...authorizationReviews, ...closeOutReviews].sort(
    (a, b) => b.sortScore - a.sortScore || a.id.localeCompare(b.id),
  );
}

function isCleanCloseOut(request: WorkCloseOutRequest) {
  return (
    request.status === "approved" &&
    request.hseApproval?.decision === "Approve" &&
    request.completionDetails.workCompleted &&
    request.completionDetails.completedAsApproved &&
    !request.completionDetails.incidentObserved &&
    request.monitoring.monitoredDuringExecution &&
    request.monitoring.stayedWithinScope &&
    request.monitoring.ppeAndControlsMaintained &&
    request.areaCondition.workAreaCleaned &&
    request.areaCondition.toolsRemoved &&
    request.areaCondition.systemSafe &&
    !request.areaCondition.remainingHazard &&
    request.hseApproval.areaSafeForOperations &&
    !request.hseApproval.correctiveActionRequired
  );
}

function hasCloseOutHazard(request: WorkCloseOutRequest) {
  return isExceptionWorkCloseOut(request) || Boolean(request.hseApproval?.correctiveActionRequired);
}

function isCompliantEndToEnd(
  closeOut: WorkCloseOutRequest,
  workAuthorizations: WorkAuthorizationRequest[],
) {
  const authorization = workAuthorizations.find(
    (request) => request.id === closeOut.workAuthorization.id,
  );
  const requiredInspectionChecks = authorization?.hseInspection
    ? [
        authorization.hseInspection.workAreaSafe,
        authorization.hseInspection.emergencyEquipmentAvailable,
        authorization.hseInspection.gasPressureCheckCompleted,
        authorization.hseInspection.ppeAndSafetyKitsAvailable,
        authorization.hseInspection.safetyControlsInPlace,
      ]
    : [];
  const authorizationCompliant =
    closeOut.workAuthorization.status === "approved" &&
    (!authorization ||
      (authorization.status === "approved" &&
        authorization.hseApproval?.decision === "Approve" &&
        authorization.hseInspection?.result === "Passed" &&
        requiredInspectionChecks.every((value) => value === "Pass")));

  return authorizationCompliant && isCleanCloseOut(closeOut);
}

function getAuthorizationSortScore(request: WorkAuthorizationRequest) {
  const { gasInvolved, pressurizedSystem, heatOrSparks, electricalIsolation } =
    request.riskIndicators;

  if (gasInvolved && (pressurizedSystem || heatOrSparks)) return 3;
  if (heatOrSparks || electricalIsolation || pressurizedSystem) return 2;
  return 1;
}

function getRiskSummary(request: WorkAuthorizationRequest) {
  const risks = [
    request.riskIndicators.gasInvolved ? "gas" : "",
    request.riskIndicators.pressurizedSystem ? "pressurized system" : "",
    request.riskIndicators.heatOrSparks ? "hot work" : "",
    request.riskIndicators.electricalIsolation ? "electrical isolation" : "",
    request.riskIndicators.liftingEquipment ? "lifting" : "",
  ].filter(Boolean);

  return risks.length > 0
    ? `Risk indicators: ${risks.join(", ")}`
    : "No high-risk indicator selected";
}

function getTopCounts(items: string[]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 5);
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
        <span className={`rounded-lg p-2 ring-1 ${toneClass}`}>{icon}</span>
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
  rows: { label: string; value: number }[];
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
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
}
