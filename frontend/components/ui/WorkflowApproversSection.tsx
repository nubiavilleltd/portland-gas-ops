"use client";

/**
 * WorkflowApproversSection
 *
 * Renders the Approvers form section for any request form that has
 * requester_pick workflow steps. Pair with useApproverPicker() hook.
 *
 * Returns null when there are no requester_pick steps — safe to always render.
 *
 * Usage:
 *   const approverPicker = useApproverPicker("procurement", editId);
 *   ...
 *   <WorkflowApproversSection {...approverPicker} />
 */

import FormSection from "@/components/ui/FormSection";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import type { WorkflowForTypeStep } from "@/lib/modules/workflow/queries";

interface Props {
  requesterPickSteps: WorkflowForTypeStep[];
  pickedApprovers:    Record<number, PickedEmployee>;
  setPickedApprovers: React.Dispatch<React.SetStateAction<Record<number, PickedEmployee>>>;
  allEmployees:       PickedEmployee[];
  /** Employee ids to hide from every picker (e.g. the leave's own subject —
   *  you can't be your own reliever). Optional; defaults to none. */
  excludeEmployeeIds?: string[];
}

export default function WorkflowApproversSection({
  requesterPickSteps,
  pickedApprovers,
  setPickedApprovers,
  allEmployees,
  excludeEmployeeIds = [],
}: Props) {
  if (requesterPickSteps.length === 0) return null;

  const excludeSet = new Set(excludeEmployeeIds);

  return (
    <FormSection
      title="Approvers"
      description="This request requires you to select one or more approvers before submitting."
    >
      <div className="space-y-5">
        {requesterPickSteps.map((step) => {
          /**
           * Use step.group_id — not group_members.length — to decide which
           * employee list to show. A group can exist but have 0 members
           * (admin misconfiguration); we still must not fall through to all employees.
           */
          const employees: PickedEmployee[] = (step.group_id
            ? step.group_members.map((m) => ({
                id:         m.id,
                name:       m.name,
                role:       m.job_title ?? "",
                department: m.department ?? "",
                avatar_url: m.avatar_url ?? undefined,
              }))
            : allEmployees
          ).filter((e) => !excludeSet.has(e.id));

          const label = step.step_name;

          const placeholder = step.group_id
            ? `Pick from ${step.group_name ?? "group"}…`
            : "Search all employees…";

          return (
            <div key={step.step_number}>
              <EmployeePicker
                label={label}
                required
                employees={employees}
                value={pickedApprovers[step.step_number] ?? null}
                onChange={(emp) =>
                  setPickedApprovers((prev) => {
                    if (!emp) {
                      const next = { ...prev };
                      delete next[step.step_number];
                      return next;
                    }
                    return { ...prev, [step.step_number]: emp };
                  })
                }
                placeholder={placeholder}
              />

              {/* Edge case: group configured but has no members yet */}
              {step.group_id && step.group_members.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  This group has no members yet — contact your admin.
                </p>
              )}

              {/* Open pick — clarify the requester can pick anyone */}
              {!step.group_id && (
                <p className="text-xs text-brand-text-secondary mt-1">
                  You can select any employee as approver for this step.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}
