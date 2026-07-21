export default function LeaveRequestDetailSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      {/* Header card */}
      <div className="rounded-2xl border border-brand-border bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-3 w-56 rounded bg-gray-100" />
          </div>
          <div className="h-6 w-20 rounded-full bg-gray-100" />
        </div>
      </div>

      {/* Access note */}
      <div className="rounded-2xl border border-brand-border bg-white p-4">
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>

      {/* Detail sections */}
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section
          key={sectionIndex}
          className="overflow-hidden rounded-2xl border border-brand-border bg-white"
        >
          <div className="border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
            <div className="h-4 w-44 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            {Array.from({ length: sectionIndex === 0 ? 4 : 6 }).map((__, fieldIndex) => (
              <div key={fieldIndex}>
                <div className="mb-2 h-3 w-32 rounded bg-gray-200" />
                <div className="h-11 rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
