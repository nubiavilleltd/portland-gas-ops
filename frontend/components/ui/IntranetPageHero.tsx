"use client";

/**
 * IntranetPageHero — animated dark-purple hero banner used across intranet
 * listing pages (/news, /events, /people, etc.)
 *
 * Usage:
 *   <IntranetPageHero
 *     label="Portland Gas Intranet"
 *     title="News & Announcements"
 *     subtitle="Stay informed with the latest from across the company."
 *     imageSrc="https://…"   // optional company photo (shown at low opacity)
 *   />
 */

interface Props {
  label?: string;
  title: string;
  subtitle?: string;
  /** Optional company photo shown as a low-opacity background strip */
  imageSrc?: string;
}

export default function IntranetPageHero({ label = "Portland Gas Intranet", title, subtitle, imageSrc }: Props) {
  return (
    <div className="relative bg-[#1C043B] pt-12 pb-10 px-4 lg:px-8 overflow-hidden">

      {/* ── Keyframe animations ──────────────────────────────────────────── */}
      <style>{`
        @keyframes pg-blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%       { transform: translate(18px, -14px) scale(1.06); }
          66%       { transform: translate(-12px, 8px) scale(0.96); }
        }
        @keyframes pg-blob2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40%       { transform: translate(-20px, 12px) scale(1.08); }
          70%       { transform: translate(14px, -8px) scale(0.94); }
        }
        @keyframes pg-scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(400%); opacity: 0; }
        }
      `}</style>

      {/* ── Background photo (optional) ──────────────────────────────────── */}
      {imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
          style={{ opacity: 0.12 }}
        />
      )}

      {/* ── SVG dot grid ─────────────────────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        aria-hidden="true"
        style={{ opacity: 0.07 }}
      >
        <defs>
          <pattern id="pg-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pg-dots)" />
      </svg>

      {/* ── Animated blobs ───────────────────────────────────────────────── */}
      <div
        className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{
          backgroundColor: "#7234BD",
          opacity: 0.35,
          animation: "pg-blob 9s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-12 left-[30%] w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{
          backgroundColor: "#FFBC00",
          opacity: 0.1,
          animation: "pg-blob2 11s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/2 right-[20%] w-48 h-48 rounded-full blur-2xl pointer-events-none"
        style={{
          backgroundColor: "#7234BD",
          opacity: 0.18,
          animation: "pg-blob 13s ease-in-out infinite reverse",
        }}
      />

      {/* ── Scanning light line ──────────────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,188,0,0.4) 30%, rgba(255,188,0,0.7) 50%, rgba(255,188,0,0.4) 70%, transparent 100%)",
          animation: "pg-scan 6s ease-in-out infinite",
          animationDelay: "1s",
        }}
      />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto relative z-10">
        <p className="text-[#FFBC00] text-[10px] font-extrabold uppercase tracking-[0.2em] mb-3">
          {label}
        </p>
        <h1
          className="text-3xl lg:text-4xl font-extrabold text-white mb-2 leading-tight"
          style={{ fontFamily: "var(--font-mulish, sans-serif)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/40 text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
