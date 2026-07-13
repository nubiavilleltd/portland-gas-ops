"use client";

/**
 * Avatar — shows a profile image if available, otherwise a purple circle/square with initials.
 *
 * Usage:
 *   <Avatar name="Ebuka Ezeanya" src={user.profile_picture_url} size="md" />
 *   <Avatar name="Ebuka Ezeanya" src={user.profile_picture_url} size="lg" rounded="xl" />
 *
 * Sizes:  xs (24px) | sm (28px) | md (32px) | xl (40px) | lg (64px)
 * Rounded: "full" (circle, default) | "xl" (rounded-2xl square)
 */

const SIZE: Record<string, string> = {
  xs:  "h-6  w-6  text-[9px]",
  sm:  "h-7  w-7  text-[10px]",
  md:  "h-8  w-8  text-xs",
  xl:  "h-10 w-10 text-sm",
  lg:  "h-16 w-16 text-xl",
};

const ROUNDED: Record<string, string> = {
  full: "rounded-full",
  xl:   "rounded-2xl",
};

interface AvatarProps {
  /** Display name — used to derive initials when no image is available */
  name: string;
  /** Profile picture URL. If falsy, falls back to initials. */
  src?: string | null;
  size?: "xs" | "sm" | "md" | "xl" | "lg";
  /** Shape: "full" = circle (default), "xl" = rounded square */
  rounded?: "full" | "xl";
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, src, size = "md", rounded = "full", className = "" }: AvatarProps) {
  const dim    = SIZE[size] ?? SIZE.md;
  const radius = ROUNDED[rounded] ?? ROUNDED.full;
  const base   = `${dim} ${radius} shrink-0 overflow-hidden ${className}`;

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
