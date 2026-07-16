export default function AdminAssetDetailSkeleton() {
  return (
    <div className="animate-pulse">

      {/* Back link */}
      <div className="mb-5 h-4 w-28 rounded bg-gray-200" />

      <div className="space-y-5">

        {/* Header card */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 rounded bg-gray-300" />
              <div className="h-3.5 w-28 rounded bg-gray-100" />
              <div className="flex items-center gap-2 mt-3">
                <div className="h-5 w-20 rounded-full bg-gray-200" />
                <div className="h-5 w-16 rounded-full bg-gray-200" />
                <div className="h-5 w-24 rounded-full bg-gray-100" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-24 rounded-lg bg-gray-100" />
              <div className="h-8 w-16 rounded-lg bg-gray-100" />
              <div className="h-8 w-18 rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Tabs bar */}
        <div className="flex gap-1 bg-white border border-brand-border rounded-xl p-1 w-fit">
          <div className="h-7 w-16 rounded-lg bg-brand-purple/20" />
          <div className="h-7 w-24 rounded-lg bg-gray-100" />
          <div className="h-7 w-24 rounded-lg bg-gray-100" />
        </div>

        {/* Details tab — 2/3 + 1/3 grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left col */}
          <div className="lg:col-span-2 space-y-5">

            {/* Image card */}
            <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
              <div className="h-64 bg-gray-100 rounded-2xl" />
            </div>

            {/* Asset details card */}
            <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50">
                <div className="h-4 w-28 rounded bg-gray-200" />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i}>
                      <div className="h-3 w-20 rounded bg-gray-100 mb-1.5" />
                      <div className="h-4 w-32 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="space-y-5">

            {/* Quick info card */}
            <div className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="h-4 w-20 rounded bg-gray-200 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-3 w-16 rounded bg-gray-100" />
                    <div className="h-5 w-20 rounded-full bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>

            {/* QR code card */}
            <div className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="h-4 w-16 rounded bg-gray-200 mb-4" />
              <div className="flex flex-col items-center gap-3">
                <div className="h-[164px] w-[164px] rounded-xl bg-gray-100" />
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-9 w-full rounded-lg bg-gray-100" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
