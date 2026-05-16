"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/public/Portland-gas-logo.png";
import { usePathname } from "next/navigation";
import {
  Home, ShoppingCart, Package, Receipt, Truck, Wrench,
  ShieldCheck, AlertTriangle, BarChart3, Users, Settings, LogOut, X, Store,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: "HOME",
    items: [{ label: "Home", href: "/home", icon: Home }],
  },
  {
    group: "OPERATIONS",
    items: [
      { label: "Procurement", href: "/procurement", icon: ShoppingCart },
      { label: "Vendors", href: "/vendors", icon: Store },
      { label: "Orders", href: "/orders", icon: Package },
      { label: "Billing", href: "/billing", icon: Receipt },
      { label: "Fleet", href: "/fleet", icon: Truck },
    ],
  },
  {
    group: "ASSETS & SAFETY",
    items: [
      { label: "Assets", href: "/assets", icon: Wrench },
      { label: "Safety", href: "/safety", icon: ShieldCheck },
      { label: "Incidents", href: "/safety/incidents", icon: AlertTriangle },
    ],
  },
  {
    group: "FINANCE & HR",
    items: [
      { label: "Finance", href: "/finance", icon: BarChart3 },
      { label: "HR", href: "/hr", icon: Users },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { label: "Admin", href: "/admin", icon: Settings },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
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
      <nav className="flex-1 px-3 py-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.group}>
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1">
              {group.group}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose} // close on mobile after navigation
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
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
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-4">
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
            <button
              onClick={logout}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div className="h-8 rounded-lg bg-white/5 animate-pulse" />
        )}
      </div>
    </aside>
  );
}
