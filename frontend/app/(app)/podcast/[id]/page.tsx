"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Volume2, Mic2, Clock, Star, Video } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import { PODCAST_EPISODES } from "../_data";

export default function PodcastPlayerPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const initialEp = PODCAST_EPISODES.find((e) => e.id === Number(id)) ?? PODCAST_EPISODES[0];
  const [activeEp, setActiveEp] = useState(initialEp);
  const [playing, setPlaying]   = useState(false);

  if (!initialEp) {
    return (
      <IntranetLayout>
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-20 text-center">
          <p className="text-gray-400 text-sm">Episode not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-[#7234BD] text-sm hover:underline">Go back</button>
        </div>
      </IntranetLayout>
    );
  }

  const published = PODCAST_EPISODES.filter((e) => e.is_published);

  return (
    <IntranetLayout>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10">

        {/* Back */}
        <Link
          href="/podcast"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#7234BD] transition-colors mb-8"
        >
          <ArrowLeft size={14} /> All Episodes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Player ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cover / Player area */}
            <div className="relative rounded-2xl overflow-hidden bg-[#1C043B] aspect-video flex items-center justify-center">
              {activeEp.cover_image_url ? (
                <img
                  src={activeEp.cover_image_url}
                  alt={activeEp.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              ) : null}
              <div className="relative z-10 flex flex-col items-center gap-5 p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-[#FFBC00]/20 flex items-center justify-center">
                  {activeEp.media_type === "video"
                    ? <Video size={28} className="text-[#FFBC00]" />
                    : <Mic2 size={28} className="text-[#FFBC00]" />
                  }
                </div>
                <div>
                  <p className="text-[#FFBC00] text-[10px] font-bold uppercase tracking-widest mb-1">
                    EP. {activeEp.episode_number}
                  </p>
                  <h2 className="text-white text-lg font-bold leading-snug max-w-md" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                    {activeEp.title}
                  </h2>
                  {activeEp.guest_name && (
                    <p className="text-white/60 text-sm mt-1">with {activeEp.guest_name}</p>
                  )}
                </div>

                {/* Native player if URL available, else placeholder controls */}
                {activeEp.audio_url ? (
                  activeEp.media_type === "video" ? (
                    <video
                      src={activeEp.audio_url}
                      controls
                      className="w-full max-w-lg mt-2 rounded-xl"
                    />
                  ) : (
                    <audio
                      src={activeEp.audio_url}
                      controls
                      className="w-full max-w-lg mt-2"
                    />
                  )
                ) : (
                  /* Placeholder play button when no URL */
                  <div className="flex flex-col items-center gap-3 mt-2">
                    <button
                      onClick={() => setPlaying((p) => !p)}
                      className="h-14 w-14 rounded-full bg-[#FFBC00] flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                    >
                      {playing
                        ? <Pause size={20} className="text-[#1C043B] fill-[#1C043B]" />
                        : <Play  size={20} className="text-[#1C043B] ml-1 fill-[#1C043B]" />
                      }
                    </button>
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Volume2 size={12} />
                      <span>Stream link not yet available</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Episode metadata */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#7234BD] bg-[#7234BD]/10 px-2.5 py-1 rounded-full">
                  EP. {activeEp.episode_number}
                </span>
                {activeEp.is_featured && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <Star size={9} className="fill-amber-500" /> Featured
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {activeEp.media_type === "video" ? "Video Podcast" : "Audio Podcast"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1C043B] leading-snug" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                {activeEp.title}
              </h3>
              {activeEp.guest_name && (
                <p className="text-sm text-gray-500">Guest / Host: <span className="font-medium text-gray-700">{activeEp.guest_name}</span></p>
              )}
              {activeEp.duration && (
                <p className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Clock size={13} /> {activeEp.duration}
                </p>
              )}
            </div>
          </div>

          {/* ── Right: Episode List ────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">All Episodes</h3>
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {published.map((ep) => {
                const isActive = ep.id === activeEp.id;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => setActiveEp(ep)}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
                      isActive
                        ? "border-[#7234BD]/30 bg-[#7234BD]/5"
                        : "border-gray-100 bg-white hover:border-[#7234BD]/20 hover:bg-gray-50"
                    }`}
                  >
                    {/* Mini cover */}
                    <div className="h-11 w-11 rounded-lg bg-[#1C043B] flex items-center justify-center shrink-0 overflow-hidden">
                      {ep.cover_image_url
                        ? <img src={ep.cover_image_url} alt="" className="w-full h-full object-cover" />
                        : <Mic2 size={14} className="text-[#FFBC00]/50" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold mb-0.5 ${isActive ? "text-[#7234BD]" : "text-gray-400"}`}>
                        EP. {ep.episode_number}
                      </p>
                      <p className={`text-xs font-semibold leading-snug line-clamp-2 ${isActive ? "text-[#1C043B]" : "text-gray-700"}`}>
                        {ep.title}
                      </p>
                      {ep.duration && (
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock size={9} /> {ep.duration}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <div className="h-6 w-6 rounded-full bg-[#7234BD] flex items-center justify-center shrink-0 mt-0.5">
                        <Play size={9} className="text-white ml-0.5 fill-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8 mt-10">
        <div className="max-w-[1280px] mx-auto">
          <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Portland Gas Limited · Internal use only</p>
        </div>
      </footer>
    </IntranetLayout>
  );
}
