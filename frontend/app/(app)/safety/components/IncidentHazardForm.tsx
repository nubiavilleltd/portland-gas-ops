"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import {
  incidentLocationOptions,
  reportTypeOptions,
} from "@/lib/modules/safety/incidentReport/constants";
import { formatLocalDate, toApiDateTime } from "@/lib/safety-demo-dates";
import { useToast } from "@/hooks/useToast";
import {
  safetyChecklistsApi,
  useActiveSafetyChecklist,
  type SafetyChecklistAnswerCreate,
  type SafetyChecklistTemplate,
} from "@/lib/modules/safety/checklists";
import {
  incidentReportsApi,
  type IncidentReportCreate,
  type IncidentReportType,
} from "@/lib/modules/safety/incidentReport";
import { getLatestIncidentObservedDateTime } from "@/lib/modules/safety/date-rules";
import {
  getSafetyEmployeeRequester,
  useSafetyCurrentEmployee,
} from "@/lib/modules/safety/people";
import { useWorkAuthorizations } from "@/lib/modules/safety/workAuthorization";
import { getValidationScrollTarget } from "@/lib/modules/safety/form-validation";
import SafetyProcessFormSkeleton from "./SafetyProcessFormSkeleton";
import SafetyValidationSummary from "./SafetyValidationSummary";
import SafetyChoiceTable from "./SafetyChoiceTable";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const yesNoOptions = toOptions(["Yes", "No"]);
const reportTypeByLabel: Record<string, IncidentReportType> = {
  Incident: "incident",
  Hazard: "hazard",
  "Near Miss": "near_miss",
  "Unsafe Act": "unsafe_act",
  "Unsafe Condition": "unsafe_condition",
  "Environmental Concern": "environmental_concern",
};

type IncidentValidationField =
  | "title"
  | "reportType"
  | "locations"
  | "observedAt"
  | "description"
  | "impactChecklist"
  | "immediateAction";

type IncidentValidationErrors = Partial<Record<IncidentValidationField, string>>;

const incidentFieldOrder: IncidentValidationField[] = [
  "title",
  "reportType",
  "locations",
  "observedAt",
  "description",
  "impactChecklist",
  "immediateAction",
];

export default function IncidentHazardForm() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<IncidentValidationErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [observedAt, setObservedAt] = useState("");
  const [relatedAuthorization, setRelatedAuthorization] = useState("");
  const workAuthorizationsQuery = useWorkAuthorizations({ limit: 100 });
  const currentEmployee = useSafetyCurrentEmployee();
  const reporter = getSafetyEmployeeRequester(
    currentEmployee.data,
    formatLocalDate(),
  );
  const impactChecklist = useActiveSafetyChecklist(
    "incident_report",
    "risk_assessment",
  );
  const relatedAuthorizationOptions = (workAuthorizationsQuery.data ?? []).map((request) => ({
    value: request.id,
    label: request.reference
      ? `${request.reference} - ${request.workInitiation.title}`
      : request.workInitiation.title,
    description: `${request.requester.name} | ${request.requester.requestDate}`,
  }));
  const [description, setDescription] = useState("");
  // const [severity, setSeverity] = useState("");
  const [anyoneInjured, setAnyoneInjured] = useState("");
  const [propertyDamaged, setPropertyDamaged] = useState("");
  const [gasConcern, setGasConcern] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [peopleInvolved, setPeopleInvolved] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const titleRef = useRef<HTMLInputElement | null>(null);
  const reportTypeRef = useRef<HTMLInputElement | null>(null);
  const locationsRef = useRef<HTMLInputElement | null>(null);
  const observedAtRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const impactChecklistRef = useRef<HTMLDivElement | null>(null);
  const immediateActionRef = useRef<HTMLTextAreaElement | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextValidationErrors = validateIncidentReportForm({
      title,
      reportType,
      locations,
      observedAt,
      description,
      immediateAction,
    });
    const impactChecklistValues = {
      anyoneInjured,
      propertyDamaged,
      gasConcern,
    };

    if (
      impactChecklist.data &&
      hasMissingRequiredChecklistAnswer(impactChecklist.data, impactChecklistValues)
    ) {
      nextValidationErrors.impactChecklist = "Complete the required incident impact checks.";
    }

    setValidationErrors(nextValidationErrors);
    const firstInvalidField = getFirstInvalidIncidentField(nextValidationErrors);
    if (firstInvalidField) {
      scrollToIncidentField(
        getIncidentFieldRef(firstInvalidField, {
          titleRef,
          reportTypeRef,
          locationsRef,
          observedAtRef,
          descriptionRef,
          impactChecklistRef,
          immediateActionRef,
        }),
      );
      return;
    }

    const location = locations.join(", ");
    const payload: IncidentReportCreate = {
      title,
      report_type: toIncidentReportType(reportType),
      location,
      exact_location: null,
      observed_at: toApiDateTime(observedAt),
      related_work_authorization_id: emptyToNull(relatedAuthorization),
      description,
      severity_estimate: null,
      anyone_injured: anyoneInjured === "Yes",
      property_damaged: propertyDamaged === "Yes",
      gas_fire_environmental_concern: gasConcern === "Yes",
      immediate_action_taken: emptyToNull(immediateAction),
      people_involved: emptyToNull(peopleInvolved),
      additional_notes: emptyToNull(additionalNotes),
    };

    let reportWasSaved = false;
    try {
      setIsSubmitting(true);
      let savedReport;
      try {
        savedReport = await incidentReportsApi.create(payload, files);
      } catch (error) {
        if (files.length === 0 || !isStorageNotConfiguredError(error)) {
          throw error;
        }

        savedReport = await incidentReportsApi.create(payload);
        toast.info(
          "Incident report was saved without attachments because file storage is not configured.",
        );
      }
      reportWasSaved = true;
      const checklistAnswers = impactChecklist.data
        ? buildImpactChecklistAnswers(impactChecklist.data, impactChecklistValues)
        : [];

      if (checklistAnswers.length > 0) {
        await safetyChecklistsApi.createResponses({
          parent_type: "incident_report",
          parent_id: savedReport.id,
          answers: checklistAnswers,
        });
      }

      toast.success("Incident/hazard report submitted successfully.");
      window.setTimeout(() => {
        router.push("/safety/incidents");
      }, 700);
    } catch (error) {
      console.error("Failed to submit incident/hazard report", error);
      console.error("Incident/hazard report error detail", getApiErrorDetail(error));
      toast.error(
        reportWasSaved
          ? "Incident report was saved, but checklist answers could not be saved."
          : getApiErrorMessage(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (
    impactChecklist.isLoading ||
    currentEmployee.isLoading ||
    workAuthorizationsQuery.isLoading
  ) {
    return <SafetyProcessFormSkeleton sections={4} />;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      <SafetyValidationSummary
        errors={validationErrors}
        fieldOrder={incidentFieldOrder}
      />

      <FormSection title="Reporter Details" description="Your employee information for this incident or hazard report.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Reporter Name" value={reporter.name} disabled />
          <FormInput label="Department" value={reporter.department} disabled />
          <FormInput label="Job Title / Role" value={reporter.role} disabled />
          <FormDatePicker label="Report Date" value={reporter.reportDate} disabled />
        </div>
      </FormSection>

      <FormSection title="Report Details" description="Basic information about the incident or hazard being reported.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            ref={titleRef}
            label="Report Title"
            required
            placeholder="Enter a short report title"
            value={title}
            error={validationErrors.title}
            onChange={(event) => {
              setTitle(event.target.value);
              clearIncidentValidationError("title", setValidationErrors);
            }}
          />
          <FormSelect
            ref={reportTypeRef}
            label="Report Type"
            required
            searchable
            options={toOptions(reportTypeOptions)}
            placeholder="Select or add report type"
            value={reportType}
            error={validationErrors.reportType}
            onValueChange={(value) => {
              setReportType(value);
              clearIncidentValidationError("reportType", setValidationErrors);
            }}
          />
          <FormMultiSelect
            ref={locationsRef}
            label="Location"
            required
            searchable
            creatable
            options={toOptions(incidentLocationOptions)}
            placeholder="Select or add location"
            value={locations}
            error={validationErrors.locations}
            onValueChange={(value) => {
              setLocations(value);
              clearIncidentValidationError("locations", setValidationErrors);
            }}
          />
          <FormDateTimeInput
            ref={observedAtRef}
            label="Date/Time Observed"
            required
            max={getLatestIncidentObservedDateTime()}
            value={observedAt}
            error={validationErrors.observedAt}
            onValueChange={(value) => {
              setObservedAt(value);
              clearIncidentValidationError("observedAt", setValidationErrors);
            }}
          />
          <FormSelect label="Related Work Authorization" searchable options={relatedAuthorizationOptions} placeholder="Select related work authorization" dropdownClassName="md:min-w-[34rem]" value={relatedAuthorization} onValueChange={setRelatedAuthorization} />
        </div>
      </FormSection>

      <FormSection title="Incident / Hazard Details" description="Describe what happened, its impact, and immediate actions taken.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormTextarea
            ref={descriptionRef}
            label="Description"
            required
            placeholder="Describe what happened or what was observed"
            className="md:col-span-2"
            value={description}
            error={validationErrors.description}
            onChange={(event) => {
              setDescription(event.target.value);
              clearIncidentValidationError("description", setValidationErrors);
            }}
          />
          {/* <FormSelect label="Severity Estimate" required options={toOptions(incidentSeverityOptions)} placeholder="Select severity" value={severity} onValueChange={setSeverity} /> */}
          <div
            ref={impactChecklistRef}
            className={
              validationErrors.impactChecklist
                ? "rounded-xl border border-red-400 p-2 md:col-span-2"
                : "md:col-span-2"
            }
          >
            {impactChecklist.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Incident report impact checklist template is not available.
              </p>
            ) : null}
            {impactChecklist.data ? (
              <SafetyChoiceTable
                options={yesNoOptions}
                rows={impactChecklist.data.items
                  .filter((item) => item.input_type === "boolean")
                  .map((item) => ({
                    label: item.label,
                    required: item.is_required,
                    value:
                      item.item_key === "anyone_injured"
                        ? anyoneInjured
                        : item.item_key === "property_damaged"
                          ? propertyDamaged
                          : gasConcern,
                    onValueChange:
                      item.item_key === "anyone_injured"
                        ? (value) => {
                            setAnyoneInjured(value);
                            clearIncidentValidationError("impactChecklist", setValidationErrors);
                          }
                        : item.item_key === "property_damaged"
                          ? (value) => {
                              setPropertyDamaged(value);
                              clearIncidentValidationError("impactChecklist", setValidationErrors);
                            }
                          : (value) => {
                              setGasConcern(value);
                              clearIncidentValidationError("impactChecklist", setValidationErrors);
                            },
                  }))}
              />
            ) : null}
            {validationErrors.impactChecklist ? (
              <p className="mt-2 text-xs text-red-600">
                {validationErrors.impactChecklist}
              </p>
            ) : null}
          </div>
          <FormTextarea
            ref={immediateActionRef}
            label="Immediate Action Taken"
            required
            placeholder="Describe immediate action taken"
            className="md:col-span-2"
            value={immediateAction}
            error={validationErrors.immediateAction}
            onChange={(event) => {
              setImmediateAction(event.target.value);
              clearIncidentValidationError("immediateAction", setValidationErrors);
            }}
          />
          <FormTextarea label="People Involved / Witnesses" placeholder="Optional" value={peopleInvolved} onChange={(event) => setPeopleInvolved(event.target.value)} />
          <FormTextarea label="Additional Notes" placeholder="Optional" value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} />
        </div>
      </FormSection>

      <FormSection title="Evidence / Attachments" description="Add supporting photos, videos, or documents for HSE review.">
        <div className="space-y-3">
          <FileDropzone
            label="Photos / Videos / Documents"
            value={files}
            onChange={setFiles}
            accept="image/*,video/*,.pdf,.doc,.docx"
            maxFiles={10}
            maxSizeMB={10}
            hint="Uploaded securely with the incident report. Up to 10 files, max 10 MB each."
          />
          <FormTextarea label="Evidence Notes" placeholder="Optional notes about attachments" />
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
          Submit Report
        </Button>
      </div>
    </form>
  );
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function validateIncidentReportForm({
  title,
  reportType,
  locations,
  observedAt,
  description,
  immediateAction,
}: {
  title: string;
  reportType: string;
  locations: string[];
  observedAt: string;
  description: string;
  immediateAction: string;
}): IncidentValidationErrors {
  const errors: IncidentValidationErrors = {};

  if (title.trim().length < 3) {
    errors.title = "Enter a report title with at least 3 characters.";
  }
  if (!reportType) {
    errors.reportType = "Select a report type.";
  }
  if (locations.length === 0) {
    errors.locations = "Select at least one location.";
  }
  if (!observedAt) {
    errors.observedAt = "Select the date and time observed.";
  } else {
    const observedDate = new Date(observedAt);
    const latestAllowedObservedAt = new Date(Date.now() - 5 * 60 * 1000);
    if (observedDate > latestAllowedObservedAt) {
      errors.observedAt = "Observed date/time must be at least 5 minutes in the past.";
    }
  }
  if (description.trim().length < 5) {
    errors.description = "Enter a description with at least 5 characters.";
  }
  if (!immediateAction.trim()) {
    errors.immediateAction = "Describe the immediate action taken.";
  }

  return errors;
}

function getFirstInvalidIncidentField(errors: IncidentValidationErrors) {
  return incidentFieldOrder.find((field) => Boolean(errors[field]));
}

function clearIncidentValidationError(
  field: IncidentValidationField,
  setValidationErrors: React.Dispatch<React.SetStateAction<IncidentValidationErrors>>,
) {
  setValidationErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current };
    delete next[field];
    return next;
  });
}

function getIncidentFieldRef(
  field: IncidentValidationField,
  refs: {
    titleRef: React.RefObject<HTMLInputElement | null>;
    reportTypeRef: React.RefObject<HTMLInputElement | null>;
    locationsRef: React.RefObject<HTMLInputElement | null>;
    observedAtRef: React.RefObject<HTMLInputElement | null>;
    descriptionRef: React.RefObject<HTMLTextAreaElement | null>;
    impactChecklistRef: React.RefObject<HTMLDivElement | null>;
    immediateActionRef: React.RefObject<HTMLTextAreaElement | null>;
  },
): React.RefObject<HTMLElement | null> {
  const refByField: Record<IncidentValidationField, React.RefObject<HTMLElement | null>> = {
    title: refs.titleRef,
    reportType: refs.reportTypeRef,
    locations: refs.locationsRef,
    observedAt: refs.observedAtRef,
    description: refs.descriptionRef,
    impactChecklist: refs.impactChecklistRef,
    immediateAction: refs.immediateActionRef,
  };

  return refByField[field];
}

function scrollToIncidentField(
  ref: React.RefObject<HTMLElement | null>,
) {
  window.requestAnimationFrame(() => {
    const target = getValidationScrollTarget(ref.current);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    target.focus?.({ preventScroll: true });
  });
}

function toIncidentReportType(value: string): IncidentReportType {
  return reportTypeByLabel[value] ?? "other";
}

function getImpactChecklistValue(itemKey: string, values: {
  anyoneInjured: string;
  propertyDamaged: string;
  gasConcern: string;
}) {
  if (itemKey === "anyone_injured") return values.anyoneInjured;
  if (itemKey === "property_damaged") return values.propertyDamaged;
  if (itemKey === "gas_fire_environmental_concern") return values.gasConcern;
  return "";
}

function hasMissingRequiredChecklistAnswer(
  template: SafetyChecklistTemplate,
  values: {
    anyoneInjured: string;
    propertyDamaged: string;
    gasConcern: string;
  },
) {
  return template.items.some((item) => (
    item.is_required &&
    item.input_type === "boolean" &&
    !getImpactChecklistValue(item.item_key, values)
  ));
}

function buildImpactChecklistAnswers(
  template: SafetyChecklistTemplate,
  values: {
    anyoneInjured: string;
    propertyDamaged: string;
    gasConcern: string;
  },
): SafetyChecklistAnswerCreate[] {
  return template.items
    .filter((item) => item.input_type === "boolean")
    .reduce<SafetyChecklistAnswerCreate[]>((answers, item) => {
      const value = getImpactChecklistValue(item.item_key, values);
      if (value) {
        answers.push({
          item_id: item.id,
          value_boolean: value === "Yes",
        });
      }
      return answers;
    }, []);
}

function getApiErrorDetail(error: unknown) {
  return (error as { response?: { data?: unknown } }).response?.data;
}

function getApiErrorMessage(error: unknown) {
  const data = getApiErrorDetail(error);
  const detail = (data as { detail?: unknown } | undefined)?.detail;

  if (typeof detail === "string") return detail;
  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  return "Incident/hazard report could not be submitted.";
}

function isStorageNotConfiguredError(error: unknown) {
  const data = getApiErrorDetail(error);
  const detail = (data as { detail?: unknown } | undefined)?.detail;

  return Boolean(
    detail &&
      typeof detail === "object" &&
      "error_code" in detail &&
      detail.error_code === "STORAGE_NOT_CONFIGURED",
  );
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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
