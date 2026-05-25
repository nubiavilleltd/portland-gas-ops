"use client";

import { Bell, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getModuleGroupForPathname } from "@/config/module-groups";
import { initials } from "@/lib/utils";

interface Props {
  pageTitle?: string;
  onMenuClick: () => void;
}

export default function AppHeader({ pageTitle, onMenuClick }: Props) {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const groupTitle = getModuleGroupForPathname(pathname)?.title;
  const headerTitle = groupTitle ?? pageTitle;

  return (
    <header className="h-14 bg-white border-b border-brand-border flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — visible on mobile/tablet only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {headerTitle && (
          <h2 className="text-sm font-semibold text-brand-text-primary hidden sm:block">
            {headerTitle}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50 transition-colors">
          <Bell size={18} />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand-purple flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{initials(user.name)}</span>
            </div>
            {/* Name — hide on small screens */}
            <span className="text-sm font-medium text-brand-text-primary hidden md:block">
              {user.name.split(" ")[0]}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
