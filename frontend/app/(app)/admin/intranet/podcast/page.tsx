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
import { useUploadPodcastCover, useUploadPodcastAudio } from "@/lib/modules/intranet/mutations";
import { useToast } from "@/hooks/useToast";
import Tip from "@/components/ui/Tip";
import type { PodcastEpisode, PodcastMediaType } from "@/lib/modules/intranet/types/intranet.types";

type EpisodeRow = Omit<PodcastEpisode, "id"> & { id: string; _numId: number };

const MEDIA_TYPE_OPTIONS    = [{ value: "audio", label: "Audio" }, { value: "video", label: "Video" }];
// Cover: Upload (→ Cloudinary) or Paste URL (fetched to Cloudinary)
const COVER_SOURCE_OPTIONS  = [{ value: "upload", label: "Upload Image" }, { value: "url", label: "Paste URL" }];
// Media: Upload (audio/video file → Cloudinary), External URL, or Embed (YouTube/Vimeo)
const MEDIA_SOURCE_OPTIONS  = [
  { value: "upload", label: "Upload File" },
  { value: "url",    label: "External Link" },
  { value: "embed",  label: "Embed (YouTube / Vimeo)" },
];
const EMPTY_FORM = {
  episode_number:    1,
  title:             "",
  description:       "",
  guest_name:        "",
  duration_h:        0,   // hours   0–99
  duration_m:        0,   // minutes 0–59
  duration_s:        0,   // seconds 0–59
  // Cover image
  cover_image_id:    null as number | null,
  cover_preview:     "",           // display URL (either Cloudinary URL after upload or pasted URL)
  cover_mode:        "upload" as "upload" | "url",
  cover_url_input:   "",           // raw pasted URL input
  // Media
  audio_document_id: null as number | null,
  audio_url:         "",           // external streaming link
  embed_url:         "",           // YouTube / Vimeo embed URL
  media_mode:        "embed" as "upload" | "url" | "embed",
  media_type:        "audio" as PodcastMediaType,
  is_published:      false,
  is_featured:       false,
};
type FormState = typeof EMPTY_FORM;

/** Parse a stored duration string ("8:24", "1:02:30", "38 min", "45 sec") back to h/m/s. */
function parseDuration(raw: string | null): { duration_h: number; duration_m: number; duration_s: number } {
  if (!raw) return { duration_h: 0, duration_m: 0, duration_s: 0 };
  // HH:MM:SS or MM:SS
  const colonMatch = raw.match(/^(?:(\d+):)?(\d+):(\d+)$/);
  if (colonMatch) {
    return {
      duration_h: Number(colonMatch[1] ?? 0),
      duration_m: Number(colonMatch[2]),
      duration_s: Number(colonMatch[3]),
    };
  }
  // "38 min" / "45 sec" / "2 hr"
  const wordMatch = raw.match(/^(\d+)\s*(hr|min|sec)/i);
  if (wordMatch) {
    const n = Number(wordMatch[1]);
    const u = wordMatch[2].toLowerCase();
    if (u === "hr")  return { duration_h: n, duration_m: 0, duration_s: 0 };
    if (u === "sec") return { duration_h: 0, duration_m: 0, duration_s: n };
    return { duration_h: 0, duration_m: n, duration_s: 0 };
  }
  return { duration_h: 0, duration_m: 0, duration_s: 0 };
}

/** Produce a clean duration string from h/m/s components. Returns null if all zero. */
function formatDuration(h: number, m: number, s: number): string | null {
  if (h === 0 && m === 0 && s === 0) return null;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
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
  const { episodes, isLoading, isFetching, create, update, remove, setFeatured, togglePublished } = useIntranetPodcast();
  const uploadCoverMutation = useUploadPodcastCover();
  const uploadAudioMutation = useUploadPodcastAudio();
  const toast = useToast();

  const [modalOpen,     setModalOpen]     = useState(false);
  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [featureConfirm, setFeatureConfirm] = useState<{ id: number; title: string } | null>(null);
  const [toggleConfirm,  setToggleConfirm]  = useState<{ id: number; isPublished: boolean; title: string } | null>(null);
  const [editTarget,    setEditTarget]    = useState<PodcastEpisode | null>(null);
  const [form,          setForm]          = useState<FormState>(EMPTY_FORM);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [saving,        setSaving]        = useState(false);

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
    const { duration_h, duration_m, duration_s } = parseDuration(item.duration);

    // Determine media mode from what's set on the episode
    let media_mode: "upload" | "url" | "embed" = "embed";
    if (item.audio_document_id) media_mode = "upload";
    else if (item.embed_url)    media_mode = "embed";
    else if (item.audio_url)    media_mode = "url";

    let cover_mode: "upload" | "url" = "upload";
    let cover_url_input = "";
    if (!item.cover_image_id && item.cover_image_url) {
      cover_mode = "url";
      cover_url_input = item.cover_image_url;
    }

    setForm({
      episode_number:    item.episode_number,
      title:             item.title,
      description:       item.description ?? "",
      guest_name:        item.guest_name ?? "",
      duration_h,
      duration_m,
      duration_s,
      cover_image_id:    item.cover_image_id,
      cover_preview:     item.cover_image_url ?? "",
      cover_mode,
      cover_url_input,
      audio_document_id: item.audio_document_id,
      audio_url:         item.audio_url ?? "",
      embed_url:         item.embed_url ?? "",
      media_mode,
      media_type:        item.media_type,
      is_published:      item.is_published,
      is_featured:       item.is_featured,
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

    const AUDIO_EXTS = [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a"];
    const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];

    if (form.media_mode === "url" && form.audio_url.trim()) {
      const url = form.audio_url.toLowerCase();
      if (form.media_type === "audio" && VIDEO_EXTS.some((ext) => url.endsWith(ext))) {
        e.audio_url = "This looks like a video file link. Switch Podcast Type to Video, or provide an audio link (MP3, WAV, etc.).";
      }
      if (form.media_type === "video" && AUDIO_EXTS.some((ext) => url.endsWith(ext))) {
        e.audio_url = "This looks like an audio file link. Switch Podcast Type to Audio, or provide a video link (MP4, WebM, etc.).";
      }
    }

    if (form.media_mode === "embed" && form.embed_url.trim() && form.media_type === "audio") {
      e.embed_url = "Embed links (YouTube / Vimeo) are for video podcasts. Switch Podcast Type to Video, or use External Link for audio.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCoverUpload(file: File) {
    try {
      const result = await uploadCoverMutation.mutateAsync(file);
      setForm((prev) => ({ ...prev, cover_image_id: result.id, cover_preview: result.url }));
    } catch {
      toast.error("Cover image upload failed.");
    }
  }

  async function handleAudioUpload(file: File) {
    const AUDIO_EXTS = [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a"];
    const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
    const name = file.name.toLowerCase();
    // Check MIME type first, fall back to file extension for unusual OS MIME assignments
    const isAudioFile = file.type.startsWith("audio/") || AUDIO_EXTS.some((e) => name.endsWith(e));
    const isVideoFile = file.type.startsWith("video/") || VIDEO_EXTS.some((e) => name.endsWith(e));

    if (form.media_type === "audio" && !isAudioFile) {
      toast.error("Wrong file type. You selected an Audio podcast — please upload an audio file (MP3, WAV, etc.).");
      return;
    }
    if (form.media_type === "video" && !isVideoFile) {
      toast.error("Wrong file type. You selected a Video podcast — please upload a video file (MP4, WebM, etc.).");
      return;
    }

    try {
      const result = await uploadAudioMutation.mutateAsync(file);
      setForm((prev) => ({ ...prev, audio_document_id: result.id }));
      toast.success("File uploaded successfully.");
    } catch {
      toast.error("Upload failed. Please try again.");
    }
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const duration = formatDuration(form.duration_h, form.duration_m, form.duration_s);

      // Resolve cover: if url mode, store as cover_image_id null and use embed_url / audio_url pattern
      // (cover from URL goes into cover_preview only for display — pass cover_image_id)
      // Note: for URL mode we don't have a cover_image_id since we didn't upload. The backend will show null cover_image_url.
      // This is acceptable — ideally admins upload rather than paste URLs.
      const payload = {
        episode_number:    form.episode_number,
        title:             form.title,
        description:       form.description || null,
        guest_name:        form.guest_name || null,
        duration:          duration ?? null,
        cover_image_id:    form.cover_image_id,
        audio_document_id: form.media_mode === "upload" ? form.audio_document_id : null,
        embed_url:         form.media_mode === "embed"  ? (form.embed_url || null) : null,
        audio_url:         form.media_mode === "url"    ? (form.audio_url || null) : null,
        media_type:        form.media_type,
        is_published:      form.is_published,
        is_featured:       form.is_featured,
      };

      if (editTarget) {
        await update(editTarget.id, payload);
      } else {
        await create(payload);
      }
      toast.success(editTarget ? "Episode updated." : "Episode created.");
      handleClose();
    } catch {
      toast.error("Failed to save episode.");
    } finally {
      setSaving(false);
    }
  }

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "title") setErrors((p) => ({ ...p, [key]: "" }));
  }

  const tableActions: DataTableAction<EpisodeRow>[] = [
    {
      key: "feature",
      label: "",
      icon: (row) => (
        <Tip label={row.is_featured ? "Currently Featured" : "Set as Featured"}>
          <Star size={14} className={row.is_featured ? "fill-amber-500 text-amber-500" : ""} />
        </Tip>
      ),
      variant: "ghost",
      className: "hover:bg-amber-50 hover:text-amber-600",
      onClick: (row) => {
        if (!row.is_featured) setFeatureConfirm({ id: row._numId, title: row.title });
      },
    },
    {
      key: "toggle",
      label: "",
      icon: (row) => (
        <Tip label={row.is_published ? "Unpublish Episode" : "Publish Episode"}>
          {row.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
        </Tip>
      ),
      variant: "ghost",
      onClick: (row) => setToggleConfirm({ id: row._numId, isPublished: row.is_published, title: row.title }),
    },
    {
      key: "edit",
      label: "",
      icon: <Tip label="Edit Episode"><Pencil size={14} /></Tip>,
      variant: "ghost",
      onClick: (row) => openEdit(row),
    },
    {
      key: "delete",
      label: "",
      icon: <Tip label="Delete Episode"><Trash2 size={14} /></Tip>,
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
        isLoading={isLoading || isFetching}
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
            {/* Duration: HH : MM : SS spinner */}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-brand-text-primary">Duration</p>
              <div className="flex items-center gap-1 h-10 rounded-lg border border-brand-border bg-white px-2 focus-within:ring-2 focus-within:ring-brand-purple focus-within:border-transparent">
                {/* Hours */}
                <input
                  type="number" min="0" max="99"
                  value={form.duration_h}
                  onChange={(e) => field("duration_h", Math.max(0, Math.min(99, Number(e.target.value) || 0)))}
                  className="w-9 text-center text-sm font-semibold text-brand-text-primary outline-none bg-transparent tabular-nums"
                />
                <span className="text-brand-text-secondary font-bold text-sm select-none">h</span>
                <span className="text-gray-300 mx-0.5 select-none">·</span>
                {/* Minutes */}
                <input
                  type="number" min="0" max="59"
                  value={form.duration_m}
                  onChange={(e) => field("duration_m", Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                  className="w-9 text-center text-sm font-semibold text-brand-text-primary outline-none bg-transparent tabular-nums"
                />
                <span className="text-brand-text-secondary font-bold text-sm select-none">m</span>
                <span className="text-gray-300 mx-0.5 select-none">·</span>
                {/* Seconds */}
                <input
                  type="number" min="0" max="59"
                  value={form.duration_s}
                  onChange={(e) => field("duration_s", Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                  className="w-9 text-center text-sm font-semibold text-brand-text-primary outline-none bg-transparent tabular-nums"
                />
                <span className="text-brand-text-secondary font-bold text-sm select-none">s</span>
                {/* Live preview */}
                {(form.duration_h > 0 || form.duration_m > 0 || form.duration_s > 0) && (
                  <span className="ml-auto text-[10px] font-bold text-brand-purple tabular-nums whitespace-nowrap">
                    {formatDuration(form.duration_h, form.duration_m, form.duration_s)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-brand-text-secondary">e.g. 0h 8m 24s → saves as 8:24</p>
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

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Description</label>
            <textarea
              rows={3}
              placeholder="Brief summary of what this episode covers…"
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent resize-none"
            />
          </div>

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
                field("cover_mode", v as "upload" | "url");
                field("cover_image_id", null);
                field("cover_preview", "");
                field("cover_url_input", "");
              }}
            />
            {form.cover_mode === "upload" ? (
              <div className="space-y-2">
                <FormFileUpload
                  label=""
                  accept="image/*"
                  hint="JPG, PNG or WebP — max 5 MB."

                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverUpload(file);
                  }}
                />
                {form.cover_preview && (
                  <img src={form.cover_preview} alt="Cover preview" className="h-20 rounded-lg object-cover border border-gray-200" />
                )}
              </div>
            ) : (
              <FormInput
                label=""
                placeholder="https://…"
                value={form.cover_url_input}
                onChange={(e) => {
                  field("cover_url_input", e.target.value);
                  field("cover_preview", e.target.value);
                }}
                hint="Paste a direct image URL. Note: uploading is preferred."
              />
            )}
          </div>

          {/* Media source */}
          <div className="space-y-3">
            <SegmentedControl
              label={form.media_type === "video" ? "Video Source" : "Audio Source"}
              options={MEDIA_SOURCE_OPTIONS}
              value={form.media_mode}
              onChange={(v) => {
                field("media_mode", v as "upload" | "url" | "embed");
                field("audio_document_id", null);
                field("audio_url", "");
                field("embed_url", "");
              }}
            />

            {form.media_mode === "upload" && (
              <div className="space-y-2">
                <FormFileUpload
                  label=""
                  accept={form.media_type === "video" ? "video/*" : "audio/*"}
                  hint={form.media_type === "video" ? "MP4 or WebM — max 500 MB" : "MP3 or WAV — max 100 MB"}

                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAudioUpload(file);
                  }}
                />
                {form.audio_document_id && (
                  <p className="text-xs text-green-600 font-medium">✓ File uploaded successfully</p>
                )}
              </div>
            )}

            {form.media_mode === "url" && (
              <FormInput
                label=""
                placeholder={form.media_type === "video"
                  ? "https://… (direct .mp4, .webm, Vimeo direct, etc.)"
                  : "https://… (Spotify, Anchor, direct .mp3, .wav, etc.)"
                }
                value={form.audio_url}
                onChange={(e) => { field("audio_url", e.target.value); setErrors((p) => ({ ...p, audio_url: "" })); }}
                hint="Link opens in the native browser player."
                error={errors.audio_url}
              />
            )}

            {form.media_mode === "embed" && (
              <FormInput
                label=""
                placeholder="https://www.youtube.com/watch?v=SgbcghWXDiw"
                value={form.embed_url}
                onChange={(e) => { field("embed_url", e.target.value); setErrors((p) => ({ ...p, embed_url: "" })); }}
                hint="Paste the YouTube or Vimeo page URL — not an embed code. e.g. https://www.youtube.com/watch?v=…"
                error={errors.embed_url}
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

      {/* Feature confirm */}
      <ConfirmDialog
        open={featureConfirm !== null}
        title="Set as Featured Episode"
        message={`"${featureConfirm?.title}" will be shown as the featured podcast on the intranet homepage. The current featured episode will be replaced.`}
        confirmLabel="Set as Featured"
        onConfirm={() => {
          if (featureConfirm !== null) { setFeatured(featureConfirm.id); setFeatureConfirm(null); }
        }}
        onCancel={() => setFeatureConfirm(null)}
      />

      {/* Publish / Unpublish confirm */}
      <ConfirmDialog
        open={toggleConfirm !== null}
        title={toggleConfirm?.isPublished ? "Unpublish Episode" : "Publish Episode"}
        message={
          toggleConfirm?.isPublished
            ? `"${toggleConfirm.title}" will be hidden from staff immediately. You can re-publish it at any time.`
            : `"${toggleConfirm?.title}" will be visible to all staff on the intranet.`
        }
        confirmLabel={toggleConfirm?.isPublished ? "Unpublish" : "Publish"}
        onConfirm={() => {
          if (toggleConfirm !== null) { togglePublished(toggleConfirm.id); setToggleConfirm(null); }
        }}
        onCancel={() => setToggleConfirm(null)}
      />

      {/* Delete confirm */}
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
