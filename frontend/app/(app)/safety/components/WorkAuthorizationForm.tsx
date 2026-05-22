"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormToggleGroup from "@/components/forms/FormToggleGroup";
import type { SelectOption } from "@/components/forms/SelectInput";
import { useToast } from "@/hooks/useToast";
import { assignedWorkInitiationOptions } from "@/lib/mock/work-initiation";

const requester = {
  name: "Daniel Okoro",
  department: "Engineering",
  role: "CNG Conversion Technician",
  requestDate: "2026-05-18",
};

const optionFromStrings = (items: string[]): SelectOption[] =>
  items.map((item) => ({ value: item, label: item }));

const yesNoOptions = optionFromStrings(["Yes", "No"]);

const workInitiationOptions = assignedWorkInitiationOptions.map((item) => ({
  value: item.id,
  label: `${item.id} - ${item.title}`,
}));

export default function WorkAuthorizationForm() {
  const router = useRouter();
  const toast = useToast();
  const [selectedWorkInitiationId, setSelectedWorkInitiationId] = useState("");
  const [safetyFiles, setSafetyFiles] = useState<File[]>([]);
  const selectedWorkInitiation = assignedWorkInitiationOptions.find(
    (item) => item.id === selectedWorkInitiationId,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.success("Work authorization request submitted successfully.");
    window.setTimeout(() => {
      router.push("/safety/work-authorization");
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      <FormSection title="Requester Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={requester.name} disabled />
          <FormInput label="Department" value={requester.department} disabled />
          <FormInput label="Job Title / Role" value={requester.role} disabled />
          <FormDatePicker label="Request Date" value={requester.requestDate} disabled />
        </div>
      </FormSection>

      <FormSection title="Work Initiation Lookup">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="Work Initiation Reference"
            required
            searchable
            options={workInitiationOptions}
            placeholder="Select assigned work initiation"
            value={selectedWorkInitiationId}
            onValueChange={setSelectedWorkInitiationId}
          />
        </div>
      </FormSection>

      <AssignedWorkSummary workInitiation={selectedWorkInitiation} />

      <FormSection title="Safety / Risk Indicators">
        <div className="grid gap-4 md:grid-cols-2">
          <FormToggleGroup label="Is gas/CNG/LNG involved?" required options={yesNoOptions} />
          <FormToggleGroup label="Is a pressurized system involved?" required options={yesNoOptions} />
          <FormToggleGroup label="Will the work involve heat, sparks, welding, cutting, or grinding?" required options={yesNoOptions} />
          <FormToggleGroup label="Is electrical isolation required?" required options={yesNoOptions} />
          <FormToggleGroup label="Is lifting/heavy equipment involved?" required options={yesNoOptions} />
          <FormToggleGroup label="Are all required PPE available?" required options={yesNoOptions} />
          <FormTextarea
            label="Additional Safety Note"
            placeholder="Add any extra safety concern"
          />
        </div>
      </FormSection>

      <FormSection title="Attachments / Safety Evidence">
        <div className="space-y-3">
          <FileDropzone
            label="Safety-related Images/Documents"
            value={safetyFiles}
            onChange={setSafetyFiles}
            accept="image/*,.pdf,.doc,.docx"
            maxFiles={10}
            hint="Area images, safety checklists, hazard photos, PDFs, and documents are accepted."
          />
          <FormTextarea
            label="Attachment Notes"
            placeholder="Add notes about the selected files"
          />
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit">Submit Request</Button>
      </div>
    </form>
  );
}

function AssignedWorkSummary({
  workInitiation,
}: {
  workInitiation: (typeof assignedWorkInitiationOptions)[number] | undefined;
}) {
  return (
    <FormSection title="Assigned Work Summary">
      {!workInitiation ? (
        <p className="text-sm text-brand-text-secondary">
          Select an assigned Work Initiation to load approved work details.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Work Title" value={workInitiation.title} disabled />
          <FormInput label="Work Type" value={workInitiation.workType} disabled />
          <FormInput label="Priority" value={workInitiation.priority} disabled />
          <FormInput label="Location" value={workInitiation.location} disabled />
          <FormInput label="Exact Work Area" value={workInitiation.exactWorkArea} disabled />
          <FormInput label="Assigned Supervisor" value={workInitiation.assignedSupervisor} disabled />
          <FormInput label="Assigned Workers" value={workInitiation.assignedWorkers.join(", ")} disabled />
          <FormInput label="Contractors Needed" value={workInitiation.contractorsNeeded ? "Yes" : "No"} disabled />
          {workInitiation.contractorsNeeded ? (
            <FormInput label="Selected Contractors" value={workInitiation.selectedContractors.join(", ")} disabled />
          ) : null}
          <FormInput label="Planned Start Date/Time" value={workInitiation.plannedStartDateTime} disabled />
          <FormInput label="Planned End Date/Time" value={workInitiation.plannedEndDateTime} disabled />
          <FormTextarea label="Work Description" value={workInitiation.workDescription} disabled className="md:col-span-2" />
        </div>
      )}
    </FormSection>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
