"use client";

import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyBranding } from "@/lib/company-branding";

interface Props {
  size?: number;
  className?: string;
  iconClassName?: string;
}

export default function CompanyLogo({ size = 40, className, iconClassName }: Props) {
  const { name, logoDataUrl } = useCompanyBranding();

  if (logoDataUrl) {
    return (
      <img
        src={logoDataUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", className)}
      />
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
