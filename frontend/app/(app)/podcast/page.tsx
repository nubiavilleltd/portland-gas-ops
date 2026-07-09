"use client";

import Link from "next/link";
import { Play, Clock, Mic2, Star } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import IntranetSearchBar from "@/components/ui/IntranetSearchBar";
import { useState } from "react";
import { PODCAST_EPISODES } from "./_data";

export default function PodcastPage() {
  const [q, setQ] = useState("");

  const featured  = PODCAST_EPISODES.find((e) => e.is_featured) ?? PODCAST_EPISODES[0];
  const rest       = PODCAST_EPISODES.filter((e) => e.is_published && e.id !== featured?.id);
  const filtered   = rest.filter((e) => q === "" || e.title.toLowerCase().includes(q.toLowerCase()) || e.guest_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <IntranetLayout>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10 space-y-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7234BD] mb-1">Portland Gas</p>
            <h1 className="text-2xl font-extrabold text-[#1C043B]" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
              The Portland Gas Podcast
            </h1>
            <p className="text-sm text-gray-500 mt-1">Conversations with our people and leaders.</p>
          </div>
          <div className="w-full sm:w-72">
            <IntranetSearchBar value={q} onChange={(val) => setQ(val)} placeholder="Search episodes…" />
          </div>
        </div>

        {/* Featured episode */}
        {featured && q === "" && (
          <Link
            href={`/podcast/${featured.id}`}
            className="block rounded-2xl overflow-hidden bg-[#1C043B] hover:opacity-95 transition-opacity"
          >
            <div className="flex flex-col sm:flex-row gap-0">
              {/* Cover */}
              <div className="sm:w-64 h-48 sm:h-auto bg-[#2d0a5f] flex items-center justify-center shrink-0">
                {featured.cover_image_url ? (
                  <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover" />
                ) : (
                  <Mic2 size={48} className="text-[#FFBC00]/40" />
                )}
              </div>
              {/* Info */}
              <div className="flex flex-col justify-between p-6 sm:p-8 flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-[#FFBC00]">
                      <Star size={10} className="fill-[#FFBC00]" /> Featured Episode
                    </span>
                    <span className="text-white/30 text-xs">· EP. {featured.episode_number}</span>
                  </div>
                  <h2 className="text-white text-xl font-bold leading-snug mb-2" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                    {featured.title}
                  </h2>
                  {featured.guest_name && (
                    <p className="text-white/60 text-sm">with {featured.guest_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <div className="h-12 w-12 rounded-full bg-[#FFBC00] flex items-center justify-center shadow-lg">
                    <Play size={16} className="text-[#1C043B] ml-0.5 fill-[#1C043B]" />
                  </div>
                  {featured.duration && (
                    <span className="flex items-center gap-1.5 text-white/50 text-xs">
                      <Clock size={12} /> {featured.duration}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* All episodes */}
        <div>
          <h2 className="text-sm font-bold text-[#1C043B] uppercase tracking-wider mb-4">
            {q ? `Results for "${q}"` : "All Episodes"}
          </h2>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No episodes found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/podcast/${ep.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 hover:border-[#7234BD]/30 hover:shadow-md transition-all"
                >
                  {/* Cover thumbnail */}
                  <div className="h-36 rounded-xl bg-[#1C043B] flex items-center justify-center overflow-hidden">
                    {ep.cover_image_url ? (
                      <img src={ep.cover_image_url} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Mic2 size={32} className="text-[#FFBC00]/40" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-[#7234BD] uppercase tracking-wider">EP. {ep.episode_number}</p>
                    <p className="text-sm font-semibold text-[#1C043B] leading-snug line-clamp-2 group-hover:text-[#7234BD] transition-colors" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                      {ep.title}
                    </p>
                    {ep.guest_name && <p className="text-xs text-gray-400">with {ep.guest_name}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {ep.duration ? (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} /> {ep.duration}
                      </span>
                    ) : <span />}
                    <div className="h-8 w-8 rounded-full bg-[#7234BD]/10 flex items-center justify-center group-hover:bg-[#7234BD] transition-colors">
                      <Play size={12} className="text-[#7234BD] ml-0.5 group-hover:text-white fill-[#7234BD] group-hover:fill-white transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8 mt-4">
        <div className="max-w-[1280px] mx-auto">
          <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Portland Gas Limited · Internal use only</p>
        </div>
      </footer>
    </IntranetLayout>
  );
}
