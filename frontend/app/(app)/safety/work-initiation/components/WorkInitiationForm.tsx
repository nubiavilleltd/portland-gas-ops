"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import { formatLocalDate, toApiDateTime } from "@/lib/safety-demo-dates";
import { useToast } from "@/hooks/useToast";
import { safetyLocationOptions } from "@/lib/modules/safety/locations";
import {
  getSafetyEmployeeRequester,
  useSafetyActors,
  useSafetyCurrentEmployee,
  useSafetyDepartments,
} from "@/lib/modules/safety/people";
import {
  getDateTimeAfter,
  getEarliestPlannedStartDateTime,
  MIN_SCHEDULE_DURATION_MINUTES,
} from "@/lib/modules/safety/date-rules";
import {
  useCreateWorkInitiation,
  useEligibleIncidentsForWorkInitiation,
  type WorkInitiationCategory,
  type WorkInitiationCreate,
} from "@/lib/modules/safety/workInitiation";
import {
  clearValidationError,
  getFirstInvalidField,
  scrollToValidationField,
  type ValidationErrors,
  type ValidationRef,
} from "@/lib/modules/safety/form-validation";
import type { IncidentHazardReport } from "@/types/safety";
import SafetyValidationSummary from "../../components/SafetyValidationSummary";

const toOptions = (items: string[]) =>
  items.map((item) => ({ value: item, label: item }));

const yesNoOptions = toOptions(["Yes", "No"]);
const workCategoryOptions = [
  "Routine Work",
  "Maintenance",
  "Incident/Hazard",
  "Customer Work",
  "Project Work",
  "Emergency Work",
  "Other",
];
const workTypeOptionsByCategory: Record<string, string[]> = {
  "Routine Work": [
    "Routine Bay Check",
    "Vehicle Inspection",
    "Equipment Inspection",
    "Preventive Maintenance",
    "General Engineering Work",
  ],
  Maintenance: [
    "Corrective Maintenance",
    "Gas System Repair",
    "Electrical Repair",
    "Facility Repair",
    "Equipment Servicing",
  ],
  "Incident/Hazard": [
    "Incident/Hazard Corrective Work",
    "Gas Leak Corrective Work",
    "Unsafe Condition Correction",
    "Inspection Finding",
    "Emergency Safety Repair",
  ],
  "Customer Work": [
    "CNG Conversion",
    "CNG Cylinder Work",
    "Vehicle Conversion Support",
    "Transport Preparation",
    "Customer Vehicle Inspection",
  ],
  "Project Work": [
    "Planned Project",
    "Workshop Modification",
    "Facility Upgrade",
    "Installation Work",
  ],
  "Emergency Work": [
    "Emergency Work",
    "Emergency Repair",
    "Urgent Gas System Response",
    "Critical Equipment Recovery",
  ],
  Other: ["Other"],
};
const contractorContactEmailByName: Record<string, string> = {
  "SafeWeld Engineering Ltd": "projects@safeweld.example",
  "Prime Gas Services": "operations@primegas.example",
  "Vehicle Conversion Partners": "service@vehicleconversion.example",
  "Electrical Support Contractors": "support@electricalcontractors.example",
};
const categoryOptions = toOptions(workCategoryOptions);

const categoryByLabel: Record<string, WorkInitiationCategory> = {
  "Routine Work": "routine_work",
  Maintenance: "maintenance",
  "Incident/Hazard": "incident_hazard",
  "Customer Work": "customer_work",
  "Project Work": "project_work",
  "Emergency Work": "emergency_work",
  Other: "other",
};

const locationOptions = toOptions(safetyLocationOptions);

const contractorOptions = toOptions([
  "SafeWeld Engineering Ltd",
  "Prime Gas Services",
  "Vehicle Conversion Partners",
  "Electrical Support Contractors",
]);

type WorkInitiationValidationField =
  | "title"
  | "workCategory"
  | "otherWorkCategory"
  | "relatedIncidentId"
  | "workTypes"
  | "locations"
  | "workDescription"
  | "reasonForWork"
  | "assignedDepartment"
  | "assignedSupervisor"
  | "assignedWorkers"
  | "contractorsNeeded"
  | "selectedContractor"
  | "plannedStartDateTime"
  | "plannedEndDateTime";

const workInitiationFieldOrder: WorkInitiationValidationField[] = [
  "title",
  "workCategory",
  "otherWorkCategory",
  "relatedIncidentId",
  "workTypes",
  "locations",
  "workDescription",
  "reasonForWork",
  "assignedDepartment",
  "assignedSupervisor",
  "assignedWorkers",
  "contractorsNeeded",
  "selectedContractor",
  "plannedStartDateTime",
  "plannedEndDateTime",
];

export default function WorkInitiationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const createWorkInitiation = useCreateWorkInitiation();

  const incidentIdFromQuery = searchParams.get("incidentId");
  const isIncidentLinkedFromQuery = Boolean(incidentIdFromQuery);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    ValidationErrors<WorkInitiationValidationField>
  >({});
  const [files, setFiles] = useState<File[]>([]);

  const [workCategory, setWorkCategory] = useState(
    isIncidentLinkedFromQuery ? "Incident/Hazard" : "",
  );
  const [otherWorkCategory, setOtherWorkCategory] = useState("");
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
  const titleRef = useRef<HTMLInputElement | null>(null);
  const workCategoryRef = useRef<HTMLInputElement | null>(null);
  const otherWorkCategoryRef = useRef<HTMLInputElement | null>(null);
  const relatedIncidentIdRef = useRef<HTMLInputElement | null>(null);
  const workTypesRef = useRef<HTMLInputElement | null>(null);
  const locationsRef = useRef<HTMLInputElement | null>(null);
  const workDescriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const reasonForWorkRef = useRef<HTMLTextAreaElement | null>(null);
  const assignedDepartmentRef = useRef<HTMLInputElement | null>(null);
  const assignedSupervisorRef = useRef<HTMLInputElement | null>(null);
  const assignedWorkersRef = useRef<HTMLInputElement | null>(null);
  const contractorsNeededRef = useRef<HTMLInputElement | null>(null);
  const selectedContractorRef = useRef<HTMLInputElement | null>(null);
  const plannedStartDateTimeRef = useRef<HTMLInputElement | null>(null);
  const plannedEndDateTimeRef = useRef<HTMLInputElement | null>(null);

  const currentEmployee = useSafetyCurrentEmployee();
  const requester = getSafetyEmployeeRequester(
    currentEmployee.data,
    formatLocalDate(),
  );

  const recommendedIncidentsQuery = useEligibleIncidentsForWorkInitiation();
  const departmentsQuery = useSafetyDepartments();
  const departmentTeamOptions = useMemo(
    () =>
      (departmentsQuery.data ?? []).map((department) => ({
        value: department.value,
        label: department.label,
      })),
    [departmentsQuery.data],
  );
  const departmentEmployeesQuery = useSafetyActors(
    assignedDepartment ? { department: assignedDepartment } : undefined,
    { enabled: Boolean(assignedDepartment) },
  );
  const employeeOptions = useMemo(
    () =>
      (departmentEmployeesQuery.data ?? []).map((actor) => ({
        value: actor.id,
        label: `${actor.name}${actor.job_title ? ` - ${actor.job_title}` : ""}`,
      })),
    [departmentEmployeesQuery.data],
  );

  const recommendedIncidents = recommendedIncidentsQuery.data ?? [];

  const incidentOptionsSource = mergeUniqueIncidents(recommendedIncidents);

  const incidentHazardRequestOptions = incidentOptionsSource
    .filter((report) => isActionRecommendedIncident(report))
    .map((report) => ({
      value: report.id,
      label: report.reference
        ? `${report.reference} - ${report.title || report.reportType}`
        : report.title || report.reportType,
      description: `${report.reporter.name} | ${report.reporter.reportDate}`,
    }));

  const selectedIncident = incidentOptionsSource.find(
    (report) => report.id === relatedIncidentId,
  );

  const workTypeOptions = toOptions(
    workCategory ? workTypeOptionsByCategory[workCategory] ?? [] : [],
  );

  function handleWorkCategoryChange(nextCategory: string) {
    setWorkCategory(nextCategory);
    setWorkTypes([]);
    clearValidationError("workCategory", setValidationErrors);
    clearValidationError("otherWorkCategory", setValidationErrors);
    clearValidationError("workTypes", setValidationErrors);

    if (nextCategory !== "Other") {
      setOtherWorkCategory("");
    }

    if (nextCategory !== "Incident/Hazard") {
      setRelatedIncidentId("");
      clearValidationError("relatedIncidentId", setValidationErrors);
    }
  }

  function handleRelatedIncidentChange(nextIncidentId: string) {
    setRelatedIncidentId(nextIncidentId);
    clearValidationError("relatedIncidentId", setValidationErrors);
  }

  function handleContractorsNeededChange(nextValue: string) {
    setContractorsNeeded(nextValue);
    clearValidationError("contractorsNeeded", setValidationErrors);

    if (nextValue !== "Yes") {
      setSelectedContractor("");
      clearValidationError("selectedContractor", setValidationErrors);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || createWorkInitiation.isPending) return;

    const nextValidationErrors = validateWorkInitiationForm({
      title,
      workCategory,
      otherWorkCategory,
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
    if (
      workCategory === "Incident/Hazard" &&
      relatedIncidentId &&
      !selectedIncident
    ) {
      nextValidationErrors.relatedIncidentId =
        "Select an eligible incident/hazard request.";
    }
    setValidationErrors(nextValidationErrors);

    const firstInvalidField = getFirstInvalidField(
      nextValidationErrors,
      workInitiationFieldOrder,
    );
    if (firstInvalidField) {
      scrollToValidationField(
        getWorkInitiationFieldRef(firstInvalidField, {
          titleRef,
          workCategoryRef,
          otherWorkCategoryRef,
          relatedIncidentIdRef,
          workTypesRef,
          locationsRef,
          workDescriptionRef,
          reasonForWorkRef,
          assignedDepartmentRef,
          assignedSupervisorRef,
          assignedWorkersRef,
          contractorsNeededRef,
          selectedContractorRef,
          plannedStartDateTimeRef,
          plannedEndDateTimeRef,
        }),
      );
      return;
    }

    const payload: WorkInitiationCreate = {
      title,
      work_category: toWorkInitiationCategory(workCategory),
      other_work_category:
        workCategory === "Other" ? emptyToNull(otherWorkCategory) : null,
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
      planned_start_at: toApiDateTime(plannedStartDateTime),
      planned_end_at: toApiDateTime(plannedEndDateTime),
      materials_required: emptyToNull(materialsRequired),
    };

    try {
      setIsSubmitting(true);

      await createWorkInitiation.mutateAsync({
        payload,
        attachments: files,
      });

      toast.success("Work initiation request submitted successfully.");

      router.push("/safety/work-initiation");
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
      <SafetyValidationSummary
        errors={validationErrors}
        fieldOrder={workInitiationFieldOrder}
      />

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

          {recommendedIncidentsQuery.isLoading && isIncidentLinkedFromQuery ? (
            <div className="rounded-lg border border-brand-border bg-gray-50 px-4 py-3 text-sm text-brand-text-secondary md:col-span-2">
              Loading linked incident details...
            </div>
          ) : null}

          {recommendedIncidentsQuery.isError && isIncidentLinkedFromQuery ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
              Could not load eligible incident report context. Please select an
              eligible incident manually.
            </div>
          ) : null}

          <FormInput
            ref={titleRef}
            label="Work Title"
            required
            placeholder="Enter work title"
            value={title}
            error={validationErrors.title}
            onChange={(event) => {
              setTitle(event.target.value);
              clearValidationError("title", setValidationErrors);
            }}
          />

          <FormSelect
            ref={workCategoryRef}
            label="Work Category"
            required
            options={categoryOptions}
            placeholder="Select work category"
            value={workCategory}
            error={validationErrors.workCategory}
            onValueChange={handleWorkCategoryChange}
            disabled={isIncidentLinkedFromQuery}
          />

          {workCategory === "Other" ? (
            <FormInput
              ref={otherWorkCategoryRef}
              label="Specify Work Category"
              required
              maxLength={255}
              placeholder="Enter the work category"
              value={otherWorkCategory}
              error={validationErrors.otherWorkCategory}
              onChange={(event) => {
                setOtherWorkCategory(event.target.value);
                clearValidationError("otherWorkCategory", setValidationErrors);
              }}
            />
          ) : null}

          {workCategory === "Incident/Hazard" ? (
            <>
              {isIncidentLinkedFromQuery ? (
                <FormInput
                  ref={relatedIncidentIdRef}
                  label="Related Incident/Hazard Request"
                  required
                  value={
                    selectedIncident
                      ? selectedIncident.reference
                        ? `${selectedIncident.reference} - ${
                            selectedIncident.title || selectedIncident.reportType
                          }`
                        : selectedIncident.title || selectedIncident.reportType
                      : "Reference pending"
                  }
                  error={validationErrors.relatedIncidentId}
                  disabled
                />
              ) : (
                <FormSelect
                  ref={relatedIncidentIdRef}
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
                  error={validationErrors.relatedIncidentId}
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
            ref={workTypesRef}
            label="Work Type"
            required
            searchable
            creatable
            options={workTypeOptions}
            value={workTypes}
            error={validationErrors.workTypes}
            onValueChange={(value) => {
              setWorkTypes(value);
              clearValidationError("workTypes", setValidationErrors);
            }}
            placeholder={
              workCategory
                ? "Select or add work type"
                : "Select work category first"
            }
            disabled={!workCategory}
          />

          <FormMultiSelect
            ref={locationsRef}
            label="Location"
            required
            searchable
            creatable
            options={locationOptions}
            placeholder="Select or add location"
            value={locations}
            error={validationErrors.locations}
            onValueChange={(value) => {
              setLocations(value);
              clearValidationError("locations", setValidationErrors);
            }}
          />

          <FormTextarea
            label="Exact Work Area"
            placeholder="Enter exact work area"
            value={exactWorkArea}
            onChange={(event) => setExactWorkArea(event.target.value)}
          />

          <FormTextarea
            ref={workDescriptionRef}
            label="Work Description"
            required
            placeholder="Describe what needs to be done"
            className="md:col-span-2"
            value={workDescription}
            error={validationErrors.workDescription}
            onChange={(event) => {
              setWorkDescription(event.target.value);
              clearValidationError("workDescription", setValidationErrors);
            }}
          />

          <FormTextarea
            ref={reasonForWorkRef}
            label="Reason for Work"
            required
            placeholder="Explain why the work is needed"
            className="md:col-span-2"
            value={reasonForWork}
            error={validationErrors.reasonForWork}
            onChange={(event) => {
              setReasonForWork(event.target.value);
              clearValidationError("reasonForWork", setValidationErrors);
            }}
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
            ref={assignedDepartmentRef}
            label="Assigned Department / Team"
            required
            options={departmentTeamOptions}
            placeholder={
              departmentsQuery.isLoading
                ? "Loading departments..."
                : "Select department or team"
            }
            value={assignedDepartment}
            error={validationErrors.assignedDepartment}
            onValueChange={(value) => {
              setAssignedDepartment(value);
              setAssignedSupervisor("");
              setAssignedWorkers([]);
              clearValidationError("assignedDepartment", setValidationErrors);
              clearValidationError("assignedSupervisor", setValidationErrors);
              clearValidationError("assignedWorkers", setValidationErrors);
            }}
          />

          <FormSelect
            ref={assignedSupervisorRef}
            label="Assigned Supervisor"
            required
            searchable
            options={employeeOptions}
            placeholder={
              !assignedDepartment
                ? "Select a department first"
                : departmentEmployeesQuery.isLoading
                ? "Loading employees..."
                : "Select supervisor"
            }
            value={assignedSupervisor}
            error={validationErrors.assignedSupervisor}
            onValueChange={(value) => {
              setAssignedSupervisor(value);
              clearValidationError("assignedSupervisor", setValidationErrors);
            }}
            disabled={!assignedDepartment || departmentEmployeesQuery.isLoading}
          />

          <FormMultiSelect
            ref={assignedWorkersRef}
            label="Assigned Workers"
            required
            searchable
            options={employeeOptions}
            placeholder={
              !assignedDepartment
                ? "Select a department first"
                : departmentEmployeesQuery.isLoading
                ? "Loading employees..."
                : "Select workers"
            }
            value={assignedWorkers}
            error={validationErrors.assignedWorkers}
            onValueChange={(value) => {
              setAssignedWorkers(value);
              clearValidationError("assignedWorkers", setValidationErrors);
            }}
            disabled={!assignedDepartment || departmentEmployeesQuery.isLoading}
          />

          <FormSelect
            ref={contractorsNeededRef}
            label="Contractors Needed?"
            required
            options={yesNoOptions}
            placeholder="Select an option"
            value={contractorsNeeded}
            error={validationErrors.contractorsNeeded}
            onValueChange={handleContractorsNeededChange}
          />

          {contractorsNeeded === "Yes" ? (
            <>
              <FormSelect
                ref={selectedContractorRef}
                label="Selected Contractor"
                required
                searchable
                creatable
                options={contractorOptions}
                placeholder="Select contractor"
                value={selectedContractor}
                error={validationErrors.selectedContractor}
                onValueChange={(value) => {
                  setSelectedContractor(value);
                  clearValidationError("selectedContractor", setValidationErrors);
                }}
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
            ref={plannedStartDateTimeRef}
            label="Planned Start Date/Time"
            required
            min={getEarliestPlannedStartDateTime()}
            value={plannedStartDateTime}
            error={validationErrors.plannedStartDateTime}
            onValueChange={(value) => {
              setPlannedStartDateTime(value);
              clearValidationError("plannedStartDateTime", setValidationErrors);
            }}
          />

          <FormDateTimeInput
            ref={plannedEndDateTimeRef}
            label="Planned End Date/Time"
            required
            min={
              plannedStartDateTime
                ? getDateTimeAfter(plannedStartDateTime, MIN_SCHEDULE_DURATION_MINUTES)
                : getEarliestPlannedStartDateTime()
            }
            value={plannedEndDateTime}
            error={validationErrors.plannedEndDateTime}
            onValueChange={(value) => {
              setPlannedEndDateTime(value);
              clearValidationError("plannedEndDateTime", setValidationErrors);
            }}
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
        <Button
          type="submit"
          loading={isSubmitting || createWorkInitiation.isPending}
          loadingText="Submitting..."
        >
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
            {incident.reference
              ? `${incident.reference} - ${incident.title}`
              : incident.title}
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
  otherWorkCategory,
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
  otherWorkCategory: string;
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
}): ValidationErrors<WorkInitiationValidationField> {
  const errors: ValidationErrors<WorkInitiationValidationField> = {};

  if (title.trim().length < 3) errors.title = "Enter a work title.";
  if (!workCategory) errors.workCategory = "Select work category.";
  if (workCategory === "Other" && !otherWorkCategory.trim()) {
    errors.otherWorkCategory = "Specify the work category.";
  }

  if (workCategory === "Incident/Hazard" && !relatedIncidentId) {
    errors.relatedIncidentId = "Select the related incident/hazard request.";
  }

  if (workTypes.length === 0) errors.workTypes = "Select at least one work type.";
  if (locations.length === 0) errors.locations = "Select at least one location.";
  if (workDescription.trim().length < 5) {
    errors.workDescription = "Work description must be at least 5 characters.";
  }
  if (reasonForWork.trim().length < 3) {
    errors.reasonForWork = "Enter the reason for work.";
  }
  if (!assignedDepartment) errors.assignedDepartment = "Select assigned department.";
  if (!assignedSupervisor) errors.assignedSupervisor = "Select assigned supervisor.";
  if (assignedWorkers.length === 0) {
    errors.assignedWorkers = "Select at least one assigned worker.";
  }
  if (!contractorsNeeded) {
    errors.contractorsNeeded = "Select whether contractors are needed.";
  }

  if (contractorsNeeded === "Yes" && !selectedContractor) {
    errors.selectedContractor = "Select contractor.";
  }

  if (!plannedStartDateTime) {
    errors.plannedStartDateTime = "Select planned start date/time.";
  }
  if (!plannedEndDateTime) {
    errors.plannedEndDateTime = "Select planned end date/time.";
  }

  const now = new Date();
  const minimumStartTime = new Date(now.getTime() + 10 * 60 * 1000);

  const plannedStart = new Date(plannedStartDateTime);
  const plannedEnd = new Date(plannedEndDateTime);

  if (plannedStartDateTime && Number.isNaN(plannedStart.getTime())) {
    errors.plannedStartDateTime = "Select a valid planned start date/time.";
  }

  if (plannedEndDateTime && Number.isNaN(plannedEnd.getTime())) {
    errors.plannedEndDateTime = "Select a valid planned end date/time.";
  }

  if (plannedStartDateTime && !errors.plannedStartDateTime && plannedStart < minimumStartTime) {
    errors.plannedStartDateTime = "Planned start date/time must be at least 10 minutes from now.";
  }

  if (plannedEndDateTime && !errors.plannedEndDateTime && plannedEnd < now) {
    errors.plannedEndDateTime = "Planned end date/time cannot be in the past.";
  }

  const minimumEndTime = new Date(
    plannedStart.getTime() + MIN_SCHEDULE_DURATION_MINUTES * 60 * 1000,
  );
  if (
    plannedStartDateTime &&
    plannedEndDateTime &&
    !errors.plannedStartDateTime &&
    !errors.plannedEndDateTime &&
    plannedEnd < minimumEndTime
  ) {
    errors.plannedEndDateTime = `Planned end date/time must be at least ${MIN_SCHEDULE_DURATION_MINUTES} minutes after planned start date/time.`;
  }

  return errors;
}

function getWorkInitiationFieldRef(
  field: WorkInitiationValidationField,
  refs: Record<`${WorkInitiationValidationField}Ref`, ValidationRef>,
) {
  return refs[`${field}Ref`];
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
