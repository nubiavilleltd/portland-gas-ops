import { DeliveryStatus } from "../types/dispatch.types";

export const DRIVER_OPTIONS = [
  { value: "musa", label: "Musa Abdullahi" },
  { value: "john", label: "John Okafor" },
  { value: "ibrahim", label: "Ibrahim Bello" },
];

export const VEHICLE_OPTIONS = [
  { value: "trk-001", label: "LNG-TRK-001" },
  { value: "trk-002", label: "LNG-TRK-002" },
  { value: "trk-003", label: "LNG-TRK-003" },
];

export const STATUS_CONFIG: Record<
  DeliveryStatus,
  {
    label: string;
    badgeStatus: "pending" | "approved" | "rejected" | "in_progress" | "draft";
  }
> = {
  assigned: { label: "Assigned", badgeStatus: "pending" },
  in_transit: { label: "In Transit", badgeStatus: "in_progress" },
  delivered: { label: "Delivered", badgeStatus: "approved" },
  failed: { label: "Failed Delivery", badgeStatus: "rejected" },
};