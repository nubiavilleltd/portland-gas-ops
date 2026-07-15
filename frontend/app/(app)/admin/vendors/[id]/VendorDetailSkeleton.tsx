export default function VendorDetailSkeleton() {
  return (
    <div className="animate-pulse">

      {/* Back link */}
      <div className="mb-5 h-4 w-28 rounded bg-gray-200" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-gray-200 shrink-0" />
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3">
              <div className="h-5 w-40 rounded bg-gray-300" />
              <div className="h-5 w-20 rounded-full bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="h-4 w-24 rounded bg-gray-100" />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gray-100" />
          <div className="h-8 w-8 rounded-lg bg-gray-100" />
          <div className="h-8 w-8 rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Two-column info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Company Information */}
        <div className="bg-white border border-brand-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-4 rounded bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-200" />
          </div>
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-brand-border last:border-0">
                <div className="w-36 h-3.5 rounded bg-gray-100 shrink-0" />
                <div className="h-3.5 rounded bg-gray-200" style={{ width: `${[60, 40, 55, 70, 35][i]}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white border border-brand-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-4 rounded bg-gray-200" />
            <div className="h-4 w-28 rounded bg-gray-200" />
          </div>
          <div className="space-y-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-brand-border last:border-0">
                <div className="w-36 h-3.5 rounded bg-gray-100 shrink-0" />
                <div className="h-3.5 rounded bg-gray-200" style={{ width: `${[45, 65, 40][i]}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requests table */}
      <div className="bg-white border border-brand-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-48 rounded bg-gray-200" />
        </div>
        <div className="space-y-3">
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 pb-2 border-b border-brand-border">
            {["Reference", "Category", "Date", "Est. Value", "Status"].map((col) => (
              <div key={col} className="h-3 w-16 rounded bg-gray-100" />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-2">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-100" />
              <div className="h-4 w-16 rounded bg-gray-100" />
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
