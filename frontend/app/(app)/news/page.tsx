"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import IntranetSearchBar from "@/components/ui/IntranetSearchBar";
import Pagination from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import { useIntranetNewsPublished, useIntranetNewsCategories } from "@/lib/modules/intranet/queries";
import type { NewsCategoryColor } from "@/lib/modules/intranet/types/intranet.types";

const PAGE_SIZE = 6;

// Tailwind-safe badge classes by color key
const COLOR_BADGE_CLASS: Record<NewsCategoryColor, string> = {
  purple: "bg-[#7234BD] text-white",
  yellow: "bg-[#FFBC00] text-[#1C043B]",
  gray:   "bg-gray-100 text-[#1C043B]",
  red:    "bg-red-500 text-white",
  blue:   "bg-blue-100 text-blue-700",
  green:  "bg-green-100 text-green-700",
  teal:   "bg-teal-100 text-teal-700",
  orange: "bg-orange-100 text-orange-700",
};

export default function NewsPage() {
  const [tab,  setTab]  = useState("All");
  const [q,    setQ]    = useState("");
  const [page, setPage] = useState(1);

  const { data: rawNews    = [] } = useIntranetNewsPublished();
  const { data: categories = [] } = useIntranetNewsCategories();

  const TABS = ["All", ...categories.map((c) => c.name)];

  // Map color key from categories to badge class for each article
  const colorByName = Object.fromEntries(categories.map((c) => [c.name, c.color as NewsCategoryColor]));

  const NEWS = rawNews.map((n) => ({
    id:          n.id,
    category:    n.category,
    badge:       COLOR_BADGE_CLASS[colorByName[n.category] ?? "gray"] ?? "bg-gray-100 text-[#1C043B]",
    title:       n.title,
    bodyHtml:    n.body,
    excerptText: n.body.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(),
    date:        n.published_at
      ? new Date(n.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "",
    author:      n.author_name,
    img:         n.cover_image_url ?? "",
  }));

  const filtered = NEWS.filter((n) => {
    if (tab !== "All" && n.category !== tab) return false;
    if (q) return n.title.toLowerCase().includes(q.toLowerCase()) || n.excerptText.toLowerCase().includes(q.toLowerCase());
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const feed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleTabChange(t: string) {
    setTab(t);
    setPage(1);
  }

  function handleSearch(val: string) {
    setQ(val);
    setPage(1);
  }

  return (
    <IntranetLayout>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-[#1C043B] pt-12 pb-8 px-4 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[#FFBC00] text-xs font-bold uppercase tracking-widest mb-2">Portland Gas Intranet</p>
          <h1 className="text-3xl font-extrabold text-white mb-4" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
            News & Announcements
          </h1>
          <IntranetSearchBar
            value={q}
            onChange={handleSearch}
            placeholder="Search news…"
            className="max-w-lg"
          />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-7">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={cn(
                "shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all",
                tab === t ? "bg-[#7234BD] text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:text-[#7234BD] hover:border-[#7234BD]/30"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Result count */}
        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 mb-4">
            {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            {q && <> for &ldquo;{q}&rdquo;</>}
          </p>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Search size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No results{q && <> for &ldquo;{q}&rdquo;</>}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {feed.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <Image
                      src={item.img}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${item.badge}`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-[#1C043B] text-sm leading-snug mb-2 group-hover:text-[#7234BD] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <div
                      className="rich-text-preview line-clamp-3 mb-4"
                      dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
                    />
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>{item.author}</span>
                      <span className="flex items-center gap-1 text-[#7234BD] font-semibold">
                        Read more <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8 mt-8">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Portland Gas Limited · Internal use only</p>
        </div>
      </footer>
    </IntranetLayout>
  );
}
