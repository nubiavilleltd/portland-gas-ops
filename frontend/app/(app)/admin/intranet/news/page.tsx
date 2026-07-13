"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Tag, X, Loader2 } from "lucide-react";
import Image from "next/image";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import ActionModal from "@/components/ui/ActionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FormInput from "@/components/forms/FormInput";
import RichTextEditor from "@/components/forms/RichTextEditor";
import FormSelect from "@/components/forms/FormSelect";
import FormFileUpload from "@/components/forms/FormFileUpload";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { BackButton } from "@/components/ui/BackButton";
import { useIntranetNewsAdmin, useIntranetNewsCategories } from "@/lib/modules/intranet/queries";
import {
  useCreateNews, useUpdateNews, useDeleteNews, useToggleNewsPublished,
  useCreateNewsCategory, useDeleteNewsCategory,
  useUploadNewsImage, useUploadNewsImageFromUrl,
} from "@/lib/modules/intranet/mutations";
import { useToast } from "@/hooks/useToast";
import { z } from "zod";
import type { NewsItem, NewsCategory, NewsCategoryColor } from "@/lib/modules/intranet/types/intranet.types";

// DataTable requires id: string
type NewsRow = Omit<NewsItem, "id"> & { id: string; _numId: number };

// Maps a color key to Tailwind-safe badge classes (all must be in source — not dynamic strings)
const COLOR_BADGE_CLASS: Record<string, string> = {
  purple: "bg-purple-100 text-purple-700",
  yellow: "bg-yellow-100 text-yellow-800",
  gray:   "bg-gray-100 text-gray-700",
  red:    "bg-red-100 text-red-700",
  blue:   "bg-blue-100 text-blue-700",
  green:  "bg-green-100 text-green-700",
  teal:   "bg-teal-100 text-teal-700",
  orange: "bg-orange-100 text-orange-700",
};

// Swatch dot colours — inline styles so Tailwind purging doesn't affect them
const COLOR_SWATCHES: { value: NewsCategoryColor; hex: string; label: string }[] = [
  { value: "purple", hex: "#7C3AED", label: "Purple"  },
  { value: "yellow", hex: "#F59E0B", label: "Yellow"  },
  { value: "gray",   hex: "#6B7280", label: "Gray"    },
  { value: "red",    hex: "#EF4444", label: "Red"     },
  { value: "blue",   hex: "#3B82F6", label: "Blue"    },
  { value: "green",  hex: "#22C55E", label: "Green"   },
  { value: "teal",   hex: "#14B8A6", label: "Teal"    },
  { value: "orange", hex: "#F97316", label: "Orange"  },
];

const columns: Column<NewsRow>[] = [
  {
    key: "title",
    label: "Title",
    className: "max-w-xs",
    render: (_, row) => (
      <div className="min-w-0">
        <p className="font-medium text-brand-text-primary truncate max-w-xs">{row.title}</p>
        <p className="text-xs text-brand-text-secondary mt-0.5 truncate max-w-xs">{row.author_name}</p>
      </div>
    ),
  },
  {
    key: "category",
    label: "Category",
    className: "whitespace-nowrap",
    render: (_, row) => (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
        {row.category}
      </span>
    ),
  },
  {
    key: "is_published",
    label: "Status",
    className: "whitespace-nowrap",
    render: (_, row) => (
      <Badge variant={row.is_published ? "success" : "neutral"} label={row.is_published ? "Published" : "Draft"} />
    ),
  },
  {
    key: "published_at",
    label: "Date",
    className: "whitespace-nowrap",
    render: (_, row) => (
      <span className="text-sm text-brand-text-secondary whitespace-nowrap">
        {row.published_at
          ? new Date(row.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          : "—"}
      </span>
    ),
  },
];

const COVER_OPTIONS = [
  { value: "url",    label: "Paste URL" },
  { value: "upload", label: "Upload from device" },
];

// ── Validation ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const articleSchema = z.object({
  title:      z.string().min(1, "Title is required").max(255, "Title is too long"),
  body:       z.string().min(1, "Body is required").refine(
    (v) => v.replace(/<[^>]*>/g, "").trim().length > 0,
    "Body cannot be empty"
  ),
  category:   z.string().min(1, "Category is required"),
  author_name: z.string().min(1, "Author / source is required").max(200, "Too long"),
  cover_image_url:  z.string().optional().refine(
    (v) => !v || v.startsWith("http://") || v.startsWith("https://"),
    "URL must start with http:// or https://"
  ),
  cover_image_file: z
    .instanceof(File)
    .optional()
    .nullable()
    .refine((f) => !f || ALLOWED_TYPES.includes(f.type), "Only JPG, PNG, WebP, or GIF allowed")
    .refine((f) => !f || f.size <= MAX_FILE_BYTES, "Image must be 5 MB or smaller"),
});

type ArticleErrors = Partial<Record<keyof z.infer<typeof articleSchema>, string>>;

const EMPTY_FORM = {
  title:            "",
  body:             "",
  category:         "",
  cover_image_mode:  "url" as "url" | "upload",
  cover_image_url:   "",           // typed URL (paste URL mode) — uploaded on Save
  cover_image_file:  null as File | null,  // selected file (upload mode) — uploaded on Save
  cover_image_id:    null as number | null, // existing FK (populated when editing)
  cover_image_preview: "",         // shown when editing (existing Cloudinary URL)
  author_name:      "",
  is_published:     false,
  published_at:     null as string | null,
};
type FormState = typeof EMPTY_FORM;

export default function IntranetNewsPage() {
  const { data: items = [], isLoading }         = useIntranetNewsAdmin();
  const { data: categories = [] }               = useIntranetNewsCategories();
  const createMutation        = useCreateNews();
  const deleteMutation        = useDeleteNews();
  const toggleMutation        = useToggleNewsPublished();
  const createCatMutation     = useCreateNewsCategory();
  const deleteCatMutation     = useDeleteNewsCategory();
  const uploadFileMutation    = useUploadNewsImage();
  const uploadUrlMutation     = useUploadNewsImageFromUrl();
  const toast = useToast();

  const [modalOpen,      setModalOpen]      = useState(false);
  const [catPanelOpen,   setCatPanelOpen]   = useState(false);
  const [deleteId,       setDeleteId]       = useState<number | null>(null);
  const [editTarget,     setEditTarget]     = useState<NewsItem | null>(null);
  const [form,           setForm]           = useState<FormState>(EMPTY_FORM);
  const [formErrors,     setFormErrors]     = useState<ArticleErrors>({});
  const [newCatName,     setNewCatName]     = useState("");
  const [newCatColor,    setNewCatColor]    = useState<NewsCategoryColor>("gray");
  const [deleteCatId,    setDeleteCatId]    = useState<number | null>(null);
  const [toggleConfirm,  setToggleConfirm]  = useState<{ id: number; isPublished: boolean } | null>(null);

  // update mutation at top level with stable id
  const updateMutation = useUpdateNews(editTarget?.id ?? 0);
  const uploading      = uploadFileMutation.isPending || uploadUrlMutation.isPending;
  const saving         = createMutation.isPending || updateMutation.isPending || uploading;

  // Category dropdown options built from DB
  const categoryOptions = categories.map((c) => ({ value: c.name, label: c.name }));

  // Map to string-id rows for DataTable
  const rows: NewsRow[] = items.map((n) => ({ ...n, id: String(n.id), _numId: n.id }));

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?.name ?? "" });
    setModalOpen(true);
  }

  function openEdit(row: NewsRow) {
    const item = items.find((n) => n.id === row._numId)!;
    setEditTarget(item);
    setForm({
      title:               item.title,
      body:                item.body,
      category:            item.category,
      cover_image_mode:    "url" as const,
      cover_image_url:     "",
      cover_image_file:    null,
      cover_image_id:      item.cover_image_id ?? null,
      cover_image_preview: item.cover_image_url ?? "",
      author_name:         item.author_name,
      is_published:        item.is_published,
      published_at:        item.published_at,
    });
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  }

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    // Validate
    const parsed = articleSchema.safeParse({
      title:            form.title,
      body:             form.body,
      category:         form.category,
      author_name:      form.author_name,
      cover_image_url:  form.cover_image_mode === "url" ? form.cover_image_url : undefined,
      cover_image_file: form.cover_image_mode === "upload" ? form.cover_image_file : undefined,
    });
    if (!parsed.success) {
      const errs: ArticleErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ArticleErrors;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFormErrors(errs);
      return;
    }
    setFormErrors({});

    try {
      // Step 1: upload cover image if one was provided (file takes priority over URL)
      let coverImageId = form.cover_image_id ?? undefined;
      if (form.cover_image_file) {
        const result = await uploadFileMutation.mutateAsync(form.cover_image_file);
        coverImageId = result.id;
      } else if (form.cover_image_url.trim()) {
        const result = await uploadUrlMutation.mutateAsync(form.cover_image_url.trim());
        coverImageId = result.id;
      }

      // Step 2: save the article with the resolved cover_image_id
      const payload = {
        title:          form.title,
        body:           form.body,
        category:       form.category,
        cover_image_id: coverImageId ?? null,
        author_name:    form.author_name,
        is_published:   form.is_published,
        published_at:   form.is_published ? (form.published_at ?? new Date().toISOString()) : null,
      };
      if (editTarget) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      toast.success(editTarget ? "Article updated." : "Article created.");
      handleClose();
    } catch {
      toast.error("Failed to save article. Please try again.");
    }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    try {
      await createCatMutation.mutateAsync({ name: newCatName.trim(), color: newCatColor });
      toast.success("Category added.");
      setNewCatName("");
      setNewCatColor("gray");
    } catch {
      toast.error("A category with this name may already exist.");
    }
  }

  const tableActions: DataTableAction<NewsRow>[] = [
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex flex-row items-center gap-1">
          <button
            type="button"
            title={row.is_published ? "Unpublish" : "Publish"}
            onClick={() => setToggleConfirm({ id: row._numId, isPublished: row.is_published })}
            disabled={toggleMutation.isPending && toggleConfirm?.id === row._numId}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {toggleMutation.isPending && toggleConfirm?.id === row._numId
              ? <Loader2 size={14} className="animate-spin" />
              : row.is_published ? <EyeOff size={14} /> : <Eye size={14} />
            }
          </button>
          <button
            type="button"
            title="Edit"
            onClick={() => openEdit(row)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => setDeleteId(row._numId)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-brand-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
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
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<Tag size={15} />} onClick={() => setCatPanelOpen(true)}>
              Categories
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
              New Article
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-brand-border bg-white" />
          ))}
        </div>
      ) : (
        <DataTable<NewsRow>
          columns={columns}
          data={rows}
          showActions
          actions={tableActions}
          actionsLabel="Actions"
          actionsHeaderClassName="w-28"
          actionsContainerClassName="flex flex-nowrap items-center gap-2"
          searchable
          searchPlaceholder="Search articles…"
          emptyMessage="No articles yet."
          emptyDescription="Click 'New Article' to add one."
        />
      )}

      {/* ── Create / Edit article panel ──────────────────────────────────── */}
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
            error={formErrors.title}
          />
          <FormSelect
            label="Category"
            required
            placeholder={categoryOptions.length === 0 ? "No categories yet — add one first" : "Select category"}
            options={categoryOptions}
            value={form.category}
            onValueChange={(v) => field("category", v)}
            error={formErrors.category}
          />
          <FormInput
            label="Author / Source"
            required
            placeholder="e.g. Corporate Communications"
            value={form.author_name}
            onChange={(e) => field("author_name", e.target.value)}
            error={formErrors.author_name}
          />
          <RichTextEditor
            label="Body"
            required
            placeholder="Article content or excerpt…"
            value={form.body}
            onChange={(html) => field("body", html)}
            error={formErrors.body}
          />

          {/* Cover Image */}
          <div className="space-y-3">
            <SegmentedControl
              label="Cover Image"
              options={COVER_OPTIONS}
              value={form.cover_image_mode}
              onChange={(v) => {
                setForm((prev) => ({
                  ...prev,
                  cover_image_mode: v as "url" | "upload",
                  cover_image_url: "",
                  cover_image_file: null,
                }));
              }}
            />

            {form.cover_image_mode === "url" ? (
              <FormInput
                label=""
                placeholder="https://example.com/image.jpg"
                value={form.cover_image_url}
                onChange={(e) => field("cover_image_url", e.target.value)}
                error={formErrors.cover_image_url}
              />
            ) : (
              <FormFileUpload
                label=""
                accept="image/*"
                hint="JPG, PNG or WebP — max 5 MB"
                error={formErrors.cover_image_file}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setForm((prev) => ({
                    ...prev,
                    cover_image_file: file,
                    cover_image_preview: file ? URL.createObjectURL(file) : prev.cover_image_preview,
                  }));
                }}
              />
            )}

            {/* Local file preview (before save) */}
            {form.cover_image_file && form.cover_image_preview && (
              <div className="relative rounded-lg overflow-hidden border border-brand-border h-36 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.cover_image_preview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, cover_image_file: null, cover_image_preview: "" }))}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Existing cover image (edit mode, no new file selected) */}
            {!form.cover_image_file && form.cover_image_preview && (
              <div className="relative rounded-lg overflow-hidden border border-brand-border h-36 bg-gray-50">
                <Image
                  src={form.cover_image_preview}
                  alt="Current cover"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 480px"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, cover_image_id: null, cover_image_preview: "" }))}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

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

      {/* ── Manage Categories panel ──────────────────────────────────────── */}
      <ActionModal
        open={catPanelOpen}
        onClose={() => setCatPanelOpen(false)}
        title="Manage Categories"
        variant="panel"
        size="md"
        footer={
          <Button variant="outline" onClick={() => setCatPanelOpen(false)}>Close</Button>
        }
      >
        <div className="space-y-6">
          {/* Add new category */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-brand-text-primary">Add Category</p>
            <FormInput
              label="Name"
              placeholder="e.g. Project Update"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            {/* Colour swatch picker */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-brand-text-primary">Colour</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    title={s.label}
                    onClick={() => setNewCatColor(s.value)}
                    className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{ backgroundColor: s.hex }}
                  >
                    {newCatColor === s.value && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1.5,6 4.5,9.5 10.5,2.5" />
                        </svg>
                      </span>
                    )}
                    <span
                      className={`absolute inset-0 rounded-full ring-2 ring-offset-2 transition-all ${newCatColor === s.value ? "ring-current opacity-100" : "opacity-0"}`}
                      style={{ color: s.hex }}
                    />
                  </button>
                ))}
              </div>

              {/* Live badge preview */}
              {newCatName.trim() && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-brand-text-secondary">Preview:</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COLOR_BADGE_CLASS[newCatColor]}`}>
                    {newCatName.trim()}
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={handleAddCategory}
              loading={createCatMutation.isPending}
              loadingText="Adding…"
              leftIcon={<Plus size={14} />}
              className="w-full"
            >
              Add Category
            </Button>
          </div>

          {/* Existing categories */}
          <div>
            <p className="text-sm font-medium text-brand-text-primary mb-3">
              Existing Categories ({categories.length})
            </p>
            {categories.length === 0 ? (
              <p className="text-sm text-brand-text-secondary">No categories yet.</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-brand-border bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COLOR_BADGE_CLASS[cat.color] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {cat.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setDeleteCatId(cat.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                      title="Delete category"
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

      {/* Publish / Unpublish confirm */}
      <ConfirmDialog
        open={toggleConfirm !== null}
        title={toggleConfirm?.isPublished ? "Unpublish Article" : "Publish Article"}
        message={
          toggleConfirm?.isPublished
            ? "This will hide the article from the intranet immediately. You can re-publish it at any time."
            : "This will make the article visible to all staff on the intranet."
        }
        confirmLabel={toggleConfirm?.isPublished ? "Unpublish" : "Publish"}
        onConfirm={() => {
          if (toggleConfirm !== null) {
            toggleMutation.mutate(toggleConfirm.id);
            setToggleConfirm(null);
          }
        }}
        onCancel={() => setToggleConfirm(null)}
      />

      {/* Delete article confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Article"
        message="This will permanently remove the article from the intranet. This cannot be undone."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={() => { if (deleteId !== null) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />

      {/* Delete category confirm */}
      <ConfirmDialog
        open={deleteCatId !== null}
        title="Delete Category"
        message="Deleting this category will not delete existing articles, but those articles will no longer match any tab filter. Are you sure?"
        confirmLabel="Delete"
        destructive={true}
        onConfirm={() => {
          if (deleteCatId !== null) {
            deleteCatMutation.mutate(deleteCatId);
            setDeleteCatId(null);
          }
        }}
        onCancel={() => setDeleteCatId(null)}
      />
    </AppLayout>
  );
}
