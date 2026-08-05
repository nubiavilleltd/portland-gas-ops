"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import SortableList, { SortableAction, type SortableColumn } from "@/components/ui/SortableList";
import ActionModal from "@/components/ui/ActionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import { BackButton } from "@/components/ui/BackButton";
import Tip from "@/components/ui/Tip";
import { useIntranetFAQs } from "@/lib/modules/intranet/hooks/useIntranetFAQs";
import { useToggleFAQPublished } from "@/lib/modules/intranet/mutations";
import { useToast } from "@/hooks/useToast";
import type { FAQItem, FAQCategoryLabel } from "@/lib/modules/intranet/types/intranet.types";

// DataTable requires id: string
type FAQRow = Omit<FAQItem, "id"> & { id: string; _numId: number };

const EMPTY_FORM = {
  question:    "",
  answer:      "",
  category:    "" as FAQCategoryLabel,
  order_index: 0,
  is_published: true,
};
type FormState = typeof EMPTY_FORM;

const EMPTY_CAT_FORM = { label: "" };

export default function IntranetFAQsPage() {
  const {
    faqs,
    isLoading,
    isFetching,
    categories,
    faqsByCategory,
    visibility,
    toggleCategoryVisibility,
    addCategory,
    updateCategory,
    removeCategory,
    addFaq,
    updateFaq,
    removeFaq,
    reorderFaqs,
  } = useIntranetFAQs();
  const toast = useToast();
  const toggleMutation = useToggleFAQPublished();

  // ── FAQ state ──────────────────────────────────────────────────────────────
  const [selectedCat,         setSelectedCat]         = useState<FAQCategoryLabel>("");
  const [modalOpen,           setModalOpen]           = useState(false);
  const [deleteId,            setDeleteId]            = useState<number | null>(null);
  const [editTarget,          setEditTarget]          = useState<FAQItem | null>(null);
  const [form,                setForm]                = useState<FormState>(EMPTY_FORM);
  const [saving,              setSaving]              = useState(false);
  const [toggleConfirmTarget, setToggleConfirmTarget] = useState<FAQRow | null>(null);
  const [toggleTarget,        setToggleTarget]        = useState<number | null>(null);

  // ── Category state ─────────────────────────────────────────────────────────
  const [catModalOpen,  setCatModalOpen]  = useState(false);
  const [editCatId,     setEditCatId]     = useState<number | null>(null);
  const [catForm,       setCatForm]       = useState(EMPTY_CAT_FORM);
  const [savingCat,     setSavingCat]     = useState(false);
  const [deleteCatId,   setDeleteCatId]   = useState<number | null>(null);

  const activeCat = selectedCat || categories[0]?.label || "";
  const catFaqs   = faqsByCategory(activeCat);
  const rows: FAQRow[] = catFaqs.map((f) => ({ ...f, id: String(f.id), _numId: f.id }));

  const categoryOptions = categories.map((c) => ({ value: c.label, label: c.label }));

  // ── FAQ handlers ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, category: activeCat, order_index: catFaqs.length });
    setModalOpen(true);
  }

  function openEdit(row: FAQRow) {
    const item = faqs.find((f) => f.id === row._numId)!;
    setEditTarget(item);
    setForm({
      question:     item.question,
      answer:       item.answer,
      category:     item.category,
      order_index:  item.order_index,
      is_published: item.is_published,
    });
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateFaq(editTarget.id, form);
      } else {
        await addFaq(form);
      }
      toast.success(editTarget ? "FAQ updated." : "FAQ created.");
      handleClose();
    } catch {
      toast.error("Failed to save FAQ. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (!toggleConfirmTarget) return;
    const row = toggleConfirmTarget;
    setToggleConfirmTarget(null);
    setToggleTarget(row._numId);
    try {
      await toggleMutation.mutateAsync(row._numId);
      toast.success(row.is_published ? "FAQ hidden." : "FAQ published.");
    } catch {
      toast.error("Failed to update FAQ visibility.");
    } finally {
      setToggleTarget(null);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await removeFaq(deleteId);
      toast.success("FAQ deleted.");
    } catch {
      toast.error("Failed to delete FAQ.");
    }
    setDeleteId(null);
  }

  function field(key: keyof FormState, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Category handlers ──────────────────────────────────────────────────────

  function openAddCategory() {
    setEditCatId(null);
    setCatForm(EMPTY_CAT_FORM);
    setCatModalOpen(true);
  }

  function openEditCategory(id: number, label: string) {
    setEditCatId(id);
    setCatForm({ label });
    setCatModalOpen(true);
  }

  function handleCatClose() {
    setCatModalOpen(false);
    setEditCatId(null);
    setCatForm(EMPTY_CAT_FORM);
  }

  async function handleCatSave() {
    if (!catForm.label.trim()) return;
    setSavingCat(true);
    try {
      if (editCatId !== null) {
        await updateCategory(editCatId, catForm.label.trim());
        toast.success("Category renamed.");
      } else {
        await addCategory(catForm.label.trim());
        toast.success("Category added.");
      }
      handleCatClose();
    } catch {
      toast.error("Failed to save category.");
    } finally {
      setSavingCat(false);
    }
  }

  function handleDeleteCategory() {
    if (deleteCatId === null) return;
    const deletedLabel = categories.find((c) => c.id === deleteCatId)?.label;
    removeCategory(deleteCatId);
    if (deletedLabel === activeCat) setSelectedCat("");
    setDeleteCatId(null);
    toast.success("Category deleted.");
  }

  const sortableColumns: SortableColumn<FAQRow>[] = [
    {
      label: "Question",
      className: "flex-1 min-w-0",
      render: (row) => (
        <p className="text-sm font-medium text-brand-text-primary truncate">{row.question}</p>
      ),
    },
    {
      label: "Status",
      className: "w-20 sm:w-24 shrink-0 text-center",
      render: (row) => (
        <Badge variant={row.is_published ? "success" : "neutral"} label={row.is_published ? "Visible" : "Hidden"} />
      ),
    },
  ];

  const selectedMeta = categories.find((c) => c.label === activeCat);

  return (
    <AppLayout pageTitle="FAQs">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="FAQs"
        description="Manage frequently asked questions shown on the intranet, organised by department"
        className="mb-6"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            New FAQ
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Category sidebar */}
        <div className="w-56 shrink-0 space-y-2">
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
              Categories
            </p>
            <button
              onClick={openAddCategory}
              className="p-0.5 rounded text-brand-text-secondary hover:text-brand-purple hover:bg-brand-purple/10 transition-colors"
              title="Add category"
            >
              <Plus size={14} />
            </button>
          </div>

          {categories.map((cat) => {
            const count = faqsByCategory(cat.label).length;
            const isSelected = activeCat === cat.label;
            return (
              <div
                key={cat.label}
                onClick={() => setSelectedCat(cat.label)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-brand-purple/10 border border-brand-purple/20"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span
                    className={`text-sm font-medium truncate ${
                      isSelected ? "text-brand-purple" : "text-brand-text-primary"
                    }`}
                  >
                    {cat.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-xs text-brand-text-secondary">{count}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCategoryVisibility(cat.label); }}
                    className="p-0.5 rounded text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                    title={cat.is_visible ? "Hide category" : "Show category"}
                  >
                    {cat.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditCategory(cat.id, cat.label); }}
                    className="p-0.5 rounded text-brand-text-secondary hover:text-brand-purple transition-colors"
                    title="Rename category"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteCatId(cat.id); }}
                    className="p-0.5 rounded text-brand-text-secondary hover:text-red-600 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ table */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            {selectedMeta && (
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: selectedMeta.bg, color: selectedMeta.color }}
              >
                {activeCat}
              </span>
            )}
            {activeCat && !visibility[activeCat] && (
              <Badge variant="neutral" label="Category hidden on intranet" />
            )}
          </div>
          <SortableList<FAQRow>
            items={rows}
            onReorder={(newRows) => reorderFaqs(newRows.map((r) => r._numId))}
            columns={sortableColumns}
            isLoading={isLoading}
            emptyMessage="No FAQs in this category. Click 'New FAQ' to add one."
            actions={(row) => (
              <>
                {toggleMutation.isPending && toggleTarget === row._numId ? (
                  <div className="h-7 w-7 flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin text-brand-text-secondary" />
                  </div>
                ) : (
                  <SortableAction onClick={() => setToggleConfirmTarget(row)}>
                    <Tip label={row.is_published ? "Hide FAQ" : "Show FAQ"}>
                      {row.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Tip>
                  </SortableAction>
                )}
                <SortableAction onClick={() => openEdit(row)}>
                  <Tip label="Edit FAQ"><Pencil size={14} /></Tip>
                </SortableAction>
                <SortableAction className="hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteId(row._numId)}>
                  <Tip label="Delete FAQ"><Trash2 size={14} /></Tip>
                </SortableAction>
              </>
            )}
          />
        </div>
      </div>

      {/* Create / Edit FAQ panel */}
      <ActionModal
        open={modalOpen}
        onClose={handleClose}
        title={editTarget ? "Edit FAQ" : "New FAQ"}
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
          <FormSelect
            label="Category"
            required
            options={categoryOptions}
            value={form.category}
            onValueChange={(v) => field("category", v as FAQCategoryLabel)}
          />
          <FormInput
            label="Question"
            required
            placeholder="e.g. How do I reset my password?"
            value={form.question}
            onChange={(e) => field("question", e.target.value)}
          />
          <FormTextarea
            label="Answer"
            required
            placeholder="Provide a clear, helpful answer…"
            value={form.answer}
            onChange={(e) => field("answer", e.target.value)}
            rows={5}
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => field("is_published", e.target.checked)}
              className="w-4 h-4 accent-brand-purple"
            />
            <span className="text-sm text-brand-text-primary">Visible on intranet</span>
          </label>
        </div>
      </ActionModal>

      {/* Create / Edit category modal */}
      <ActionModal
        open={catModalOpen}
        onClose={handleCatClose}
        title={editCatId !== null ? "Rename Category" : "Add Category"}
        variant="dialog"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={handleCatClose} disabled={savingCat}>Cancel</Button>
            <Button onClick={handleCatSave} loading={savingCat} loadingText="Saving…">Save</Button>
          </>
        }
      >
        <FormInput
          label="Category name"
          required
          placeholder="e.g. Finance"
          value={catForm.label}
          onChange={(e) => setCatForm({ label: e.target.value })}
        />
      </ActionModal>

      {/* FAQ visibility toggle confirm */}
      <ConfirmDialog
        open={toggleConfirmTarget !== null}
        title={toggleConfirmTarget?.is_published ? "Hide FAQ" : "Show FAQ"}
        message={
          toggleConfirmTarget?.is_published
            ? "This FAQ will be hidden from the intranet. Staff will no longer see it."
            : "This FAQ will become visible to all staff on the intranet."
        }
        confirmLabel={toggleConfirmTarget?.is_published ? "Hide" : "Show"}
        destructive={toggleConfirmTarget?.is_published ?? false}
        onConfirm={handleToggle}
        onCancel={() => setToggleConfirmTarget(null)}
      />

      {/* Delete FAQ confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete FAQ"
        message="This will permanently remove this FAQ from the intranet. This cannot be undone."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Delete category confirm */}
      <ConfirmDialog
        open={deleteCatId !== null}
        title="Delete Category"
        message="This will delete the category. FAQs in this category will no longer be grouped — consider reassigning them first."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteCatId(null)}
      />
    </AppLayout>
  );
}
