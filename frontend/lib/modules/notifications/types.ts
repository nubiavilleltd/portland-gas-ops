export type NotificationType =
  | "approval_required"
  | "approved"
  | "rejected"
  | "returned"
  | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string; // ISO datetime string from backend
}
