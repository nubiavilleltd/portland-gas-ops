import AppLayout from "@/components/layout/AppLayout";

export default function InventoryItemDetailSkeleton() {
  return (
    <AppLayout pageTitle="Item Detail">
      <div className="h-4 w-36 rounded-md bg-brand-border/60 animate-pulse mb-5" />

      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-4 w-32 rounded-md bg-brand-border/60 animate-pulse" />
        </div>
        <div className="h-9 w-28 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      <div className="space-y-6">
        {/* Item Details */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <div className="h-4 w-28 rounded-md bg-brand-border/60 animate-pulse" />
          </div>
          <div className="p-6 grid grid-cols-2 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded-md bg-brand-border/60 animate-pulse" />
                <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Assignment */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
          </div>
          <div className="p-6 grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="h-3 w-12 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-8 w-24 rounded-md bg-brand-border/60 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-4 w-28 rounded-md bg-brand-border/60 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Movement History */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <div className="h-4 w-36 rounded-md bg-brand-border/60 animate-pulse" />
          </div>
          <div className="divide-y divide-brand-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="px-6 py-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="h-5 w-20 rounded-md bg-brand-border/60 animate-pulse" />
                  <div className="h-3 w-32 rounded-md bg-brand-border/60 animate-pulse" />
                </div>
                <div className="h-3 w-20 rounded-md bg-brand-border/60 animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}