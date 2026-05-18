"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormFileUpload from "@/components/forms/FormFileUpload";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import {
  approvedWorkAuthorizationOptions,
  closeOutRequester,
} from "@/lib/mock/work-close-out";
import type { ApprovedWorkAuthorizationOption } from "@/types/safety";

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const yesNoNaOptions = [...yesNoOptions, { value: "N/A", label: "N/A" }];

const workAuthorizationOptions = approvedWorkAuthorizationOptions.map((item) => ({
  value: item.id,
  label: `${item.id} - ${item.title}`,
}));

export default function WorkCompletionForm() {
  const [selectedWorkAuthorizationId, setSelectedWorkAuthorizationId] = useState("");
  const [completedAsApproved, setCompletedAsApproved] = useState("");
  const [incidentObserved, setIncidentObserved] = useState("");
  const [remainingHazard, setRemainingHazard] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [submittedReference, setSubmittedReference] = useState("");

  const selectedWorkAuthorization = useMemo(
    () =>
      approvedWorkAuthorizationOptions.find(
        (item) => item.id === selectedWorkAuthorizationId
      ) ?? null,
    [selectedWorkAuthorizationId]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedReference("WC-2026-0001");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      {submittedReference ? (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Close-out submitted successfully.</p>
            <p className="mt-1">Mock reference generated: {submittedReference}</p>
          </div>
        </div>
      ) : null}

      <FormSection title="Requester Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={closeOutRequester.name} disabled />
          <FormInput label="Department" value={closeOutRequester.department} disabled />
          <FormInput label="Job Title / Role" value={closeOutRequester.role} disabled />
          <FormDatePicker label="Request Date" value={closeOutRequester.requestDate} disabled />
        </div>
      </FormSection>

      <FormSection title="Work Authorization Lookup">
        <FormSelect
          label="Work Authorization Reference"
          required
          searchable
          options={workAuthorizationOptions}
          value={selectedWorkAuthorizationId}
          placeholder="Select approved work authorization"
          onValueChange={setSelectedWorkAuthorizationId}
        />
      </FormSection>

      <ApprovedWorkSummary workAuthorization={selectedWorkAuthorization} />

      <FormSection title="Completion Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormDateTimeInput label="Actual Start Date/Time" required />
          <FormDateTimeInput label="Actual Completion Date/Time" required />
          <FormSelect label="Was work completed?" required options={yesNoOptions} placeholder="Select answer" />
          <FormSelect
            label="Was work completed as approved?"
            required
            options={yesNoOptions}
            value={completedAsApproved}
            placeholder="Select answer"
            onValueChange={setCompletedAsApproved}
          />
          {completedAsApproved === "No" ? (
            <FormTextarea
              label="Explanation for change/deviation"
              required
              placeholder="Explain the deviation from approved scope"
              className="md:col-span-2"
            />
          ) : null}
          <FormTextarea
            label="Completion Summary"
            required
            placeholder="Briefly describe what was completed"
            className="md:col-span-2"
          />
          <FormSelect
            label="Any incident, hazard, or near miss observed?"
            required
            options={yesNoOptions}
            value={incidentObserved}
            placeholder="Select answer"
            onValueChange={setIncidentObserved}
          />
          {incidentObserved === "Yes" ? (
            <FormTextarea
              label="Incident/Hazard Note"
              required
              placeholder="Describe the incident, hazard, or near miss"
            />
          ) : null}
          <div className="space-y-3 md:col-span-2">
            <FormFileUpload
              label="Completion Evidence"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              hint="Local selection only. No upload is performed."
              onChange={(event) =>
                setCompletionFiles(Array.from(event.currentTarget.files ?? []))
              }
            />
            <SelectedFiles files={completionFiles} />
          </div>
          <FormTextarea
            label="Completion Notes"
            placeholder="Add optional completion notes"
            className="md:col-span-2"
          />
        </div>
      </FormSection>

      <FormSection title="Monitoring Attestation">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect label="Work was monitored during execution" required options={yesNoOptions} placeholder="Select answer" />
          <FormSelect label="Work stayed within approved scope" required options={yesNoOptions} placeholder="Select answer" />
          <FormSelect label="Required PPE and safety controls were maintained" required options={yesNoOptions} placeholder="Select answer" />
          <FormSelect label="Unsafe condition was reported/addressed if noticed" required options={yesNoNaOptions} placeholder="Select answer" />
          <FormTextarea label="Monitoring Comment" placeholder="Add optional monitoring comment" className="md:col-span-2" />
        </div>
      </FormSection>

      <FormSection title="Area / Equipment Condition">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect label="Work area cleaned after completion" required options={yesNoOptions} placeholder="Select answer" />
          <FormSelect label="Tools/equipment removed from work area" required options={yesNoOptions} placeholder="Select answer" />
          <FormSelect label="Vehicle/equipment/system left in safe condition" required options={yesNoOptions} placeholder="Select answer" />
          <FormSelect
            label="Any remaining hazard?"
            required
            options={yesNoOptions}
            value={remainingHazard}
            placeholder="Select answer"
            onValueChange={setRemainingHazard}
          />
          {remainingHazard === "Yes" ? (
            <FormTextarea
              label="Remaining Hazard Details"
              required
              placeholder="Describe remaining hazard"
              className="md:col-span-2"
            />
          ) : null}
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit">Submit Close-Out</Button>
      </div>
    </form>
  );
}

function ApprovedWorkSummary({
  workAuthorization,
}: {
  workAuthorization: ApprovedWorkAuthorizationOption | null;
}) {
  return (
    <FormSection title="Approved Work Summary">
      {!workAuthorization ? (
        <p className="rounded-xl border border-dashed border-brand-border bg-gray-50 p-4 text-sm text-brand-text-secondary">
          Select an approved Work Authorization to load the work details.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Work Authorization Title" value={workAuthorization.title} disabled />
          <FormInput label="Original Requester" value={workAuthorization.requester} disabled />
          <FormInput label="Department" value={workAuthorization.department} disabled />
          <FormInput label="Work Location" value={workAuthorization.location} disabled />
          <FormInput label="Exact Work Area" value={workAuthorization.exactWorkArea} disabled />
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

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
            {file.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
