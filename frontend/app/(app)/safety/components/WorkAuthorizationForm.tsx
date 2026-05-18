"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormFileUpload from "@/components/forms/FormFileUpload";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import type { SelectOption } from "@/components/forms/SelectInput";
import DatePicker from "@/components/forms/DatePicker";

const requester = {
  name: "Daniel Okoro",
  department: "Engineering",
  role: "CNG Conversion Technician",
  requestDate: "2026-05-18",
};

const optionFromStrings = (items: string[]): SelectOption[] =>
  items.map((item) => ({ value: item, label: item }));

const employeeOptions = [
  { value: "Mary James", label: "Mary James - Engineering Supervisor" },
  { value: "Samuel Bassey", label: "Samuel Bassey - HSE Officer" },
  { value: "Grace Bello", label: "Grace Bello - Operations Officer" },
  { value: "Ibrahim Musa", label: "Ibrahim Musa - Technician" },
];

const workLocationOptions = optionFromStrings([
  "Conversion Bay 1",
  "Conversion Bay 2",
  "Vehicle Yard",
  "Gas Storage Area",
  "Maintenance Workshop",
  "Electrical Room",
  "Loading Area",
  "Inspection Bay",
]);

const priorityOptions = optionFromStrings(["Low", "Medium", "High", "Critical"]);
const yesNoOptions = optionFromStrings(["Yes", "No"]);

const workTypeOptions = optionFromStrings([
  "CNG Conversion",
  "CNG Cylinder Work",
  "Gas System Work",
  "Electrical Work",
  "Hot Work",
  "Lifting Work",
  "Vehicle Inspection",
  "Transport Preparation",
  "Maintenance",
  "Calibration",
  "General Engineering Work",
]);

const toolsEquipmentOptions = optionFromStrings([
  "Hand Tools",
  "Diagnostic Tool",
  "Welding Machine",
  "Grinding Machine",
  "Cylinder Lifting Equipment",
  "Gas Detector",
  "Pressure Gauge",
  "Electrical Tester",
  "Torque Wrench",
  "PPE Kit",
]);

const contractorOptions = optionFromStrings([
  "ABC Engineering Services",
  "SafeGas Technical Ltd",
  "Prime Mechanical Contractors",
]);

export default function WorkAuthorizationForm() {
  const [contractorRequired, setContractorRequired] = useState("");
  const [workAreaFiles, setWorkAreaFiles] = useState<File[]>([]);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [submittedReference, setSubmittedReference] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedReference("WA-2026-0001");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      {submittedReference ? (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Request submitted successfully.</p>
            <p className="mt-1">Mock reference generated: {submittedReference}</p>
          </div>
        </div>
      ) : null}

      <FormSection title="Requester Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={requester.name} disabled />
          <FormInput label="Department" value={requester.department} disabled />
          <FormInput label="Job Title / Role" value={requester.role} disabled />
          <FormDatePicker label="Request Date" value={requester.requestDate} disabled />
        </div>
      </FormSection>

      <FormSection title="Request Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Request Title" required placeholder="Enter request title" />
          <FormSelect
            label="Work Location"
            required
            searchable
            creatable
            options={workLocationOptions}
            placeholder="Select or add location"
          />
          <FormTextarea label="Exact Work Area" required placeholder="Describe the exact area" />
          <FormDateTimeInput label="Expected Start Date/Time" required />
          <FormDateTimeInput label="Expected End Date/Time" required />
          <DatePicker label="Date of Last Similar Work at This Location" />
          <FormSelect
            label="Supervisor"
            required
            searchable
            options={employeeOptions}
            placeholder="Select supervisor"
          />
          <FormSelect
            label="Priority"
            required
            options={priorityOptions}
            placeholder="Select priority"
          />
        </div>
      </FormSection>

      <FormSection title="Work Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormMultiSelect
            label="Type of Work"
            required
            searchable
            creatable
            options={workTypeOptions}
            placeholder="Select work type"
          />
          <FormMultiSelect
            label="Workers Involved"
            required
            searchable
            options={employeeOptions}
            placeholder="Select workers"
          />
          <FormTextarea
            label="Work Description"
            required
            placeholder="Describe the work to be performed"
            className="md:min-h-28"
          />
          <FormTextarea
            label="Reason for Work"
            required
            placeholder="Explain why the work is needed"
            className="md:min-h-28"
          />
          <FormSelect
            label="Contractor Required?"
            required
            options={yesNoOptions}
            value={contractorRequired}
            placeholder="Select answer"
            onValueChange={setContractorRequired}
          />
          {contractorRequired === "Yes" ? (
            <>
              <FormSelect
                label="Contractor Name"
                required
                searchable
                creatable
                options={contractorOptions}
                placeholder="Select or add contractor"
              />
              <FormInput
                label="Contractor Contact Person"
                placeholder="Enter contact person"
              />
            </>
          ) : null}
          <FormMultiSelect
            label="Tools/Equipment Required"
            required
            searchable
            creatable
            options={toolsEquipmentOptions}
            placeholder="Select tools or equipment"
          />
          <FormTextarea
            label="Special Instructions"
            placeholder="Add any special instructions"
          />
        </div>
      </FormSection>

      <FormSection title="Safety / Risk Indicators">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="Is gas/CNG/LNG involved?"
            required
            options={yesNoOptions}
            placeholder="Select answer"
          />
          <FormSelect
            label="Is a pressurized system involved?"
            required
            options={yesNoOptions}
            placeholder="Select answer"
          />
          <FormSelect
            label="Will the work involve heat, sparks, welding, cutting, or grinding?"
            required
            options={yesNoOptions}
            placeholder="Select answer"
          />
          <FormSelect
            label="Is electrical isolation required?"
            required
            options={yesNoOptions}
            placeholder="Select answer"
          />
          <FormSelect
            label="Is lifting/heavy equipment involved?"
            required
            options={yesNoOptions}
            placeholder="Select answer"
          />
          <FormTextarea
            label="Additional Safety Note"
            placeholder="Add any extra safety concern"
          />
        </div>
      </FormSection>

      <FormSection title="Attachments">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <FormFileUpload
              label="Work Area Images"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              hint="Images, PDFs, and documents are accepted. No upload will occur yet."
              onChange={(event) =>
                setWorkAreaFiles(Array.from(event.currentTarget.files ?? []))
              }
            />
            <SelectedFiles files={workAreaFiles} />
          </div>
          <div className="space-y-3">
            <FormFileUpload
              label="Supporting Documents"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              hint="Attach method statements, drawings, checklists, or photos."
              onChange={(event) =>
                setSupportingFiles(Array.from(event.currentTarget.files ?? []))
              }
            />
            <SelectedFiles files={supportingFiles} />
          </div>
          <FormTextarea
            label="Attachment Notes"
            placeholder="Add notes about the selected files"
            className="md:col-span-2"
          />
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit">Submit Request</Button>
      </div>
    </form>
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
