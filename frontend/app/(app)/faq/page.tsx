"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Laptop, Users, ShieldCheck, Briefcase, Phone, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import IntranetPageHero from "@/components/ui/IntranetPageHero";
import { cn } from "@/lib/utils";
import { useIntranetFAQsPublished, useIntranetFAQCategories } from "@/lib/modules/intranet/queries";

// Map DB iconName strings → Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Laptop:      Laptop,
  Users:       Users,
  ShieldCheck: ShieldCheck,
  Briefcase:   Briefcase,
  Phone:       Phone,
};

// UI metadata for known categories (matches the admin hook)
const CAT_META: Record<string, { color: string; bg: string; iconName: string }> = {
  "IT Support":   { color: "#1E40AF", bg: "#EFF6FF", iconName: "Laptop"      },
  "HR & Payroll": { color: "#7234BD", bg: "#F3EEFF", iconName: "Users"       },
  "HSE":          { color: "#166534", bg: "#F0FDF4", iconName: "ShieldCheck" },
  "Procurement":  { color: "#C2410C", bg: "#FFF7ED", iconName: "Briefcase"   },
  "General":      { color: "#B45309", bg: "#FFFBEB", iconName: "Phone"       },
};
const DEFAULT_META = { color: "#374151", bg: "#F9FAFB", iconName: "Tag" };

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-[#7234BD] transition-colors group"
      >
        <span className={cn("text-sm font-medium leading-snug", open ? "text-[#7234BD]" : "text-[#1C043B]")}>
          {q}
        </span>
        <ChevronDown
          size={15}
          className={cn("text-gray-300 shrink-0 transition-transform duration-200 group-hover:text-[#7234BD]", open && "rotate-180 text-[#7234BD]")}
        />
      </button>
      {open && (
        <div className="pb-4 pr-6">
          <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

function FAQSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-gray-100 shrink-0" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="ml-auto h-3 w-16 bg-gray-100 rounded" />
          </div>
          <div className="px-6 py-2 space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="py-3 border-b border-gray-50 last:border-0">
                <div className="h-4 bg-gray-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: rawFAQs = [],      isLoading: faqsLoading }  = useIntranetFAQsPublished();
  const { data: rawCategories = [], isLoading: catsLoading } = useIntranetFAQCategories();

  const isLoading = faqsLoading || catsLoading;

  // Build category list from DB, filtered to visible only, enriched with UI metadata
  const visibleCategories = rawCategories
    .filter((c) => c.is_visible)
    .map((c) => {
      const meta = CAT_META[c.label] ?? DEFAULT_META;
      const Icon = ICON_MAP[meta.iconName] ?? Tag;
      const faqs = rawFAQs
        .filter((f) => f.category === c.label)
        .sort((a, b) => a.order_index - b.order_index);
      return { id: c.id, label: c.label, color: meta.color, bg: meta.bg, Icon, faqs };
    })
    .filter((c) => c.faqs.length > 0 || !isLoading);

  const visible = activeCategory
    ? visibleCategories.filter((c) => c.label === activeCategory)
    : visibleCategories;

  return (
    <IntranetLayout>

      <IntranetPageHero
        title="Frequently Asked Questions"
        subtitle="IT, HR, HSE, Procurement and more — all in one place."
        imageSrc="https://portlandgasltd.com/wp-content/uploads/2026/03/Portland-gas-70.png"
      />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">

        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-all",
              !activeCategory ? "bg-[#7234BD] text-white" : "bg-white border border-gray-200 text-gray-500 hover:text-[#7234BD] hover:border-[#7234BD]/30"
            )}
          >
            All
          </button>
          {isLoading
            ? [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 w-24 rounded-full bg-gray-100 animate-pulse" />
              ))
            : visibleCategories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all",
                    activeCategory === cat.label
                      ? "bg-[#7234BD] text-white"
                      : "bg-white border border-gray-200 text-gray-500 hover:text-[#7234BD] hover:border-[#7234BD]/30"
                  )}
                >
                  <cat.Icon size={13} />
                  {cat.label}
                </button>
              ))
          }
        </div>

        {/* FAQ grid */}
        {isLoading ? (
          <FAQSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visible.map((cat) => (
              <div key={cat.label} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Category header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg }}>
                    <cat.Icon size={16} style={{ color: cat.color }} />
                  </div>
                  <p className="text-sm font-bold text-[#1C043B]">{cat.label}</p>
                  <span className="ml-auto text-xs text-gray-400">{cat.faqs.length} questions</span>
                </div>
                {/* FAQs */}
                <div className="px-6">
                  {cat.faqs.map((faq) => (
                    <FAQItem key={faq.id} q={faq.question} a={faq.answer} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 rounded-2xl bg-[#F3EEFF] border border-[#7234BD]/15 px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-[#7234BD] flex items-center justify-center shrink-0">
              <HelpCircle size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C043B]">Can&apos;t find your answer?</p>
              <p className="text-xs text-gray-500 mt-0.5">Reach out to the relevant team and we&apos;ll help you out.</p>
            </div>
          </div>
          <a
            href="mailto:support@portlandgas.com"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7234BD] text-white text-sm font-semibold hover:bg-[#5c2899] transition-colors"
          >
            Contact Support
          </a>
        </div>

      </div>

      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8 mt-4">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Portland Gas Limited · Internal use only</p>
        </div>
      </footer>
    </IntranetLayout>
  );
}
