export type ApprovalStatus =
  | "draft"
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "returned";

export type StepType = "individual" | "group";
export type GroupRule = "any_one" | "all_must";
export type DecisionStatus = "pending" | "approved" | "rejected" | "returned";

export interface StepAssignee {
  id: string;
  step_id: string;
  user_id: string;
  user_name?: string;
  decision: DecisionStatus;
  decided_at: string | null;
  comment: string | null;
}

export interface ApprovalStep {
  id: string;
  request_id: string;
  step_number: number;
  step_type: StepType;
  group_rule: GroupRule | null;
  status: ApprovalStatus;
  completed_at: string | null;
  assignees: StepAssignee[];
}

export interface ApprovalHistory {
  id: string;
  request_id: string;
  action: string;
  actor_id: string;
  actor_name?: string;
  step_number: number | null;
  comment: string | null;
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  workflow_type: string;
  reference_id: string;
  reference_label: string;
  status: ApprovalStatus;
  current_step: number;
  total_steps: number;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  steps?: ApprovalStep[];
  history?: ApprovalHistory[];
}
