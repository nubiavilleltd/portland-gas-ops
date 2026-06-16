"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, ChevronRight } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import IntranetSearchBar from "@/components/ui/IntranetSearchBar";
import Pagination from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

export const EVENTS = [
  { id: 1, day: 12, month: "JUN", monthFull: "June",  year: 2026, type: "Town Hall", title: "Q2 All-Staff Town Hall — MD Briefing",        location: "Head Office, Boardroom A",     color: "#7234BD", description: "The Managing Director will address Q2 2026 business performance and strategic priorities for H2. All staff must attend in person or via live stream. Q&A session from 11:30 AM. Lunch provided for in-person attendees." },
  { id: 2, day: 18, month: "JUN", monthFull: "June",  year: 2026, type: "Training",  title: "HSE Field Safety Refresher — Lagos Stations", location: "Portland Gas Training Centre", color: "#166534", description: "Mandatory refresher training for all field staff covering updated emergency response procedures, PPE requirements at CNG stations, and new gas leak protocols. See your supervisor for your designated session time." },
  { id: 3, day: 20, month: "JUN", monthFull: "June",  year: 2026, type: "Deadline",  title: "Q2 Performance Appraisal Submissions Due",    location: "HR Portal (online)",           color: "#C2410C", description: "All line managers must submit Q2 performance appraisals for their direct reports via the HR Portal before midnight. Staff can access their own review forms through the same portal." },
  { id: 4, day: 25, month: "JUN", monthFull: "June",  year: 2026, type: "Workshop",  title: "Fleet Conversion Technology Symposium",       location: "Eko Hotel Convention Centre",  color: "#1E40AF", description: "An industry symposium on CNG and LPG fleet conversion technology, attended by Portland Gas engineers and fleet partners. Full-day event. Delegates have been notified by the Projects team." },
  { id: 5, day: 28, month: "JUN", monthFull: "June",  year: 2026, type: "Social",    title: "Annual Family Fun Day 2026",                  location: "Landmark Event Centre, VI",    color: "#B45309", description: "Portland Gas Annual Family Fun Day — open to all staff and immediate family. Live band, children's entertainment, food stations, staff awards, and charity raffle. Register by 20 June. Shuttle buses available." },
];

const TYPE_STYLES: Record<string, string> = {
  "Town Hall": "bg-[#F3EEFF] text-[#7234BD]",
  "Training":  "bg-[#F0FDF4] text-[#166534]",
  "Deadline":  "bg-red-50 text-red-700",
  "Workshop":  "bg-[#EFF6FF] text-[#1E40AF]",
  "Social":    "bg-amber-50 text-amber-700",
};

const TYPE_FILTERS = ["All", "Town Hall", "Training", "Deadline", "Workshop", "Social"];

export default function EventsPage() {
  const [q,      setQ]      = useState("");
  const [type,   setType]   = useState("All");
  const [page,   setPage]   = useState(1);

  const filtered = EVENTS.filter((ev) => {
    if (type !== "All" && ev.type !== type) return false;
    if (q) {
      const lq = q.toLowerCase();
      return ev.title.toLowerCase().includes(lq) || ev.location.toLowerCase().includes(lq) || ev.description.toLowerCase().includes(lq);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(val: string) { setQ(val);   setPage(1); }
  function handleType(t: string)     { setType(t);  setPage(1); }

  return (
    <IntranetLayout>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-[#1C043B] pt-12 pb-8 px-4 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[#FFBC00] text-xs font-bold uppercase tracking-widest mb-2">Portland Gas Intranet</p>
          <h1 className="text-3xl font-extrabold text-white mb-4" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
            Upcoming Events
          </h1>
          <IntranetSearchBar
            value={q}
            onChange={handleSearch}
            placeholder="Search events by title, location…"
            className="max-w-lg"
          />
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">

        {/* Type filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-7">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => handleType(t)}
              className={cn(
                "shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all",
                type === t ? "bg-[#7234BD] text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:text-[#7234BD] hover:border-[#7234BD]/30"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Result count */}
        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 mb-4">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            {q && <> matching &ldquo;{q}&rdquo;</>}
          </p>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Search size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No events found{q && <> for &ldquo;{q}&rdquo;</>}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
                >
                  {/* Coloured top band */}
                  <div className="px-6 py-5 flex items-center gap-4" style={{ backgroundColor: ev.color }}>
                    <div className="flex flex-col items-center bg-white/20 rounded-xl px-3 py-2.5 shrink-0 min-w-[52px]">
                      <span className="text-white text-2xl font-extrabold leading-none">{ev.day}</span>
                      <span className="text-white/80 text-[10px] font-bold uppercase mt-0.5">{ev.month}</span>
                    </div>
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-white/20 text-white mb-1">
                        {ev.type}
                      </span>
                      <p className="text-white/70 text-xs">{ev.year}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-[#1C043B] group-hover:text-[#7234BD] transition-colors leading-snug mb-2 line-clamp-2">
                      {ev.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-3">
                      <MapPin size={11} className="text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-400 truncate">{ev.location}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">{ev.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-[#7234BD] text-xs font-semibold">
                      View details <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
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
