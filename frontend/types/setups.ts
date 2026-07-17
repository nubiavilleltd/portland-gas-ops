// ── Setups — Departments ───────────────────────────────────────────────────────

export interface DepartmentListItem {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  hod_id: string | null;
  hod_name: string | null;
  parent_dept_id: string | null;
  created_at: string;
  employee_count: number;
}

// ── Setups — Groups ────────────────────────────────────────────────────────────

export interface GroupMember {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_no: string;
  job_title: string | null;
  department: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  is_active: boolean;
  created_at: string;
  members: GroupMember[];
}

export interface GroupListItem {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  is_active: boolean;
  member_count: number;
  created_at: string;
}
