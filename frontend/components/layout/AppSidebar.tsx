"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/Portland-gas-logo.png";
import { usePathname } from "next/navigation";
import {
  Home,
  CheckCircle,
  // FileText,
  ClipboardList,
  ShieldCheck,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "My Approvals", href: "/approvals", icon: CheckCircle },
  { label: "My Requests", href: "/requests", icon: ClipboardList },
  // Drafts are hidden for now, but kept here so the nav item can return later.
  // { label: "Drafts", href: "/drafts", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

const roleNavItems: NavItem[] = [
  { label: "Admin", href: "/admin", icon: ShieldCheck },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  function isActive(href: string) {
    return href === "/home" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        // Base: fixed full-height sidebar
        "fixed inset-y-0 left-0 z-30 w-64 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out",
        // Mobile: slide in/out. Desktop: always visible
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(26,15,46,0.92) 0%, rgba(17,8,38,0.88) 45%, rgba(13,13,18,0.95) 100%), url('/portland-sidebar.png')",
        backgroundSize: "auto, cover",
        backgroundPosition: "center, center 30%",
        backgroundRepeat: "no-repeat, no-repeat",
      }}
    >
      {/* Logo + mobile close button */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image src={logo} alt="Portland Gas" width={32} height={32} className="brightness-0 invert shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold leading-none">Portland Gas</p>
            <p className="text-purple-400 text-xs mt-0.5">Operations</p>
          </div>
        </Link>
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
                    ? "bg-brand-purple/15 text-white border-l-2 border-brand-purple"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {(user?.role === "super_admin" || user?.role === "admin") && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Role access
            </p>
            <div className="mt-2 space-y-1">
              {roleNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-brand-purple/15 text-white border-l-2 border-brand-purple"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-4 space-y-4">
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar
              name={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.name || "?"}
              src={user.profile_picture_url}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user.name}</p>
              <p className="text-gray-400 text-[10px] truncate capitalize">
                {user.role.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-8 rounded-lg bg-white/5 animate-pulse" />
        )}

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutModal}
        title="Log out"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Yes, log out"
        destructive
        icon={<LogOut size={18} />}
        onConfirm={() => { setShowLogoutModal(false); logout(); }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </aside>
  );
}
