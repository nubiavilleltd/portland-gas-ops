import AppLayout from "@/components/layout/AppLayout";

export default function StockDetailSkeleton() {
  return (
    <AppLayout pageTitle="Consumable Stock">
      <div className="h-4 w-36 rounded-md bg-brand-border/60 animate-pulse mb-5" />

      <div className="mb-6 space-y-2">
        <div className="h-6 w-56 rounded-md bg-brand-border/60 animate-pulse" />
        <div className="h-4 w-40 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      {/* Stock Details */}
      <div className="rounded-xl border border-brand-border p-5 space-y-4">
        <div className="h-5 w-32 rounded-md bg-brand-border/60 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Movement History */}
      <div className="rounded-xl border border-brand-border p-5 mt-4 space-y-4">
        <div className="h-5 w-40 rounded-md bg-brand-border/60 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start justify-between py-2">
            <div className="space-y-2">
              <div className="h-5 w-24 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-3 w-40 rounded-md bg-brand-border/60 animate-pulse" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 w-16 rounded-md bg-brand-border/60 animate-pulse ml-auto" />
              <div className="h-3 w-20 rounded-md bg-brand-border/60 animate-pulse ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}