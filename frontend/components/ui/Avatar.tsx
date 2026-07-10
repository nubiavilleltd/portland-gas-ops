"use client";

/**
 * Avatar — shows a profile image if available, otherwise a purple circle with initials.
 *
 * Usage:
 *   <Avatar name="Ebuka Ezeanya" src={user.profile_picture_url} size="md" />
 *
 * Sizes:  xs (24px) | sm (28px) | md (32px) | lg (64px)
 */

const SIZE: Record<string, string> = {
  xs:  "h-6  w-6  text-[9px]",
  sm:  "h-7  w-7  text-[10px]",
  md:  "h-8  w-8  text-xs",
  lg:  "h-16 w-16 text-xl",
};

interface AvatarProps {
  /** Display name — used to derive initials when no image is available */
  name: string;
  /** Profile picture URL. If falsy, falls back to initials. */
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, src, size = "md", className = "" }: AvatarProps) {
  const dim = SIZE[size] ?? SIZE.md;
  const base = `${dim} rounded-full shrink-0 overflow-hidden ${className}`;

  if (src) {
    return <img src={src} alt={name} className={`${base} object-cover`} />;
  }

  return (
    <div className={`${base} bg-brand-purple flex items-center justify-center`}>
      <span className="text-white font-semibold leading-none select-none">
        {initials(name)}
      </span>
    </div>
  );
}
