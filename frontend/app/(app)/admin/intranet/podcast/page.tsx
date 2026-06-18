"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import ActionModal from "@/components/ui/ActionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import { BackButton } from "@/components/ui/BackButton";
import { useIntranetPodcast } from "@/lib/modules/intranet/hooks/useIntranetPodcast";
import { useToast } from "@/hooks/useToast";
import type { PodcastEpisode } from "@/lib/modules/intranet/types/intranet.types";

type EpisodeRow = Omit<PodcastEpisode, "id"> & { id: string; _numId: number };

const EMPTY_FORM = {
  episode_number:  1,
  title:           "",
  guest_name:      "",
  duration:        "",
  cover_image_url: "",
  audio_url:       "",
  is_published:    false,
  is_featured:     false,
};
type FormState = typeof EMPTY_FORM;

const columns: Column<EpisodeRow>[] = [
  {
    key: "episode_number",
    label: "EP.",
    render: (_, row) => (
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-brand-purple">#{row.episode_number}</span>
        {row.is_featured && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <Star size={10} className="fill-amber-500 text-amber-500" />
            Featured
          </span>
        )}
      </div>
    ),
  },
  {
    key: "title",
    label: "Title",
    render: (_, row) => (
      <div>
        <p className="text-sm font-medium text-brand-text-primary max-w-sm truncate">{row.title}</p>
        {row.guest_name && (
          <p className="text-xs text-brand-text-secondary mt-0.5">with {row.guest_name}</p>
        )}
      </div>
    ),
  },
  {
    key: "duration",
    label: "Duration",
    render: (_, row) => (
      <span className="text-sm text-brand-text-secondary">{row.duration || "—"}</span>
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

export default function PodcastPage() {
  const { episodes, create, update, remove, setFeatured, togglePublished } = useIntranetPodcast();
  const toast = useToast();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<PodcastEpisode | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);

  const sorted = [...episodes].sort((a, b) => b.episode_number - a.episode_number);
  const rows: EpisodeRow[] = sorted.map((e) => ({ ...e, id: String(e.id), _numId: e.id }));

  const nextEpNumber = Math.max(0, ...episodes.map((e) => e.episode_number)) + 1;

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, episode_number: nextEpNumber });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(row: EpisodeRow) {
    const item = episodes.find((e) => e.id === row._numId)!;
    setEditTarget(item);
    setForm({
      episode_number:  item.episode_number,
      title:           item.title,
      guest_name:      item.guest_name,
      duration:        item.duration,
      cover_image_url: item.cover_image_url,
      audio_url:       item.audio_url,
      is_published:    item.is_published,
      is_featured:     item.is_featured,
    });
    setErrors({});
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim())  e.title = "Episode title is required";
    if (!form.duration.trim()) e.duration = "Duration is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const ts = new Date().toISOString();
    if (editTarget) {
      update(editTarget.id, { ...form, updated_at: ts });
    } else {
      create({ ...form });
    }
    setSaving(false);
    toast.success(editTarget ? "Episode updated." : "Episode created.");
    handleClose();
  }

  function field(key: keyof FormState, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "title" || key === "duration") setErrors((p) => ({ ...p, [key]: "" }));
  }

  const tableActions: DataTableAction<EpisodeRow>[] = [
    {
      key: "feature",
      label: "",
      icon: (row) => <Star size={14} className={row.is_featured ? "fill-amber-500 text-amber-500" : ""} />,
      title: (row) => row.is_featured ? "Currently featured" : "Set as featured",
      variant: "ghost",
      className: "hover:bg-amber-50 hover:text-amber-600",
      onClick: (row) => { if (!row.is_featured) setFeatured(row._numId); },
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
    <AppLayout pageTitle="Podcast">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="Podcast Episodes"
        description="Manage all podcast episodes. The ★ featured episode is shown on the intranet homepage."
        className="mb-6"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            New Episode
          </Button>
        }
      />

      <DataTable<EpisodeRow>
        columns={columns}
        data={rows}
        showActions
        actions={tableActions}
        actionsLabel="Actions"
        searchable
        searchPlaceholder="Search episodes…"
        emptyMessage="No episodes yet."
        emptyDescription="Click 'New Episode' to add one."
      />

      {/* Create / Edit panel */}
      <ActionModal
        open={modalOpen}
        onClose={handleClose}
        title={editTarget ? "Edit Episode" : "New Episode"}
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
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Episode Number"
              required
              type="number"
              value={String(form.episode_number)}
              onChange={(e) => field("episode_number", Number(e.target.value))}
            />
            <FormInput
              label="Duration"
              required
              placeholder="e.g. 38 min"
              value={form.duration}
              onChange={(e) => field("duration", e.target.value)}
              error={errors.duration}
            />
          </div>
          <FormInput
            label="Episode Title"
            required
            placeholder="e.g. Nigeria's Gas-to-Power Opportunity"
            value={form.title}
            onChange={(e) => field("title", e.target.value)}
            error={errors.title}
          />
          <FormInput
            label="Guest / Host"
            placeholder="e.g. MD & Chief Engineer"
            value={form.guest_name}
            onChange={(e) => field("guest_name", e.target.value)}
          />
          <FormInput
            label="Cover Image URL"
            placeholder="https://…"
            value={form.cover_image_url}
            onChange={(e) => field("cover_image_url", e.target.value)}
          />
          <FormInput
            label="Audio / Stream URL"
            placeholder="https://…"
            value={form.audio_url}
            onChange={(e) => field("audio_url", e.target.value)}
          />
          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => field("is_published", e.target.checked)}
                className="w-4 h-4 accent-brand-purple"
              />
              <span className="text-sm text-brand-text-primary">Published</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => field("is_featured", e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-sm text-brand-text-primary">
                Set as featured <span className="text-brand-text-secondary text-xs">(shown on intranet homepage)</span>
              </span>
            </label>
          </div>
        </div>
      </ActionModal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Episode"
        message="This will permanently remove this episode. This cannot be undone."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={() => { if (deleteId !== null) { remove(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
