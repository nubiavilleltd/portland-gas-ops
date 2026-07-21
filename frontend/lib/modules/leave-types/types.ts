export type LeaveTypeListItem = {
  id: number;
  leave_type_name: string;
  entitlement_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string; // ISO datetime
};

export type LeaveTypeDetail = LeaveTypeListItem & {
  updated_at: string;
};

export type LeaveTypePayload = {
  leave_type_name?: string;
  entitlement_days?: number;
  description?: string | null;
  is_active?: boolean;
};

export type LeaveTypeCreatePayload = {
  leave_type_name: string;
  entitlement_days: number;
  description?: string;
  is_active: boolean;
};

export type LeaveTypeListResponse = {
  data: LeaveTypeListItem[];
  total: number;
  skip: number;
  limit: number;
};
