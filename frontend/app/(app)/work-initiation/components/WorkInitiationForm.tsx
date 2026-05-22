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
import { mockWorkInitiationRequester } from "@/lib/mock/work-initiation";
import { useToast } from "@/hooks/useToast";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const yesNoOptions = toOptions(["Yes", "No"]);
const priorityOptions = toOptions(["Low", "Medium", "High", "Critical"]);
const workTypeOptions = toOptions([
  "Routine Maintenance",
  "Corrective Maintenance",
  "Incident/Hazard Corrective Work",
  "Inspection Finding",
  "CNG Conversion",
  "Gas System Repair",
  "Vehicle Inspection",
  "Transport Preparation",
  "Emergency Work",
  "Planned Project",
  "General Engineering Work",
]);
const locationOptions = toOptions([
  "Conversion Bay 1",
  "Conversion Bay 2",
  "Vehicle Yard",
  "Gas Storage Area",
  "Maintenance Workshop",
  "Electrical Room",
  "Loading Area",
  "Inspection Bay",
]);
const assetTypeOptions = toOptions([
  "Vehicle",
  "Equipment",
  "Gas Pipe",
  "Gas Cylinder",
  "Facility Area",
  "Electrical System",
  "Other",
]);
const departmentTeamOptions = toOptions([
  "Engineering",
  "Maintenance",
  "Operations",
  "Logistics",
  "HSE",
  "Admin",
]);
const employeeOptions = toOptions(["Mary James", "Daniel Okoro", "Ibrahim Musa", "Grace Bello"]);
const contractorOptions = toOptions([
  "SafeWeld Engineering Ltd",
  "Prime Gas Services",
  "Vehicle Conversion Partners",
  "Electrical Support Contractors",
]);

export default function WorkInitiationForm() {
  const router = useRouter();
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [assetInvolved, setAssetInvolved] = useState("");
  const [assetType, setAssetType] = useState("");
  const [contractorsNeeded, setContractorsNeeded] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.success("Work initiation request submitted successfully.");
    window.setTimeout(() => router.push("/work-initiation"), 700);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      <FormSection title="Requester Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={mockWorkInitiationRequester.name} disabled />
          <FormInput label="Department" value={mockWorkInitiationRequester.department} disabled />
          <FormInput label="Job Title / Role" value={mockWorkInitiationRequester.role} disabled />
          <FormDatePicker label="Request Date" value={mockWorkInitiationRequester.requestDate} disabled />
        </div>
      </FormSection>

      <FormSection title="Work Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Work Title" required placeholder="Enter work title" />
          <FormSelect label="Work Type" required searchable creatable options={workTypeOptions} placeholder="Select or add work type" />
          <FormSelect label="Priority" required options={priorityOptions} placeholder="Select priority" />
          <FormMultiSelect label="Location" required searchable creatable options={locationOptions} placeholder="Select or add location" />
          <FormInput label="Exact Work Area" placeholder="Enter exact work area" />
          <FormTextarea label="Work Description" required placeholder="Describe what needs to be done" className="md:col-span-2" />
          <FormTextarea label="Reason for Work" required placeholder="Explain why the work is needed" className="md:col-span-2" />
          <div className="md:col-span-2">
            <FileDropzone
              label="Supporting Images/Documents"
              value={files}
              onChange={setFiles}
              accept="image/*,.pdf,.doc,.docx"
              maxFiles={10}
            />
          </div>
        </div>
      </FormSection>

      {/* <FormSection title="Asset / Vehicle / Equipment Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormToggleGroup
            label="Asset/Vehicle/Equipment Involved?"
            required
            options={yesNoOptions}
            value={assetInvolved}
            onValueChange={setAssetInvolved}
          />
          {assetInvolved === "Yes" ? (
            <>
              <FormSelect label="Asset Type" required searchable creatable options={assetTypeOptions} placeholder="Select asset type" value={assetType} onValueChange={setAssetType} />
              <FormInput label="Asset Reference / ID" required placeholder="Enter asset reference" />
              {assetType === "Vehicle" ? (
                <FormInput label="Vehicle Plate Number" required placeholder="Enter plate number" />
              ) : null}
              <FormInput label="VIN / Chassis Number" placeholder="Optional" />
              <FormInput label="Client / Company" placeholder="Optional" />
            </>
          ) : null}
        </div>
      </FormSection> */}

      <FormSection title="Assignment & Planning">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect label="Assigned Department / Team" required options={departmentTeamOptions} placeholder="Select department or team" />
          <FormSelect label="Assigned Supervisor" required searchable options={employeeOptions} placeholder="Select supervisor" />
          <FormMultiSelect label="Assigned Workers" required searchable options={employeeOptions} placeholder="Select workers" />
          <FormToggleGroup label="Contractors Needed?" required options={yesNoOptions} value={contractorsNeeded} onValueChange={setContractorsNeeded} />
          {contractorsNeeded === "Yes" ? (
            <FormMultiSelect label="Selected Contractors" required searchable creatable options={contractorOptions} placeholder="Select contractors" />
          ) : null}
          <FormDateTimeInput label="Planned Start Date/Time" />
          <FormDateTimeInput label="Planned End Date/Time" />
          <FormTextarea label="Materials / Parts Required" placeholder="Optional" className="md:col-span-2" />
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit">Submit Work Initiation</Button>
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
