"use client";

import type { FAQItem, FAQCategoryLabel } from "../types/intranet.types";
import { useIntranetFAQsAdmin, useIntranetFAQCategories } from "../queries";
import {
  useCreateFAQ,
  useUpdateFAQ,
  useDeleteFAQ,
  useReorderFAQs,
  useToggleFAQCategoryVisibility,
  useCreateFAQCategory,
  useUpdateFAQCategory,
  useDeleteFAQCategory,
} from "../mutations";

// UI-only metadata for known categories (icon, colour). Not stored in DB.
const FAQ_CATEGORY_META: Record<string, { iconName: string; color: string; bg: string }> = {
  "IT Support":   { iconName: "Laptop",     color: "#1E40AF", bg: "#EFF6FF" },
  "HR & Payroll": { iconName: "Users",       color: "#7234BD", bg: "#F3EEFF" },
  "HSE":          { iconName: "ShieldCheck", color: "#166534", bg: "#F0FDF4" },
  "Procurement":  { iconName: "Briefcase",   color: "#C2410C", bg: "#FFF7ED" },
  "General":      { iconName: "Phone",       color: "#B45309", bg: "#FFFBEB" },
};

const DEFAULT_META = { iconName: "Tag", color: "#374151", bg: "#F9FAFB" };

export type EnrichedFAQCategory = {
  id:         number;
  label:      string;
  is_visible: boolean;
  sort_order: number;
  iconName:   string;
  color:      string;
  bg:         string;
};

// Static fallback used before DB loads and for form select options
export const FAQ_CATEGORIES: { label: FAQCategoryLabel; iconName: string; color: string; bg: string }[] = [
  { label: "IT Support",   iconName: "Laptop",     color: "#1E40AF", bg: "#EFF6FF" },
  { label: "HR & Payroll", iconName: "Users",       color: "#7234BD", bg: "#F3EEFF" },
  { label: "HSE",          iconName: "ShieldCheck", color: "#166534", bg: "#F0FDF4" },
  { label: "Procurement",  iconName: "Briefcase",   color: "#C2410C", bg: "#FFF7ED" },
  { label: "General",      iconName: "Phone",       color: "#B45309", bg: "#FFFBEB" },
];

export function useIntranetFAQs() {
  const { data: faqs = [], isLoading, isFetching } = useIntranetFAQsAdmin();
  const { data: rawCategories = [] }               = useIntranetFAQCategories();

  const createMutation    = useCreateFAQ();
  const updateMutation    = useUpdateFAQ();
  const deleteMutation    = useDeleteFAQ();
  const reorderMutation   = useReorderFAQs();
  const toggleCatMutation = useToggleFAQCategoryVisibility();
  const createCatMutation = useCreateFAQCategory();
  const updateCatMutation = useUpdateFAQCategory();
  const deleteCatMutation = useDeleteFAQCategory();

  // Enrich DB categories with UI metadata
  const categories: EnrichedFAQCategory[] = rawCategories.map((cat) => ({
    ...cat,
    ...(FAQ_CATEGORY_META[cat.label] ?? DEFAULT_META),
  }));

  // Derive visibility record from DB categories; default true while loading
  const visibility: Record<FAQCategoryLabel, boolean> = Object.fromEntries(
    categories.map((c) => [c.label, c.is_visible])
  );

  function faqsByCategory(cat: FAQCategoryLabel): FAQItem[] {
    return faqs
      .filter((f) => f.category === cat)
      .sort((a, b) => a.order_index - b.order_index);
  }

  // ── Category actions ────────────────────────────────────────────────────────

  function toggleCategoryVisibility(cat: FAQCategoryLabel) {
    const dbCat = rawCategories.find((c) => c.label === cat);
    if (dbCat) toggleCatMutation.mutate(dbCat.id);
  }

  function addCategory(label: string) {
    return createCatMutation.mutateAsync({ label, sort_order: rawCategories.length });
  }

  function updateCategory(id: number, label: string) {
    return updateCatMutation.mutateAsync({ id, label });
  }

  function removeCategory(id: number) {
    return deleteCatMutation.mutateAsync(id);
  }

  // ── FAQ actions ─────────────────────────────────────────────────────────────

  function addFaq(faq: Omit<FAQItem, "id" | "created_at" | "updated_at">) {
    return createMutation.mutateAsync(faq);
  }

  function updateFaq(id: number, patch: Partial<Omit<FAQItem, "id" | "created_at">>) {
    return updateMutation.mutateAsync({ id, ...patch });
  }

  function removeFaq(id: number) {
    return deleteMutation.mutateAsync(id);
  }

  function moveFaq(id: number, direction: "up" | "down") {
    const item = faqs.find((f) => f.id === id);
    if (!item) return;
    const siblings = faqs
      .filter((f) => f.category === item.category)
      .sort((a, b) => a.order_index - b.order_index);
    const idx     = siblings.findIndex((f) => f.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const swapItem = siblings[swapIdx];
    reorderMutation.mutate([
      { id: item.id,     order_index: swapItem.order_index },
      { id: swapItem.id, order_index: item.order_index },
    ]);
  }

  /** Bulk reorder after a drag-and-drop — pass numeric IDs in their new order */
  function reorderFaqs(orderedIds: number[]) {
    reorderMutation.mutate(
      orderedIds.map((id, i) => ({ id, order_index: i }))
    );
  }

  return {
    faqs,
    isLoading,
    isFetching,
    categories,           // enriched DB categories — use for sidebar instead of static FAQ_CATEGORIES
    faqsByCategory,
    visibility,
    toggleCategoryVisibility,
    addCategory,
    updateCategory,
    removeCategory,
    addFaq,
    updateFaq,
    removeFaq,
    moveFaq,
    reorderFaqs,
  };
}
