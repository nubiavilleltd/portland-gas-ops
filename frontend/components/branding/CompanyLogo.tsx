"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCompanyBranding } from "@/lib/company-branding";

interface Props {
  size?: number;
  className?: string;
  iconClassName?: string;
}

export default function CompanyLogo({ size = 40, className, iconClassName }: Props) {
  const { name, logoDataUrl, logoBackground, secondaryColor } = useCompanyBranding();
  const hasDimensionClass = /\b[hw]-/.test(className ?? "");
  const logoSurface = logoBackground === "dark"
    ? secondaryColor
    : logoBackground === "light"
      ? "#FFFFFF"
      : "transparent";

  if (logoDataUrl) {
    return (
      <span
        className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl p-1", className)}
        style={{
          ...(hasDimensionClass ? {} : { width: size, height: size }),
          backgroundColor: logoSurface,
        }}
      >
        <Image
          src={logoDataUrl}
          alt={`${name} logo`}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={`${name} logo`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Building2 size={Math.max(18, Math.round(size * 0.45))} className={iconClassName} />
    </span>
  );
}
