import AppLayout from "@/components/layout/AppLayout";

export default function InventoryListSkeleton() {
  return (
    <AppLayout pageTitle="Inventory">
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 w-28 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-4 w-64 rounded-md bg-brand-border/60 animate-pulse" />
        </div>
        <div className="h-9 w-36 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-brand-border p-4 space-y-2"
          >
            <div className="h-3 w-20 rounded-md bg-brand-border/60 animate-pulse" />
            <div className="h-6 w-16 rounded-md bg-brand-border/60 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        <div className="h-8 w-28 rounded-lg bg-brand-border/60 animate-pulse" />
        <div className="h-8 w-32 rounded-lg bg-brand-border/60 animate-pulse" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-brand-border overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-border bg-gray-50/50 flex gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-16 rounded-md bg-brand-border/60 animate-pulse"
            />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-4 flex gap-6 border-b border-brand-border last:border-b-0"
          >
            {Array.from({ length: 6 }).map((_, j) => (
              <div
                key={j}
                className="h-4 w-16 rounded-md bg-brand-border/60 animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}