// components/ui/Badge.tsx

import { BADGE_VARIANTS, BadgeVariant } from "@/config/badge.config";


interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  className?: string;
}

export default function Badge({ variant = "neutral", label, className }: BadgeProps) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${BADGE_VARIANTS[variant]} ${className ?? ""}`}>
      {label}
    </span>
  );
}




// import { cn } from "@/lib/utils";

// export type BadgeVariant =
//   | "success"
//   | "warning"
//   | "danger"
//   | "info"
//   | "purple"
//   | "cyan"
//   | "orange"
//   | "pink"
//   | "rose"
//   | "indigo"
//   | "teal"
//   | "lime"
//   | "amber"
//   | "sky"
//   | "neutral";

// interface BadgeProps {
//   variant?: BadgeVariant;
//   label: string;
//   className?: string;
// }

// export default function Badge({
//   variant = "neutral",
//   label,
//   className,
// }: BadgeProps) {
//   return (
//     <span
//       className={cn(
//         // Base styles
//         "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
//         // Variant styles - MUST be complete class names, not interpolated
//         {
//           "bg-green-100 text-green-700": variant === "success",
//           "bg-yellow-100 text-yellow-700": variant === "warning",
//           "bg-red-100 text-red-700": variant === "danger",
//           "bg-blue-100 text-blue-700": variant === "info",
//           "bg-purple-100 text-purple-700": variant === "purple",
//           "bg-cyan-100 text-cyan-700": variant === "cyan",
//           "bg-orange-100 text-orange-700": variant === "orange",
//           "bg-pink-100 text-pink-700": variant === "pink",
//           "bg-rose-100 text-rose-700": variant === "rose",
//           "bg-indigo-100 text-indigo-700": variant === "indigo",
//           "bg-teal-100 text-teal-700": variant === "teal",
//           "bg-lime-100 text-lime-700": variant === "lime",
//           "bg-amber-100 text-amber-700": variant === "amber",
//           "bg-sky-100 text-sky-700": variant === "sky",
//           "bg-gray-100 text-gray-600": variant === "neutral",
//         },
//         className
//       )}
//     >
//       {label}
//     </span>
//   );
// }