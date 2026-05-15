"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  title?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  bodyClassName?: string;
  iconWrapperClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export default function Card({
  title,
  description,
  content,
  icon,
  action,
  children,
  href,
  onClick,
  disabled = false,
  className,
  bodyClassName,
  iconWrapperClassName,
  titleClassName,
  descriptionClassName,
}: Props) {
  const interactive = Boolean(href || onClick);

  const classes = cn(
    "bg-white border border-brand-border rounded-xl md:rounded-2xl p-4 md:p-6",
    interactive && !disabled && "cursor-pointer transition-all hover:border-brand-purple hover:shadow-sm",
    interactive && disabled && "cursor-not-allowed opacity-40",
    className
  );

  const inner = (
    <div className={cn("flex h-full flex-col", bodyClassName)}>
      {(icon || action) && (
        <div className="flex items-start justify-between gap-3">
          {icon ? (
            <div
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-brand-purple-faint text-brand-purple",
                iconWrapperClassName
              )}
            >
              {icon}
            </div>
          ) : (
            <div />
          )}
          {action}
        </div>
      )}
      {title ? (
        <p className={cn("font-semibold text-brand-text-primary mt-3 md:mt-4 text-xs md:text-sm", titleClassName)}>
          {title}
        </p>
      ) : null}
      {description ? (
        <p
          className={cn(
            "text-sm text-brand-text-secondary mt-1 leading-relaxed",
            descriptionClassName
          )}
        >
          {description}
        </p>
      ) : null}
      {content}
      {children}
    </div>
  );

  if (href) {
    return disabled ? (
      <div className={classes} aria-disabled="true">
        {inner}
      </div>
    ) : (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => !disabled && onClick()}
        className={cn("w-full text-left", classes)}
        disabled={disabled}
      >
        {inner}
      </button>
    );
  }

  return <div className={classes}>{inner}</div>;
}
