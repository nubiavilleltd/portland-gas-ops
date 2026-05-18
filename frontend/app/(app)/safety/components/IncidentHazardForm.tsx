"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormFileUpload from "@/components/forms/FormFileUpload";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import {
  incidentLocationOptions,
  incidentPriorityOptions,
  mockReporter,
  relatedWorkAuthorizationOptions,
  reportTypeOptions,
} from "@/lib/mock/incident-hazard";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const yesNoOptions = toOptions(["Yes", "No"]);

export default function IncidentHazardForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [submittedReference, setSubmittedReference] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedReference("IH-2026-0001");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      {submittedReference ? (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Incident/hazard report submitted.</p>
            <p className="mt-1">Mock reference generated: {submittedReference}</p>
          </div>
        </div>
      ) : null}

      <FormSection title="Reporter Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Reporter Name" value={mockReporter.name} disabled />
          <FormInput label="Department" value={mockReporter.department} disabled />
          <FormInput label="Job Title / Role" value={mockReporter.role} disabled />
          <FormDatePicker label="Report Date" value={mockReporter.reportDate} disabled />
        </div>
      </FormSection>

      <FormSection title="Report Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect label="Report Type" required searchable creatable options={toOptions(reportTypeOptions)} placeholder="Select or add report type" />
          <FormSelect label="Location" required searchable creatable options={toOptions(incidentLocationOptions)} placeholder="Select or add location" />
          <FormDateTimeInput label="Date/Time Observed" required />
          <FormSelect label="Related Work Authorization" searchable options={toOptions(relatedWorkAuthorizationOptions)} placeholder="Select related work authorization" />
          <FormSelect label="Priority/Urgency" required options={toOptions(incidentPriorityOptions)} placeholder="Select priority" />
        </div>
      </FormSection>

      <FormSection title="Incident / Hazard Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormTextarea label="Description" required placeholder="Describe what happened or what was observed" className="md:col-span-2" />
          <FormSelect label="Severity Estimate" required options={toOptions(incidentPriorityOptions)} placeholder="Select severity" />
          <FormSelect label="Was anyone injured?" required options={yesNoOptions} placeholder="Select answer" />
          <FormSelect label="Was equipment/property damaged?" required options={yesNoOptions} placeholder="Select answer" />
          <FormSelect label="Is there gas/fire/environmental concern?" required options={yesNoOptions} placeholder="Select answer" />
          <FormTextarea label="Immediate Action Taken" required placeholder="Describe immediate action taken" className="md:col-span-2" />
          <FormTextarea label="People Involved / Witnesses" placeholder="Optional" />
          <FormTextarea label="Additional Notes" placeholder="Optional" />
        </div>
      </FormSection>

      <FormSection title="Evidence / Attachments">
        <div className="space-y-3">
          <FormFileUpload
            label="Photos / Videos / Documents"
            accept="image/*,video/*,.pdf,.doc,.docx"
            multiple
            hint="Local selection only. No upload is performed."
            onChange={(event) => setFiles(Array.from(event.currentTarget.files ?? []))}
          />
          <SelectedFiles files={files} />
          <FormTextarea label="Evidence Notes" placeholder="Optional notes about attachments" />
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit">Submit Report</Button>
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
      <h2 className="mb-5 text-base font-semibold text-brand-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function SelectedFiles({ files }: { files: File[] }) {
  if (files.length === 0) {
    return <p className="text-xs text-brand-text-secondary">No files selected.</p>;
  }

  return (
    <div className="rounded-xl border border-brand-border bg-gray-50 p-3">
      <p className="text-xs font-medium text-brand-text-secondary">Selected files:</p>
      <ul className="mt-2 space-y-1">
        {files.map((file) => (
          <li key={`${file.name}-${file.size}`} className="text-sm text-brand-text-primary">
            {file.name}{" "}
            <span className="text-xs text-brand-text-secondary">
              ({formatFileSize(file.size)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
