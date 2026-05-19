import ApprovalBadge from "@/components/ui/ApprovalBadge";

export function FleetVehicleStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    available: "available",
    in_use: "in_use",
    maintenance: "maintenance",
    retired: "retired",
    assigned: "in_use",
    in_transit: "in_use",
  };

  return <ApprovalBadge status={map[status] || "retired"} />;
}