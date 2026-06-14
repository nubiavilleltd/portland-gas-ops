"use client";

import { Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import PickerModal from "@/components/ui/PickerModal";
import Badge from "@/components/ui/Badge";
import type { InventoryItem } from "@/lib/modules/inventory/types/inventory.types";
import type { BadgeVariant } from "@/config/badge.config";

interface InventoryUnitPickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (itemIds: string[]) => void;
  items: InventoryItem[];
  selectedIds: string[];
  productName: string;
  required: number;
}

const CONDITION_VARIANT: Record<InventoryItem["condition"], BadgeVariant> = {
  new:         "success",
  refurbished: "info",
  used:        "neutral",
  damaged:     "danger",
};

function InventoryUnitCard({
  item,
  isSelected,
}: {
  item: InventoryItem;
  isSelected: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Check indicator */}
      <div className={cn(
        "w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
        isSelected
          ? "bg-brand-purple border-brand-purple"
          : "border-brand-border"
      )}>
        {isSelected && <Check size={11} className="text-white" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-mono font-medium",
          isSelected ? "text-brand-purple" : "text-brand-text-primary"
        )}>
          {item.tag_number}
        </p>
        {item.serial_number && (
          <p className="text-xs text-brand-text-secondary mt-0.5">
            SN: {item.serial_number}
          </p>
        )}
      </div>

      {/* Condition badge */}
      <Badge
        variant={CONDITION_VARIANT[item.condition]}
        label={item.condition}
      />
    </div>
  );
}

export default function InventoryUnitPickerModal({
  open,
  onClose,
  onConfirm,
  items,
  selectedIds,
  productName,
  required,
}: InventoryUnitPickerModalProps) {
  return (
    <PickerModal<InventoryItem>
      open={open}
      onClose={onClose}
      multiSelect
      selectedIds={selectedIds}
      onConfirm={onConfirm}
      maxSelect={required}
      items={items}
      title={`Select ${productName}`}
      subtitle={`Select exactly ${required} unit${required !== 1 ? "s" : ""} to assign`}
      searchPlaceholder="Search by tag number or serial…"
      searchKeys={(item) => [item.tag_number, item.serial_number ?? ""]}
      getKey={(item) => item.id}
      emptyIcon={<Package size={32} />}
      emptyMessage="No available units in stock"
      renderCard={(item, isSelected) => (
        <InventoryUnitCard item={item} isSelected={isSelected} />
      )}
    />
  );
}