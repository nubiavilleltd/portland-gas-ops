"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import ActionModal from "@/components/ui/ActionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { BackButton } from "@/components/ui/BackButton";
import Tip from "@/components/ui/Tip";
import Avatar from "@/components/ui/Avatar";
import { useIntranetLeadershipAdmin } from "@/lib/modules/intranet/queries";
import {
  useCreateLeadership,
  useUpdateLeadership,
  useDeleteLeadership,
  useToggleLeadershipPublished,
  useReorderLeadership,
} from "@/lib/modules/intranet/mutations";
import { useToast } from "@/hooks/useToast";
import { useEmployees } from "@/lib/modules/employees/hooks";
import type { LeadershipMessage } from "@/lib/modules/intranet/types/intranet.types";

type MessageRow = Omit<LeadershipMessage, "id"> & { id: string; _numId: number };

const EMPTY_FORM = {
  title: "",
  body:  "",
  is_published: true,
};
type FormState = typeof EMPTY_FORM;

const columns: Column<MessageRow>[] = [
  {
    key: "sort_order",
    label: "#",
    render: (_, row) => (
      <span className="text-sm font-medium text-brand-text-secondary">{row.sort_order + 1}</span>
    ),
  },
  {
    key: "author_name",
    label: "Author",
    render: (_, row) => (
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={row.author_name} src={row.avatar_url} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-text-primary truncate">{row.author_name}</p>
          <p className="text-xs text-brand-text-secondary truncate">{row.author_role} · {row.author_dept}</p>
        </div>
      </div>
    ),
  },
  {
    key: "title",
    label: "Headline",
    render: (_, row) => (
      <p className="text-sm text-brand-text-primary max-w-sm truncate">{row.title}</p>
    ),
  },
  {
    key: "is_published",
    label: "Status",
    render: (_, row) => (
      <Badge variant={row.is_published ? "success" : "neutral"} label={row.is_published ? "Published" : "Draft"} />
    ),
  },
];

export default function LeadershipPage() {
  const { data: messages = [], isLoading, isFetching } = useIntranetLeadershipAdmin();
  const { data: employeeList = [] }        = useEmployees();
  const toast = useToast();

  const EMPLOYEES: PickedEmployee[] = employeeList.map((e) => ({
    id:         e.id,
    name:       `${e.user?.first_name ?? ""} ${e.user?.last_name ?? ""}`.trim(),
    role:       e.job_title ?? "",
    department: e.department ?? "",
    avatar_url: e.user?.profile_picture_url ?? undefined,
  }));

  const createMutation = useCreateLeadership();
  const deleteMutation = useDeleteLeadership();
  const toggleMutation = useToggleLeadershipPublished();
  const reorderMutation = useReorderLeadership();

  const [modalOpen,           setModalOpen]           = useState(false);
  const [deleteId,            setDeleteId]            = useState<number | null>(null);
  const [editTarget,          setEditTarget]          = useState<LeadershipMessage | null>(null);
  const [employee,            setEmployee]            = useState<PickedEmployee | null>(null);
  const [form,                setForm]                = useState<FormState>(EMPTY_FORM);
  const [errors,              setErrors]              = useState<Record<string, string>>({});
  const [toggleConfirmTarget, setToggleConfirmTarget] = useState<MessageRow | null>(null);
  const [toggleSpinner,       setToggleSpinner]       = useState<number | null>(null);

  const updateMutation = useUpdateLeadership(editTarget?.id ?? 0);

  const sorted = [...messages].sort((a, b) => a.sort_order - b.sort_order);
  const rows: MessageRow[] = sorted.map((m) => ({ ...m, id: String(m.id), _numId: m.id }));

  function openCreate() {
    setEditTarget(null);
    setEmployee(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(row: MessageRow) {
    const item = messages.find((m) => m.id === row._numId)!;
    setEditTarget(item);
    setEmployee(
      EMPLOYEES.find((e) => e.id === item.author_id) ?? {
        id:         item.author_id ?? "0",
        name:       item.author_name,
        role:       item.author_role ?? "",
        department: item.author_dept ?? "",
        avatar_url: item.avatar_url ?? undefined,
      }
    );
    setForm({
      title:        item.title,
      body:         item.body,
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
    if (!employee)           e.employee = "Please select an author";
    if (!form.title.trim())  e.title    = "Headline is required";
    if (!form.body.trim())   e.body     = "Message body is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const payload = {
      author_id:    employee!.id,
      author_name:  employee!.name,
      author_role:  employee!.role ?? null,
      author_dept:  employee!.department ?? null,
      avatar_url:   employee!.avatar_url ?? null,
      title:        form.title,
      body:         form.body,
      is_published: form.is_published,
      sort_order:   editTarget?.sort_order ?? messages.length,
    };
    try {
      if (editTarget) {
        await updateMutation.mutateAsync(payload);
        toast.success("Message updated.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Message created.");
      }
      handleClose();
    } catch {
      toast.error("Failed to save message.");
    }
  }

  async function handleToggle() {
    if (!toggleConfirmTarget) return;
    const row = toggleConfirmTarget;
    setToggleConfirmTarget(null);
    setToggleSpinner(row._numId);
    try {
      await toggleMutation.mutateAsync(row._numId);
      toast.success(row.is_published ? "Message unpublished." : "Message published.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setToggleSpinner(null);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Message deleted.");
    } catch {
      toast.error("Failed to delete message.");
    }
    setDeleteId(null);
  }

  async function handleMove(row: MessageRow, direction: "up" | "down") {
    const idx     = sorted.findIndex((m) => m.id === row._numId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];
    try {
      await reorderMutation.mutateAsync([
        { id: a.id, sort_order: b.sort_order },
        { id: b.id, sort_order: a.sort_order },
      ]);
    } catch {
      toast.error("Failed to reorder.");
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  const tableActions: DataTableAction<MessageRow>[] = [
    {
      key: "up",
      label: "",
      icon: <Tip label="Move Up"><ChevronUp size={14} /></Tip>,
      variant: "ghost",
      onClick: (row) => handleMove(row, "up"),
    },
    {
      key: "down",
      label: "",
      icon: <Tip label="Move Down"><ChevronDown size={14} /></Tip>,
      variant: "ghost",
      onClick: (row) => handleMove(row, "down"),
    },
    {
      key: "toggle",
      label: "",
      icon: (row) =>
        toggleMutation.isPending && toggleSpinner === row._numId
          ? <Loader2 size={14} className="animate-spin" />
          : <Tip label={row.is_published ? "Unpublish Message" : "Publish Message"}>{row.is_published ? <EyeOff size={14} /> : <Eye size={14} />}</Tip>,
      variant: "ghost",
      onClick: (row) => setToggleConfirmTarget(row),
    },
    {
      key: "edit",
      label: "",
      icon: <Tip label="Edit Message"><Pencil size={14} /></Tip>,
      variant: "ghost",
      onClick: (row) => openEdit(row),
    },
    {
      key: "delete",
      label: "",
      icon: <Tip label="Delete Message"><Trash2 size={14} /></Tip>,
      variant: "ghost",
      className: "hover:bg-red-50 hover:text-red-600",
      onClick: (row) => setDeleteId(row._numId),
    },
  ];

  return (
    <AppLayout pageTitle="Leadership Messages">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="Leadership Messages"
        description="Manage messages from leadership displayed as a carousel on the intranet homepage"
        className="mb-6"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            New Message
          </Button>
        }
      />

      <DataTable<MessageRow>
        columns={columns}
        data={rows}
        isLoading={isLoading || isFetching}
        showActions
        actions={tableActions}
        actionsLabel="Actions"
        searchable
        searchPlaceholder="Search messages…"
        emptyMessage="No leadership messages yet."
        emptyDescription="Click 'New Message' to add one."
      />

      <ActionModal
        open={modalOpen}
        onClose={handleClose}
        title={editTarget ? "Edit Message" : "New Leadership Message"}
        variant="panel"
        size="lg"
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
            label="Author"
            required
            error={errors.employee}
          />
          <FormInput
            label="Headline"
            required
            placeholder="e.g. Message from the MD — July 2026"
            value={form.title}
            onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setErrors((p) => ({ ...p, title: "" })); }}
            error={errors.title}
          />
          <FormTextarea
            label="Message Body"
            required
            placeholder="Write the leadership message…"
            value={form.body}
            onChange={(e) => { setForm((p) => ({ ...p, body: e.target.value })); setErrors((p) => ({ ...p, body: "" })); }}
            rows={5}
            error={errors.body}
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
              className="w-4 h-4 accent-brand-purple"
            />
            <span className="text-sm text-brand-text-primary">Publish immediately</span>
          </label>
        </div>
      </ActionModal>

      <ConfirmDialog
        open={toggleConfirmTarget !== null}
        title={toggleConfirmTarget?.is_published ? "Unpublish Message" : "Publish Message"}
        message={
          toggleConfirmTarget?.is_published
            ? "This message will be hidden from the intranet homepage carousel."
            : "This message will become visible to all staff on the intranet homepage."
        }
        confirmLabel={toggleConfirmTarget?.is_published ? "Unpublish" : "Publish"}
        destructive={toggleConfirmTarget?.is_published ?? false}
        onConfirm={handleToggle}
        onCancel={() => setToggleConfirmTarget(null)}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Message"
        message="This will permanently remove this leadership message from the intranet carousel."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
