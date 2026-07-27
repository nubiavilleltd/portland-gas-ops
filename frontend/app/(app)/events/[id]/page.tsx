"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Tag, ChevronRight, ExternalLink } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useIntranetEventDetail, useIntranetEventsPublished } from "@/lib/modules/intranet/queries";

const TYPE_STYLES: Record<string, { pill: string; dot: string }> = {
  "Town Hall": { pill: "bg-[#F3EEFF] text-[#7234BD]",  dot: "#7234BD" },
  "Training":  { pill: "bg-[#F0FDF4] text-[#166534]",  dot: "#166534" },
  "Deadline":  { pill: "bg-red-50 text-red-700",        dot: "#C2410C" },
  "Workshop":  { pill: "bg-[#EFF6FF] text-[#1E40AF]",  dot: "#1E40AF" },
  "Social":    { pill: "bg-amber-50 text-amber-700",    dot: "#B45309" },
};

function parseDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day:       d.getDate(),
    month:     d.toLocaleString("en-GB", { month: "short" }).toUpperCase(),
    monthFull: d.toLocaleString("en-GB", { month: "long" }),
    year:      d.getFullYear(),
  };
}

export default function EventDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const { data: ev, isLoading, isError } = useIntranetEventDetail(Number(id));
  const { data: allEvents = [] }          = useIntranetEventsPublished();

  if (isLoading) {
    return (
      <IntranetLayout>
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      </IntranetLayout>
    );
  }

  if (isError || !ev) {
    return (
      <IntranetLayout>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-20 text-center">
          <p className="text-gray-400 text-sm">Event not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-[#7234BD] text-sm hover:underline">Go back</button>
        </div>
      </IntranetLayout>
    );
  }

  const { day, month, monthFull, year } = parseDate(ev.event_date);
  const typeStyle = TYPE_STYLES[ev.event_type] ?? { pill: "bg-gray-100 text-gray-500", dot: "#6b7280" };
  const related   = allEvents.filter((e) => e.id !== ev.id).slice(0, 3);
  const displayLocation = ev.location ?? ev.virtual_link ?? "Online";

  return (
    <IntranetLayout>

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ backgroundColor: ev.color, minHeight: 200 }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }} />
        <div className="relative max-w-[860px] mx-auto px-4 lg:px-8 py-14 flex items-end gap-6">
          <div
            className="rounded-2xl px-5 py-5 flex flex-col items-center shrink-0 bg-white/20"
            style={{ minWidth: 72 }}
          >
            <span className="text-white text-3xl font-extrabold leading-none">{day}</span>
            <span className="text-white/80 text-sm font-bold uppercase mt-1">{month}</span>
            <span className="text-white/60 text-xs mt-0.5">{year}</span>
          </div>
          <div>
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3 ${typeStyle.pill}`}>
              {ev.event_type}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
              {ev.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[860px] mx-auto px-4 lg:px-8 py-8">

        {/* Back */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#7234BD] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Events
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-8 pb-6 border-b border-gray-100">
          <span className="flex items-center gap-1.5"><Calendar size={12} /> {day} {monthFull} {year}</span>
          <span className="flex items-center gap-1.5"><MapPin size={12} /> {displayLocation}</span>
          <span className="flex items-center gap-1.5"><Tag size={12} /> {ev.event_type}</span>
        </div>

        {/* Description */}
        {ev.description && (
          <p className="text-gray-700 text-base leading-relaxed mb-8">{ev.description}</p>
        )}

        {/* Details card */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#1C043B]">Event Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Date</p>
              <p className="font-medium text-[#1C043B]">{day} {monthFull} {year}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Location</p>
              {ev.virtual_link ? (
                <a
                  href={ev.virtual_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#7234BD] hover:underline"
                >
                  Join Online <ExternalLink size={11} />
                </a>
              ) : (
                <p className="font-medium text-[#1C043B]">{ev.location ?? "—"}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Type</p>
              <span className={`inline-block text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${typeStyle.pill}`}>
                {ev.event_type}
              </span>
            </div>
          </div>
        </div>

        {/* Related events */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-base font-bold text-[#1C043B] mb-5" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
              Other Upcoming Events
            </h2>
            <div className="space-y-3">
              {related.map((r) => {
                const rd = parseDate(r.event_date);
                return (
                  <Link
                    key={r.id}
                    href={`/events/${r.id}`}
                    className="group flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-md hover:border-[#7234BD]/20 transition-all"
                  >
                    <div className="rounded-lg px-2.5 py-2 flex flex-col items-center shrink-0" style={{ backgroundColor: r.color }}>
                      <span className="text-white text-sm font-extrabold leading-none">{rd.day}</span>
                      <span className="text-white/75 text-[9px] font-bold uppercase">{rd.month}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1C043B] group-hover:text-[#7234BD] transition-colors line-clamp-1">{r.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.location ?? r.virtual_link ?? "Online"}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-[#7234BD] transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8 mt-4">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Portland Gas Limited · Internal use only</p>
        </div>
      </footer>
    </IntranetLayout>
  );
}
