"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  User,
  CheckSquare,
  AlertCircle,
  RotateCcw,
  Info,
  Clock,
  Cake,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/lib/modules/notifications/hooks";
import type { AppNotification, NotificationType } from "@/lib/modules/notifications/types";

const DEMO_NAME = "Portland Gas";

const NAV_LINKS = [
  { label: "Home",    href: "/" },
  { label: "News",    href: "/news" },
  { label: "Events",  href: "/events" },
  { label: "Podcast", href: "/podcast" },
  { label: "FAQ",     href: "/faq" },
];

// ── Icon + colour per notification type ────────────────────────────────────────
const TYPE_META: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  approval_required: { icon: Clock,       color: "#B45309", bg: "#FFFBEB" },
  approved:          { icon: CheckSquare, color: "#166534", bg: "#F0FDF4" },
  rejected:          { icon: AlertCircle, color: "#991B1B", bg: "#FEF2F2" },
  returned:          { icon: RotateCcw,   color: "#1E40AF", bg: "#EFF6FF" },
  info:              { icon: Info,        color: "#7234BD", bg: "#F3EEFF" },
};

// Birthday wishes look nicer with a cake icon
function getTypeMeta(n: AppNotification) {
  if (n.type === "info" && n.title.includes("🎂")) {
    return { icon: Cake, color: "#B45309", bg: "#FFFBEB" };
  }
  return TYPE_META[n.type] ?? TYPE_META.info;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

interface Props { children: React.ReactNode }

export default function IntranetLayout({ children }: Props) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { logout } = useAuth();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Real notifications
  const { data: notifications = [] } = useNotifications({ limit: 30 });
  const markRead    = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unread = notifications.filter((n) => !n.is_read).length;

  // Blend with hero when at top; solidify on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const displayName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.name || DEMO_NAME
    : DEMO_NAME;
  const firstName = displayName.split(" ")[0];

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleNotifClick(n: AppNotification) {
    if (!n.is_read) markRead.mutate(n.id);
  }

  return (
    <div className="min-h-screen bg-[#F5F4F7]" style={{ fontFamily: "var(--font-mulish, var(--font-sans))" }}>

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        pathname === "/" && !scrolled
          ? "bg-transparent border-b border-transparent"
          : "bg-[#1C043B] border-b border-white/10 shadow-lg"
      )}>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center gap-6">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="https://portlandgasltd.com/wp-content/uploads/2024/06/Portland-gas-42.png"
              alt="Portland Gas"
              width={130}
              height={34}
              className="h-7 w-auto object-contain brightness-0 invert"
              style={{ width: "auto" }}
              priority
            />
          </Link>

          {/* Desktop nav — centred */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold transition-all duration-150 border-b-2",
                    active
                      ? "text-white border-[#FFBC00]"
                      : "text-white/60 hover:text-white hover:bg-white/10 border-transparent rounded-lg"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">

            {/* ── Workflow CTA ── */}
            <Link
              href="/home"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#7234BD] text-[#c084fc] text-xs font-semibold hover:bg-[#7234BD] hover:text-white transition-all duration-150 btn-press"
            >
              <LayoutDashboard size={13} />
              Workflow
            </Link>

            {/* ── Notifications ── */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative h-9 w-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all btn-press"
              >
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#FFBC00] flex items-center justify-center text-[9px] font-extrabold text-[#1C043B]">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-[68px] sm:top-full sm:mt-2 w-auto sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-up">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-[#1C043B]">Notifications</p>
                    {unread > 0 && (
                      <span className="text-[10px] text-[#7234BD] font-semibold bg-[#F3EEFF] px-2 py-0.5 rounded-full">
                        {unread} new
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-400 text-xs">
                        <Bell size={20} className="mx-auto mb-2 opacity-30" />
                        No notifications yet
                      </div>
                    ) : notifications.map((n) => {
                      const meta = getTypeMeta(n);
                      const Icon = meta.icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={cn(
                            "w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left",
                            !n.is_read && "bg-[#F3EEFF]/40"
                          )}
                        >
                          <div
                            className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: meta.bg }}
                          >
                            <Icon size={15} style={{ color: meta.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm leading-snug", !n.is_read ? "font-semibold text-[#1C043B]" : "font-medium text-gray-700")}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.is_read && <span className="h-2 w-2 rounded-full bg-[#7234BD] shrink-0 mt-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                      <button
                        onClick={() => markAllRead.mutate()}
                        disabled={unread === 0 || markAllRead.isPending}
                        className="text-xs text-[#7234BD] font-semibold hover:underline disabled:opacity-40 disabled:no-underline"
                      >
                        {markAllRead.isPending ? "Marking…" : "Mark all as read"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Profile ── */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all btn-press"
              >
                <Avatar
                  name={displayName}
                  src={user?.profile_picture_url}
                  size="sm"
                  className="ring-2 ring-white/20"
                />
                <span className="hidden sm:block text-sm text-white/80 font-medium max-w-[90px] truncate">
                  {firstName}
                </span>
                <ChevronDown size={13} className={cn("text-white/40 hidden sm:block transition-transform duration-200", profileOpen && "rotate-180")} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-50 animate-fade-up">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email ?? ""}</p>
                  </div>
                  <Link href="/hr-management/my-profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User size={14} className="text-gray-400" /> My Profile
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all btn-press"
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          className={cn(
            "lg:hidden bg-[#1C043B] px-4 overflow-hidden transition-all duration-300 ease-in-out",
            mobileOpen
              ? "max-h-64 opacity-100 py-3 border-t border-white/10"
              : "max-h-0 opacity-0 py-0 border-t-0"
          )}
        >
          <div className="space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  pathname === link.href ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/home" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#c084fc] font-semibold">
              <LayoutDashboard size={14} /> Workflow Portal
            </Link>
          </div>
        </div>
      </header>

      {/* pt-16 offsets the fixed header (h-16 = 64px) */}
      <main className="animate-page-enter pt-16">{children}</main>
    </div>
  );
}
