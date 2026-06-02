import ApprovalBadge from "@/components/ui/ApprovalBadge";

export function FleetVehicleStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    available: "available",
    maintenance: "maintenance",
    retired: "retired",
    assigned: "assigned",
    in_transit: "in_transit",
  };

  return <ApprovalBadge status={map[status] || "retired"} />;
}