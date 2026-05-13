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
        "bg-white border border-brand-border rounded-2xl p-6 transition-all",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:border-brand-purple hover:shadow-sm cursor-pointer"
      )}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-purple-faint text-brand-purple">
        <Icon size={24} />
      </div>
      <p className="font-semibold text-brand-text-primary mt-4 text-sm">{name}</p>
      <p className="text-xs text-brand-text-secondary mt-1 leading-relaxed">{description}</p>
    </div>
  );
}
