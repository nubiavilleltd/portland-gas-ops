"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";

export interface PickedEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar_url?: string | null;
}

interface EmployeePickerProps {
  employees: PickedEmployee[];
  value: PickedEmployee | null;
  onChange: (emp: PickedEmployee | null) => void;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}


export default function EmployeePicker({
  employees,
  value,
  onChange,
  label,
  required,
  error,
  disabled,
  placeholder = "Search by name or department…",
}: EmployeePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? employees.filter(
      (e) =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.department.toLowerCase().includes(query.toLowerCase()) ||
        e.role.toLowerCase().includes(query.toLowerCase())
    )
    : employees;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSelect(emp: PickedEmployee) {
    onChange(emp);
    setOpen(false);
    setQuery("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-brand-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger */}
      {!open ? (
        value ? (
          <div
            className={cn(
              "flex items-center gap-3 h-12 w-full rounded-lg border bg-white px-3 transition-colors",
              error ? "border-red-400" : "border-brand-border",
              disabled
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:border-brand-purple/50"
            )}
            onClick={handleOpen}
          >
            <Avatar name={value.name} src={value.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text-primary leading-tight truncate">{value.name}</p>
              <p className="text-xs text-brand-text-secondary truncate">{value.role} · {value.department}</p>
            </div>
            {disabled ? null : <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded text-brand-text-secondary hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              title="Clear selection"
            >
              <X size={13} />
            </button>}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 h-10 w-full rounded-lg border bg-white px-3 text-left transition-colors",
              error ? "border-red-400" : "border-brand-border",
              disabled
                ? "cursor-not-allowed opacity-60"
                : "hover:border-brand-purple/50"
            )}
          >
            <Search size={14} className="text-brand-text-secondary shrink-0" />
            <span className="text-sm text-brand-text-secondary flex-1">{placeholder}</span>
            <ChevronDown size={14} className="text-brand-text-secondary shrink-0" />
          </button>
        )
      ) : (
        <div className="relative">
          <div className={cn(
            "flex items-center gap-2 h-10 w-full rounded-lg border bg-white px-3",
            error ? "border-red-400" : "border-brand-purple",
            "ring-2",
            error ? "ring-red-400/20" : "ring-brand-purple/20"
          )}>
            <Search size={14} className="text-brand-text-secondary shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-sm text-brand-text-primary placeholder:text-brand-text-secondary bg-transparent focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-brand-text-secondary hover:text-brand-text-primary">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-brand-text-secondary">No employees found</p>
              </div>
            ) : (
              filtered.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSelect(emp)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left first:rounded-t-xl last:rounded-b-xl"
                >
                  <Avatar name={emp.name} src={emp.avatar_url} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-text-primary truncate">{emp.name}</p>
                    <p className="text-xs text-brand-text-secondary truncate">{emp.role} · {emp.department}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
