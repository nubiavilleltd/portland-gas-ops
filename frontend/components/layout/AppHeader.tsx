"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { getModuleGroupForPathname } from "@/config/module-groups";
import { getModuleGroupForPathname as getAdminModuleGroupForPathname } from "@/config/module-groups-admin";

interface Props {
  pageTitle?: string;
  onMenuClick: () => void;
}

export default function AppHeader({ pageTitle, onMenuClick }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/home" || pathname === "/admin";

  const groupTitle = pathname.startsWith("/admin")
    ? getAdminModuleGroupForPathname(pathname)?.title
    : getModuleGroupForPathname(pathname)?.title;
  const headerTitle = groupTitle ?? pageTitle;

  // On /home desktop the sidebar is always visible and the header adds nothing —
  // only keep a slim mobile-only bar for the hamburger.
  if (isHome) {
    return (
      <header className="lg:hidden h-14 bg-white border-b border-brand-border flex items-center px-4 shrink-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>
    );
  }

  return (
    <header className="h-14 bg-white border-b border-brand-border flex items-center gap-3 px-4 md:px-6 shrink-0">
      {/* Hamburger — mobile/tablet only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {headerTitle && (
        <h2 className="text-sm font-semibold text-brand-text-primary">
          {headerTitle}
        </h2>
      )}
    </header>
  );
}
