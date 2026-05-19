"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const variantStyles = {
  primary: "bg-brand-purple text-white hover:bg-brand-purple-dark",
  secondary: "bg-brand-purple-faint text-brand-purple hover:bg-brand-purple-mid",
  outline: "border border-brand-border bg-white text-brand-text-secondary hover:bg-gray-50",
  ghost: "bg-transparent text-brand-text-secondary hover:bg-gray-50 hover:text-brand-text-primary",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

const sizeStyles = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-11 px-5 text-sm rounded-xl",
} as const;

type ButtonVariant = keyof typeof variantStyles;
type ButtonSize = keyof typeof sizeStyles;

interface Props extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "content"> {
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  content?: React.ReactNode;
  disabled?: boolean;
}

export default function Button({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  content,
  children,
  disabled = false,
  className,
  onClick,
  type = "button",
  ...props
}: Props) {
  const isDisabled = disabled || loading;
  const body = loadingText && loading ? loadingText : (content ?? children);

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    isDisabled && "pointer-events-none opacity-60",
    className
  );

  const inner = (
    <>
      {loading ? (
        <LoaderCircle size={16} className="animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {body && <span>{body}</span>}
      {!loading && rightIcon ? rightIcon : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={(event) => {
          if (isDisabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event as never);
        }}
        aria-disabled={isDisabled}
        className={classes}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={classes}
      onClick={onClick}
      {...props}
    >
      {inner}
    </button>
  );
}
