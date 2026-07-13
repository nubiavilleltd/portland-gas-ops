"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import ActionModal from "@/components/ui/ActionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import FormTextarea from "@/components/forms/FormTextarea";
import FormInput from "@/components/forms/FormInput";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { BackButton } from "@/components/ui/BackButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useIntranetSpotlightAdmin, useIntranetSpotlightTags } from "@/lib/modules/intranet/queries";
import {
  useCreateSpotlight,
  useUpdateSpotlight,
  useDeleteSpotlight,
  useCreateSpotlightTag,
  useDeleteSpotlightTag,
} from "@/lib/modules/intranet/mutations";
import { useToast } from "@/hooks/useToast";
import type { SpotlightEntry } from "@/lib/modules/intranet/types/intranet.types";
import { useEmployees } from "@/lib/modules/employees/hooks";

type SpotlightRow = Omit<SpotlightEntry, "id"> & { id: string; _numId: number };

/** Given a hex colour, returns a light tinted background (12% colour + 88% white). */
function deriveBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r * 0.12 + 255 * 0.88)}${toHex(g * 0.12 + 255 * 0.88)}${toHex(b * 0.12 + 255 * 0.88)}`;
}

const EMPTY_FORM = {
  message:      "",
  tag:          "",
  tag_color:    "#166534",
  tag_bg:       "#F0FDF4",
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
        style={{ backgroundColor: row.tag_bg ?? "#F3EEFF", color: row.tag_color ?? "#7234BD" }}
      >
        {row.tag ?? "—"}
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
  const { data: all = [], isLoading }  = useIntranetSpotlightAdmin();
  const { data: tags = [] }            = useIntranetSpotlightTags();
  const { data: employeeList = [] }    = useEmployees();
  const toast = useToast();

  const EMPLOYEES: PickedEmployee[] = employeeList.map((e) => ({
    id:         e.id,
    name:       `${e.user?.first_name ?? ""} ${e.user?.last_name ?? ""}`.trim(),
    role:       e.job_title ?? "",
    department: e.department ?? "",
    avatar_url: e.user?.profile_picture_url ?? undefined,
  }));

  // Spotlight cards exclude EOM entries
  const cards = all.filter((e) => e.category !== "employee_of_month");

  const deleteMutation     = useDeleteSpotlight();
  const createTagMutation  = useCreateSpotlightTag();
  const deleteTagMutation  = useDeleteSpotlightTag();

  // Spotlight card modal state
  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<SpotlightEntry | null>(null);
  const [employee,   setEmployee]   = useState<PickedEmployee | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  // Tag management panel state
  const [tagPanelOpen,  setTagPanelOpen]  = useState(false);
  const [newTagLabel,   setNewTagLabel]   = useState("");
  const [newTagColor,   setNewTagColor]   = useState("#166534");
  const [deleteTagId,   setDeleteTagId]   = useState<number | null>(null);

  const createMutation = useCreateSpotlight();
  const updateMutation = useUpdateSpotlight(editTarget?.id ?? 0);

  const rows: SpotlightRow[] = cards.map((c) => ({ ...c, id: String(c.id), _numId: c.id }));

  // ── Defaults when form opens ──────────────────────────────────────────────
  function defaultTag() {
    if (tags.length === 0) return { tag: "", tag_color: "#166534", tag_bg: "#F0FDF4" };
    return { tag: tags[0].label, tag_color: tags[0].color, tag_bg: tags[0].bg };
  }

  function openCreate() {
    if (cards.length >= 3) {
      toast.info("Maximum 3 spotlight cards allowed. Remove one to add another.");
      return;
    }
    setEditTarget(null);
    setEmployee(null);
    setForm({ ...EMPTY_FORM, ...defaultTag() });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(row: SpotlightRow) {
    const item = cards.find((c) => c.id === row._numId)!;
    setEditTarget(item);
    setEmployee(
      EMPLOYEES.find((e) => e.name === item.employee_name) ?? {
        id: item.employee_id ?? "0",
        name: item.employee_name,
        role: item.employee_role ?? "",
        department: item.employee_dept ?? "",
        avatar_url: item.avatar_url ?? undefined,
      }
    );
    setForm({
      message:      item.message,
      tag:          item.tag ?? defaultTag().tag,
      tag_color:    item.tag_color ?? defaultTag().tag_color,
      tag_bg:       item.tag_bg ?? defaultTag().tag_bg,
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
    if (!employee)            e.employee = "Please select an employee";
    if (!form.message.trim()) e.message  = "Recognition message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const payload = {
      employee_id:   employee!.id,
      employee_name: employee!.name,
      employee_role: employee!.role ?? null,
      employee_dept: employee!.department ?? null,
      avatar_url:    employee!.avatar_url ?? null,
      title:         `Spotlight — ${employee!.name}`,
      message:       form.message,
      category:      "achievement" as const,
      month:         null,
      year:          null,
      tag:           form.tag || null,
      tag_color:     form.tag_color || null,
      tag_bg:        form.tag_bg || null,
      is_published:  form.is_published,
    };
    try {
      if (editTarget) {
        await updateMutation.mutateAsync(payload);
        toast.success("Spotlight card updated.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Spotlight card added.");
      }
      handleClose();
    } catch {
      toast.error("Failed to save spotlight card.");
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Spotlight card removed.");
    } catch {
      toast.error("Failed to remove card.");
    }
    setDeleteId(null);
  }

  async function handleAddTag() {
    if (!newTagLabel.trim()) return;
    try {
      await createTagMutation.mutateAsync({ label: newTagLabel.trim(), color: newTagColor, bg: deriveBg(newTagColor) });
      toast.success("Tag added.");
      setNewTagLabel("");
      setNewTagColor("#166534");
    } catch {
      toast.error("Failed to add tag. Label may already exist.");
    }
  }

  async function handleDeleteTag() {
    if (deleteTagId === null) return;
    try {
      await deleteTagMutation.mutateAsync(deleteTagId);
      toast.success("Tag removed.");
    } catch {
      toast.error("Failed to remove tag.");
    }
    setDeleteTagId(null);
  }

  const saving = createMutation.isPending || updateMutation.isPending;

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
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<Tag size={16} />} onClick={() => setTagPanelOpen(true)}>
              Manage Tags
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
              Add Spotlight
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : (
        <DataTable<SpotlightRow>
          columns={columns}
          data={rows}
          showActions
          actions={tableActions}
          actionsLabel="Actions"
          emptyMessage="No spotlight cards yet."
          emptyDescription="Add up to 3 employees to feature on the intranet homepage."
        />
      )}

      {/* ── Add / Edit spotlight card ─────────────────────────────────────── */}
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

          {tags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-brand-text-primary mb-2">Tag</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, tag: t.label, tag_color: t.color, tag_bg: t.bg }))}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                    style={{
                      backgroundColor: t.bg,
                      color: t.color,
                      borderColor: form.tag === t.label ? t.color : "transparent",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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

      {/* ── Manage Tags panel ─────────────────────────────────────────────── */}
      <ActionModal
        open={tagPanelOpen}
        onClose={() => setTagPanelOpen(false)}
        title="Manage Tags"
        variant="panel"
        size="md"
        footer={
          <Button variant="outline" onClick={() => setTagPanelOpen(false)}>Close</Button>
        }
      >
        <div className="space-y-6">
          {/* Add new tag */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-brand-text-primary">Add Tag</p>
            <FormInput
              label="Label"
              placeholder="e.g. Rising Star"
              value={newTagLabel}
              onChange={(e) => setNewTagLabel(e.target.value)}
            />
            <div>
              <p className="text-xs font-medium text-brand-text-secondary mb-1.5">Colour</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-brand-border"
                />
                <span className="text-xs text-brand-text-secondary font-mono">{newTagColor}</span>
              </div>
            </div>

            {/* Live preview */}
            {newTagLabel.trim() && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-brand-text-secondary">Preview:</span>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: deriveBg(newTagColor), color: newTagColor }}
                >
                  {newTagLabel.trim()}
                </span>
              </div>
            )}

            <Button
              onClick={handleAddTag}
              loading={createTagMutation.isPending}
              loadingText="Adding…"
              leftIcon={<Plus size={14} />}
              className="w-full"
            >
              Add Tag
            </Button>
          </div>

          {/* Existing tags */}
          <div>
            <p className="text-sm font-medium text-brand-text-primary mb-3">
              Existing Tags ({tags.length})
            </p>
            {tags.length === 0 ? (
              <p className="text-sm text-brand-text-secondary">No tags yet.</p>
            ) : (
              <div className="space-y-2">
                {tags.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-brand-border bg-white"
                  >
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: t.bg, color: t.color }}
                    >
                      {t.label}
                    </span>
                    <button
                      onClick={() => setDeleteTagId(t.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                      title="Delete tag"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ActionModal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Remove Spotlight Card"
        message="This will remove the employee from the intranet spotlight section."
        confirmLabel="Remove"
        destructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={deleteTagId !== null}
        title="Delete Tag"
        message="This will permanently delete this tag. Existing spotlight cards that use it will keep their tag text."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={handleDeleteTag}
        onCancel={() => setDeleteTagId(null)}
      />
    </AppLayout>
  );
}
