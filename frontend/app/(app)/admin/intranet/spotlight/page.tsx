"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import ActionModal from "@/components/ui/ActionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import FormTextarea from "@/components/forms/FormTextarea";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { BackButton } from "@/components/ui/BackButton";
import { useEmployeeSpotlight } from "@/lib/modules/intranet/hooks/useIntranetSpotlight";
import { useToast } from "@/hooks/useToast";
import type { SpotlightEntry } from "@/lib/modules/intranet/types/intranet.types";
import { EMPLOYEE_STORE } from "@/app/(app)/admin/_components/_data";

const EMPLOYEES: PickedEmployee[] = EMPLOYEE_STORE.map((e) => ({
  id: e.id,
  name: `${e.firstName} ${e.lastName}`,
  role: e.title,
  department: e.department,
  avatar_url: `https://i.pravatar.cc/150?img=${10 + Number(e.id)}`,
}));

type SpotlightRow = Omit<SpotlightEntry, "id"> & { id: string; _numId: number };

const TAG_PRESETS = [
  { label: "Safety Champion",   color: "#166534", bg: "#F0FDF4" },
  { label: "Process Innovator", color: "#1E40AF", bg: "#EFF6FF" },
  { label: "Top Performer",     color: "#7234BD", bg: "#F3EEFF" },
  { label: "Team Player",       color: "#B45309", bg: "#FFFBEB" },
  { label: "Innovation Award",  color: "#C2410C", bg: "#FFF7ED" },
];

const EMPTY_FORM = {
  message:      "",
  tag:          TAG_PRESETS[0].label,
  tag_color:    TAG_PRESETS[0].color,
  tag_bg:       TAG_PRESETS[0].bg,
  is_published: true,
};
type FormState = typeof EMPTY_FORM;

const columns: Column<SpotlightRow>[] = [
  {
    key: "employee_name",
    label: "Employee",
    render: (_, row) => (
      <div className="flex items-center gap-3 min-w-0">
        {row.avatar_url ? (
          <img src={row.avatar_url} alt={row.employee_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple text-sm font-bold shrink-0">
            {row.employee_name[0]}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-text-primary truncate">{row.employee_name}</p>
          <p className="text-xs text-brand-text-secondary truncate">{row.employee_role} · {row.employee_dept}</p>
        </div>
      </div>
    ),
  },
  {
    key: "tag",
    label: "Tag",
    render: (_, row) => (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: row.tag_bg, color: row.tag_color }}
      >
        {row.tag}
      </span>
    ),
  },
  {
    key: "message",
    label: "Recognition",
    render: (_, row) => (
      <p className="text-sm text-brand-text-secondary max-w-sm truncate">{row.message}</p>
    ),
  },
];

export default function SpotlightPage() {
  const { cards, update, add, remove } = useEmployeeSpotlight();
  const toast = useToast();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<SpotlightEntry | null>(null);
  const [employee,   setEmployee]   = useState<PickedEmployee | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);

  const rows: SpotlightRow[] = cards.map((c) => ({ ...c, id: String(c.id), _numId: c.id }));

  function openCreate() {
    if (cards.length >= 3) {
      toast.info("Maximum 3 spotlight cards allowed. Remove one to add another.");
      return;
    }
    setEditTarget(null);
    setEmployee(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(row: SpotlightRow) {
    const item = cards.find((c) => c.id === row._numId)!;
    setEditTarget(item);
    setEmployee(
      EMPLOYEES.find((e) => e.name === item.employee_name) ?? {
        id: String(item.employee_id),
        name: item.employee_name,
        role: item.employee_role,
        department: item.employee_dept,
        avatar_url: item.avatar_url,
      }
    );
    setForm({
      message:      item.message,
      tag:          item.tag,
      tag_color:    item.tag_color,
      tag_bg:       item.tag_bg,
      is_published: item.is_published,
    });
    setErrors({});
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditTarget(null);
    setEmployee(null);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!employee)        e.employee = "Please select an employee";
    if (!form.message.trim()) e.message = "Recognition message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const ts = new Date().toISOString();
    const payload = {
      employee_id:   Number(employee!.id),
      employee_name: employee!.name,
      employee_role: employee!.role,
      employee_dept: employee!.department,
      avatar_url:    employee!.avatar_url ?? "",
      title:         `Spotlight — ${employee!.name}`,
      message:       form.message,
      tag:           form.tag,
      tag_color:     form.tag_color,
      tag_bg:        form.tag_bg,
      is_published:  form.is_published,
      month:         new Date().getMonth() + 1,
      year:          new Date().getFullYear(),
      published_at:  form.is_published ? ts : null,
    };
    if (editTarget) {
      update(editTarget.id, payload);
    } else {
      add(payload);
    }
    setSaving(false);
    toast.success(editTarget ? "Spotlight card updated." : "Spotlight card added.");
    handleClose();
  }

  function applyTag(preset: typeof TAG_PRESETS[0]) {
    setForm((prev) => ({ ...prev, tag: preset.label, tag_color: preset.color, tag_bg: preset.bg }));
  }

  const tableActions: DataTableAction<SpotlightRow>[] = [
    {
      key: "edit",
      label: "",
      icon: <Pencil size={14} />,
      title: "Edit",
      variant: "ghost",
      onClick: (row) => openEdit(row),
    },
    {
      key: "delete",
      label: "",
      icon: <Trash2 size={14} />,
      title: "Delete",
      variant: "ghost",
      className: "hover:bg-red-50 hover:text-red-600",
      onClick: (row) => setDeleteId(row._numId),
    },
  ];

  return (
    <AppLayout pageTitle="Employee Spotlight">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="Employee Spotlight"
        description={`Manage spotlight cards shown on the intranet homepage (max 3). Currently ${cards.length}/3.`}
        className="mb-6"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            Add Spotlight
          </Button>
        }
      />

      <DataTable<SpotlightRow>
        columns={columns}
        data={rows}
        showActions
        actions={tableActions}
        actionsLabel="Actions"
        emptyMessage="No spotlight cards yet."
        emptyDescription="Add up to 3 employees to feature on the intranet homepage."
      />

      <ActionModal
        open={modalOpen}
        onClose={handleClose}
        title={editTarget ? "Edit Spotlight" : "New Spotlight Card"}
        variant="panel"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} loadingText="Saving…">Save</Button>
          </>
        }
      >
        <div className="space-y-5">
          <EmployeePicker
            employees={EMPLOYEES}
            value={employee}
            onChange={(emp) => {
              setEmployee(emp);
              if (emp) setErrors((p) => ({ ...p, employee: "" }));
            }}
            label="Employee"
            required
            error={errors.employee}
          />

          <FormTextarea
            label="Recognition"
            required
            placeholder="What did this employee achieve?"
            value={form.message}
            onChange={(e) => {
              setForm((p) => ({ ...p, message: e.target.value }));
              if (e.target.value.trim()) setErrors((p) => ({ ...p, message: "" }));
            }}
            rows={3}
            error={errors.message}
          />

          <div>
            <p className="text-sm font-medium text-brand-text-primary mb-2">Tag</p>
            <div className="flex flex-wrap gap-2">
              {TAG_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyTag(p)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                  style={{
                    backgroundColor: p.bg,
                    color: p.color,
                    borderColor: form.tag === p.label ? p.color : "transparent",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
              className="w-4 h-4 accent-brand-purple"
            />
            <span className="text-sm text-brand-text-primary">Show on intranet</span>
          </label>
        </div>
      </ActionModal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Remove Spotlight Card"
        message="This will remove the employee from the intranet spotlight section."
        confirmLabel="Remove"
        destructive={true}
        onConfirm={() => { if (deleteId !== null) { remove(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
