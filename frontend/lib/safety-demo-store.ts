"use client";

import { useMemo, useSyncExternalStore } from "react";
import { mockIncidentHazardReports } from "@/lib/mock/incident-hazard";
import { mockWorkAuthorizationRequests } from "@/lib/mock/work-authorization";
import { mockWorkCloseOutRequests } from "@/lib/mock/work-close-out";
import { mockWorkInitiationRequests } from "@/lib/mock/work-initiation";
import type {
  ApprovedWorkAuthorizationOption,
  AssignedWorkInitiationSummary,
  IncidentHazardReport,
  WorkAuthorizationRequest,
  WorkCloseOutRequest,
  WorkInitiationRequest,
} from "@/types/safety";

const STORAGE_KEY = "portland-gas-ops.safety-demo.v6";
const CHANGE_EVENT = "safety-demo-data-changed";

export interface SafetyDemoData {
  incidentHazards: IncidentHazardReport[];
  workInitiations: WorkInitiationRequest[];
  workAuthorizations: WorkAuthorizationRequest[];
  workCloseOuts: WorkCloseOutRequest[];
}

function seedData(): SafetyDemoData {
  return structuredClone({
    incidentHazards: mockIncidentHazardReports,
    workInitiations: mockWorkInitiationRequests,
    workAuthorizations: mockWorkAuthorizationRequests,
    workCloseOuts: mockWorkCloseOutRequests,
  });
}

const SEED_SNAPSHOT = JSON.stringify(seedData());

function mergeMissingById<T extends { id: string }>(current: T[], seed: T[]) {
  const existingIds = new Set(current.map((item) => item.id));
  const missingSeedItems = seed.filter((item) => !existingIds.has(item.id));
  return missingSeedItems.length > 0
    ? { items: [...current, ...structuredClone(missingSeedItems)], changed: true }
    : { items: current, changed: false };
}

function mergeSeedRecords(data: SafetyDemoData) {
  const seed = seedData();
  const incidentHazards = mergeMissingById(data.incidentHazards ?? [], seed.incidentHazards);
  const workInitiations = mergeMissingById(data.workInitiations ?? [], seed.workInitiations);
  const workAuthorizations = mergeMissingById(
    data.workAuthorizations ?? [],
    seed.workAuthorizations,
  );
  const workCloseOuts = mergeMissingById(data.workCloseOuts ?? [], seed.workCloseOuts);

  return {
    data: {
      incidentHazards: incidentHazards.items,
      workInitiations: workInitiations.items,
      workAuthorizations: workAuthorizations.items,
      workCloseOuts: workCloseOuts.items,
    },
    changed:
      incidentHazards.changed ||
      workInitiations.changed ||
      workAuthorizations.changed ||
      workCloseOuts.changed,
  };
}

export function readSafetyDemoData(): SafetyDemoData {
  if (typeof window === "undefined") return seedData();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seeded = seedData();
    writeSafetyDemoData(seeded);
    return seeded;
  }

  try {
    const migrated = mergeSeedRecords(JSON.parse(stored) as SafetyDemoData);
    if (migrated.changed) writeSafetyDemoData(migrated.data);
    return migrated.data;
  } catch {
    const seeded = seedData();
    writeSafetyDemoData(seeded);
    return seeded;
  }
}

function writeSafetyDemoData(data: SafetyDemoData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function getSafetyDemoSnapshot() {
  if (typeof window === "undefined") return SEED_SNAPSHOT;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const migrated = mergeSeedRecords(JSON.parse(stored) as SafetyDemoData);
      if (migrated.changed) {
        const snapshot = JSON.stringify(migrated.data);
        window.localStorage.setItem(STORAGE_KEY, snapshot);
        return snapshot;
      }
    } catch {
      window.localStorage.setItem(STORAGE_KEY, SEED_SNAPSHOT);
      return SEED_SNAPSHOT;
    }
    return stored;
  }
  window.localStorage.setItem(STORAGE_KEY, SEED_SNAPSHOT);
  return SEED_SNAPSHOT;
}

function subscribeSafetyDemoData(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) onStoreChange();
  }
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useSafetyDemoData() {
  const snapshot = useSyncExternalStore(
    subscribeSafetyDemoData,
    getSafetyDemoSnapshot,
    () => SEED_SNAPSHOT,
  );
  return useMemo(() => JSON.parse(snapshot) as SafetyDemoData, [snapshot]);
}

function nextReference(prefix: string, existingIds: string[]) {
  const year = new Date().getFullYear();
  const number =
    existingIds.reduce((highest, id) => {
      const match = id.match(new RegExp(`^${prefix}-${year}-(\\d+)$`));
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;
  return `${prefix}-${year}-${String(number).padStart(4, "0")}`;
}

export function listIncidentHazardReports() {
  return structuredClone(readSafetyDemoData().incidentHazards);
}

export function getIncidentHazardReport(id: string) {
  const report = readSafetyDemoData().incidentHazards.find((item) => item.id === id);
  return report ? structuredClone(report) : null;
}

export function createIncidentHazardReport(
  create: (id: string) => IncidentHazardReport,
) {
  const data = readSafetyDemoData();
  const report = create(nextReference("IH", data.incidentHazards.map((item) => item.id)));
  data.incidentHazards.unshift(report);
  writeSafetyDemoData(data);
  return structuredClone(report);
}

export function updateIncidentHazardReport(
  id: string,
  update: (report: IncidentHazardReport) => IncidentHazardReport,
) {
  const data = readSafetyDemoData();
  const index = data.incidentHazards.findIndex((item) => item.id === id);
  if (index < 0) return null;
  data.incidentHazards[index] = update(data.incidentHazards[index]);
  writeSafetyDemoData(data);
  return structuredClone(data.incidentHazards[index]);
}

export function listWorkInitiations() {
  return structuredClone(readSafetyDemoData().workInitiations);
}

export function getWorkInitiation(id: string) {
  const request = readSafetyDemoData().workInitiations.find((item) => item.id === id);
  return request ? structuredClone(request) : null;
}

export function createWorkInitiation(create: (id: string) => WorkInitiationRequest) {
  const data = readSafetyDemoData();
  const request = create(nextReference("WI", data.workInitiations.map((item) => item.id)));
  data.workInitiations.unshift(request);
  writeSafetyDemoData(data);
  return structuredClone(request);
}

export function updateWorkInitiation(
  id: string,
  update: (request: WorkInitiationRequest) => WorkInitiationRequest,
) {
  const data = readSafetyDemoData();
  const index = data.workInitiations.findIndex((item) => item.id === id);
  if (index < 0) return null;
  data.workInitiations[index] = update(data.workInitiations[index]);
  writeSafetyDemoData(data);
  return structuredClone(data.workInitiations[index]);
}

function toAssignedSummary(request: WorkInitiationRequest): AssignedWorkInitiationSummary {
  return {
    id: request.id,
    title: request.title,
    status: "approved",
    workCategory: request.workCategory,
    relatedIncidentHazardId: request.relatedIncidentHazardId,
    workType: request.workType,
    location: request.location,
    exactWorkArea: request.exactWorkArea,
    workDescription: request.workDescription,
    assignedSupervisor: request.assignment.assignedSupervisor,
    assignedWorkers: request.assignment.assignedWorkers,
    contractorsNeeded: request.assignment.contractorsNeeded,
    selectedContractor: request.assignment.selectedContractor,
    contractorContactEmail: request.assignment.contractorContactEmail,
    plannedStartDateTime: request.assignment.plannedStartDateTime,
    plannedEndDateTime: request.assignment.plannedEndDateTime,
  };
}

export function listApprovedWorkInitiationOptions() {
  return readSafetyDemoData().workInitiations
    .filter(
      (request) =>
        request.status === "approved" &&
        request.operationalReview?.decision === "Approve",
    )
    .map(toAssignedSummary);
}

export function listWorkAuthorizations() {
  return structuredClone(readSafetyDemoData().workAuthorizations);
}

export function getWorkAuthorization(id: string) {
  const request = readSafetyDemoData().workAuthorizations.find((item) => item.id === id);
  return request ? structuredClone(request) : null;
}

export function createWorkAuthorization(
  create: (id: string) => WorkAuthorizationRequest,
) {
  const data = readSafetyDemoData();
  const request = create(nextReference("WA", data.workAuthorizations.map((item) => item.id)));
  data.workAuthorizations.unshift(request);
  writeSafetyDemoData(data);
  return structuredClone(request);
}

export function updateWorkAuthorization(
  id: string,
  update: (request: WorkAuthorizationRequest) => WorkAuthorizationRequest,
) {
  const data = readSafetyDemoData();
  const index = data.workAuthorizations.findIndex((item) => item.id === id);
  if (index < 0) return null;
  data.workAuthorizations[index] = update(data.workAuthorizations[index]);
  writeSafetyDemoData(data);
  return structuredClone(data.workAuthorizations[index]);
}

function toApprovedAuthorizationOption(
  request: WorkAuthorizationRequest,
): ApprovedWorkAuthorizationOption {
  return {
    id: request.id,
    title: request.workInitiation.title,
    status: "approved",
    requester: request.requester.name,
    requestDate: request.requester.requestDate,
    department: request.requester.department,
    location: request.workInitiation.location,
    exactWorkArea: request.workInitiation.exactWorkArea,
    approvedStartDateTime: request.workInitiation.plannedStartDateTime,
    approvedEndDateTime: request.workInitiation.plannedEndDateTime,
    workTypes: request.workInitiation.workType,
    supervisor: request.workInitiation.assignedSupervisor,
    hseApprover: request.hseApproval?.approver ?? "Daniel Okoro",
  };
}

export function listApprovedWorkAuthorizationOptions() {
  return readSafetyDemoData().workAuthorizations
    .filter((request) => request.status === "approved")
    .map(toApprovedAuthorizationOption);
}

export function listWorkCloseOuts() {
  return structuredClone(readSafetyDemoData().workCloseOuts);
}

export function getWorkCloseOut(id: string) {
  const request = readSafetyDemoData().workCloseOuts.find((item) => item.id === id);
  return request ? structuredClone(request) : null;
}

export function createWorkCloseOut(create: (id: string) => WorkCloseOutRequest) {
  const data = readSafetyDemoData();
  const request = create(nextReference("WC", data.workCloseOuts.map((item) => item.id)));
  data.workCloseOuts.unshift(request);
  writeSafetyDemoData(data);
  return structuredClone(request);
}

export function updateWorkCloseOut(
  id: string,
  update: (request: WorkCloseOutRequest) => WorkCloseOutRequest,
) {
  const data = readSafetyDemoData();
  const index = data.workCloseOuts.findIndex((item) => item.id === id);
  if (index < 0) return null;
  data.workCloseOuts[index] = update(data.workCloseOuts[index]);
  writeSafetyDemoData(data);
  return structuredClone(data.workCloseOuts[index]);
}

function getLinkedIncidentIdForCloseOut(data: SafetyDemoData, closeOut: WorkCloseOutRequest) {
  const authorization = data.workAuthorizations.find(
    (request) => request.id === closeOut.workAuthorization.id,
  );
  return authorization?.workInitiation.relatedIncidentHazardId ?? "";
}

export function getApprovedCloseOutForIncident(incidentId: string) {
  const data = readSafetyDemoData();
  const closeOut = data.workCloseOuts.find(
    (request) =>
      request.status === "approved" &&
      getLinkedIncidentIdForCloseOut(data, request) === incidentId,
  );
  return closeOut ? structuredClone(closeOut) : null;
}

export function resolveIncidentWithCompletedWork(incidentId: string) {
  const data = readSafetyDemoData();
  const report = data.incidentHazards.find((item) => item.id === incidentId);
  const closeOut = data.workCloseOuts.find(
    (request) =>
      request.status === "approved" &&
      getLinkedIncidentIdForCloseOut(data, request) === incidentId,
  );
  if (!report || report.status !== "recommended" || !closeOut) return null;

  report.status = "resolved";
  report.resolutionWorkCompletionId = closeOut.id;
  report.auditTrail = [
    ...report.auditTrail,
    {
      action: "Resolved by Action Owner",
      actor: report.hseReview?.actionOwner || "Action Owner",
      role: "Action Owner",
      dateTime: "2026-05-25 03:50 PM",
      comment: `Corrective work completed under ${closeOut.id}. Submitted to HSE for closure.`,
    },
  ];
  writeSafetyDemoData(data);
  return structuredClone(report);
}

export function closeResolvedIncident(incidentId: string) {
  const data = readSafetyDemoData();
  const report = data.incidentHazards.find((item) => item.id === incidentId);
  if (!report || report.status !== "resolved") return null;

  report.status = "closed";
  report.auditTrail = [
    ...report.auditTrail,
    {
      action: "Closed by HSE",
      actor: report.hseReview?.inspector || "Daniel Okoro",
      role: "HSE Inspector",
      dateTime: "2026-05-25 04:00 PM",
      comment: report.resolutionWorkCompletionId
        ? `Verified corrective work completion ${report.resolutionWorkCompletionId}. Incident closed.`
        : "Incident resolution verified and closed by HSE.",
    },
  ];
  writeSafetyDemoData(data);
  return structuredClone(report);
}

export function resetSafetyDemoData() {
  writeSafetyDemoData(seedData());
}
