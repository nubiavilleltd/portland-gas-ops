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
import FormToggleGroup from "@/components/forms/FormToggleGroup";
import type { SelectOption } from "@/components/forms/SelectInput";
import { useToast } from "@/hooks/useToast";

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

const riskIndicatorOptions = optionFromStrings([
  "Gas/CNG/LNG involved",
  "Pressurized system involved",
  "Heat, sparks, welding, cutting, or grinding",
  "Electrical isolation required",
  "Lifting/heavy equipment involved",
]);

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
  const router = useRouter();
  const toast = useToast();
  const [contractorRequired, setContractorRequired] = useState("");
  const [workAreaFiles, setWorkAreaFiles] = useState<File[]>([]);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);

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
          <FormDateTimeInput label="Expected Start Date/Time" required />
          <FormDateTimeInput label="Expected End Date/Time" required />
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
          <FormTextarea label="Exact Work Area" required placeholder="Describe the exact area" />
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
          {/* <FormTextarea
            label="Reason for Work"
            required
            placeholder="Explain why the work is needed"
            className="md:min-h-28"
          /> */}
          <FormToggleGroup
            label="Contractor Required?"
            required
            options={yesNoOptions}
            value={contractorRequired}
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
                label="Contractor Contact Email"
                type="email"
                placeholder="Enter contractor contact email"
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
          {/* <FormTextarea
            label="Special Instructions"
            placeholder="Add any special instructions"
          /> */}
        </div>
      </FormSection>

      <FormSection title="Safety / Risk Indicators">
        <div className="grid gap-4 md:grid-cols-2">
          <FormMultiSelect
            label="Risks Involved"
            required
            options={riskIndicatorOptions}
            placeholder="Select all risks involved"
            className="md:col-span-2"
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
            <FileDropzone
              label="Work Area Images"
              value={workAreaFiles}
              onChange={setWorkAreaFiles}
              accept="image/*,.pdf,.doc,.docx"
              maxFiles={10}
              hint="Images, PDFs, and documents are accepted. No upload will occur yet."
            />
          </div>
          <div className="space-y-3">
            <FileDropzone
              label="Supporting Documents"
              value={supportingFiles}
              onChange={setSupportingFiles}
              accept="image/*,.pdf,.doc,.docx"
              maxFiles={10}
              hint="Attach method statements, drawings, checklists, or photos."
            />
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
