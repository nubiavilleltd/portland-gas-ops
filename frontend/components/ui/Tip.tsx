/**
 * Lightweight CSS-only tooltip wrapper.
 * Wraps any content and shows a dark pill above it on hover.
 *
 * Usage:
 *   <Tip label="Delete Episode"><Trash2 size={14} /></Tip>
 */
export default function Tip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="relative group/tip inline-flex items-center">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/tip:opacity-100 z-50 shadow-sm">
        {label}
      </span>
    </span>
  );
}
