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
import {
  contractorContactEmailByName,
  mockWorkInitiationRequester,
  workCategoryOptions,
  workTypeOptionsByCategory,
} from "@/lib/mock/work-initiation";
import {
  createWorkInitiation,
  useSafetyDemoData,
} from "@/lib/safety-demo-store";
import type { WorkAuthorizationAttachment } from "@/types/safety";
import { useToast } from "@/hooks/useToast";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const yesNoOptions = toOptions(["Yes", "No"]);
const priorityOptions = toOptions(["Low", "Medium", "High", "Critical"]);
const categoryOptions = toOptions(workCategoryOptions);
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
  const [workCategory, setWorkCategory] = useState("");
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [relatedIncidentId, setRelatedIncidentId] = useState("");
  const [priority, setPriority] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [exactWorkArea, setExactWorkArea] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [reasonForWork, setReasonForWork] = useState("");
  const [assignedDepartment, setAssignedDepartment] = useState("");
  const [assignedSupervisor, setAssignedSupervisor] = useState("");
  const [assignedWorkers, setAssignedWorkers] = useState<string[]>([]);
  const [contractorsNeeded, setContractorsNeeded] = useState("");
  const [selectedContractor, setSelectedContractor] = useState("");
  const [plannedStartDateTime, setPlannedStartDateTime] = useState("");
  const [plannedEndDateTime, setPlannedEndDateTime] = useState("");
  const [materialsRequired, setMaterialsRequired] = useState("");
  const { incidentHazards } = useSafetyDemoData();
  const incidentHazardRequestOptions = incidentHazards
    .filter((report) => report.status === "recommended")
    .map((report) => ({
      value: report.id,
      label: `${report.id} - ${report.title || report.reportType}`,
      description: `${report.reporter.name} | ${report.reporter.reportDate}`,
    }));
  const selectedIncident = incidentHazards.find((report) => report.id === relatedIncidentId);
  const workTypeOptions = toOptions(
    workCategory ? workTypeOptionsByCategory[workCategory] ?? [] : [],
  );

  function handleWorkCategoryChange(nextCategory: string) {
    setWorkCategory(nextCategory);
    setWorkTypes([]);
    if (nextCategory !== "Incident/Hazard") setRelatedIncidentId("");
  }

  function handleRelatedIncidentChange(nextIncidentId: string) {
    setRelatedIncidentId(nextIncidentId);
    const selectedReport = incidentHazards.find((report) => report.id === nextIncidentId);
    if (selectedReport?.hseReview?.assignedDepartment) {
      setAssignedDepartment(selectedReport.hseReview.assignedDepartment);
    }
  }

  function handleContractorsNeededChange(nextValue: string) {
    setContractorsNeeded(nextValue);
    if (nextValue !== "Yes") {
      setSelectedContractor("");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createWorkInitiation((id) => ({
      id,
      status: "submitted",
      requester: mockWorkInitiationRequester,
      title,
      workDescription,
      reasonForWork,
      workCategory,
      relatedIncidentHazardId: relatedIncidentId,
      workType: workTypes,
      priority: priority as "Low" | "Medium" | "High" | "Critical",
      location: locations.join(", "),
      exactWorkArea,
      attachments: files.map((file) => ({
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "document",
      })) as WorkAuthorizationAttachment[],
      assetDetails: {
        assetInvolved: false,
        assetType: "",
        assetReference: "",
        vehiclePlateNumber: "",
        vin: "",
        clientCompany: "",
      },
      assignment: {
        assignedDepartment,
        assignedSupervisor,
        assignedWorkers,
        contractorsNeeded: contractorsNeeded === "Yes",
        selectedContractor,
        contractorContactEmail: contractorContactEmailByName[selectedContractor] ?? "",
        plannedStartDateTime,
        plannedEndDateTime,
        materialsRequired,
      },
      supervisorApproval: null,
      operationalReview: null,
      auditTrail: [{
        action: "Submitted",
        actor: mockWorkInitiationRequester.name,
        role: "Requester",
        dateTime: "2026-05-25 09:30 AM",
        comment: "Work initiation request submitted.",
      }],
    }));
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
          <FormInput label="Work Title" required placeholder="Enter work title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <FormSelect
            label="Work Category"
            required
            options={categoryOptions}
            placeholder="Select work category"
            value={workCategory}
            onValueChange={handleWorkCategoryChange}
          />
          {workCategory === "Incident/Hazard" ? (
            <>
              <FormSelect
                label="Related Incident/Hazard Request"
                required
                searchable
                options={incidentHazardRequestOptions}
                placeholder="Select recommended incident or hazard"
                dropdownClassName="md:min-w-[34rem]"
                value={relatedIncidentId}
                onValueChange={handleRelatedIncidentChange}
              />
              {selectedIncident ? (
                <div className="rounded-lg border border-brand-border bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-brand-text-primary">{selectedIncident.title}</p>
                  <p className="mt-1 text-brand-text-secondary">
                    {selectedIncident.id} | {selectedIncident.reporter.name} | {selectedIncident.reporter.reportDate}
                  </p>
                  <p className="mt-1 text-brand-text-secondary">
                    Recommended to {selectedIncident.hseReview?.assignedDepartment} | Action Owner: {selectedIncident.hseReview?.actionOwner}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
          <FormMultiSelect
            label="Work Type"
            required
            searchable
            creatable
            options={workTypeOptions}
            value={workTypes}
            onValueChange={setWorkTypes}
            placeholder={workCategory ? "Select or add work type" : "Select work category first"}
            disabled={!workCategory}
          />
          <FormSelect label="Priority" required options={priorityOptions} placeholder="Select priority" value={priority} onValueChange={setPriority} />
          <FormMultiSelect label="Location" required searchable creatable options={locationOptions} placeholder="Select or add location" value={locations} onValueChange={setLocations} />
          <FormInput label="Exact Work Area" placeholder="Enter exact work area" value={exactWorkArea} onChange={(event) => setExactWorkArea(event.target.value)} />
          <FormTextarea label="Work Description" required placeholder="Describe what needs to be done" className="md:col-span-2" value={workDescription} onChange={(event) => setWorkDescription(event.target.value)} />
          <FormTextarea label="Reason for Work" required placeholder="Explain why the work is needed" className="md:col-span-2" value={reasonForWork} onChange={(event) => setReasonForWork(event.target.value)} />
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

      <FormSection title="Assignment & Planning">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect label="Assigned Department / Team" required options={departmentTeamOptions} placeholder="Select department or team" value={assignedDepartment} onValueChange={setAssignedDepartment} />
          <FormSelect label="Assigned Supervisor" required searchable options={employeeOptions} placeholder="Select supervisor" value={assignedSupervisor} onValueChange={setAssignedSupervisor} />
          <FormMultiSelect label="Assigned Workers" required searchable options={employeeOptions} placeholder="Select workers" value={assignedWorkers} onValueChange={setAssignedWorkers} />
          <FormToggleGroup label="Contractors Needed?" required options={yesNoOptions} value={contractorsNeeded} onValueChange={handleContractorsNeededChange} />
          {contractorsNeeded === "Yes" ? (
            <>
              <FormSelect
                label="Selected Contractor"
                required
                searchable
                creatable
                options={contractorOptions}
                placeholder="Select contractor"
                value={selectedContractor}
                onValueChange={setSelectedContractor}
              />
              <FormInput
                label="Contractor Contact Email"
                type="email"
                value={contractorContactEmailByName[selectedContractor] ?? ""}
                disabled
              />
            </>
          ) : null}
          <FormDateTimeInput label="Planned Start Date/Time" value={plannedStartDateTime} onValueChange={setPlannedStartDateTime} />
          <FormDateTimeInput label="Planned End Date/Time" value={plannedEndDateTime} onValueChange={setPlannedEndDateTime} />
          <FormTextarea label="Materials / Parts Required" placeholder="Optional" className="md:col-span-2" value={materialsRequired} onChange={(event) => setMaterialsRequired(event.target.value)} />
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
