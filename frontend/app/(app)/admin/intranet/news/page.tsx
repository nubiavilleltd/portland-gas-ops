"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import ActionModal from "@/components/ui/ActionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import { BackButton } from "@/components/ui/BackButton";
import { useIntranetNews } from "@/lib/modules/intranet/hooks/useIntranetNews";
import { useToast } from "@/hooks/useToast";
import type { NewsItem, NewsCategory } from "@/lib/modules/intranet/types/intranet.types";

// DataTable requires id: string
type NewsRow = Omit<NewsItem, "id"> & { id: string; _numId: number };

const CATEGORY_OPTIONS: { value: NewsCategory; label: string }[] = [
  { value: "Company News",   label: "Company News" },
  { value: "Announcement",   label: "Announcement" },
  { value: "Policy Update",  label: "Policy Update" },
  { value: "Project Update", label: "Project Update" },
  { value: "Safety",         label: "Safety" },
  { value: "Events",         label: "Events" },
];

const CATEGORY_BADGE: Record<NewsCategory, "purple" | "warning" | "neutral" | "danger" | "info"> = {
  "Company News":   "purple",
  "Announcement":   "warning",
  "Policy Update":  "neutral",
  "Project Update": "info",
  "Safety":         "danger",
  "Events":         "warning",
};

const columns: Column<NewsRow>[] = [
  {
    key: "title",
    label: "Title",
    render: (_, row) => (
      <div>
        <p className="font-medium text-brand-text-primary">{row.title}</p>
        <p className="text-xs text-brand-text-secondary mt-0.5">{row.author_name}</p>
      </div>
    ),
  },
  {
    key: "category",
    label: "Category",
    render: (_, row) => <Badge variant={CATEGORY_BADGE[row.category]} label={row.category} />,
  },
  {
    key: "is_published",
    label: "Status",
    render: (_, row) => (
      <Badge variant={row.is_published ? "success" : "neutral"} label={row.is_published ? "Published" : "Draft"} />
    ),
  },
  {
    key: "published_at",
    label: "Date",
    render: (_, row) => (
      <span className="text-sm text-brand-text-secondary">
        {row.published_at
          ? new Date(row.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          : "—"}
      </span>
    ),
  },
];

const EMPTY_FORM = {
  title:           "",
  body:            "",
  category:        "Company News" as NewsCategory,
  cover_image_url: "",
  author_name:     "",
  is_published:    false,
  published_at:    null as string | null,
};
type FormState = typeof EMPTY_FORM;

export default function IntranetNewsPage() {
  const { items, create, update, remove, togglePublished } = useIntranetNews();
  const toast = useToast();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<NewsItem | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  // Map to string-id rows for DataTable
  const rows: NewsRow[] = items.map((n) => ({ ...n, id: String(n.id), _numId: n.id }));

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(row: NewsRow) {
    const item = items.find((n) => n.id === row._numId)!;
    setEditTarget(item);
    setForm({
      title:           item.title,
      body:            item.body,
      category:        item.category,
      cover_image_url: item.cover_image_url,
      author_name:     item.author_name,
      is_published:    item.is_published,
      published_at:    item.published_at,
    });
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim() || !form.author_name.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const ts = new Date().toISOString();
    if (editTarget) {
      update(editTarget.id, { ...form, updated_at: ts });
    } else {
      create({ ...form });
    }
    setSaving(false);
    toast.success(editTarget ? "Article updated." : "Article created.");
    handleClose();
  }

  function field(key: keyof FormState, value: string | boolean | null) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const tableActions: DataTableAction<NewsRow>[] = [
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
    <AppLayout pageTitle="News & Announcements">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="News & Announcements"
        description="Manage articles and announcements shown on the intranet"
        className="mb-6"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            New Article
          </Button>
        }
      />

      <DataTable<NewsRow>
        columns={columns}
        data={rows}
        showActions
        actions={tableActions}
        actionsLabel="Actions"
        searchable
        searchPlaceholder="Search articles…"
        emptyMessage="No articles yet."
        emptyDescription="Click 'New Article' to add one."
      />

      {/* Create / Edit panel */}
      <ActionModal
        open={modalOpen}
        onClose={handleClose}
        title={editTarget ? "Edit Article" : "New Article"}
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
          <FormInput
            label="Title"
            required
            placeholder="Article headline"
            value={form.title}
            onChange={(e) => field("title", e.target.value)}
          />
          <FormSelect
            label="Category"
            required
            options={CATEGORY_OPTIONS}
            value={form.category}
            onValueChange={(v) => field("category", v as NewsCategory)}
          />
          <FormInput
            label="Author / Source"
            required
            placeholder="e.g. Corporate Communications"
            value={form.author_name}
            onChange={(e) => field("author_name", e.target.value)}
          />
          <FormTextarea
            label="Body"
            required
            placeholder="Article content or excerpt…"
            value={form.body}
            onChange={(e) => field("body", e.target.value)}
            rows={5}
          />
          <FormInput
            label="Cover Image URL"
            placeholder="https://…"
            value={form.cover_image_url}
            onChange={(e) => field("cover_image_url", e.target.value)}
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
        title="Delete Article"
        message="This will permanently remove the article from the intranet. This cannot be undone."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={() => { if (deleteId !== null) { remove(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
