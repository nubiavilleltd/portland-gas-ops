"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import IntranetSearchBar from "@/components/ui/IntranetSearchBar";
import Pagination from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";

const PG = "https://portlandgasltd.com/wp-content/uploads/2026/03";
const PAGE_SIZE = 6;

export const NEWS = [
  { id: 1, category: "Company News",   badge: "bg-[#7234BD] text-white",      title: "Portland Gas Commissions New CNG Refuelling Station in Lekki",   excerpt: "The newly commissioned station marks our 14th fuelling point in Lagos, expanding access to clean energy for fleet operators and private vehicle owners.", date: "9 Jun 2026",  author: "Corporate Communications",     img: `${PG}/Portland-gas-46-1.png` },
  { id: 2, category: "Announcement",   badge: "bg-[#FFBC00] text-[#1C043B]",  title: "Q2 2026 Town Hall — All Staff Meeting Thursday 12 June",            excerpt: "The MD will address Q2 performance and strategic priorities for H2 2026, then open the floor to questions. Attendance is mandatory for all staff.", date: "8 Jun 2026",  author: "MD's Office",                  img: `${PG}/NASENI-PORTLAND-GAS-LAUNCH-4-scaled-1.jpg` },
  { id: 3, category: "Policy Update",  badge: "bg-gray-100 text-[#1C043B]",   title: "Updated Remote Work & Flexible Hours Policy Effective 1 July",     excerpt: "HR has published the revised hybrid work policy. All staff must read and acknowledge the new policy before end of June 2026.",                    date: "6 Jun 2026",  author: "Human Resources",              img: `${PG}/Portland-gas-18.png` },
  { id: 4, category: "Project Update", badge: "bg-[#7234BD] text-white",      title: "Phase 2 of Sagamu–Ibadan LNG Pipeline Now Underway",               excerpt: "Engineering teams have mobilised to site as the second phase of the landmark pipeline project begins. Completion is targeted for Q4 2026.",        date: "4 Jun 2026",  author: "Projects & Engineering",       img: `${PG}/CNG-bus-fleet.jpg` },
  { id: 5, category: "Safety",         badge: "bg-red-500 text-white",        title: "Mandatory HSE Refresher Training — All Field Staff by 30 June",    excerpt: "HSE has scheduled refresher sessions across all field locations. Supervisors must ensure 100% participation before the end-of-month deadline.",    date: "3 Jun 2026",  author: "Health, Safety & Environment", img: `${PG}/Portland-gas-23.png` },
  { id: 6, category: "Events",         badge: "bg-[#FFBC00] text-[#1C043B]", title: "Portland Gas Annual Family Fun Day — Saturday 28 June",             excerpt: "Join us for a day of fun, food, and fellowship. Venue: Landmark Event Centre, Victoria Island. Registration closes 20 June — don't miss out.",    date: "2 Jun 2026",  author: "Admin & Corporate Services",   img: `${PG}/KL7V2Q3.webp` },
];

const TABS = ["All", "News", "Announcements", "Events", "Policies", "Safety"];

const TAB_MAP: Record<string, string[]> = {
  News:          ["Company News", "Project Update"],
  Announcements: ["Announcement"],
  Events:        ["Events"],
  Policies:      ["Policy Update"],
  Safety:        ["Safety"],
};

export default function NewsPage() {
  const [tab,  setTab]  = useState("All");
  const [q,    setQ]    = useState("");
  const [page, setPage] = useState(1);

  const filtered = NEWS.filter((n) => {
    if (tab !== "All" && !TAB_MAP[tab]?.includes(n.category)) return false;
    if (q) return n.title.toLowerCase().includes(q.toLowerCase()) || n.excerpt.toLowerCase().includes(q.toLowerCase());
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
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-4">{item.excerpt}</p>
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
