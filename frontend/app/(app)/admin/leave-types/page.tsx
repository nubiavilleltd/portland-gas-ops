"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, PowerOff, Power, Pencil } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/data-table";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import { useLeaveTypes, useDeactivateLeaveType, useReactivateLeaveType, useUpdateLeaveType } from "@/lib/modules/leave-types/hooks";
import { useToast } from "@/hooks/useToast";
import { LeaveTypeListItem } from "@/lib/modules/leave-types/types";

export default function LeaveTypesPage() {
  const toast = useToast();
  const [deactivateTarget, setDeactivateTarget] = useState<LeaveTypeListItem | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<LeaveTypeListItem | null>(null);
  const [editingItem, setEditingItem] = useState<LeaveTypeListItem | null>(null);
  const [editForm, setEditForm] = useState({
    leave_type_name: "",
    entitlement_days: 0,
    description: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useLeaveTypes({
    skip: 0,
    limit: 100,
  });

  const deactivate = useDeactivateLeaveType(deactivateTarget?.id || 0);
  const reactivate = useReactivateLeaveType(reactivateTarget?.id || 0);
  const update = useUpdateLeaveType(editingItem?.id || 0);

  const columns: Column<LeaveTypeListItem & { id: string }>[] = [
    {
      key: "leave_type_name",
      label: "Leave Type",
      sortable: true,
      render: (v) => <span className="font-medium">{String(v)}</span>,
    },
    {
      key: "entitlement_days",
      label: "Entitlement Days",
      sortable: true,
      render: (v) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {String(v)} days
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (v) => <span className="text-sm text-brand-text-secondary">{v ? String(v) : "—"}</span>,
    },
    {
      key: "is_active",
      label: "Status",
      render: (v) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
            v
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          {v ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const handleEdit = (row: LeaveTypeListItem) => {
    setEditingItem(row);
    setEditForm({
      leave_type_name: row.leave_type_name,
      entitlement_days: row.entitlement_days,
      description: row.description || "",
    });
    setEditErrors({});
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "number" ? (value ? parseInt(value) : 0) : value;

    setEditForm((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    if (editErrors[name]) {
      setEditErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editForm.leave_type_name.trim()) {
      newErrors.leave_type_name = "Leave type name is required";
    }

    if (editForm.entitlement_days <= 0) {
      newErrors.entitlement_days = "Entitlement days must be greater than 0";
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateSubmit = () => {
    if (!editingItem || !validateEditForm()) return;

    update.mutate(editForm, {
      onSuccess: () => {
        toast.success("Leave type updated successfully");
        setEditingItem(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.detail || "Failed to update leave type");
      },
    });
  };

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    deactivate.mutate(undefined, {
      onSuccess: () => {
        toast.success("Leave type deactivated");
        setDeactivateTarget(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.detail || "Failed to deactivate leave type");
      },
    });
  };

  const handleReactivate = () => {
    if (!reactivateTarget) return;
    reactivate.mutate(undefined, {
      onSuccess: () => {
        toast.success("Leave type activated");
        setReactivateTarget(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.detail || "Failed to activate leave type");
      },
    });
  };

  // Convert id to string for DataTable
  const tableData = (data?.data || []).map((item: any) => ({
    ...item,
    id: String(item.id),
  }));

  return (
    <AppLayout pageTitle="Leave Type Setup">
      <PageHeader
        title="Leave Type Setup"
        description="Configure and manage all leave types for your organization"
        action={
          <Link href="/admin/leave-types/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors whitespace-nowrap">
            <Plus size={16} /> New Leave Type
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-brand-text-secondary">
          Failed to load leave types.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          searchPlaceholder="Search leave types…"
          emptyState={{
            title: "No leave types found.",
            description: "Create your first leave type to get started.",
          }}
          rowActions={[
            {
              label: "Edit",
              icon: Pencil,
              onClick: (row: any) => handleEdit(row),
              color: "default",
            },
            {
              label: (row: any) => row.is_active ? "Deactivate" : "Activate",
              icon: (row: any) => row.is_active ? PowerOff : Power,
              onClick: (row: any) => {
                if (row.is_active) {
                  setDeactivateTarget(row);
                } else {
                  setReactivateTarget(row);
                }
              },
              color: (row: any) => row.is_active ? "danger" : "success",
            },
          ]}
        />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate Leave Type"
        message={`Deactivating "${deactivateTarget?.leave_type_name}" will hide it from leave request forms. Existing requests are not affected.`}
        confirmLabel="Deactivate"
        destructive
        loading={deactivate.isPending}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />

      <ConfirmDialog
        open={!!reactivateTarget}
        title="Activate Leave Type"
        message={`Activating "${reactivateTarget?.leave_type_name}" will make it available again on leave request forms.`}
        confirmLabel="Activate"
        loading={reactivate.isPending}
        onConfirm={handleReactivate}
        onCancel={() => setReactivateTarget(null)}
      />

      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        title="Edit Leave Type"
        description="Update leave type details"
      >
        <div className="space-y-4">
          <FormInput
            label="Leave Type Name"
            name="leave_type_name"
            value={editForm.leave_type_name}
            onChange={handleEditChange}
            placeholder="e.g., Annual Leave"
            error={editErrors.leave_type_name}
            disabled={update.isPending}
            required
          />

          <FormInput
            label="Entitlement Days"
            name="entitlement_days"
            type="number"
            value={editForm.entitlement_days}
            onChange={handleEditChange}
            placeholder="e.g., 21"
            min={1}
            error={editErrors.entitlement_days}
            disabled={update.isPending}
            required
          />

          <FormTextarea
            label="Description"
            name="description"
            value={editForm.description}
            onChange={handleEditChange}
            placeholder="Brief description of this leave type..."
            rows={3}
            disabled={update.isPending}
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingItem(null)}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleUpdateSubmit}
              loading={update.isPending}
              disabled={update.isPending}
            >
              Update Leave Type
            </Button>
          </div>
        </div>
      </Dialog>
    </AppLayout>
  );
}
