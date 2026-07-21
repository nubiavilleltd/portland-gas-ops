"use client";

import { Package } from "lucide-react";
import PickerModal from "./PickerModal";
import type { AssetType } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: AssetType) => void;
  /** All available asset types to display */
  items: AssetType[];
  /** Map of type id → available count */
  availability: Record<string, number>;
  /** Currently selected type id (for highlight) */
  selectedId?: string;
}

function AssetTypeCard({
  type,
  availability,
  isSelected,
}: {
  type: AssetType;
  availability: number;
  isSelected: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Icon */}
      <div className="h-9 w-9 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0">
        <Package size={16} className="text-brand-purple" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-text-primary truncate">{type.name}</p>
        <p className="text-xs text-brand-text-secondary mt-0.5">
          <span
            className={[
              "inline-flex items-center gap-1 font-medium",
              availability > 0 ? "text-green-600" : "text-red-500",
            ].join(" ")}
          >
            {availability} {availability === 1 ? "unit" : "units"} available
          </span>
        </p>
      </div>

      {/* Selection indicator */}
      <div
        className={[
          "h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
          isSelected
            ? "border-brand-purple bg-brand-purple"
            : "border-gray-300 bg-white",
        ].join(" ")}
      >
        {isSelected && (
          <div className="h-2 w-2 rounded-full bg-white" />
        )}
      </div>
    </div>
  );
}

export default function AssetTypePickerModal({
  open,
  onClose,
  onSelect,
  items,
  availability,
  selectedId,
}: Props) {
  return (
    <PickerModal<AssetType>
      open={open}
      onClose={onClose}
      onSelect={onSelect}
      items={items}
      title="Select Asset Type"
      subtitle="Choose the type of asset you need"
      searchPlaceholder="Search asset types…"
      searchKeys={(t) => [t.name, t.prefix]}
      getKey={(t) => t.id}
      selectedIds={selectedId ? [selectedId] : []}
      emptyIcon={<Package size={32} />}
      emptyMessage="No asset types available"
      renderCard={(type, isSelected) => (
        <AssetTypeCard
          type={type}
          availability={availability[type.id] ?? 0}
          isSelected={isSelected}
        />
      )}
    />
  );
}
