export default function ApprovalsSkeleton() {
  return (
    <div className="animate-pulse">

      {/* Table shell */}
      <div className="rounded-2xl border border-brand-border bg-white overflow-hidden shadow-sm">

        {/* Header row */}
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-brand-border bg-gray-50">
          {["w-20", "w-24", "w-20", "w-24", "w-20", "w-28"].map((w, i) => (
            <div key={i} className={`h-3 ${w} rounded bg-gray-200`} />
          ))}
        </div>

        {/* Body rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 px-4 py-4 border-b border-brand-border last:border-0 items-center">
            {/* Reference — mono */}
            <div className="h-3.5 w-24 rounded bg-gray-200" />
            {/* Request title */}
            <div className="h-3.5 w-32 rounded bg-gray-200" />
            {/* Process badge */}
            <div className="h-5 w-20 rounded-full bg-gray-100" />
            {/* Department */}
            <div className="h-3.5 w-24 rounded bg-gray-100" />
            {/* Submitted */}
            <div className="h-3 w-28 rounded bg-gray-100" />
            {/* Action needed badge */}
            <div className="h-5 w-28 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>

    </div>
  );
}
