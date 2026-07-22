export default function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-brand-border/60 ${className}`}
    />
  );
}