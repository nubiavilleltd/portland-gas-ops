"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import type {
  ApprovedWorkAuthorizationOption,
  WorkAuthorizationRequest,
} from "@/types/safety";
import { useToast } from "@/hooks/useToast";
import { useSafetyCurrentEmployee } from "@/lib/modules/safety/people";
import {
  useCreateWorkCloseout,
  useEligibleWorkAuthorizationsForCloseout,
  type WorkCloseOutChecklistAnswerCreate,
} from "@/lib/modules/safety/workCloseout";
import {
  getDateTimeAfter,
  getLatestActualWorkDateTime,
  getLatestActualWorkStartDateTime,
  isDateTimeBefore,
  MIN_SCHEDULE_DURATION_MINUTES,
  SCHEDULE_DEVIATION_TOLERANCE_MINUTES,
} from "@/lib/modules/safety/date-rules";
import { useActiveSafetyChecklist } from "@/lib/modules/safety/checklists";
import type { SafetyChecklistItem } from "@/lib/modules/safety/checklists";
import {
  clearValidationError,
  getFirstInvalidField,
  scrollToValidationField,
  type ValidationErrors,
} from "@/lib/modules/safety/form-validation";
import SafetyProcessFormSkeleton from "./SafetyProcessFormSkeleton";
import SafetyChoiceTable from "./SafetyChoiceTable";
import SafetyValidationSummary from "./SafetyValidationSummary";

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const yesNoNaOptions = [...yesNoOptions, { value: "N/A", label: "N/A" }];

type WorkCompletionValidationField =
  | "selectedWorkAuthorizationId"
  | "actualStartDateTime"
  | "actualCompletionDateTime"
  | "completionChecklist"
  | "completionSummary"
  | "deviationExplanation"
  | "incidentNote"
  | "monitoringChecklist"
  | "areaConditionChecklist"
  | "remainingHazardDetails";

const workCompletionFieldOrder: WorkCompletionValidationField[] = [
  "selectedWorkAuthorizationId",
  "actualStartDateTime",
  "actualCompletionDateTime",
  "completionChecklist",
  "completionSummary",
  "deviationExplanation",
  "incidentNote",
  "monitoringChecklist",
  "areaConditionChecklist",
  "remainingHazardDetails",
];

export default function WorkCompletionForm() {
  const router = useRouter();
  const toast = useToast();
  const [selectedWorkAuthorizationId, setSelectedWorkAuthorizationId] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    ValidationErrors<WorkCompletionValidationField>
  >({});
  const currentEmployee = useSafetyCurrentEmployee();
  const approvedAuthorizations = useEligibleWorkAuthorizationsForCloseout();
  const createCloseout = useCreateWorkCloseout();
  const completionChecklist = useActiveSafetyChecklist("work_closeout", "completion");
  const monitoringChecklist = useActiveSafetyChecklist("work_closeout", "monitoring");
  const areaConditionChecklist = useActiveSafetyChecklist(
    "work_closeout",
    "closeout_review",
  );
  const workAuthorizations: ApprovedWorkAuthorizationOption[] = (approvedAuthorizations.data ?? [])
    .map(mapApprovedAuthorizationOption);
  const [actualStartDateTime, setActualStartDateTime] = useState("");
  const [actualCompletionDateTime, setActualCompletionDateTime] = useState("");
  const [workCompleted, setWorkCompleted] = useState("");
  const [completedAsApproved, setCompletedAsApproved] = useState("");
  const [incidentObserved, setIncidentObserved] = useState("");
  const [completionSummary, setCompletionSummary] = useState("");
  const [deviationExplanation, setDeviationExplanation] = useState("");
  const [incidentNote, setIncidentNote] = useState("");
  const [monitoredDuringExecution, setMonitoredDuringExecution] = useState("");
  const [stayedWithinScope, setStayedWithinScope] = useState("");
  const [ppeAndControlsMaintained, setPpeAndControlsMaintained] = useState("");
  const [unsafeConditionAddressed, setUnsafeConditionAddressed] = useState("");
  const [workAreaCleaned, setWorkAreaCleaned] = useState("");
  const [toolsRemoved, setToolsRemoved] = useState("");
  const [systemSafe, setSystemSafe] = useState("");
  const [remainingHazard, setRemainingHazard] = useState("");
  const [remainingHazardDetails, setRemainingHazardDetails] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const selectedWorkAuthorizationRef = useRef<HTMLInputElement | null>(null);
  const actualStartDateTimeRef = useRef<HTMLInputElement | null>(null);
  const actualCompletionDateTimeRef = useRef<HTMLInputElement | null>(null);
  const completionChecklistRef = useRef<HTMLDivElement | null>(null);
  const completionSummaryRef = useRef<HTMLTextAreaElement | null>(null);
  const deviationExplanationRef = useRef<HTMLTextAreaElement | null>(null);
  const incidentNoteRef = useRef<HTMLTextAreaElement | null>(null);
  const monitoringChecklistRef = useRef<HTMLDivElement | null>(null);
  const areaConditionChecklistRef = useRef<HTMLDivElement | null>(null);
  const remainingHazardDetailsRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedWorkAuthorization = useMemo(
    () =>
      workAuthorizations.find(
        (item) => item.id === selectedWorkAuthorizationId
      ) ?? null,
    [selectedWorkAuthorizationId, workAuthorizations]
  );
  const requiresDeviationExplanation =
    completedAsApproved === "No" ||
    hasScheduleDeviation({
      selectedWorkAuthorization,
      actualStartDateTime,
      actualCompletionDateTime,
    });
  const workAuthorizationOptions = workAuthorizations.map((item) => ({
    value: item.id,
    label: item.reference ? `${item.reference} - ${item.title}` : item.title,
    description: `${item.requester} | ${item.requestDate}`,
  }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createCloseout.isPending) return;
    const nextValidationErrors = validateWorkCompletionForm({
      selectedWorkAuthorization,
      actualStartDateTime,
      actualCompletionDateTime,
      workCompleted,
      completedAsApproved,
      incidentObserved,
      completionSummary,
      deviationExplanation,
      incidentNote,
      monitoredDuringExecution,
      stayedWithinScope,
      ppeAndControlsMaintained,
      unsafeConditionAddressed,
      workAreaCleaned,
      toolsRemoved,
      systemSafe,
      remainingHazard,
      remainingHazardDetails,
    });
    setValidationErrors(nextValidationErrors);

    const firstInvalidField = getFirstInvalidField(
      nextValidationErrors,
      workCompletionFieldOrder,
    );
    if (firstInvalidField) {
      scrollToValidationField(
        getWorkCompletionFieldRef(firstInvalidField, {
          selectedWorkAuthorizationRef,
          actualStartDateTimeRef,
          actualCompletionDateTimeRef,
          completionChecklistRef,
          completionSummaryRef,
          deviationExplanationRef,
          incidentNoteRef,
          monitoringChecklistRef,
          areaConditionChecklistRef,
          remainingHazardDetailsRef,
        }),
      );
      return;
    }
    if (!selectedWorkAuthorization) return;

    try {
      const saved = await createCloseout.mutateAsync({
        payload: {
          work_authorization_id: selectedWorkAuthorization.id,
          actual_start_at: toApiDateTime(actualStartDateTime),
          actual_completion_at: toApiDateTime(actualCompletionDateTime),
          work_completed: workCompleted === "Yes",
          completed_as_approved: completedAsApproved === "Yes",
          deviation_explanation: deviationExplanation || null,
          completion_summary: completionSummary,
          incident_observed: incidentObserved === "Yes",
          incident_note: incidentNote || null,
          completion_notes: null,
          monitored_during_execution: monitoredDuringExecution === "Yes",
          stayed_within_scope: stayedWithinScope === "Yes",
          ppe_and_controls_maintained: ppeAndControlsMaintained === "Yes",
          unsafe_condition_addressed: yesNoNaToAnswer(unsafeConditionAddressed),
          monitoring_comment: null,
          work_area_cleaned: workAreaCleaned === "Yes",
          tools_removed: toolsRemoved === "Yes",
          system_safe: systemSafe === "Yes",
          remaining_hazard: remainingHazard === "Yes",
          remaining_hazard_details: remainingHazardDetails || null,
          completion_checklist_answers: buildCompletionChecklistAnswers(
            completionChecklist.data?.items ?? [],
            {
              workCompleted,
              completedAsApproved,
              incidentObserved,
            },
          ),
          monitoring_checklist_answers: buildMonitoringChecklistAnswers(
            monitoringChecklist.data?.items ?? [],
            {
              monitoredDuringExecution,
              stayedWithinScope,
              ppeAndControlsMaintained,
              unsafeConditionAddressed,
            },
          ),
          area_condition_checklist_answers: buildAreaConditionChecklistAnswers(
            areaConditionChecklist.data?.items ?? [],
            {
              workAreaCleaned,
              toolsRemoved,
              systemSafe,
              remainingHazard,
            },
          ),
        },
        completionEvidence: completionFiles,
      });
      toast.success("Work close-out submitted successfully.");
      window.setTimeout(() => {
        router.push(`/safety/work-close-out/${saved.id}`);
      }, 700);
    } catch (error) {
      console.error("Failed to submit work close-out", error);
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to submit work close-out. Please review and try again.",
        ),
      );
    }
  }

  if (
    completionChecklist.isLoading ||
    monitoringChecklist.isLoading ||
    areaConditionChecklist.isLoading ||
    currentEmployee.isLoading ||
    approvedAuthorizations.isLoading
  ) {
    return <SafetyProcessFormSkeleton sections={5} />;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      <SafetyValidationSummary
        errors={validationErrors}
        fieldOrder={workCompletionFieldOrder}
      />

      <FormSection title="Work Authorization Lookup" description="Select the approved work authorization being completed.">
        <FormSelect
          ref={selectedWorkAuthorizationRef}
          label="Work Authorization Reference"
          required
          searchable
          options={workAuthorizationOptions}
          value={selectedWorkAuthorizationId}
          placeholder="Select approved work authorization"
          dropdownClassName="md:min-w-[34rem]"
          error={validationErrors.selectedWorkAuthorizationId}
          onValueChange={(value) => {
            setSelectedWorkAuthorizationId(value);
            clearValidationError("selectedWorkAuthorizationId", setValidationErrors);
          }}
        />
      </FormSection>

      <ApprovedWorkSummary workAuthorization={selectedWorkAuthorization} />

      <FormSection title="Completion Details" description="Record when the work occurred and what was completed.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormDateTimeInput
            ref={actualStartDateTimeRef}
            label="Actual Start Date/Time"
            required
            max={getLatestActualWorkStartDateTime()}
            value={actualStartDateTime}
            error={validationErrors.actualStartDateTime}
            onValueChange={(value) => {
              setActualStartDateTime(value);
              const minimumCompletion = getDateTimeAfter(
                value,
                MIN_SCHEDULE_DURATION_MINUTES,
              );
              if (
                actualCompletionDateTime &&
                isDateTimeBefore(actualCompletionDateTime, minimumCompletion)
              ) {
                setActualCompletionDateTime("");
                clearValidationError(
                  "actualCompletionDateTime",
                  setValidationErrors,
                );
              }
              clearValidationError("actualStartDateTime", setValidationErrors);
            }}
          />
          <FormDateTimeInput
            ref={actualCompletionDateTimeRef}
            label="Actual Completion Date/Time"
            required
            disabled={!actualStartDateTime}
            placeholder={
              actualStartDateTime
                ? "Select date and time"
                : "Select actual start date/time first"
            }
            min={
              actualStartDateTime
                ? getDateTimeAfter(actualStartDateTime, MIN_SCHEDULE_DURATION_MINUTES)
                : undefined
            }
            max={getLatestActualWorkDateTime()}
            value={actualCompletionDateTime}
            error={validationErrors.actualCompletionDateTime}
            onValueChange={(value) => {
              setActualCompletionDateTime(value);
              clearValidationError("actualCompletionDateTime", setValidationErrors);
            }}
          />
          {completionChecklist.isError ? (
            <p className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Close-out completion checklist template is not available.
            </p>
          ) : null}
          <div
            ref={completionChecklistRef}
            className={
              validationErrors.completionChecklist
                ? "rounded-xl border border-red-400 p-2 md:col-span-2"
                : "md:col-span-2"
            }
          >
            <SafetyChoiceTable
              options={yesNoOptions}
              rows={(completionChecklist.data?.items ?? [])
                .filter((item) =>
                  ["work_completed", "completed_as_approved", "incident_observed"].includes(
                    item.item_key,
                  ),
                )
                .map((item) => ({
                  label: item.label,
                  required: item.is_required,
                  value:
                    item.item_key === "work_completed"
                      ? workCompleted
                      : item.item_key === "completed_as_approved"
                        ? completedAsApproved
                        : incidentObserved,
                  onValueChange:
                    item.item_key === "work_completed"
                      ? (value) => {
                          setWorkCompleted(value);
                          clearValidationError("completionChecklist", setValidationErrors);
                        }
                      : item.item_key === "completed_as_approved"
                        ? (value) => {
                            setCompletedAsApproved(value);
                            clearValidationError("completionChecklist", setValidationErrors);
                            clearValidationError("deviationExplanation", setValidationErrors);
                          }
                        : (value) => {
                            setIncidentObserved(value);
                            clearValidationError("completionChecklist", setValidationErrors);
                            clearValidationError("incidentNote", setValidationErrors);
                          },
                }))}
            />
            {validationErrors.completionChecklist ? (
              <p className="mt-2 text-xs text-red-600">
                {validationErrors.completionChecklist}
              </p>
            ) : null}
          </div>
          <FormTextarea
            ref={completionSummaryRef}
            label="Completion Summary"
            required
            placeholder="Briefly describe what was completed"
            className="md:col-span-2"
            value={completionSummary}
            error={validationErrors.completionSummary}
            onChange={(event) => {
              setCompletionSummary(event.target.value);
              clearValidationError("completionSummary", setValidationErrors);
            }}
          />
          {requiresDeviationExplanation ? (
            <FormTextarea
              ref={deviationExplanationRef}
              label="Explanation for change/deviation"
              required
              placeholder="Explain the deviation from approved scope or schedule"
              className="md:col-span-2"
              value={deviationExplanation}
              error={validationErrors.deviationExplanation}
              onChange={(event) => {
                setDeviationExplanation(event.target.value);
                clearValidationError("deviationExplanation", setValidationErrors);
              }}
            />
          ) : null}
          {incidentObserved === "Yes" ? (
            <FormTextarea
              ref={incidentNoteRef}
              label="Incident/Hazard Note"
              required
              placeholder="Describe the incident, hazard, or near miss"
              value={incidentNote}
              error={validationErrors.incidentNote}
              onChange={(event) => {
                setIncidentNote(event.target.value);
                clearValidationError("incidentNote", setValidationErrors);
              }}
            />
          ) : null}
          <div className="space-y-3 md:col-span-2">
            <FileDropzone
              label="Completion Evidence"
              value={completionFiles}
              onChange={setCompletionFiles}
              accept="image/*,.pdf,.doc,.docx"
              maxFiles={10}
              hint="Upload photos, videos, or documents that support the close-out."
            />
          </div>
          {/* <FormTextarea
            label="Completion Notes"
            placeholder="Add optional completion notes"
            className="md:col-span-2"
          /> */}
        </div>
      </FormSection>

      <FormSection title="Monitoring Attestation" description="Confirm the work was monitored and remained within its approved scope.">
        {monitoringChecklist.isError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Close-out monitoring checklist template is not available.
          </p>
        ) : null}
        <div
          ref={monitoringChecklistRef}
          className={validationErrors.monitoringChecklist ? "rounded-xl border border-red-400 p-2" : ""}
        >
          <SafetyChoiceTable
            options={yesNoNaOptions}
            rows={(monitoringChecklist.data?.items ?? [])
              .filter((item) => item.input_type === "boolean" || item.input_type === "enum")
              .map((item) => ({
                label: item.label,
                required: item.is_required,
                value:
                  item.item_key === "monitored_during_execution"
                    ? monitoredDuringExecution
                    : item.item_key === "stayed_within_scope"
                      ? stayedWithinScope
                      : item.item_key === "ppe_and_controls_maintained"
                        ? ppeAndControlsMaintained
                        : unsafeConditionAddressed,
                onValueChange:
                  item.item_key === "monitored_during_execution"
                    ? (value) => {
                        setMonitoredDuringExecution(value);
                        clearValidationError("monitoringChecklist", setValidationErrors);
                      }
                    : item.item_key === "stayed_within_scope"
                      ? (value) => {
                          setStayedWithinScope(value);
                          clearValidationError("monitoringChecklist", setValidationErrors);
                        }
                      : item.item_key === "ppe_and_controls_maintained"
                        ? (value) => {
                            setPpeAndControlsMaintained(value);
                            clearValidationError("monitoringChecklist", setValidationErrors);
                          }
                        : (value) => {
                            setUnsafeConditionAddressed(value);
                            clearValidationError("monitoringChecklist", setValidationErrors);
                          },
              }))}
          />
          {validationErrors.monitoringChecklist ? (
            <p className="mt-2 text-xs text-red-600">
              {validationErrors.monitoringChecklist}
            </p>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Area / Equipment Condition" description="Confirm the work area and equipment were left in a safe condition.">
        <div className="space-y-4">
          {areaConditionChecklist.isError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Close-out area condition checklist template is not available.
            </p>
          ) : null}
          <div
            ref={areaConditionChecklistRef}
            className={validationErrors.areaConditionChecklist ? "rounded-xl border border-red-400 p-2" : ""}
          >
            <SafetyChoiceTable
              options={yesNoOptions}
              rows={(areaConditionChecklist.data?.items ?? [])
                .filter((item) => item.input_type === "boolean")
                .map((item) => ({
                  label: item.label,
                  required: item.is_required,
                  value:
                    item.item_key === "work_area_cleaned"
                      ? workAreaCleaned
                      : item.item_key === "tools_removed"
                        ? toolsRemoved
                        : item.item_key === "system_safe"
                          ? systemSafe
                          : remainingHazard,
                  onValueChange:
                    item.item_key === "work_area_cleaned"
                      ? (value) => {
                          setWorkAreaCleaned(value);
                          clearValidationError("areaConditionChecklist", setValidationErrors);
                        }
                      : item.item_key === "tools_removed"
                        ? (value) => {
                            setToolsRemoved(value);
                            clearValidationError("areaConditionChecklist", setValidationErrors);
                          }
                        : item.item_key === "system_safe"
                          ? (value) => {
                              setSystemSafe(value);
                              clearValidationError("areaConditionChecklist", setValidationErrors);
                            }
                          : (value) => {
                              setRemainingHazard(value);
                              clearValidationError("areaConditionChecklist", setValidationErrors);
                              clearValidationError("remainingHazardDetails", setValidationErrors);
                            },
                }))}
            />
            {validationErrors.areaConditionChecklist ? (
              <p className="mt-2 text-xs text-red-600">
                {validationErrors.areaConditionChecklist}
              </p>
            ) : null}
          </div>
          {remainingHazard === "Yes" ? (
            <FormTextarea
              ref={remainingHazardDetailsRef}
              label="Remaining Hazard Details"
              required
              placeholder="Describe remaining hazard"
              className="md:col-span-2"
              value={remainingHazardDetails}
              error={validationErrors.remainingHazardDetails}
              onChange={(event) => {
                setRemainingHazardDetails(event.target.value);
                clearValidationError("remainingHazardDetails", setValidationErrors);
              }}
            />
          ) : null}
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={createCloseout.isPending} loadingText="Submitting...">
          Submit Close-Out
        </Button>
      </div>
    </form>
  );
}

function mapApprovedAuthorizationOption(
  request: WorkAuthorizationRequest,
): ApprovedWorkAuthorizationOption {
  return {
    id: request.id,
    reference: request.reference,
    title: request.workInitiation.title,
    status: "approved",
    requester: request.requester.name,
    requestDate: request.requester.requestDate,
    department: request.requester.department,
    location: request.workInitiation.location,
    exactWorkArea: request.workInitiation.exactWorkArea,
    approvedStartDateTime: request.workInitiation.plannedStartDateTime,
    approvedStartDateTimeRaw: request.workInitiation.plannedStartDateTimeRaw,
    approvedEndDateTime: request.workInitiation.plannedEndDateTime,
    approvedEndDateTimeRaw: request.workInitiation.plannedEndDateTimeRaw,
    workTypes: request.workInitiation.workType,
    supervisorId: request.workInitiation.assignedSupervisorId,
    supervisor: request.workInitiation.assignedSupervisor,
    hseApprover: request.hseApproval?.approver ?? "HSE Inspector",
  };
}

function toApiDateTime(value: string) {
  return new Date(value).toISOString();
}

function yesNoNaToAnswer(value: string) {
  if (value === "Yes") return "yes";
  if (value === "No") return "no";
  return "not_applicable";
}

function getApiErrorDetail(error: unknown) {
  return (error as { response?: { data?: { detail?: unknown } } }).response?.data
    ?.detail;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = getApiErrorDetail(error);

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (
          item &&
          typeof item === "object" &&
          "msg" in item &&
          typeof item.msg === "string"
        ) {
          return item.msg;
        }
        return null;
      })
      .filter(Boolean)
      .join(" ");
  }
  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  return fallback;
}

function hasScheduleDeviation({
  selectedWorkAuthorization,
  actualStartDateTime,
  actualCompletionDateTime,
}: {
  selectedWorkAuthorization: ApprovedWorkAuthorizationOption | null;
  actualStartDateTime: string;
  actualCompletionDateTime: string;
}) {
  if (!selectedWorkAuthorization) return false;

  const actualStart = parseDateValue(actualStartDateTime);
  const actualCompletion = parseDateValue(actualCompletionDateTime);
  const approvedStart = parseDateValue(
    selectedWorkAuthorization.approvedStartDateTimeRaw ??
      selectedWorkAuthorization.approvedStartDateTime,
  );
  const approvedEnd = parseDateValue(
    selectedWorkAuthorization.approvedEndDateTimeRaw ??
      selectedWorkAuthorization.approvedEndDateTime,
  );
  const lateStartThreshold = approvedStart
    ? new Date(
        approvedStart.getTime() +
          SCHEDULE_DEVIATION_TOLERANCE_MINUTES * 60 * 1000,
      )
    : null;
  const earlyCompletionThreshold = approvedEnd
    ? new Date(
        approvedEnd.getTime() -
          SCHEDULE_DEVIATION_TOLERANCE_MINUTES * 60 * 1000,
      )
    : null;

  return Boolean(
    (actualStart && approvedStart && actualStart < approvedStart) ||
      (actualStart && lateStartThreshold && actualStart > lateStartThreshold) ||
      (actualCompletion &&
        earlyCompletionThreshold &&
        actualCompletion < earlyCompletionThreshold) ||
      (actualCompletion && approvedEnd && actualCompletion > approvedEnd),
  );
}

function parseDateValue(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildCompletionChecklistAnswers(
  items: SafetyChecklistItem[],
  values: {
    workCompleted: string;
    completedAsApproved: string;
    incidentObserved: string;
  },
): WorkCloseOutChecklistAnswerCreate[] {
  return [
    booleanAnswer(items, "work_completed", values.workCompleted),
    booleanAnswer(items, "completed_as_approved", values.completedAsApproved),
    booleanAnswer(items, "incident_observed", values.incidentObserved),
  ].filter(Boolean) as WorkCloseOutChecklistAnswerCreate[];
}

function buildMonitoringChecklistAnswers(
  items: SafetyChecklistItem[],
  values: {
    monitoredDuringExecution: string;
    stayedWithinScope: string;
    ppeAndControlsMaintained: string;
    unsafeConditionAddressed: string;
  },
): WorkCloseOutChecklistAnswerCreate[] {
  return [
    booleanAnswer(
      items,
      "monitored_during_execution",
      values.monitoredDuringExecution,
    ),
    booleanAnswer(items, "stayed_within_scope", values.stayedWithinScope),
    booleanAnswer(
      items,
      "ppe_and_controls_maintained",
      values.ppeAndControlsMaintained,
    ),
    enumAnswer(
      items,
      "unsafe_condition_addressed",
      yesNoNaToAnswer(values.unsafeConditionAddressed),
    ),
  ].filter(Boolean) as WorkCloseOutChecklistAnswerCreate[];
}

function buildAreaConditionChecklistAnswers(
  items: SafetyChecklistItem[],
  values: {
    workAreaCleaned: string;
    toolsRemoved: string;
    systemSafe: string;
    remainingHazard: string;
  },
): WorkCloseOutChecklistAnswerCreate[] {
  return [
    booleanAnswer(items, "work_area_cleaned", values.workAreaCleaned),
    booleanAnswer(items, "tools_removed", values.toolsRemoved),
    booleanAnswer(items, "system_safe", values.systemSafe),
    booleanAnswer(items, "remaining_hazard", values.remainingHazard),
  ].filter(Boolean) as WorkCloseOutChecklistAnswerCreate[];
}

function booleanAnswer(
  items: SafetyChecklistItem[],
  itemKey: string,
  value: string,
): WorkCloseOutChecklistAnswerCreate | null {
  const item = items.find((current) => current.item_key === itemKey);
  if (!item) return null;
  return {
    item_id: item.id,
    value_boolean: value === "Yes",
  };
}

function enumAnswer(
  items: SafetyChecklistItem[],
  itemKey: string,
  value: string,
): WorkCloseOutChecklistAnswerCreate | null {
  const item = items.find((current) => current.item_key === itemKey);
  if (!item) return null;
  return {
    item_id: item.id,
    selected_option: value,
  };
}

function ApprovedWorkSummary({
  workAuthorization,
}: {
  workAuthorization: ApprovedWorkAuthorizationOption | null;
}) {
  return (
    <FormSection title="Approved Work Summary" description="Approved work authorization details for this close-out.">
      {!workAuthorization ? (
        <p className="rounded-xl border border-dashed border-brand-border bg-gray-50 p-4 text-sm text-brand-text-secondary">
          Select an approved Work Authorization to load the work details.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Work Authorization Reference"
            value={workAuthorization.reference ?? ""}
            disabled
          />
          <FormInput label="Work Authorization Title" value={workAuthorization.title} disabled />
          <FormInput label="Original Requester" value={workAuthorization.requester} disabled />
          <FormInput label="Department" value={workAuthorization.department} disabled />
          <FormInput label="Work Location" value={workAuthorization.location} disabled />
          <FormTextarea label="Exact Work Area" value={workAuthorization.exactWorkArea} disabled />
          <FormInput label="Approved Start Date/Time" value={workAuthorization.approvedStartDateTime} disabled />
          <FormInput label="Approved End Date/Time" value={workAuthorization.approvedEndDateTime} disabled />
          <FormInput label="Approved Work Type" value={workAuthorization.workTypes.join(", ")} disabled />
          <FormInput label="Approved Supervisor" value={workAuthorization.supervisor} disabled />
          <FormInput label="HSE Approver" value={workAuthorization.hseApprover} disabled />
        </div>
      )}
    </FormSection>
  );
}

function validateWorkCompletionForm({
  selectedWorkAuthorization,
  actualStartDateTime,
  actualCompletionDateTime,
  workCompleted,
  completedAsApproved,
  incidentObserved,
  completionSummary,
  deviationExplanation,
  incidentNote,
  monitoredDuringExecution,
  stayedWithinScope,
  ppeAndControlsMaintained,
  unsafeConditionAddressed,
  workAreaCleaned,
  toolsRemoved,
  systemSafe,
  remainingHazard,
  remainingHazardDetails,
}: {
  selectedWorkAuthorization: ApprovedWorkAuthorizationOption | null;
  actualStartDateTime: string;
  actualCompletionDateTime: string;
  workCompleted: string;
  completedAsApproved: string;
  incidentObserved: string;
  completionSummary: string;
  deviationExplanation: string;
  incidentNote: string;
  monitoredDuringExecution: string;
  stayedWithinScope: string;
  ppeAndControlsMaintained: string;
  unsafeConditionAddressed: string;
  workAreaCleaned: string;
  toolsRemoved: string;
  systemSafe: string;
  remainingHazard: string;
  remainingHazardDetails: string;
}): ValidationErrors<WorkCompletionValidationField> {
  const errors: ValidationErrors<WorkCompletionValidationField> = {};

  if (!selectedWorkAuthorization) {
    errors.selectedWorkAuthorizationId = "Select approved work authorization.";
  }
  if (!actualStartDateTime) {
    errors.actualStartDateTime = "Select actual start date/time.";
  }
  if (!actualCompletionDateTime) {
    errors.actualCompletionDateTime = "Select actual completion date/time.";
  }

  const actualStart = new Date(actualStartDateTime);
  const actualCompletion = new Date(actualCompletionDateTime);
  const now = new Date();
  if (actualStartDateTime && Number.isNaN(actualStart.getTime())) {
    errors.actualStartDateTime = "Select a valid actual start date/time.";
  } else if (actualStartDateTime && actualStart > now) {
    errors.actualStartDateTime = "Actual start date/time cannot be in the future.";
  }
  if (actualCompletionDateTime && Number.isNaN(actualCompletion.getTime())) {
    errors.actualCompletionDateTime = "Select a valid actual completion date/time.";
  } else if (actualCompletionDateTime && actualCompletion > now) {
    errors.actualCompletionDateTime = "Actual completion date/time cannot be in the future.";
  }
  const minimumCompletionTime = new Date(
    actualStart.getTime() + MIN_SCHEDULE_DURATION_MINUTES * 60 * 1000,
  );
  if (
    actualStartDateTime &&
    actualCompletionDateTime &&
    !errors.actualStartDateTime &&
    !errors.actualCompletionDateTime &&
    actualCompletion < minimumCompletionTime
  ) {
    errors.actualCompletionDateTime = `Actual completion date/time must be at least ${MIN_SCHEDULE_DURATION_MINUTES} minutes after actual start date/time.`;
  }
  if (!workCompleted || !completedAsApproved || !incidentObserved) {
    errors.completionChecklist = "Complete the required completion checks.";
  }
  if (completionSummary.trim().length < 3) {
    errors.completionSummary = "Briefly describe what was completed.";
  }
  if (
    (completedAsApproved === "No" ||
      hasScheduleDeviation({
        selectedWorkAuthorization,
        actualStartDateTime,
        actualCompletionDateTime,
      })) &&
    deviationExplanation.trim().length < 3
  ) {
    errors.deviationExplanation =
      "Explain why work differed from the approved scope or schedule.";
  }
  if (incidentObserved === "Yes" && incidentNote.trim().length < 3) {
    errors.incidentNote = "Describe the incident, hazard, or near miss.";
  }
  if (!monitoredDuringExecution || !stayedWithinScope || !ppeAndControlsMaintained || !unsafeConditionAddressed) {
    errors.monitoringChecklist = "Complete the required monitoring checks.";
  }
  if (!workAreaCleaned || !toolsRemoved || !systemSafe || !remainingHazard) {
    errors.areaConditionChecklist = "Complete the required area/equipment condition checks.";
  }
  if (remainingHazard === "Yes" && remainingHazardDetails.trim().length < 3) {
    errors.remainingHazardDetails = "Describe remaining hazard.";
  }

  return errors;
}

function getWorkCompletionFieldRef(
  field: WorkCompletionValidationField,
  refs: {
    selectedWorkAuthorizationRef: React.RefObject<HTMLElement | null>;
    actualStartDateTimeRef: React.RefObject<HTMLElement | null>;
    actualCompletionDateTimeRef: React.RefObject<HTMLElement | null>;
    completionChecklistRef: React.RefObject<HTMLElement | null>;
    completionSummaryRef: React.RefObject<HTMLElement | null>;
    deviationExplanationRef: React.RefObject<HTMLElement | null>;
    incidentNoteRef: React.RefObject<HTMLElement | null>;
    monitoringChecklistRef: React.RefObject<HTMLElement | null>;
    areaConditionChecklistRef: React.RefObject<HTMLElement | null>;
    remainingHazardDetailsRef: React.RefObject<HTMLElement | null>;
  },
) {
  const refByField: Record<WorkCompletionValidationField, React.RefObject<HTMLElement | null>> = {
    selectedWorkAuthorizationId: refs.selectedWorkAuthorizationRef,
    actualStartDateTime: refs.actualStartDateTimeRef,
    actualCompletionDateTime: refs.actualCompletionDateTimeRef,
    completionChecklist: refs.completionChecklistRef,
    completionSummary: refs.completionSummaryRef,
    deviationExplanation: refs.deviationExplanationRef,
    incidentNote: refs.incidentNoteRef,
    monitoringChecklist: refs.monitoringChecklistRef,
    areaConditionChecklist: refs.areaConditionChecklistRef,
    remainingHazardDetails: refs.remainingHazardDetailsRef,
  };

  return refByField[field];
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm text-brand-text-secondary">{description}</p> : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
