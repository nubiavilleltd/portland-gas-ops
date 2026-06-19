"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Tag, ChevronRight } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import { EVENTS } from "../page";

const TYPE_STYLES: Record<string, { pill: string; dot: string }> = {
  "Town Hall": { pill: "bg-[#F3EEFF] text-[#7234BD]",  dot: "#7234BD" },
  "Training":  { pill: "bg-[#F0FDF4] text-[#166534]",  dot: "#166534" },
  "Deadline":  { pill: "bg-red-50 text-red-700",        dot: "#C2410C" },
  "Workshop":  { pill: "bg-[#EFF6FF] text-[#1E40AF]",  dot: "#1E40AF" },
  "Social":    { pill: "bg-amber-50 text-amber-700",    dot: "#B45309" },
};

export default function EventDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const ev      = EVENTS.find((e) => e.id === Number(id));

  if (!ev) {
    return (
      <IntranetLayout>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-20 text-center">
          <p className="text-gray-400 text-sm">Event not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-[#7234BD] text-sm hover:underline">Go back</button>
        </div>
      </IntranetLayout>
    );
  }

  const typeStyle = TYPE_STYLES[ev.type] ?? { pill: "bg-gray-100 text-gray-500", dot: "#6b7280" };
  const related   = EVENTS.filter((e) => e.id !== ev.id).slice(0, 3);

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
            <span className="text-white text-3xl font-extrabold leading-none">{ev.day}</span>
            <span className="text-white/80 text-sm font-bold uppercase mt-1">{ev.month}</span>
            <span className="text-white/60 text-xs mt-0.5">{ev.year}</span>
          </div>
          <div>
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3 ${typeStyle.pill}`}>
              {ev.type}
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
          <span className="flex items-center gap-1.5"><Calendar size={12} /> {ev.day} {ev.monthFull} {ev.year}</span>
          <span className="flex items-center gap-1.5"><MapPin size={12} /> {ev.location}</span>
          <span className="flex items-center gap-1.5"><Tag size={12} /> {ev.type}</span>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-base leading-relaxed mb-8">{ev.description}</p>

        {/* Details card */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#1C043B]">Event Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Date</p>
              <p className="font-medium text-[#1C043B]">{ev.day} {ev.monthFull} {ev.year}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Location</p>
              <p className="font-medium text-[#1C043B]">{ev.location}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Type</p>
              <span className={`inline-block text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${typeStyle.pill}`}>
                {ev.type}
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
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/events/${r.id}`}
                  className="group flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-md hover:border-[#7234BD]/20 transition-all"
                >
                  <div className="rounded-lg px-2.5 py-2 flex flex-col items-center shrink-0" style={{ backgroundColor: r.color }}>
                    <span className="text-white text-sm font-extrabold leading-none">{r.day}</span>
                    <span className="text-white/75 text-[9px] font-bold uppercase">{r.month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1C043B] group-hover:text-[#7234BD] transition-colors line-clamp-1">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.location}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-[#7234BD] transition-colors shrink-0" />
                </Link>
              ))}
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
