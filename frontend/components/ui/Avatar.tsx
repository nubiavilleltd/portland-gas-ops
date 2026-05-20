"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  shape?: "circle" | "square" | "rounded";
  className?: string;
}

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Avatar({
  src,
  name,
  size = 48,
  shape = "circle",
  className,
}: AvatarProps) {
  const initials = getInitials(name);

  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "rounded"
      ? "rounded-xl"
      : "rounded-md";

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative flex items-center justify-center bg-gray-100 border border-brand-border overflow-hidden",
        shapeClass,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name || "avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-sm font-semibold text-gray-500">
          {initials}
        </span>
      )}
    </div>
  );
}