"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  stat?: string;
}

export default function WorkspaceCard({
  title,
  description,
  href,
  icon: Icon,
  stat,
}: Props) {
  return (
    <Link
      href={href}
      className="
        group
        bg-white
        border border-brand-border
        rounded-2xl
        p-5
        hover:border-brand-purple
        hover:shadow-sm
        transition-all
        flex
        flex-col
        justify-between
        min-h-45
      "
    >
      <div>

        <div className="w-11 h-11 rounded-xl bg-brand-purple/10 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-brand-purple" />
        </div>

        <h3 className="text-base font-semibold text-brand-text-primary">
          {title}
        </h3>

        <p className="text-sm text-brand-text-secondary mt-2 leading-relaxed">
          {description}
        </p>

      </div>

      <div className="mt-6 flex items-center justify-between">

        {stat ? (
          <p className="text-sm font-medium text-brand-text-primary">
            {stat}
          </p>
        ) : (
          <div />
        )}

        <span className="text-sm font-medium text-brand-purple group-hover:translate-x-1 transition-transform">
          Open →
        </span>

      </div>
    </Link>
  );
}