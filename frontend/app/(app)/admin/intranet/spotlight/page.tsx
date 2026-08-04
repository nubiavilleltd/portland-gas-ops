"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, X, Eye, EyeOff, AlertTriangle } from "lucide-react";
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
import Tip from "@/components/ui/Tip";
import Badge from "@/components/ui/Badge";
import { useIntranetSpotlightAdmin, useIntranetSpotlightTags } from "@/lib/modules/intranet/queries";
import {
  useCreateSpotlight,
  useUpdateSpotlight,
  useDeleteSpotlight,
  useToggleSpotlightPublished,
  useCreateSpotlightTag,
  useUpdateSpotlightTag,
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
  {
    key: "is_published",
    label: "Status",
    render: (_, row) => (
      <Badge variant={row.is_published ? "success" : "neutral"} label={row.is_published ? "Visible" : "Hidden"} />
    ),
  },
];

export default function SpotlightPage() {
  const { data: all = [], isLoading, isFetching } = useIntranetSpotlightAdmin();
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
  const visibleCount = cards.filter((c) => c.is_published).length;

  const deleteMutation        = useDeleteSpotlight();
  const togglePublishMutation = useToggleSpotlightPublished();
  const createTagMutation     = useCreateSpotlightTag();
  const updateTagMutation     = useUpdateSpotlightTag();
  const deleteTagMutation     = useDeleteSpotlightTag();

  const [toggleConfirm, setToggleConfirm] = useState<SpotlightEntry | null>(null);

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
  const [editTag,       setEditTag]       = useState<{ id: number; label: string; color: string; bg: string } | null>(null);
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

    if (employee && form.message.trim() && form.tag) {
      const exactDuplicate = cards.some(
        (c) =>
          String(c.employee_id) === String(employee.id) &&
          (c.tag ?? "").toLowerCase() === form.tag.toLowerCase() &&
          c.message.trim().toLowerCase() === form.message.trim().toLowerCase() &&
          c.id !== editTarget?.id
      );
      if (exactDuplicate) {
        e.message = "An identical spotlight already exists for this employee with the same tag and recognition.";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    // Auto-hide if 3 are already visible and this would add another visible one
    const isNewOrWasHidden = !editTarget || !editTarget.is_published;
    const forceHidden = form.is_published && isNewOrWasHidden && visibleCount >= 3;
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
      is_published:  forceHidden ? false : form.is_published,
    };
    try {
      if (editTarget) {
        await updateMutation.mutateAsync(payload);
        toast.success(forceHidden ? "Spotlight card updated (saved as hidden — 3 already visible)." : "Spotlight card updated.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(forceHidden ? "Spotlight card added as hidden (3 already visible)." : "Spotlight card added.");
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

  function startEditTag(t: { id: number; label: string; color: string; bg: string }) {
    setEditTag(t);
    setNewTagLabel(t.label);
    setNewTagColor(t.color);
  }

  function cancelEditTag() {
    setEditTag(null);
    setNewTagLabel("");
    setNewTagColor("#166534");
  }

  async function handleAddTag() {
    if (!newTagLabel.trim()) return;
    try {
      if (editTag) {
        const newColor = newTagColor;
        await updateTagMutation.mutateAsync({ id: editTag.id, label: newTagLabel.trim(), color: newColor, bg: deriveBg(newColor) });
        toast.success("Tag updated.");
      } else {
        await createTagMutation.mutateAsync({ label: newTagLabel.trim(), color: newTagColor, bg: deriveBg(newTagColor) });
        toast.success("Tag added.");
      }
      cancelEditTag();
    } catch {
      toast.error(editTag ? "Failed to update tag." : "Failed to add tag. Label may already exist.");
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
      key: "toggle",
      label: "",
      icon: (row) => (
        <Tip label={row.is_published ? "Hide from Intranet" : "Show on Intranet"}>
          {row.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
        </Tip>
      ),
      variant: "ghost",
      onClick: (row) => {
        const item = cards.find((c) => c.id === row._numId)!;
        // Prevent showing if 3 are already visible
        if (!item.is_published && visibleCount >= 3) {
          toast.error("Maximum 3 visible spotlight cards allowed. Hide one first before showing another.");
          return;
        }
        setToggleConfirm(item);
      },
    },
    {
      key: "edit",
      label: "",
      icon: <Tip label="Edit Spotlight"><Pencil size={14} /></Tip>,
      variant: "ghost",
      onClick: (row) => openEdit(row),
    },
    {
      key: "delete",
      label: "",
      icon: <Tip label="Remove Spotlight"><Trash2 size={14} /></Tip>,
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
        description={`Manage spotlight cards shown on the intranet homepage (max 3 visible). Currently ${visibleCount}/3 visible${cards.length > visibleCount ? ` (${cards.length - visibleCount} hidden)` : ""}.`}
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

      <DataTable<SpotlightRow>
        columns={columns}
        data={rows}
        isLoading={isLoading || isFetching}
        showActions
        actions={tableActions}
        actionsLabel="Actions"
        emptyMessage="No spotlight cards yet."
        emptyDescription="Add up to 3 employees to feature on the intranet homepage."
      />

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
          {(() => {
            const alreadySpotlit = employee
              ? cards.some(
                  (c) =>
                    String(c.employee_id) === String(employee.id) &&
                    c.id !== editTarget?.id
                )
              : false;
            return (
              <>
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
                {alreadySpotlit && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 -mt-2">
                    <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      <span className="font-semibold">{employee!.name}</span> already has an active spotlight. You can still add this one for a different recognition.
                    </p>
                  </div>
                )}
              </>
            );
          })()}

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

          {(() => {
            const isNewOrWasHidden = !editTarget || !editTarget.is_published;
            const wouldExceedLimit = isNewOrWasHidden && visibleCount >= 3;
            return (
              <div className="space-y-1">
                <label className={`flex items-center gap-2 select-none ${wouldExceedLimit ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={wouldExceedLimit ? false : form.is_published}
                    onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                    disabled={wouldExceedLimit}
                    className="w-4 h-4 accent-brand-purple disabled:opacity-50"
                  />
                  <span className={`text-sm ${wouldExceedLimit ? "text-brand-text-secondary" : "text-brand-text-primary"}`}>
                    Show on intranet
                  </span>
                </label>
                {wouldExceedLimit && (
                  <p className="text-xs text-amber-600">
                    3 spotlight cards are already visible. This will be saved as hidden.
                  </p>
                )}
              </div>
            );
          })()}
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
          {/* Add / Edit tag */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-brand-text-primary">{editTag ? "Edit Tag" : "Add Tag"}</p>
              {editTag && (
                <button type="button" onClick={cancelEditTag} className="text-xs text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                  Cancel
                </button>
              )}
            </div>
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
              loading={createTagMutation.isPending || updateTagMutation.isPending}
              loadingText={editTag ? "Saving…" : "Adding…"}
              leftIcon={editTag ? undefined : <Plus size={14} />}
              className="w-full"
            >
              {editTag ? "Save Changes" : "Add Tag"}
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditTag(t)}
                        className="text-gray-400 hover:text-brand-purple transition-colors p-1 rounded"
                      >
                        <Tip label="Edit Tag"><Pencil size={13} /></Tip>
                      </button>
                      <button
                        onClick={() => setDeleteTagId(t.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                      >
                        <Tip label="Delete Tag"><X size={14} /></Tip>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ActionModal>

      {/* Publish / hide toggle confirm */}
      <ConfirmDialog
        open={toggleConfirm !== null}
        title={toggleConfirm?.is_published ? "Hide Spotlight Card" : "Show Spotlight Card"}
        message={
          toggleConfirm?.is_published
            ? `"${toggleConfirm.employee_name}" will no longer appear in the intranet spotlight section.`
            : `"${toggleConfirm?.employee_name}" will become visible in the intranet spotlight section.`
        }
        confirmLabel={toggleConfirm?.is_published ? "Hide" : "Show"}
        destructive={toggleConfirm?.is_published ?? false}
        onConfirm={async () => {
          if (toggleConfirm) {
            try {
              await togglePublishMutation.mutateAsync(toggleConfirm.id);
            } catch {
              /* toast from hook or let it fail silently */
            }
            setToggleConfirm(null);
          }
        }}
        onCancel={() => setToggleConfirm(null)}
      />

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
