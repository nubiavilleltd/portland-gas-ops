"use client";

import { User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import PickerModal from "@/components/ui/PickerModal";
import Badge from "@/components/ui/Badge";
import type { Driver } from "@/lib/modules/fleet/types/driver.types";
import type { BadgeVariant } from "@/config/badge.config";
import { formatDate } from "@/lib/utils";

interface DriverPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (driver: Driver) => void;
  drivers: Driver[];
  selectedDriverId?: string;
}

const DRIVER_STATUS_VARIANT: Record<Driver["status"], BadgeVariant> = {
  available:  "success",
  assigned:   "warning",
  in_transit: "info",
  off_duty:   "neutral",
  suspended:  "danger",
};

const DRIVER_STATUS_LABEL: Record<Driver["status"], string> = {
  available:  "Available",
  assigned:   "Assigned",
  in_transit: "In Transit",
  off_duty:   "Off Duty",
  suspended:  "Suspended",
};

function DriverCard({
  driver,
  isSelected,
}: {
  driver: Driver;
  isSelected: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Photo */}
      <div className="w-14 h-14 rounded-full overflow-hidden border border-brand-border bg-gray-50 shrink-0 flex items-center justify-center">
        {driver.profile_image ? (
          <img
            src={driver.profile_image}
            alt={driver.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User size={22} className="text-gray-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-medium truncate",
            isSelected ? "text-brand-purple" : "text-brand-text-primary"
          )}>
            {driver.full_name}
          </p>
          {isSelected && (
            <span className="shrink-0 text-xs text-brand-purple font-medium">
              Selected
            </span>
          )}
        </div>
        <p className="text-xs text-brand-text-secondary mt-0.5">
          {driver.license_number} · {driver.experience_years} yrs experience
        </p>
        <div className="flex items-center gap-3 mt-1">
          <Badge
            variant={DRIVER_STATUS_VARIANT[driver.status]}
            label={DRIVER_STATUS_LABEL[driver.status]}
          />
          <span className="text-xs text-brand-text-secondary">
            Licence expires {formatDate(driver.license_expiry_date)}
          </span>
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

export default function DriverPickerModal({
  open, onClose, onSelect,
  drivers, selectedDriverId,
}: DriverPickerModalProps) {
  return (
    <PickerModal<Driver>
      open={open}
      onClose={onClose}
      onSelect={onSelect}
      items={drivers}
      selectedIds={selectedDriverId ? [selectedDriverId] : []}
      title="Select Driver"
      subtitle={`${drivers.length} available driver${drivers.length !== 1 ? "s" : ""}`}
      searchPlaceholder="Search by name or licence number…"
      searchKeys={(d) => [d.full_name, d.license_number, d.phone_number]}
      getKey={(d) => d.id}
      emptyIcon={<User size={32} />}
      emptyMessage="No available drivers"
      renderCard={(driver, isSelected) => (
        <DriverCard driver={driver} isSelected={isSelected} />
      )}
    />
  );
}