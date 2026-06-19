"use client";

import { Truck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import PickerModal from "@/components/ui/PickerModal";
import Badge from "@/components/ui/Badge";
import type { Vehicle } from "@/lib/modules/fleet/types/vehicle.types";
import type { BadgeVariant } from "@/config/badge.config";

interface VehiclePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (vehicle: Vehicle) => void;
  vehicles: Vehicle[];
  selectedVehicleId?: string;
}

const VEHICLE_STATUS_VARIANT: Record<Vehicle["status"], BadgeVariant> = {
  available:   "success",
  assigned:    "warning",
  in_transit:  "info",
  maintenance: "orange",
  inactive:    "neutral",
};

const VEHICLE_STATUS_LABEL: Record<Vehicle["status"], string> = {
  available:   "Available",
  assigned:    "Assigned",
  in_transit:  "In Transit",
  maintenance: "Maintenance",
  inactive:    "Inactive",
};

const VEHICLE_TYPE_LABEL: Record<Vehicle["type"], string> = {
  lpg_tanker:     "LPG Tanker",
  delivery_van:   "Delivery Van",
  service_truck:  "Service Truck",
  emergency_unit: "Emergency Unit",
};

function VehicleCard({
  vehicle,
  isSelected,
}: {
  vehicle: Vehicle;
  isSelected: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden border border-brand-border bg-gray-50 shrink-0 flex items-center justify-center">
        {vehicle.image ? (
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Truck size={22} className="text-gray-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-medium truncate",
            isSelected ? "text-brand-purple" : "text-brand-text-primary"
          )}>
            {vehicle.name}
          </p>
          {isSelected && (
            <span className="shrink-0 text-xs text-brand-purple font-medium">
              Selected
            </span>
          )}
        </div>
        <p className="text-xs text-brand-text-secondary mt-0.5">
          {vehicle.plate_number} · {VEHICLE_TYPE_LABEL[vehicle.type]} · {vehicle.make} {vehicle.model} {vehicle.year}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <Badge
            variant={VEHICLE_STATUS_VARIANT[vehicle.status]}
            label={VEHICLE_STATUS_LABEL[vehicle.status]}
          />
          {vehicle.capacity && (
            <span className="text-xs text-brand-text-secondary">
              {vehicle.capacity.toLocaleString()} kg capacity
            </span>
          )}
        </div>
      </div>

      {/* Check */}
      <div className={cn(
        "w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 transition-colors",
        isSelected ? "bg-brand-purple border-brand-purple" : "border-brand-border"
      )}>
        {isSelected && <Check size={12} className="text-white" />}
      </div>
    </div>
  );
}

export default function VehiclePickerModal({
  open, onClose, onSelect,
  vehicles, selectedVehicleId,
}: VehiclePickerModalProps) {
  return (
    <PickerModal<Vehicle>
      open={open}
      onClose={onClose}
      onSelect={onSelect}
      items={vehicles}
      selectedIds={selectedVehicleId ? [selectedVehicleId] : []}
      title="Select Vehicle"
      subtitle={`${vehicles.length} available vehicle${vehicles.length !== 1 ? "s" : ""}`}
      searchPlaceholder="Search by name, plate number, or type…"
      searchKeys={(v) => [v.name, v.plate_number, v.make, v.model, v.type]}
      getKey={(v) => v.id}
      emptyIcon={<Truck size={32} />}
      emptyMessage="No available vehicles"
      renderCard={(vehicle, isSelected) => (
        <VehicleCard vehicle={vehicle} isSelected={isSelected} />
      )}
    />
  );
}