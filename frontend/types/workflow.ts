// ── Workflow Engine Types ──────────────────────────────────────────────────────

export type AssigneeType =
  | "role"
  | "specific"
  | "requester_pick"
  | "requester_operations_manager"
  | "requester_hod"
  | "requester_skip_level";

export type ApprovalOverallStatus = "pending" | "approved" | "rejected" | "returned";
export type NotificationType = "approval_required" | "approved" | "rejected" | "returned" | "info";

// ── Workflow Templates ─────────────────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  step_name: string;
  assignee_type: AssigneeType;
  role: string | null;
  employee_id: string | null;
  group_id: string | null;
  can_approve: boolean;
  can_reject: boolean;
  can_return: boolean;
  // resolved display name (from backend join)
  employee_name?: string | null;
  group_name?: string | null;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  reset_on_return: boolean;
  created_at: string;
  steps: WorkflowStep[];
  // how many request_types are currently assigned to this workflow
  assignment_count?: number;
}

export interface ApprovalWorkflowListItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  step_count: number;
  assignment_count: number;
  created_at: string;
}

// ── Workflow Assignments ───────────────────────────────────────────────────────

export interface WorkflowAssignment {
  id: string;
  request_type: string;
  workflow_id: string;
  workflow_name: string;
  is_active: boolean;
  updated_at: string;
}

// ── Notifications ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}
