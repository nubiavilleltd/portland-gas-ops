"use client";

import { useState } from "react";
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
} from "@/lib/mock/incident-hazard";
import { getSafetyCurrentUser } from "@/lib/safety-demo-identity";
import { useSafetyDemoData } from "@/lib/safety-demo-store";
import { formatLocalDate } from "@/lib/safety-demo-dates";
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
import SafetyProcessFormSkeleton from "./SafetyProcessFormSkeleton";
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

export default function IncidentHazardForm() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [observedAt, setObservedAt] = useState("");
  const [relatedAuthorization, setRelatedAuthorization] = useState("");
  const { workAuthorizations } = useSafetyDemoData();
  const reporter = {
    ...getSafetyCurrentUser(),
    reportDate: formatLocalDate(),
  };
  const impactChecklist = useActiveSafetyChecklist(
    "incident_report",
    "risk_assessment",
  );
  const relatedAuthorizationOptions = workAuthorizations.map((request) => ({
    value: request.id,
    label: `${request.id} - ${request.workInitiation.title}`,
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const validationMessage = validateIncidentReportForm({
      title,
      reportType,
      locations,
      observedAt,
      description,
      immediateAction,
    });
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const impactChecklistValues = {
      anyoneInjured,
      propertyDamaged,
      gasConcern,
    };

    if (
      impactChecklist.data &&
      hasMissingRequiredChecklistAnswer(impactChecklist.data, impactChecklistValues)
    ) {
      toast.error("Complete the required incident impact checks.");
      return;
    }

    const location = locations.join(", ");
    const payload: IncidentReportCreate = {
      title,
      report_type: toIncidentReportType(reportType),
      location,
      exact_location: null,
      observed_at: observedAt,
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
      const savedReport = await incidentReportsApi.create(payload);
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

  if (impactChecklist.isLoading) {
    return <SafetyProcessFormSkeleton sections={4} />;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
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
          <FormInput label="Report Title" required placeholder="Enter a short report title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <FormSelect label="Report Type" required searchable creatable options={toOptions(reportTypeOptions)} placeholder="Select or add report type" value={reportType} onValueChange={setReportType} />
          <FormMultiSelect label="Location" required searchable creatable options={toOptions(incidentLocationOptions)} placeholder="Select or add location" value={locations} onValueChange={setLocations} />
          <FormDateTimeInput label="Date/Time Observed" required value={observedAt} onValueChange={setObservedAt} />
          <FormSelect label="Related Work Authorization" searchable options={relatedAuthorizationOptions} placeholder="Select related work authorization" dropdownClassName="md:min-w-[34rem]" value={relatedAuthorization} onValueChange={setRelatedAuthorization} />
        </div>
      </FormSection>

      <FormSection title="Incident / Hazard Details" description="Describe what happened, its impact, and immediate actions taken.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormTextarea label="Description" required placeholder="Describe what happened or what was observed" className="md:col-span-2" value={description} onChange={(event) => setDescription(event.target.value)} />
          {/* <FormSelect label="Severity Estimate" required options={toOptions(incidentSeverityOptions)} placeholder="Select severity" value={severity} onValueChange={setSeverity} /> */}
          <div className="md:col-span-2">
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
                        ? setAnyoneInjured
                        : item.item_key === "property_damaged"
                          ? setPropertyDamaged
                          : setGasConcern,
                  }))}
              />
            ) : null}
          </div>
          <FormTextarea label="Immediate Action Taken" required placeholder="Describe immediate action taken" className="md:col-span-2" value={immediateAction} onChange={(event) => setImmediateAction(event.target.value)} />
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
            hint="Local selection only. No upload is performed."
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
}) {
  if (title.trim().length < 3) return "Enter a report title with at least 3 characters.";
  if (!reportType) return "Select a report type.";
  if (locations.length === 0) return "Select at least one location.";
  if (!observedAt) return "Select the date and time observed.";
  if (description.trim().length < 5) return "Enter a description with at least 5 characters.";
  if (!immediateAction.trim()) return "Describe the immediate action taken.";
  return "";
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
