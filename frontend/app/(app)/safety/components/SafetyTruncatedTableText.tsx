export default function SafetyTruncatedTableText({
  value,
}: {
  value?: string | null;
}) {
  const displayValue = value?.trim() || "-";

  return (
    <span className="block max-w-48 truncate" title={displayValue}>
      {displayValue}
    </span>
  );
}
