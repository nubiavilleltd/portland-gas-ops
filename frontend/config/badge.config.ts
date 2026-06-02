// lib/config/badge.config.ts

export const BADGE_VARIANTS = {
  success:  "bg-green-100 text-green-700",
  warning:  "bg-yellow-100 text-yellow-700",
  danger:   "bg-red-100 text-red-700",
  info:     "bg-blue-100 text-blue-700",
  purple:   "bg-purple-100 text-purple-700",
  cyan:     "bg-cyan-100 text-cyan-700",
  orange:   "bg-orange-100 text-orange-700",
  pink:     "bg-pink-100 text-pink-700",
  rose:     "bg-rose-100 text-rose-700",
  indigo:   "bg-indigo-100 text-indigo-700",
  teal:     "bg-teal-100 text-teal-700",
  lime:     "bg-lime-100 text-lime-700",
  amber:    "bg-amber-100 text-amber-700",
  sky:      "bg-sky-100 text-sky-700",
  neutral:  "bg-gray-100 text-gray-600",
} as const;

export type BadgeVariant = keyof typeof BADGE_VARIANTS;