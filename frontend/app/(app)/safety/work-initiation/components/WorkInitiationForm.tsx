"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import {
  contractorContactEmailByName,
  workCategoryOptions,
  workTypeOptionsByCategory,
} from "@/lib/mock/work-initiation";
import { getSafetyCurrentUser } from "@/lib/safety-demo-identity";
import { formatLocalDate } from "@/lib/safety-demo-dates";
import { useToast } from "@/hooks/useToast";
import {
  useIncidentReport,
  useIncidentReports,
  useSafetyActors,
} from "@/lib/modules/safety/incidentReport";
import {
  workInitiationsApi,
  type WorkInitiationCategory,
  type WorkInitiationCreate,
} from "@/lib/modules/safety/workInitiation";
import type { IncidentHazardReport } from "@/types/safety";

const toOptions = (items: string[]) =>
  items.map((item) => ({ value: item, label: item }));

const yesNoOptions = toOptions(["Yes", "No"]);
const categoryOptions = toOptions(workCategoryOptions);

const categoryByLabel: Record<string, WorkInitiationCategory> = {
  "Routine Work": "routine_work",
  Maintenance: "maintenance",
  "Incident/Hazard": "incident_hazard",
  "Customer Work": "customer_work",
  "Project Work": "project_work",
  "Emergency Work": "emergency_work",
};

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

const contractorOptions = toOptions([
  "SafeWeld Engineering Ltd",
  "Prime Gas Services",
  "Vehicle Conversion Partners",
  "Electrical Support Contractors",
]);

export default function WorkInitiationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const incidentIdFromQuery = searchParams.get("incidentId");
  const isIncidentLinkedFromQuery = Boolean(incidentIdFromQuery);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [workCategory, setWorkCategory] = useState(
    isIncidentLinkedFromQuery ? "Incident/Hazard" : "",
  );
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [relatedIncidentId, setRelatedIncidentId] = useState(
    incidentIdFromQuery ?? "",
  );

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

  const requester = {
    ...getSafetyCurrentUser(),
    requestDate: formatLocalDate(),
  };

  const recommendedIncidentsQuery = useIncidentReports({
    status: "recommended",
  });

  const linkedIncidentQuery = useIncidentReport(incidentIdFromQuery ?? "");
  const safetyActorsQuery = useSafetyActors();

  const employeeOptions = (safetyActorsQuery.data ?? []).map((actor) => ({
    value: actor.id,
    label: `${actor.name}${actor.job_title ? ` - ${actor.job_title}` : ""}`,
  }));

  const recommendedIncidents = recommendedIncidentsQuery.data ?? [];

  const incidentOptionsSource = mergeUniqueIncidents(
    linkedIncidentQuery.data
      ? [linkedIncidentQuery.data, ...recommendedIncidents]
      : recommendedIncidents,
  );

  const incidentHazardRequestOptions = incidentOptionsSource
    .filter((report) => isActionRecommendedIncident(report))
    .map((report) => ({
      value: report.id,
      label: `${report.reference ?? report.id} - ${
        report.title || report.reportType
      }`,
      description: `${report.reporter.name} | ${report.reporter.reportDate}`,
    }));

  const selectedIncident =
    linkedIncidentQuery.data ??
    incidentOptionsSource.find((report) => report.id === relatedIncidentId);

  const workTypeOptions = toOptions(
    workCategory ? workTypeOptionsByCategory[workCategory] ?? [] : [],
  );

  function handleWorkCategoryChange(nextCategory: string) {
    setWorkCategory(nextCategory);
    setWorkTypes([]);

    if (nextCategory !== "Incident/Hazard") {
      setRelatedIncidentId("");
    }
  }

  function handleRelatedIncidentChange(nextIncidentId: string) {
    setRelatedIncidentId(nextIncidentId);
  }

  function handleContractorsNeededChange(nextValue: string) {
    setContractorsNeeded(nextValue);

    if (nextValue !== "Yes") {
      setSelectedContractor("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const validationMessage = validateWorkInitiationForm({
      title,
      workCategory,
      relatedIncidentId,
      workTypes,
      locations,
      workDescription,
      reasonForWork,
      assignedDepartment,
      assignedSupervisor,
      assignedWorkers,
      contractorsNeeded,
      selectedContractor,
      plannedStartDateTime,
      plannedEndDateTime,
    });

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload: WorkInitiationCreate = {
      title,
      work_category: toWorkInitiationCategory(workCategory),
      related_incident_report_id: emptyToNull(relatedIncidentId),
      work_type: workTypes,
      location: locations.join(", "),
      exact_work_area: emptyToNull(exactWorkArea),
      work_description: workDescription,
      reason_for_work: reasonForWork,
      assigned_department: assignedDepartment,
      assigned_supervisor_id: assignedSupervisor,
      assigned_worker_ids: assignedWorkers,
      contractors_needed: contractorsNeeded === "Yes",
      selected_contractor_name:
        contractorsNeeded === "Yes" ? emptyToNull(selectedContractor) : null,
      contractor_contact_email:
        contractorsNeeded === "Yes"
          ? emptyToNull(contractorContactEmailByName[selectedContractor] ?? "")
          : null,
      planned_start_at: plannedStartDateTime,
      planned_end_at: plannedEndDateTime,
      materials_required: emptyToNull(materialsRequired),
    };

    try {
      setIsSubmitting(true);

      await workInitiationsApi.create(payload);

      toast.success("Work initiation request submitted successfully.");

      window.setTimeout(() => {
        router.push("/safety/work-initiation");
      }, 700);
    } catch (error) {
      console.error("Failed to submit work initiation", error);

      toast.error(
        getApiErrorMessage(
          error,
          "Work initiation request could not be submitted.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      <FormSection
        title="Requester Details"
        description="Your employee information for this work initiation request."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={requester.name} disabled />
          <FormInput label="Department" value={requester.department} disabled />
          <FormInput label="Job Title / Role" value={requester.role} disabled />
          <FormDatePicker
            label="Request Date"
            value={requester.requestDate}
            disabled
          />
        </div>
      </FormSection>

      <FormSection
        title="Work Details"
        description="Define the work needed, its purpose, and where it will happen."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {isIncidentLinkedFromQuery && selectedIncident ? (
            <IncidentContextCard incident={selectedIncident} />
          ) : null}

          {linkedIncidentQuery.isLoading && isIncidentLinkedFromQuery ? (
            <div className="rounded-lg border border-brand-border bg-gray-50 px-4 py-3 text-sm text-brand-text-secondary md:col-span-2">
              Loading linked incident details...
            </div>
          ) : null}

          {linkedIncidentQuery.isError && isIncidentLinkedFromQuery ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
              Could not load the linked incident report context. The incident
              link from the URL is still attached to this request.
            </div>
          ) : null}

          <FormInput
            label="Work Title"
            required
            placeholder="Enter work title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <FormSelect
            label="Work Category"
            required
            options={categoryOptions}
            placeholder="Select work category"
            value={workCategory}
            onValueChange={handleWorkCategoryChange}
            disabled={isIncidentLinkedFromQuery}
          />

          {workCategory === "Incident/Hazard" ? (
            <>
              {isIncidentLinkedFromQuery ? (
                <FormInput
                  label="Related Incident/Hazard Request"
                  required
                  value={
                    selectedIncident
                      ? `${selectedIncident.reference ?? selectedIncident.id} - ${
                          selectedIncident.title || selectedIncident.reportType
                        }`
                      : relatedIncidentId
                  }
                  disabled
                />
              ) : (
                <FormSelect
                  label="Related Incident/Hazard Request"
                  required
                  searchable
                  options={incidentHazardRequestOptions}
                  placeholder={
                    recommendedIncidentsQuery.isLoading
                      ? "Loading recommended incidents..."
                      : "Select recommended incident or hazard"
                  }
                  dropdownClassName="md:min-w-[34rem]"
                  value={relatedIncidentId}
                  onValueChange={handleRelatedIncidentChange}
                />
              )}

              {selectedIncident ? (
                isIncidentLinkedFromQuery ? null : (
                  <IncidentContextCard incident={selectedIncident} />
                )
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
            placeholder={
              workCategory
                ? "Select or add work type"
                : "Select work category first"
            }
            disabled={!workCategory}
          />

          <FormMultiSelect
            label="Location"
            required
            searchable
            creatable
            options={locationOptions}
            placeholder="Select or add location"
            value={locations}
            onValueChange={setLocations}
          />

          <FormTextarea
            label="Exact Work Area"
            placeholder="Enter exact work area"
            value={exactWorkArea}
            onChange={(event) => setExactWorkArea(event.target.value)}
          />

          <FormTextarea
            label="Work Description"
            required
            placeholder="Describe what needs to be done"
            className="md:col-span-2"
            value={workDescription}
            onChange={(event) => setWorkDescription(event.target.value)}
          />

          <FormTextarea
            label="Reason for Work"
            required
            placeholder="Explain why the work is needed"
            className="md:col-span-2"
            value={reasonForWork}
            onChange={(event) => setReasonForWork(event.target.value)}
          />

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

      <FormSection
        title="Assignment & Planning"
        description="Identify the team, workers, contractor, and planned schedule."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="Assigned Department / Team"
            required
            options={departmentTeamOptions}
            placeholder="Select department or team"
            value={assignedDepartment}
            onValueChange={setAssignedDepartment}
          />

          <FormSelect
            label="Assigned Supervisor"
            required
            searchable
            options={employeeOptions}
            placeholder={
              safetyActorsQuery.isLoading
                ? "Loading employees..."
                : "Select supervisor"
            }
            value={assignedSupervisor}
            onValueChange={setAssignedSupervisor}
          />

          <FormMultiSelect
            label="Assigned Workers"
            required
            searchable
            options={employeeOptions}
            placeholder={
              safetyActorsQuery.isLoading
                ? "Loading employees..."
                : "Select workers"
            }
            value={assignedWorkers}
            onValueChange={setAssignedWorkers}
          />

          <FormSelect
            label="Contractors Needed?"
            required
            options={yesNoOptions}
            placeholder="Select an option"
            value={contractorsNeeded}
            onValueChange={handleContractorsNeededChange}
          />

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

          <FormDateTimeInput
            label="Planned Start Date/Time"
            value={plannedStartDateTime}
            onValueChange={setPlannedStartDateTime}
          />

          <FormDateTimeInput
            label="Planned End Date/Time"
            value={plannedEndDateTime}
            onValueChange={setPlannedEndDateTime}
          />

          <FormTextarea
            label="Materials / Parts Required"
            placeholder="Optional"
            className="md:col-span-2"
            value={materialsRequired}
            onChange={(event) => setMaterialsRequired(event.target.value)}
          />
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
          Submit Work Initiation
        </Button>
      </div>
    </form>
  );
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toWorkInitiationCategory(value: string): WorkInitiationCategory {
  return categoryByLabel[value] ?? "other";
}

function mergeUniqueIncidents(reports: IncidentHazardReport[]) {
  const seen = new Set<string>();

  return reports.filter((report) => {
    if (seen.has(report.id)) return false;

    seen.add(report.id);
    return true;
  });
}

function isActionRecommendedIncident(report: IncidentHazardReport) {
  return String(report.status) === "recommended";
}

function IncidentContextCard({ incident }: { incident: IncidentHazardReport }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 md:col-span-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-blue-700">
            Linked Incident/Hazard
          </p>
          <p className="mt-1 truncate font-semibold text-brand-text-primary">
            {incident.reference ?? incident.id} - {incident.title}
          </p>
          <p className="mt-1 text-blue-800">
            {incident.reportType} | {incident.reporter.name} |{" "}
            {incident.reporter.reportDate}
          </p>
        </div>

        <div className="shrink-0 text-blue-800 md:text-right">
          <p>
            Recommended to{" "}
            <span className="font-medium">
              {incident.hseReview?.assignedDepartment || "N/A"}
            </span>
          </p>
          <p>
            Action Owner:{" "}
            <span className="font-medium">
              {incident.hseReview?.actionOwner || "N/A"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function validateWorkInitiationForm({
  title,
  workCategory,
  relatedIncidentId,
  workTypes,
  locations,
  workDescription,
  reasonForWork,
  assignedDepartment,
  assignedSupervisor,
  assignedWorkers,
  contractorsNeeded,
  selectedContractor,
  plannedStartDateTime,
  plannedEndDateTime,
}: {
  title: string;
  workCategory: string;
  relatedIncidentId: string;
  workTypes: string[];
  locations: string[];
  workDescription: string;
  reasonForWork: string;
  assignedDepartment: string;
  assignedSupervisor: string;
  assignedWorkers: string[];
  contractorsNeeded: string;
  selectedContractor: string;
  plannedStartDateTime: string;
  plannedEndDateTime: string;
}) {
  if (title.trim().length < 3) return "Enter a work title.";
  if (!workCategory) return "Select work category.";

  if (workCategory === "Incident/Hazard" && !relatedIncidentId) {
    return "Select the related incident/hazard request.";
  }

  if (workTypes.length === 0) return "Select at least one work type.";
  if (locations.length === 0) return "Select at least one location.";
  if (workDescription.trim().length < 5) return "Describe the work to be done.";
  if (reasonForWork.trim().length < 3) return "Enter the reason for work.";
  if (!assignedDepartment) return "Select assigned department.";
  if (!assignedSupervisor) return "Select assigned supervisor.";
  if (assignedWorkers.length === 0) return "Select at least one assigned worker.";
  if (!contractorsNeeded) return "Select whether contractors are needed.";

  if (contractorsNeeded === "Yes" && !selectedContractor) {
    return "Select contractor.";
  }

  if (!plannedStartDateTime) return "Select planned start date/time.";
  if (!plannedEndDateTime) return "Select planned end date/time.";

  if (plannedEndDateTime <= plannedStartDateTime) {
    return "Planned end date/time must be after planned start date/time.";
  }

  return "";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: unknown } }).response?.data;
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

  return fallback;
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h2 className="text-base font-semibold text-brand-text-primary">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 text-sm text-brand-text-secondary">
            {description}
          </p>
        ) : null}
      </div>

      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
