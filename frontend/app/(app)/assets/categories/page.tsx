"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
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
  "#7c3aed", "#2563eb", "#16a34a", "#d97706",
  "#dc2626", "#0891b2", "#db2777", "#6b7280",
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
    if (!name.trim()) { setNameError("Category name is required"); return; }
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
          <h3 className="text-base font-semibold text-brand-text-primary">
            {isEditing ? "Edit Category" : "New Category"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              placeholder="e.g. IT Equipment"
              autoFocus
              className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
            {nameError && <p className="text-xs text-red-600">{nameError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-brand-text-primary">Colour</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLOURS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColour(hex)}
                  style={{ backgroundColor: hex }}
                  className={`h-8 w-8 rounded-full transition-all ${colour === hex ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                  title={hex}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border border-brand-border shrink-0" style={{ backgroundColor: colour }} />
              <span className="text-xs text-brand-text-secondary font-mono">{colour}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-gray-50/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-5 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isPending ? <><span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : isEditing ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Asset Type inline form ────────────────────────────────────────────────

function AddTypeInline({ categoryId, onDone }: { categoryId: string; onDone: () => void }) {
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
      <button type="button" onClick={onDone} className="h-8 px-2 text-xs text-brand-text-secondary hover:text-brand-text-primary transition-colors shrink-0">
        <X size={14} />
      </button>
      {error && <p className="text-xs text-red-600 shrink-0">{error}</p>}
    </form>
  );
}

// ── Category card ──────────────────────────────────────────────────────────────

function CategoryCard({
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
  const [expanded, setExpanded] = useState(true);

  async function handleDeleteType(typeId: string, typeName: string) {
    try {
      await deleteType.mutateAsync(typeId);
      toast.success(`"${typeName}" removed`);
    } catch {
      toast.error("Failed to remove asset type");
    }
  }

  return (
    <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
      {/* Category header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border bg-gray-50/60">
        <div
          className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center"
          style={{ backgroundColor: `${cat.colour}20` }}
        >
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.colour }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-text-primary">{cat.name}</p>
          <p className="text-[10px] text-brand-text-secondary">
            {types.length} type{types.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-brand-text-secondary hover:bg-gray-100 transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
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

      {/* Types list */}
      {expanded && (
        <div className="px-4 py-3">
          {types.length === 0 && !addingType ? (
            <p className="text-xs text-brand-text-secondary italic mb-2">No asset types yet</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-2">
              {types.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-brand-text-primary text-xs rounded-full px-2.5 py-1 transition-colors"
                >
                  <span
                    className="font-mono text-[9px] px-1 py-0.5 rounded text-white"
                    style={{ backgroundColor: cat.colour }}
                  >
                    {t.prefix}
                  </span>
                  {t.name}
                  <button
                    type="button"
                    onClick={() => handleDeleteType(t.id, t.name)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                    title={`Remove ${t.name}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {addingType ? (
            <AddTypeInline categoryId={cat.id} onDone={() => setAddingType(false)} />
          ) : (
            <button
              onClick={() => setAddingType(true)}
              className="flex items-center gap-1 text-xs font-medium text-brand-purple hover:text-brand-purple-dark transition-colors"
            >
              <Plus size={12} /> Add Asset Type
            </button>
          )}
        </div>
      )}
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
  const [editTarget, setEditTarget] = useState<AssetCategory | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<AssetCategory | null>(null);

  if (user && !isAdmin) {
    router.replace("/assets");
    return null;
  }

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
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Assets
      </button>
      <PageHeader
        title="Categories & Asset Types"
        description="Organise assets by category and define the types within each category"
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
              <Plus size={15} /> New Category
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
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors">
              <Plus size={15} /> New Category
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              types={allTypes.filter((t) => t.category_id === cat.id)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <CategoryModal initial={editTarget} onClose={() => setModalOpen(false)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? All asset types within this category will also be deleted. Assets will become uncategorised.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
