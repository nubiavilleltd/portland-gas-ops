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
