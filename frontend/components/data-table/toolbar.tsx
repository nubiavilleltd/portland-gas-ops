"use client";

import { Search, Plus, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";

const STATUS_OPTIONS = [
  { value: "",            label: "All Statuses" },
  { value: "pending",     label: "Pending" },
  { value: "approved",    label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "draft",       label: "Draft" },
  { value: "rejected",    label: "Rejected" },
];

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onNewRequest: () => void;
  newRequestLabel?: string;
  hideStatusFilter?: boolean;
}

export default function Toolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onNewRequest,
  newRequestLabel = "New Request",
  hideStatusFilter = false,
}: ToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1 min-w-0">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-10 pl-9 pr-4 text-sm border border-brand-border rounded-lg bg-white text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
        />
      </div>

      {!hideStatusFilter && (
        <div className="relative shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-10 pl-3 pr-8 text-sm border border-brand-border rounded-lg bg-white text-brand-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent cursor-pointer transition"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none"
          />
        </div>
      )}

      {newRequestLabel && (
        <Button leftIcon={<Plus size={16} />} onClick={onNewRequest} className="shrink-0">
          {newRequestLabel}
        </Button>
      )}
    </div>
  );
}
