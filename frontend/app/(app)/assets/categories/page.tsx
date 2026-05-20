"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  useAssetCategories,
  useCreateAssetCategory,
  useUpdateAssetCategory,
  useDeleteAssetCategory,
  useAssetTypes,
  useCreateAssetType,
  useDeleteAssetType,
} from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import type { AssetCategory, AssetType } from "@/types";

// ── Colour palette ─────────────────────────────────────────────────────────────

const PRESET_COLOURS = [
  "#6b7280",
  "#7c3aed",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#db2777",
];

// ── Category Modal ─────────────────────────────────────────────────────────────

interface CategoryModalProps {
  initial?: AssetCategory;
  onClose: () => void;
}

function CategoryModal({ initial, onClose }: CategoryModalProps) {
  const toast = useToast();
  const createCategory = useCreateAssetCategory();
  const updateCategory = useUpdateAssetCategory(initial?.id ?? "");

  const [name, setName] = useState(initial?.name ?? "");
  const [colour, setColour] = useState(initial?.colour ?? PRESET_COLOURS[0]);
  const [nameError, setNameError] = useState<string | null>(null);

  const isEditing = !!initial;
  const isPending = createCategory.isPending || updateCategory.isPending;

  async function handleSubmit() {
    if (!name.trim()) {
      setNameError("Category name is required");
      return;
    }
    setNameError(null);
    try {
      if (isEditing) {
        await updateCategory.mutateAsync({ name: name.trim(), colour });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync({ name: name.trim(), colour });
        toast.success("Category created");
      }
      onClose();
    } catch {
      toast.error(`Failed to ${isEditing ? "update" : "create"} category`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
          <h3 className="text-base font-semibold text-brand-text-primary">
            {isEditing ? "Edit Category" : "Add Category"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              placeholder="e.g. IT Equipment"
              autoCapitalize="none"
              autoCorrect="off"
              className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
            {nameError && <p className="text-xs text-red-600">{nameError}</p>}
          </div>

          {/* Colour picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-brand-text-primary">Colour</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLOURS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColour(hex)}
                  style={{ backgroundColor: hex }}
                  className={`h-8 w-8 rounded-full transition-all ${
                    colour === hex
                      ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  title={hex}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="h-5 w-5 rounded-full border border-brand-border shrink-0"
                style={{ backgroundColor: colour }}
              />
              <span className="text-xs text-brand-text-secondary font-mono">{colour}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-gray-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-5 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Category"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Asset Type Inline Form ─────────────────────────────────────────────────

function AddTypeInline({
  categoryId,
  onDone,
}: {
  categoryId: string;
  onDone: () => void;
}) {
  const toast = useToast();
  const createType = useCreateAssetType();
  const [typeName, setTypeName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!typeName.trim()) { setError("Name is required"); return; }
    setError(null);
    try {
      await createType.mutateAsync({ name: typeName.trim(), category_id: categoryId });
      toast.success("Asset type added");
      setTypeName("");
      onDone();
    } catch {
      toast.error("Failed to add asset type");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <input
        type="text"
        value={typeName}
        onChange={(e) => { setTypeName(e.target.value); setError(null); }}
        placeholder="e.g. Laptop"
        autoFocus
        className="h-8 rounded-lg border border-brand-border px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple flex-1 min-w-0"
      />
      <button
        type="submit"
        disabled={createType.isPending}
        className="h-8 px-3 text-xs font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 shrink-0"
      >
        {createType.isPending ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="h-8 px-2 text-xs text-brand-text-secondary hover:text-brand-text-primary transition-colors shrink-0"
      >
        <X size={14} />
      </button>
      {error && <p className="text-xs text-red-600 shrink-0">{error}</p>}
    </form>
  );
}

// ── Category Row ───────────────────────────────────────────────────────────────

function CategoryRow({
  cat,
  types,
  onEdit,
  onDelete,
}: {
  cat: AssetCategory;
  types: AssetType[];
  onEdit: (cat: AssetCategory) => void;
  onDelete: (cat: AssetCategory) => void;
}) {
  const toast = useToast();
  const deleteType = useDeleteAssetType();
  const [addingType, setAddingType] = useState(false);

  async function handleDeleteType(typeId: string, typeName: string) {
    try {
      await deleteType.mutateAsync(typeId);
      toast.success(`"${typeName}" removed`);
    } catch {
      toast.error("Failed to remove type");
    }
  }

  return (
    <div className="bg-white border border-brand-border rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* Left: colour dot + name */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-[160px]">
          <div
            className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: `${cat.colour}20` }}
          >
            <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: cat.colour }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-text-primary">{cat.name}</p>
            <span className="text-[10px] text-brand-text-secondary font-mono">{cat.colour}</span>
          </div>
        </div>

        {/* Middle: type chips */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5">
            {types.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 bg-gray-100 text-brand-text-primary text-xs rounded-full px-2 py-0.5"
              >
                <span className="font-mono text-[10px] text-brand-text-secondary">{t.prefix}</span>
                {t.name}
                <button
                  type="button"
                  onClick={() => handleDeleteType(t.id, t.name)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                  title={`Remove ${t.name}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            {types.length === 0 && !addingType && (
              <span className="text-xs text-brand-text-secondary italic">No types yet</span>
            )}
          </div>

          {/* Inline add form */}
          {addingType && (
            <AddTypeInline categoryId={cat.id} onDone={() => setAddingType(false)} />
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!addingType && (
            <button
              onClick={() => setAddingType(true)}
              className="h-7 px-2 flex items-center gap-1 text-xs font-medium rounded-lg text-brand-purple hover:bg-purple-50 transition-colors"
              title="Add type"
            >
              <Plus size={12} /> Add Type
            </button>
          )}
          <button
            onClick={() => onEdit(cat)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary transition-colors"
            title="Edit category"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-brand-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Delete category"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AssetCategoriesPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const { data: categories = [], isLoading, isError } = useAssetCategories();
  const { data: allTypes = [] } = useAssetTypes();
  const deleteCategory = useDeleteAssetCategory();

  const [modalOpen, setModalOpen] = useState(false);

  if (user && !isAdmin) {
    router.replace("/assets");
    return null;
  }
  const [editTarget, setEditTarget] = useState<AssetCategory | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<AssetCategory | null>(null);

  function openAdd() {
    setEditTarget(undefined);
    setModalOpen(true);
  }

  function openEdit(cat: AssetCategory) {
    setEditTarget(cat);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCategory.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
    } catch {
      toast.error("Failed to delete category");
    }
    setDeleteTarget(null);
  }

  return (
    <AppLayout pageTitle="Assets">
      <PageHeader
        title="Asset Categories"
        description="Manage categories and asset types for organising assets"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/assets/new")}
              className="flex items-center gap-2 px-4 py-2 border border-brand-border text-brand-text-primary text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Register Asset
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
            >
              <Plus size={15} /> Add Category
            </button>
          </div>
        }
        className="mb-6"
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : isError ? (
        <EmptyState title="Could not load categories" description="Check your connection and try again." />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add your first category to start organising assets."
          action={
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
            >
              <Plus size={15} /> Add Category
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              types={allTypes.filter((t) => t.category_id === cat.id)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <CategoryModal
          initial={editTarget}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Assets in this category will become uncategorised.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
