"use client";

import Image from "next/image";
import { Building2, CheckCircle2 } from "lucide-react";
import type { LogoBackground } from "@/lib/company-branding";
import { getContrastTextColor } from "@/lib/company-branding";

interface BrandingPreviewProps {
  companyName: string;
  logoUrl: string | null;
  logoBackground: LogoBackground;
  primaryColor: string;
  secondaryColor: string;
}

export default function BrandingPreview({
  companyName,
  logoUrl,
  logoBackground,
  primaryColor,
  secondaryColor,
}: BrandingPreviewProps) {
  const sidebarText = getContrastTextColor(secondaryColor);
  const logoSurface = logoBackground === "dark"
    ? secondaryColor
    : logoBackground === "light"
      ? "#FFFFFF"
      : "transparent";
  const logoText = logoBackground === "none" ? sidebarText : getContrastTextColor(logoSurface);

  return (
    <section className="rounded-2xl border border-brand-border bg-gray-50 p-4" aria-label="Branding preview">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-brand-text-primary">Workspace preview</h3>
          <p className="mt-1 text-xs text-brand-text-secondary">Check the logo surface and color balance before saving.</p>
        </div>
        <CheckCircle2 size={18} className="text-brand-purple" aria-hidden="true" />
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
        <div className="flex min-h-48">
          <aside className="w-44 shrink-0 p-4" style={{ backgroundColor: secondaryColor, color: sidebarText }}>
            <div className="flex items-center gap-2 border-b border-current/15 pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg p-1" style={{ backgroundColor: logoSurface, color: logoText }}>
                {logoUrl ? (
                  <Image src={logoUrl} alt="Logo preview" width={32} height={32} unoptimized className="h-full w-full object-contain" />
                ) : (
                  <Building2 size={18} />
                )}
              </span>
              <span className="min-w-0 truncate text-xs font-semibold">{companyName.trim() || "Your Company"}</span>
            </div>
            <div className="mt-5 space-y-2 text-[11px] opacity-80">
              <div className="rounded-md bg-white/15 px-2 py-1.5">Home</div>
              <div className="px-2 py-1.5">My Requests</div>
              <div className="px-2 py-1.5">Settings</div>
            </div>
          </aside>
          <div className="min-w-0 flex-1 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>Workspace home</p>
            <h4 className="mt-2 text-lg font-semibold text-slate-900">Welcome back</h4>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">A quick preview of how the selected colors and logo surface work together.</p>
            <button type="button" className="mt-5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: primaryColor, color: getContrastTextColor(primaryColor) }}>
              Open workspace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
