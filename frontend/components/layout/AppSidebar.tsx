"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/public/Portland-gas-logo.png";
import { usePathname } from "next/navigation";
import {
  Home,
  CheckCircle,
  // FileText,
  ClipboardList,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "My Approvals", href: "/approvals", icon: CheckCircle },
  { label: "My Requests", href: "/assets/requests", icon: ClipboardList },
  // Drafts are hidden for now, but kept here so the nav item can return later.
  // { label: "Drafts", href: "/drafts", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { logout } = useAuth();

  function isActive(href: string) {
    return href === "/home" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        // Base: fixed full-height sidebar
        "fixed inset-y-0 left-0 z-30 w-64 bg-brand-dark flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out",
        // Mobile: slide in/out. Desktop: always visible
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
    >
      {/* Logo + mobile close button */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0 p-1">
            <Image src={logo} alt="Portland Gas" width={28} height={28} />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">Portland Gas</p>
            <p className="text-purple-400 text-xs mt-0.5">Operations</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white p-1 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-brand-purple/15 text-brand-purple border-l-2 border-brand-purple"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-4 space-y-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-purple flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">{initials(user.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className="text-gray-400 text-[10px] truncate capitalize">
                {user.role.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-8 rounded-lg bg-white/5 animate-pulse" />
        )}

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
