export interface SafetyDashboardMetrics {
  pending_hse_requests: number;
  clean_close_outs: number;
  unsuccessful_close_outs: number;
  works_with_hazards: number;
  end_to_end_compliance_rate: number;
  compliant_close_outs: number;
  approved_close_outs: number;
}

export interface SafetyDashboardQueueItem {
  id: string;
  reference: string;
  type: string;
  title: string;
  location: string;
  href: string;
  detail: string;
  sort_score: number;
  submitted_at?: string | null;
}

export interface SafetyDashboardTrendRow {
  label: string;
  value: number;
}

export interface SafetyDashboardAttention {
  gas_fire_environmental_concerns: number;
  open_corrective_actions: number;
  approved_close_outs_reviewed: number;
}

export interface SafetyDashboardOngoingWorkItem {
  id: string;
  reference: string;
  title: string;
  location: string;
  exact_work_area?: string | null;
  supervisor?: string | null;
  assigned_workers: string[];
  requester?: string | null;
  current_stage: string;
  status: string;
  href: string;
  planned_start_at?: string | null;
  planned_end_at?: string | null;
  updated_at?: string | null;
}

export interface SafetyDashboardResponse {
  metrics: SafetyDashboardMetrics;
  pending_hse_queue: SafetyDashboardQueueItem[];
  top_hazard_types: SafetyDashboardTrendRow[];
  top_hazard_locations: SafetyDashboardTrendRow[];
  safety_attention: SafetyDashboardAttention;
  ongoing_work: SafetyDashboardOngoingWorkItem[];
}
