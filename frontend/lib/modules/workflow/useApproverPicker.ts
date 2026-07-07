"use client";

/**
 * useApproverPicker — reusable hook for workflow-driven Approvers sections.
 *
 * Drop this into ANY request form that may have requester_pick workflow steps.
 * It handles:
 *   - Fetching the active workflow for the given requestType
 *   - Filtering to only requester_pick steps (auto-resolved steps are invisible)
 *   - Loading the full employee list (only when there are open/ungrouped picks)
 *   - Pre-filling picks from the previous attempt when requestId is supplied
 *   - Managing pickedApprovers state
 *   - Validation before submit
 *   - Producing the picksPayload ready to send to the backend
 *
 * Usage in any form:
 *
 *   const approverPicker = useApproverPicker("procurement");          // new request
 *   const approverPicker = useApproverPicker("procurement", editId);  // resubmit
 *
 *   // In onSubmit:
 *   const err = approverPicker.validate();
 *   if (err) { toast.error(err); return; }
 *   payload.picked_approvers = approverPicker.picksPayload;
 *
 *   // In JSX (place before the submit button):
 *   <WorkflowApproversSection {...approverPicker} />
 */

import { useState, useEffect } from "react";
import type { PickedEmployee } from "@/components/ui/EmployeePicker";
import { useWorkflowForType, useRequesterPicks } from "./queries";
import type { WorkflowForTypeStep } from "./queries";
import { useEmployees } from "@/lib/modules/employees/hooks";

export interface ApproverPickerResult {
  /** Steps the requester must pick an approver for. Empty = no section needed. */
  requesterPickSteps: WorkflowForTypeStep[];
  /** Current picks keyed by step_number */
  pickedApprovers:    Record<number, PickedEmployee>;
  setPickedApprovers: React.Dispatch<React.SetStateAction<Record<number, PickedEmployee>>>;
  /** Full employee list for open (ungrouped) requester_pick steps */
  allEmployees:       PickedEmployee[];
  /** Returns an error message if any required pick is missing, otherwise null */
  validate:           () => string | null;
  /** Ready-to-send payload: { "<step_number>": "employee_id" } */
  picksPayload:       Record<string, string>;
  /** True while workflow or previous-picks data is loading */
  isLoading:          boolean;
}

export function useApproverPicker(
  requestType: string,
  requestId?: string,
): ApproverPickerResult {
  const [pickedApprovers, setPickedApprovers] = useState<Record<number, PickedEmployee>>({});

  const { data: workflowForType, isLoading: wfLoading }    = useWorkflowForType(requestType);
  const { data: previousPicks,   isLoading: picksLoading } = useRequesterPicks(requestType, requestId);
  const { data: allEmployeeList = [] }                      = useEmployees();

  const requesterPickSteps = (workflowForType?.steps ?? []).filter(
    (s) => s.assignee_type === "requester_pick",
  );

  // Only load all employees when at least one step has no group restriction
  const hasOpenPick = requesterPickSteps.some((s) => !s.group_id);
  const allEmployees: PickedEmployee[] = hasOpenPick
    ? allEmployeeList.map((e) => ({
        id:         e.id,
        name:       [e.user?.first_name, e.user?.last_name].filter(Boolean).join(" ") || "Unknown",
        role:       e.job_title ?? e.user?.role ?? "",
        department: e.department ?? "",
        avatar_url: e.user?.profile_picture_url,
      }))
    : [];

  // Pre-fill from the previous attempt (only if pickedApprovers is still empty,
  // so we don't overwrite anything the user has already changed).
  useEffect(() => {
    if (!previousPicks || Object.keys(previousPicks).length === 0) return;
    setPickedApprovers((prev) => {
      if (Object.keys(prev).length > 0) return prev; // user already changed something
      const prefilled: Record<number, PickedEmployee> = {};
      for (const [stepNumStr, pick] of Object.entries(previousPicks)) {
        prefilled[parseInt(stepNumStr, 10)] = {
          id:         pick.employee_id,
          name:       pick.name,
          role:       pick.job_title ?? "",
          department: pick.department ?? "",
        };
      }
      return prefilled;
    });
  }, [previousPicks]);

  function validate(): string | null {
    for (const step of requesterPickSteps) {
      if (!pickedApprovers[step.step_number]) {
        return `Please select an approver for: ${step.step_name}`;
      }
    }
    return null;
  }

  const picksPayload = Object.fromEntries(
    Object.entries(pickedApprovers).map(([k, v]) => [k, v.id]),
  );

  return {
    requesterPickSteps,
    pickedApprovers,
    setPickedApprovers,
    allEmployees,
    validate,
    picksPayload,
    isLoading: wfLoading || (!!requestId && picksLoading),
  };
}
