"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, ChevronRight } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import IntranetPageHero from "@/components/ui/IntranetPageHero";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";
import { useIntranetEventsPublished } from "@/lib/modules/intranet/queries";

const PAGE_SIZE = 6;

const TYPE_STYLES: Record<string, string> = {
  "Town Hall": "bg-[#F3EEFF] text-[#7234BD]",
  "Training":  "bg-[#F0FDF4] text-[#166534]",
  "Deadline":  "bg-red-50 text-red-700",
  "Workshop":  "bg-[#EFF6FF] text-[#1E40AF]",
  "Social":    "bg-amber-50 text-amber-700",
};

const TYPE_FILTERS = ["All", "Town Hall", "Training", "Deadline", "Workshop", "Social"];

/** Parse "YYYY-MM-DD" into { day, month, year } for display */
function parseEventDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day:   d.getDate(),
    month: d.toLocaleString("en-GB", { month: "short" }).toUpperCase(),
    year:  d.getFullYear(),
  };
}

export default function EventsPage() {
  const { data: events = [], isLoading } = useIntranetEventsPublished();

  const [q,    setQ]    = useState("");
  const [type, setType] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = events.filter((ev) => {
    if (type !== "All" && ev.event_type !== type) return false;
    if (q) {
      const lq = q.toLowerCase();
      return (
        ev.title.toLowerCase().includes(lq) ||
        (ev.location ?? "").toLowerCase().includes(lq) ||
        (ev.description ?? "").toLowerCase().includes(lq)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(val: string) { setQ(val);   setPage(1); }
  function handleType(t: string)     { setType(t);  setPage(1); }

  return (
    <IntranetLayout>
      <IntranetPageHero
        title="Upcoming Events"
        subtitle="Townhalls, training sessions, workshops and more — all in one place."
        imageSrc="https://portlandgasltd.com/wp-content/uploads/2026/03/NASENI-PORTLAND-GAS-LAUNCH-4-scaled-1.jpg"
      />

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 min-h-[60vh]">

        {/* Type pills LEFT — search RIGHT */}
        <div className="flex items-center gap-2 mb-7">
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
          <div className="relative ml-auto shrink-0">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search events…"
              className="py-2 w-72 pl-9 pr-5 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#7234BD]/20 focus:border-[#7234BD]/40 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : (
          <>
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
                  {visible.map((ev) => {
                    const { day, month, year } = parseEventDate(ev.event_date);
                    return (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.id}`}
                        className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
                      >
                        {/* Coloured top band */}
                        <div className="px-6 py-5 flex items-center gap-4" style={{ backgroundColor: ev.color }}>
                          <div className="flex flex-col items-center bg-white/20 rounded-xl px-3 py-2.5 shrink-0 min-w-[52px]">
                            <span className="text-white text-2xl font-extrabold leading-none">{day}</span>
                            <span className="text-white/80 text-[10px] font-bold uppercase mt-0.5">{month}</span>
                          </div>
                          <div>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-white/20 text-white mb-1">
                              {ev.event_type}
                            </span>
                            <p className="text-white/70 text-xs">{year}</p>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="text-sm font-bold text-[#1C043B] group-hover:text-[#7234BD] transition-colors leading-snug mb-2 line-clamp-2">
                            {ev.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mb-3">
                            <MapPin size={11} className="text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-400 truncate">{ev.location ?? ev.virtual_link ?? "Online"}</p>
                          </div>
                          {ev.description && (
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">{ev.description}</p>
                          )}
                          <div className="mt-4 flex items-center gap-1 text-[#7234BD] text-xs font-semibold">
                            View details <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}
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
