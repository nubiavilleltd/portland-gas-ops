"use client";

import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  disabled?: boolean;
}

export default function ModuleCard({ name, description, icon: Icon, href, disabled = false }: Props) {
  const router = useRouter();

  return (
    <div
      onClick={() => !disabled && router.push(href)}
      className={cn(
        "bg-white border border-brand-border rounded-xl md:rounded-2xl p-4 md:p-6 transition-all",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:border-brand-purple hover:shadow-sm cursor-pointer"
      )}
    >
      <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-brand-purple-faint text-brand-purple">
        <Icon size={20} className="md:hidden" />
        <Icon size={24} className="hidden md:block" />
      </div>
      <p className="font-semibold text-brand-text-primary mt-3 md:mt-4 text-xs md:text-sm">{name}</p>
      <p className="text-[11px] md:text-xs text-brand-text-secondary mt-1 leading-relaxed hidden sm:block">{description}</p>
    </div>
  );
}
