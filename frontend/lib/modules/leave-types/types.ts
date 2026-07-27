export type LeaveTypeListItem = {
  id: number;
  leave_type_name: string;
  entitlement_days: number;
  description: string | null;
  is_active: boolean;
  is_uncapped: boolean;   // no entitlement cap (e.g. Sick Leave)
  open_ended: boolean;    // no fixed End Date required
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
  is_uncapped?: boolean;
  open_ended?: boolean;
};

export type LeaveTypeCreatePayload = {
  leave_type_name: string;
  entitlement_days: number;
  description?: string;
  is_active: boolean;
  is_uncapped?: boolean;
  open_ended?: boolean;
};

export type LeaveTypeListResponse = {
  data: LeaveTypeListItem[];
  total: number;
  skip: number;
  limit: number;
};
