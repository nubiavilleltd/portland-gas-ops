export type LeaveTypeListItem = {
  id: number;
  leave_type_name: string;
  entitlement_days: number;
  description: string | null;
  is_active: boolean;
  is_uncapped: boolean;   // no entitlement cap (e.g. Sick Leave)
  open_ended: boolean;    // no fixed End Date required
  notice_days: number;    // min advance-notice window (calendar days); 0 = none
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
  notice_days?: number;
};

export type LeaveTypeCreatePayload = {
  leave_type_name: string;
  entitlement_days: number;
  description?: string;
  is_active: boolean;
  is_uncapped?: boolean;
  open_ended?: boolean;
  notice_days?: number;
};

export type LeaveTypeListResponse = {
  data: LeaveTypeListItem[];
  total: number;
  skip: number;
  limit: number;
};
