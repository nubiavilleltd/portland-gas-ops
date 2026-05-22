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
import FormToggleGroup from "@/components/forms/FormToggleGroup";
import {
  incidentLocationOptions,
  incidentPriorityOptions,
  mockReporter,
  relatedWorkAuthorizationOptions,
  reportTypeOptions,
} from "@/lib/mock/incident-hazard";
import { useToast } from "@/hooks/useToast";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const yesNoOptions = toOptions(["Yes", "No"]);

export default function IncidentHazardForm() {
  const router = useRouter();
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.success("Incident/hazard report submitted successfully.");
    window.setTimeout(() => {
      router.push("/safety/incidents");
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
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
          <FormToggleGroup label="Was anyone injured?" required options={yesNoOptions} />
          <FormToggleGroup label="Was equipment/property damaged?" required options={yesNoOptions} />
          <FormToggleGroup label="Is there gas/fire/environmental concern?" required options={yesNoOptions} />
          <FormTextarea label="Immediate Action Taken" required placeholder="Describe immediate action taken" className="md:col-span-2" />
          <FormTextarea label="People Involved / Witnesses" placeholder="Optional" />
          <FormTextarea label="Additional Notes" placeholder="Optional" />
        </div>
      </FormSection>

      <FormSection title="Evidence / Attachments">
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

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-brand-border bg-white">
      <div className="border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
