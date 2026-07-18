"use client";

export default function ProductDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button */}
      <div className="h-4 w-32 rounded bg-gray-200" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-100" />
        </div>

        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-lg bg-gray-100" />
          <div className="h-10 w-32 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Product Details */}
      <div className="rounded-xl border border-brand-border bg-white p-6">
        <div className="space-y-2 mb-6">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2"
            >
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-5 w-36 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="rounded-xl border border-brand-border bg-white p-6">
        <div className="space-y-2 mb-6">
          <div className="h-5 w-36 rounded bg-gray-200" />
          <div className="h-4 w-56 rounded bg-gray-100" />
        </div>

        <div className="aspect-16/7 rounded-xl bg-gray-100" />

        <div className="flex gap-2 mt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-14 rounded-lg bg-gray-200"
            />
          ))}
        </div>
      </div>

      {/* Stock Section */}
      <div className="rounded-xl border border-brand-border bg-white p-6">
        <div className="space-y-2 mb-6">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-100" />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="grid grid-cols-3 gap-6 flex-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="space-y-2"
              >
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-5 w-28 rounded bg-gray-100" />
              </div>
            ))}
          </div>

          <div className="h-9 w-36 rounded-lg bg-gray-200" />
        </div>

        <div className="divide-y divide-brand-border border-t border-brand-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-4"
            >
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-3 w-40 rounded bg-gray-100" />
              </div>

              <div className="space-y-2 text-right">
                <div className="h-4 w-20 rounded bg-gray-200 ml-auto" />
                <div className="h-3 w-24 rounded bg-gray-100 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}