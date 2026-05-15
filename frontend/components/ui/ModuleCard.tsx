"use client";

import type { LucideIcon } from "lucide-react";
import Card from "./Card";

interface Props {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  disabled?: boolean;
}

export default function ModuleCard({ name, description, icon: Icon, href, disabled = false }: Props) {
  return (
    <Card
      href={href}
      disabled={disabled}
      title={name}
      description={description}
      icon={
        <>
          <Icon size={20} className="md:hidden" />
          <Icon size={24} className="hidden md:block" />
        </>
      }
      className="h-full"
      iconWrapperClassName="md:w-12 md:h-12"
      titleClassName="text-xs md:text-sm"
      descriptionClassName="text-[11px] md:text-xs hidden sm:block"
    />
  );
}
