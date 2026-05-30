"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import {
  incidentLocationOptions,
  incidentSeverityOptions,
  mockReporter,
  reportTypeOptions,
} from "@/lib/mock/incident-hazard";
import {
  createIncidentHazardReport,
  useSafetyDemoData,
} from "@/lib/safety-demo-store";
import { formatLocalDate, formatLocalDateTime } from "@/lib/safety-demo-dates";
import { useToast } from "@/hooks/useToast";
import SafetyChoiceTable from "./SafetyChoiceTable";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const yesNoOptions = toOptions(["Yes", "No"]);

export default function IncidentHazardForm() {
  const router = useRouter();
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("");
  const [location, setLocation] = useState("");
  const [observedAt, setObservedAt] = useState("");
  const [relatedAuthorization, setRelatedAuthorization] = useState("");
  const { workAuthorizations } = useSafetyDemoData();
  const reporter = {
    ...mockReporter,
    reportDate: formatLocalDate(),
  };
  const relatedAuthorizationOptions = workAuthorizations.map((request) => ({
    value: request.id,
    label: `${request.id} - ${request.workInitiation.title}`,
    description: `${request.requester.name} | ${request.requester.requestDate}`,
  }));
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [anyoneInjured, setAnyoneInjured] = useState("");
  const [propertyDamaged, setPropertyDamaged] = useState("");
  const [gasConcern, setGasConcern] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [peopleInvolved, setPeopleInvolved] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedAt = formatLocalDateTime();

    createIncidentHazardReport((id) => ({
      id,
      status: "submitted",
      reporter,
      title,
      reportType,
      location,
      dateTimeObserved: observedAt,
      relatedWorkAuthorization: relatedAuthorization,
      description,
      severityEstimate: severity as "Low" | "Medium" | "High" | "Critical",
      anyoneInjured: anyoneInjured === "Yes",
      propertyDamaged: propertyDamaged === "Yes",
      gasFireEnvironmentalConcern: gasConcern === "Yes",
      immediateActionTaken: immediateAction,
      peopleInvolved,
      additionalNotes,
      attachments: files.map((file) => ({
        name: file.name,
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : "document",
      })),
      hseReview: null,
      auditTrail: [{
        action: "Submitted",
        actor: reporter.name,
        role: "Reporter",
        dateTime: submittedAt,
        comment: "Incident/hazard report submitted for HSE review.",
      }],
    }));
    toast.success("Incident/hazard report submitted successfully.");
    window.setTimeout(() => {
      router.push("/safety/incidents");
    }, 700);
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
          <FormSelect label="Location" required searchable creatable options={toOptions(incidentLocationOptions)} placeholder="Select or add location" value={location} onValueChange={setLocation} />
          <FormDateTimeInput label="Date/Time Observed" required value={observedAt} onValueChange={setObservedAt} />
          <FormSelect label="Related Work Authorization" searchable options={relatedAuthorizationOptions} placeholder="Select related work authorization" dropdownClassName="md:min-w-[34rem]" value={relatedAuthorization} onValueChange={setRelatedAuthorization} />
        </div>
      </FormSection>

      <FormSection title="Incident / Hazard Details" description="Describe what happened, its impact, and immediate actions taken.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormTextarea label="Description" required placeholder="Describe what happened or what was observed" className="md:col-span-2" value={description} onChange={(event) => setDescription(event.target.value)} />
          <FormSelect label="Severity Estimate" required options={toOptions(incidentSeverityOptions)} placeholder="Select severity" value={severity} onValueChange={setSeverity} />
          <div className="md:col-span-2">
            <SafetyChoiceTable
              options={yesNoOptions}
              rows={[
                { label: "Was anyone injured?", required: true, value: anyoneInjured, onValueChange: setAnyoneInjured },
                { label: "Was equipment/property damaged?", required: true, value: propertyDamaged, onValueChange: setPropertyDamaged },
                { label: "Is there gas/fire/environmental concern?", required: true, value: gasConcern, onValueChange: setGasConcern },
              ]}
            />
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
        <Button type="submit">Submit Report</Button>
      </div>
    </form>
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
