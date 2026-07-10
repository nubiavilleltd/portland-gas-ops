"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import { useIntranetNewsDetail, useIntranetNewsPublished, useIntranetNewsCategories } from "@/lib/modules/intranet/queries";
import type { NewsCategoryColor } from "@/lib/modules/intranet/types/intranet.types";

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

export default function NewsDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const numId   = Number(id);

  const { data: item, isLoading, isError } = useIntranetNewsDetail(numId);
  const { data: allNews   = [] }           = useIntranetNewsPublished();
  const { data: categories = [] }          = useIntranetNewsCategories();

  const colorByName = Object.fromEntries(categories.map((c) => [c.name, c.color as NewsCategoryColor]));
  const badge = item ? (COLOR_BADGE_CLASS[colorByName[item.category] ?? "gray"] ?? "bg-gray-100 text-[#1C043B]") : "";

  const related = allNews
    .filter((n) => n.id !== numId)
    .slice(0, 3)
    .map((n) => ({
      ...n,
      badge: COLOR_BADGE_CLASS[colorByName[n.category] ?? "gray"] ?? "bg-gray-100 text-[#1C043B]",
      date:  n.published_at
        ? new Date(n.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "",
    }));

  const formattedDate = item?.published_at
    ? new Date(item.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <IntranetLayout>
        <div className="h-64 sm:h-80 bg-gray-200 animate-pulse" />
        <div className="max-w-[860px] mx-auto px-4 lg:px-8 py-8 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded-full animate-pulse" style={{ width: `${90 - i * 8}%` }} />
          ))}
        </div>
      </IntranetLayout>
    );
  }

  // ── Not found / error ─────────────────────────────────────────────────────────
  if (isError || !item) {
    return (
      <IntranetLayout>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-20 text-center">
          <p className="text-gray-400 text-sm">Article not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-[#7234BD] text-sm hover:underline">
            Go back
          </button>
        </div>
      </IntranetLayout>
    );
  }

  return (
    <IntranetLayout>

      {/* ── Hero image ───────────────────────────────────────────────────── */}
      <div className="relative h-64 sm:h-80 bg-gray-200 overflow-hidden">
        {item.cover_image_url ? (
          <Image
            src={item.cover_image_url}
            alt={item.title}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1C043B] to-[#7234BD]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C043B]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-8 pb-6">
          <div className="max-w-[860px] mx-auto">
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3 ${badge}`}>
              {item.category}
            </span>
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-white leading-snug"
              style={{ fontFamily: "var(--font-mulish, sans-serif)" }}
            >
              {item.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[860px] mx-auto px-4 lg:px-8 py-8">

        {/* Back */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#7234BD] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to News
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-8 pb-6 border-b border-gray-100">
          <span className="flex items-center gap-1.5"><User size={12} /> {item.author_name}</span>
          <span className="flex items-center gap-1.5"><Calendar size={12} /> {formattedDate}</span>
          <span className="flex items-center gap-1.5"><Tag size={12} /> {item.category}</span>
        </div>

        {/* Body — rendered as HTML from TipTap */}
        <div
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: item.body }}
        />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h2
              className="text-base font-bold text-[#1C043B] mb-5"
              style={{ fontFamily: "var(--font-mulish, sans-serif)" }}
            >
              More from Portland Gas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} href={`/news/${r.id}`} className="group flex flex-col gap-3">
                  <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100">
                    {r.cover_image_url ? (
                      <Image
                        src={r.cover_image_url}
                        alt={r.title}
                        fill
                        sizes="300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1C043B] to-[#7234BD]" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#1C043B] group-hover:text-[#7234BD] transition-colors line-clamp-2 leading-snug">
                    {r.title}
                  </p>
                  <p className="text-[11px] text-gray-400">{r.date}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8 mt-4">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Portland Gas Limited · Internal use only
          </p>
        </div>
      </footer>
    </IntranetLayout>
  );
}
