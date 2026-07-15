"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Pencil, Trash2, Building2, X } from "lucide-react";
import Tip from "@/components/ui/Tip";
import { BackButton } from "@/components/ui/BackButton";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/lib/modules/setups";
import { useEmployees } from "@/lib/modules/employees/hooks";
import { useToast } from "@/hooks/useToast";
import type { DepartmentListItem } from "@/types/setups";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toCode(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// ── Department modal (add + edit) ─────────────────────────────────────────────

interface DeptModalProps {
  mode:        "add" | "edit";
  dept?:       DepartmentListItem;
  initialHod?: PickedEmployee | null;
  employees:   PickedEmployee[];
  onSave:      (data: { name: string; hod_id: string | null }) => Promise<void>;
  onClose:     () => void;
}

function DeptModal({ mode, dept, initialHod, employees, onSave, onClose }: DeptModalProps) {
  const [name, setName]     = useState(dept?.name ?? "");
  const [hod, setHod]       = useState<PickedEmployee | null>(initialHod ?? null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), hod_id: hod?.id ?? null });
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-brand-text-primary">
            {mode === "add" ? "Add Department" : "Edit Department"}
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-brand-text-secondary hover:bg-gray-100"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FormInput
              label="Department Name"
              required
              placeholder="e.g. Human Resources"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {mode === "add" && name.trim() && (
              <p className="text-xs text-brand-text-secondary mt-1">
                Code: <span className="font-mono text-brand-purple">{toCode(name)}</span>
              </p>
            )}
          </div>

          <EmployeePicker
            label="Head of Department"
            employees={employees}
            value={hod}
            onChange={setHod}
            placeholder="Search employees…"
          />

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving || !name.trim()} className="flex-1">
              {saving ? "Saving…" : mode === "add" ? "Add Department" : "Save Changes"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-brand-border text-sm font-medium text-brand-text-primary hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; dept: DepartmentListItem }
  | null;

export default function DepartmentsPage() {
  const toast = useToast();
  const { data: departments = [], isLoading } = useDepartments();
  const { data: allEmployees = [] }           = useEmployees();

  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();

  const [modal, setModal]               = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentListItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<DepartmentListItem | null>(null);

  // Employee list for picker
  const employeeOptions: PickedEmployee[] = useMemo(() =>
    allEmployees.map((e) => ({
      id:         e.id,
      name:       [e.user?.first_name, e.user?.last_name].filter(Boolean).join(" ") || "Unknown",
      role:       e.job_title ?? e.user?.role ?? "",
      department: e.department ?? "",
      avatar_url: e.user?.profile_picture_url,
    })),
    [allEmployees],
  );

  const employeeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of employeeOptions) map[e.id] = e.name;
    return map;
  }, [employeeOptions]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleAdd(data: { name: string; hod_id: string | null }) {
    try {
      await createDept.mutateAsync({
        name:   data.name,
        code:   toCode(data.name),
        hod_id: data.hod_id ?? undefined,
      });
      toast.success("Department added");
      setModal(null);
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail;
      toast.error(msg ?? "Failed to add department");
      throw err;
    }
  }

  function EditHandler({ dept }: { dept: DepartmentListItem }) {
    const updateDept = useUpdateDepartment(dept.id);

    async function handleUpdate(data: { name: string; hod_id: string | null }) {
      try {
        await updateDept.mutateAsync({ name: data.name, hod_id: data.hod_id });
        toast.success("Department updated");
        setModal(null);
      } catch {
        toast.error("Failed to update department");
        throw new Error("update failed");
      }
    }

    const currentHod = dept.hod_id
      ? (employeeOptions.find((e) => e.id === dept.hod_id) ?? null)
      : null;

    return (
      <DeptModal
        mode="edit"
        dept={dept}
        initialHod={currentHod}
        employees={employeeOptions}
        onSave={handleUpdate}
        onClose={() => setModal(null)}
      />
    );
  }

  function ToggleHandler({ dept }: { dept: DepartmentListItem }) {
    const updateDept = useUpdateDepartment(dept.id);

    async function handleToggle() {
      try {
        await updateDept.mutateAsync({ is_active: !dept.is_active });
        toast.success(dept.is_active ? "Department deactivated" : "Department activated");
        setToggleTarget(null);
      } catch {
        toast.error("Failed to update status");
      }
    }

    return (
      <ConfirmDialog
        open={toggleTarget?.id === dept.id}
        title={dept.is_active ? "Deactivate Department" : "Activate Department"}
        message={
          dept.is_active
            ? `Deactivate "${dept.name}"? It won't appear in dropdowns for new assignments.`
            : `Reactivate "${dept.name}"?`
        }
        confirmLabel={dept.is_active ? "Deactivate" : "Activate"}
        destructive={dept.is_active}
        onConfirm={handleToggle}
        onCancel={() => setToggleTarget(null)}
      />
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDept.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail;
      toast.error(msg ?? "Failed to delete department");
      setDeleteTarget(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout pageTitle="Setups — Departments">
      <BackButton href="/admin" label="Back to Admin" />

      <PageHeader
        title="Departments"
        description="Manage company departments and their heads."
        className="mb-5"
        action={
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setModal({ mode: "add" })}
          >
            Add Department
          </Button>
        }
      />

      {isLoading ? (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden animate-pulse">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-border bg-gray-50">
                <th className="px-4 py-3"><div className="h-3 w-20 bg-gray-200 rounded" /></th>
                <th className="px-4 py-3"><div className="h-3 w-32 bg-gray-200 rounded" /></th>
                <th className="px-4 py-3"><div className="h-3 w-12 bg-gray-200 rounded" /></th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="border-b border-brand-border/50 last:border-0">
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 w-36 bg-gray-200 rounded" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 w-28 bg-gray-200 rounded" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-14 bg-gray-100 rounded-full" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      <div className="h-7 w-7 bg-gray-100 rounded-lg" />
                      <div className="h-7 w-7 bg-gray-100 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-2xl flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <Building2 size={32} className="text-gray-300" />
          <p className="text-sm">No departments yet.</p>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setModal({ mode: "add" })}>
            Add Department
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-border bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-brand-text-secondary">Department</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-brand-text-secondary">Head of Department</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-brand-text-secondary">Status</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className="border-b border-brand-border last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-brand-text-primary">{dept.name}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    {dept.hod_id && employeeById[dept.hod_id] ? (
                      <p className="text-sm text-brand-text-primary">{employeeById[dept.hod_id]}</p>
                    ) : (
                      <p className="text-sm text-brand-text-secondary italic">Not set</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <Tip label={dept.is_active ? "Click to deactivate" : "Click to activate"}>
                      <button
                        onClick={() => setToggleTarget(dept)}
                        className={[
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-75 transition-opacity",
                          dept.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500",
                        ].join(" ")}
                      >
                        {dept.is_active ? "Active" : "Inactive"}
                      </button>
                    </Tip>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Tip label="Edit department">
                        <button
                          onClick={() => setModal({ mode: "edit", dept })}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-brand-text-secondary hover:bg-gray-100 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                      </Tip>
                      {dept.employee_count === 0 ? (
                        <Tip label="Delete department">
                          <button
                            onClick={() => setDeleteTarget(dept)}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-brand-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </Tip>
                      ) : (
                        <Tip label={`${dept.employee_count} employee(s) assigned — deactivate to retire`}>
                          <span className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-gray-300 cursor-not-allowed">
                            <Trash2 size={13} />
                          </span>
                        </Tip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {modal?.mode === "add" && (
        <DeptModal
          mode="add"
          employees={employeeOptions}
          onSave={handleAdd}
          onClose={() => setModal(null)}
        />
      )}

      {/* Edit modal */}
      {modal?.mode === "edit" && (
        <EditHandler dept={modal.dept} />
      )}

      {/* Toggle status confirm */}
      {toggleTarget && <ToggleHandler dept={toggleTarget} />}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Department"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone. This department has no employees so it is safe to remove.`}
        confirmLabel="Delete"
        destructive
        loading={deleteDept.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
