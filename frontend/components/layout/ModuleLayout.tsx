"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";

interface Tab {
  label: string;
  href: string;
}

interface Props {
  title: string;
  description?: string;
  tabs: Tab[];
  children: React.ReactNode;
  action?: React.ReactNode;
}

export default function ModuleLayout({ title, description, tabs, children, action }: Props) {
  const pathname = usePathname();

  return (
    <div>
      <PageHeader title={title} description={description} action={action} className="mb-4" />
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white border border-brand-border rounded-xl p-1 w-fit">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-purple text-white"
                  : "text-brand-text-secondary hover:text-brand-text-primary"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
