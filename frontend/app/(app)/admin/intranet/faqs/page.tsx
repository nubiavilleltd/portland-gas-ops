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
import FormSelect from "@/components/forms/FormSelect";
import { BackButton } from "@/components/ui/BackButton";
import { useIntranetFAQs, FAQ_CATEGORIES } from "@/lib/modules/intranet/hooks/useIntranetFAQs";
import { useToast } from "@/hooks/useToast";
import type { FAQItem, FAQCategoryLabel } from "@/lib/modules/intranet/types/intranet.types";

// DataTable requires id: string
type FAQRow = Omit<FAQItem, "id"> & { id: string; _numId: number };

const CATEGORY_OPTIONS: { value: FAQCategoryLabel; label: string }[] = FAQ_CATEGORIES.map((c) => ({
  value: c.label,
  label: c.label,
}));

const EMPTY_FORM = {
  question:    "",
  answer:      "",
  category:    "General" as FAQCategoryLabel,
  order_index: 0,
  is_published: true,
};
type FormState = typeof EMPTY_FORM;

export default function IntranetFAQsPage() {
  const { faqs, faqsByCategory, visibility, toggleCategoryVisibility, addFaq, updateFaq, removeFaq, moveFaq } =
    useIntranetFAQs();
  const toast = useToast();

  const [selectedCat, setSelectedCat] = useState<FAQCategoryLabel>("IT Support");
  const [modalOpen,   setModalOpen]   = useState(false);
  const [deleteId,    setDeleteId]    = useState<number | null>(null);
  const [editTarget,  setEditTarget]  = useState<FAQItem | null>(null);
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  const catFaqs = faqsByCategory(selectedCat);
  const rows: FAQRow[] = catFaqs.map((f) => ({ ...f, id: String(f.id), _numId: f.id }));

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, category: selectedCat, order_index: catFaqs.length });
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
    await new Promise((r) => setTimeout(r, 300));
    if (editTarget) {
      updateFaq(editTarget.id, form);
    } else {
      addFaq(form);
    }
    setSaving(false);
    toast.success(editTarget ? "FAQ updated." : "FAQ created.");
    handleClose();
  }

  function field(key: keyof FormState, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const columns: Column<FAQRow>[] = [
    {
      key: "question",
      label: "Question",
      render: (_, row) => (
        <p className="text-sm font-medium text-brand-text-primary max-w-lg">{row.question}</p>
      ),
    },
    {
      key: "is_published",
      label: "Status",
      render: (_, row) => (
        <Badge variant={row.is_published ? "success" : "neutral"} label={row.is_published ? "Visible" : "Hidden"} />
      ),
    },
  ];

  const tableActions: DataTableAction<FAQRow>[] = [
    {
      key: "up",
      label: "",
      icon: <ChevronUp size={14} />,
      title: "Move Up",
      variant: "ghost",
      onClick: (row) => moveFaq(row._numId, "up"),
    },
    {
      key: "down",
      label: "",
      icon: <ChevronDown size={14} />,
      title: "Move Down",
      variant: "ghost",
      onClick: (row) => moveFaq(row._numId, "down"),
    },
    {
      key: "toggle",
      label: "",
      icon: (row) => row.is_published ? <EyeOff size={14} /> : <Eye size={14} />,
      title: (row) => row.is_published ? "Hide" : "Show",
      variant: "ghost",
      onClick: (row) => updateFaq(row._numId, { is_published: !row.is_published }),
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

  const selectedMeta = FAQ_CATEGORIES.find((c) => c.label === selectedCat);

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

      <div className="flex gap-6">
        {/* Category sidebar */}
        <div className="w-56 shrink-0 space-y-2">
          <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider px-1 mb-3">
            Categories
          </p>
          {FAQ_CATEGORIES.map((cat) => {
            const count = faqsByCategory(cat.label).length;
            const isSelected = selectedCat === cat.label;
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
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-xs text-brand-text-secondary">{count}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCategoryVisibility(cat.label); }}
                    className="p-0.5 rounded text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                    title={visibility[cat.label] ? "Hide category" : "Show category"}
                  >
                    {visibility[cat.label] ? <Eye size={13} /> : <EyeOff size={13} />}
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
                {selectedCat}
              </span>
            )}
            {!visibility[selectedCat] && (
              <Badge variant="neutral" label="Category hidden on intranet" />
            )}
          </div>
          <DataTable<FAQRow>
            columns={columns}
            data={rows}
            showActions
            actions={tableActions}
            actionsLabel="Actions"
            searchable
            searchPlaceholder="Search FAQs…"
            emptyMessage="No FAQs in this category."
            emptyDescription="Click 'New FAQ' to add one."
          />
        </div>
      </div>

      {/* Create / Edit panel */}
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
            options={CATEGORY_OPTIONS}
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

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete FAQ"
        message="This will permanently remove this FAQ from the intranet. This cannot be undone."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={() => { if (deleteId !== null) { removeFaq(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
