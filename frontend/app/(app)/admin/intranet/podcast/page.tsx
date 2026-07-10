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
import FormFileUpload from "@/components/forms/FormFileUpload";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { BackButton } from "@/components/ui/BackButton";
import { useIntranetPodcast } from "@/lib/modules/intranet/hooks/useIntranetPodcast";
import { useToast } from "@/hooks/useToast";
import type { PodcastEpisode, PodcastMediaType } from "@/lib/modules/intranet/types/intranet.types";

type EpisodeRow = Omit<PodcastEpisode, "id"> & { id: string; _numId: number };

const MEDIA_TYPE_OPTIONS    = [{ value: "audio", label: "Audio" }, { value: "video", label: "Video" }];
const MEDIA_SOURCE_OPTIONS  = [{ value: "url", label: "Paste Link" }, { value: "upload", label: "Upload File" }];
const COVER_SOURCE_OPTIONS  = [{ value: "url", label: "Paste URL" }, { value: "upload", label: "Upload Image" }];
const DURATION_UNIT_OPTIONS = [{ value: "sec", label: "sec" }, { value: "min", label: "min" }, { value: "hr", label: "hr" }];

const EMPTY_FORM = {
  episode_number:    1,
  title:             "",
  guest_name:        "",
  duration_value:    "",
  duration_unit:     "min" as "sec" | "min" | "hr",
  cover_image_url:   "",
  cover_mode:        "url" as "url" | "upload",
  audio_url:         "",
  media_mode:        "url" as "url" | "upload",
  media_type:        "audio" as PodcastMediaType,
  is_published:      false,
  is_featured:       false,
};
type FormState = typeof EMPTY_FORM;

function parseDuration(raw: string): { duration_value: string; duration_unit: "sec" | "min" | "hr" } {
  const match = raw.trim().match(/^(\d+)\s*(sec|min|hr)?/i);
  if (!match) return { duration_value: raw, duration_unit: "min" };
  const unit = (match[2]?.toLowerCase() ?? "min") as "sec" | "min" | "hr";
  return { duration_value: match[1], duration_unit: unit };
}

function formatDuration(value: string, unit: "sec" | "min" | "hr") {
  if (!value.trim()) return "";
  return `${value.trim()} ${unit}`;
}

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
    key: "media_type",
    label: "Type",
    render: (_, row) => (
      <Badge variant={row.media_type === "video" ? "purple" : "info"} label={row.media_type === "video" ? "Video" : "Audio"} />
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
    const { duration_value, duration_unit } = parseDuration(item.duration);
    setForm({
      episode_number:  item.episode_number,
      title:           item.title,
      guest_name:      item.guest_name,
      duration_value,
      duration_unit,
      cover_image_url: item.cover_image_url,
      cover_mode:      "url",
      audio_url:       item.audio_url,
      media_mode:      "url",
      media_type:      item.media_type,
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
    if (!form.title.trim()) e.title = "Episode title is required";
    if (!form.duration_value.trim()) e.duration_value = "Duration is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const ts = new Date().toISOString();
    const duration = formatDuration(form.duration_value, form.duration_unit);
    const payload = {
      episode_number:  form.episode_number,
      title:           form.title,
      guest_name:      form.guest_name,
      duration,
      cover_image_url: form.cover_image_url,
      audio_url:       form.audio_url,
      media_type:      form.media_type,
      is_published:    form.is_published,
      is_featured:     form.is_featured,
    };
    if (editTarget) {
      update(editTarget.id, { ...payload, updated_at: ts });
    } else {
      create({ ...payload });
    }
    setSaving(false);
    toast.success(editTarget ? "Episode updated." : "Episode created.");
    handleClose();
  }

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "title" || key === "duration_value") setErrors((p) => ({ ...p, [key]: "" }));
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
            {/* Duration: number input + unit pill buttons */}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-brand-text-primary">
                Duration <span className="text-red-500">*</span>
              </p>
              <div className="flex h-10 rounded-lg border border-brand-border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-purple focus-within:border-transparent">
                <input
                  type="number"
                  min="1"
                  placeholder="38"
                  value={form.duration_value}
                  onChange={(e) => field("duration_value", e.target.value)}
                  className="flex-1 min-w-0 px-3 text-sm text-brand-text-primary outline-none bg-transparent"
                />
                <div className="flex items-center border-l border-brand-border bg-gray-50 px-1 gap-0.5">
                  {DURATION_UNIT_OPTIONS.map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => field("duration_unit", u.value as "sec" | "min" | "hr")}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        form.duration_unit === u.value
                          ? "bg-brand-purple text-white"
                          : "text-brand-text-secondary hover:text-brand-text-primary"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
              {errors.duration_value && <p className="text-xs text-red-600">{errors.duration_value}</p>}
            </div>
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

          {/* Media type: Audio or Video */}
          <SegmentedControl
            label="Podcast Type"
            options={MEDIA_TYPE_OPTIONS}
            value={form.media_type}
            onChange={(v) => field("media_type", v as PodcastMediaType)}
          />

          {/* Cover Image */}
          <div className="space-y-3">
            <SegmentedControl
              label="Cover Image"
              options={COVER_SOURCE_OPTIONS}
              value={form.cover_mode}
              onChange={(v) => {
                field("cover_mode", v as "url" | "upload");
                field("cover_image_url", "");
              }}
            />
            {form.cover_mode === "url" ? (
              <FormInput
                label=""
                placeholder="https://…"
                value={form.cover_image_url}
                onChange={(e) => field("cover_image_url", e.target.value)}
              />
            ) : (
              <FormFileUpload
                label=""
                accept="image/*"
                hint="JPG, PNG or WebP — max 5 MB"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) field("cover_image_url", URL.createObjectURL(file));
                }}
              />
            )}
          </div>

          {/* Media file */}
          <div className="space-y-3">
            <SegmentedControl
              label={form.media_type === "video" ? "Video Source" : "Audio Source"}
              options={MEDIA_SOURCE_OPTIONS}
              value={form.media_mode}
              onChange={(v) => {
                field("media_mode", v as "url" | "upload");
                field("audio_url", "");
              }}
            />
            {form.media_mode === "url" ? (
              <FormInput
                label=""
                placeholder={form.media_type === "video" ? "https://youtube.com/… or direct .mp4" : "https://… or Spotify / Anchor link"}
                value={form.audio_url}
                onChange={(e) => field("audio_url", e.target.value)}
              />
            ) : (
              <FormFileUpload
                label=""
                accept={form.media_type === "video" ? "video/*" : "audio/*"}
                hint={form.media_type === "video" ? "MP4 or WebM — max 500 MB" : "MP3 or WAV — max 100 MB"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) field("audio_url", URL.createObjectURL(file));
                }}
              />
            )}
          </div>

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
