// components/ui/Skeleton.tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-300 dark:bg-gray-300 ${className}`}
    />
  );
}
