"use client";

import { Bell } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { initials } from "@/lib/utils";

interface Props {
  pageTitle?: string;
}

export default function AppHeader({ pageTitle }: Props) {
  const { user } = useCurrentUser();

  return (
    <header className="h-14 bg-white border-b border-brand-border flex items-center justify-between px-6 shrink-0">
      {pageTitle ? (
        <h2 className="text-sm font-semibold text-brand-text-primary">{pageTitle}</h2>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50 transition-colors">
          <Bell size={18} />
          {/* TODO: unread count badge */}
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand-purple flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{initials(user.name)}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
