"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
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
import { useLeadershipMessages } from "@/lib/modules/intranet/hooks/useLeadershipMessages";
import { useToast } from "@/hooks/useToast";
import type { LeadershipMessage } from "@/lib/modules/intranet/types/intranet.types";
import { EMPLOYEE_STORE } from "@/app/(app)/admin/_components/_data";

const EMPLOYEES: PickedEmployee[] = EMPLOYEE_STORE.map((e) => ({
  id: e.id,
  name: `${e.firstName} ${e.lastName}`,
  role: e.title,
  department: e.department,
  avatar_url: `https://i.pravatar.cc/150?img=${10 + Number(e.id)}`,
}));

type MessageRow = Omit<LeadershipMessage, "id"> & { id: string; _numId: number };

const EMPTY_FORM = {
  title:        "",
  body:         "",
  is_published: true,
  published_at: null as string | null,
  order:        0,
};
type FormState = typeof EMPTY_FORM;

const columns: Column<MessageRow>[] = [
  {
    key: "order",
    label: "#",
    render: (_, row) => (
      <span className="text-sm font-medium text-brand-text-secondary">{row.order + 1}</span>
    ),
  },
  {
    key: "author_name",
    label: "Author",
    render: (_, row) => (
      <div className="flex items-center gap-3 min-w-0">
        {row.avatar_url ? (
          <img src={row.avatar_url} alt={row.author_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple text-sm font-bold shrink-0">
            {row.author_name[0]}
          </div>
        )}
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
  const { messages, create, update, remove, togglePublished, move } = useLeadershipMessages();
  const toast = useToast();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<LeadershipMessage | null>(null);
  const [employee,   setEmployee]   = useState<PickedEmployee | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);

  const sorted = [...messages].sort((a, b) => a.order - b.order);
  const rows: MessageRow[] = sorted.map((m) => ({ ...m, id: String(m.id), _numId: m.id }));

  function openCreate() {
    setEditTarget(null);
    setEmployee(null);
    setForm({ ...EMPTY_FORM, order: messages.length });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(row: MessageRow) {
    const item = messages.find((m) => m.id === row._numId)!;
    setEditTarget(item);
    setEmployee(
      EMPLOYEES.find((e) => e.name === item.author_name) ?? {
        id: String(item.author_id),
        name: item.author_name,
        role: item.author_role,
        department: item.author_dept,
        avatar_url: item.avatar_url,
      }
    );
    setForm({
      title:        item.title,
      body:         item.body,
      is_published: item.is_published,
      published_at: item.published_at,
      order:        item.order,
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
    if (!employee)         e.employee = "Please select an author";
    if (!form.title.trim()) e.title   = "Headline is required";
    if (!form.body.trim())  e.body    = "Message body is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const ts = new Date().toISOString();
    const payload = {
      author_id:   Number(employee!.id),
      author_name: employee!.name,
      author_role: employee!.role,
      author_dept: employee!.department,
      avatar_url:  employee!.avatar_url ?? "",
      title:       form.title,
      body:        form.body,
      is_published: form.is_published,
      published_at: form.is_published ? (form.published_at ?? ts) : null,
      order:       form.order,
    };
    if (editTarget) {
      update(editTarget.id, { ...payload, updated_at: ts });
    } else {
      create(payload);
    }
    setSaving(false);
    toast.success(editTarget ? "Message updated." : "Message created.");
    handleClose();
  }

  function field(key: keyof FormState, value: string | boolean | number | null) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const tableActions: DataTableAction<MessageRow>[] = [
    {
      key: "up",
      label: "",
      icon: <ChevronUp size={14} />,
      title: "Move Up",
      variant: "ghost",
      onClick: (row) => move(row._numId, "up"),
    },
    {
      key: "down",
      label: "",
      icon: <ChevronDown size={14} />,
      title: "Move Down",
      variant: "ghost",
      onClick: (row) => move(row._numId, "down"),
    },
    {
      key: "toggle",
      label: "",
      icon: (row) => row.is_published ? <EyeOff size={14} /> : <Eye size={14} />,
      title: (row) => row.is_published ? "Unpublish" : "Publish",
      variant: "ghost",
      onClick: (row) => togglePublished(row._numId),
    },
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
            placeholder="e.g. Message from the MD — June 2026"
            value={form.title}
            onChange={(e) => { field("title", e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
            error={errors.title}
          />
          <FormTextarea
            label="Message Body"
            required
            placeholder="Write the leadership message…"
            value={form.body}
            onChange={(e) => { field("body", e.target.value); setErrors((p) => ({ ...p, body: "" })); }}
            rows={5}
            error={errors.body}
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => {
                field("is_published", e.target.checked);
                if (e.target.checked) field("published_at", new Date().toISOString());
              }}
              className="w-4 h-4 accent-brand-purple"
            />
            <span className="text-sm text-brand-text-primary">Publish immediately</span>
          </label>
        </div>
      </ActionModal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Message"
        message="This will permanently remove this leadership message from the intranet carousel."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={() => { if (deleteId !== null) { remove(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
