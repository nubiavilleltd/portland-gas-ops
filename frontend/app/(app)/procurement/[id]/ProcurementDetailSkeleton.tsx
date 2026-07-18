export default function ProcurementDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Back link */}
      <div className="mb-4 h-4 w-36 rounded bg-gray-200" />

      {/* Header card */}
      <div className="bg-white border border-brand-border rounded-2xl px-6 py-5 mb-5 flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-40 rounded bg-gray-200" />
          <div className="h-7 w-56 rounded bg-gray-300" />
          <div className="h-3 w-32 rounded bg-gray-100" />
          <div className="h-3 w-48 rounded bg-gray-100" />
        </div>
        <div className="h-6 w-28 rounded-full bg-gray-200 mt-1 shrink-0" />
      </div>

      <div className="space-y-5">
        {/* Requester Details */}
        <SkeletonSection fields={4} />

        {/* Request Details */}
        <SkeletonSection fields={3} hasTextarea />

        {/* Line Items table */}
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="border-b border-brand-border bg-gray-50 px-6 py-4">
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
          <div className="divide-y divide-brand-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 px-6 py-4">
                <div className="flex-1 h-4 rounded bg-gray-100" />
                <div className="w-10 h-4 rounded bg-gray-100" />
                <div className="w-10 h-4 rounded bg-gray-100" />
                <div className="w-20 h-4 rounded bg-gray-100" />
                <div className="w-24 h-4 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Approval history */}
        <SkeletonSection fields={2} />
      </div>
    </div>
  );
}

function SkeletonSection({ fields, hasTextarea = false }: { fields: number; hasTextarea?: boolean }) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
      <div className="border-b border-brand-border bg-gray-50 px-6 py-4">
        <div className="h-4 w-36 rounded bg-gray-200" />
        <div className="mt-1.5 h-3 w-1/2 rounded bg-gray-100" />
      </div>
      <div className={`grid gap-4 p-6 ${fields > 2 ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-3 w-28 rounded bg-gray-200" />
            <div className="h-10 rounded-xl bg-gray-100" />
          </div>
        ))}
      </div>
      {hasTextarea && (
        <div className="px-6 pb-6">
          <div className="mb-2 h-3 w-40 rounded bg-gray-200" />
          <div className="h-20 rounded-xl bg-gray-100" />
        </div>
      )}
    </div>
  );
}
