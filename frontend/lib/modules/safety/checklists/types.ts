export type SafetyChecklistParentType =
  | "work_authorization"
  | "work_closeout"
  | "closeout_review"
  | "incident_hse_review"
  | "work_initiation"
  | "incident_report";

export type SafetyChecklistStage =
  | "risk_assessment"
  | "inspection"
  | "monitoring"
  | "hse_review"
  | "completion"
  | "closeout_review";

export type SafetyChecklistInputType =
  | "boolean"
  | "enum"
  | "text"
  | "number"
  | "date"
  | "datetime";

export interface SafetyChecklistOption {
  value: string;
  label: string;
}

export interface SafetyChecklistItem {
  id: string;
  item_key: string;
  label: string;
  input_type: SafetyChecklistInputType;
  options_json?: SafetyChecklistOption[] | string[] | null;
  default_value?: string | null;
  is_required: boolean;
  severity_weight?: number | null;
  sort_order: number;
}

export interface SafetyChecklistTemplate {
  id: string;
  code: string;
  name: string;
  parent_type: SafetyChecklistParentType;
  stage: SafetyChecklistStage;
  version: number;
  description?: string | null;
  items: SafetyChecklistItem[];
}

export interface SafetyChecklistAnswerCreate {
  item_id: string;
  value_boolean?: boolean | null;
  value_text?: string | null;
  value_number?: number | string | null;
  value_date?: string | null;
  value_datetime?: string | null;
  selected_option?: string | null;
  comment?: string | null;
}

export interface SafetyChecklistResponsesCreate {
  parent_type: SafetyChecklistParentType;
  parent_id: string;
  response_group_id?: string | null;
  answers: SafetyChecklistAnswerCreate[];
}

export interface SafetyChecklistResponse {
  id: string;
  template_id: string;
  template_code_snapshot: string;
  template_name_snapshot: string;
  template_version: number;
  stage_snapshot: string;
  item_id: string;
  item_key_snapshot: string;
  label_snapshot: string;
  input_type_snapshot: string;
  options_json_snapshot?: SafetyChecklistOption[] | string[] | null;
  is_required_snapshot: boolean;
  sort_order_snapshot: number;
  parent_type: SafetyChecklistParentType;
  parent_id: string;
  response_group_id?: string | null;
  value_boolean?: boolean | null;
  value_text?: string | null;
  value_number?: string | null;
  value_date?: string | null;
  value_datetime?: string | null;
  selected_option?: string | null;
  comment?: string | null;
  answered_by: string;
  answered_at: string;
}
