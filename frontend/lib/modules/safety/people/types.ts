export interface SafetyActor {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  job_title?: string | null;
}

export interface SafetyEmployeeProfile {
  id: string;
  user_id: string;
  employee_no: string;
  job_title?: string | null;
  department?: string | null;
  user?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    role: string;
    profile_picture_url?: string | null;
  } | null;
}

export interface SafetyActorListParams {
  department?: string;
  search?: string;
}

export interface SafetyDepartment {
  value: string;
  label: string;
  employee_count: number;
}
