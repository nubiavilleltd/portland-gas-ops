import AppLayout from "@/components/layout/AppLayout";

export default function VehicleDetailSkeleton() {
  return (
    <AppLayout pageTitle="Loading...">
      <div className="space-y-6">
        {/* Back button */}
        <div className="h-4 w-32 rounded-md bg-brand-border/60 animate-pulse" />

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-md bg-brand-border/60 animate-pulse" />
            <div className="h-4 w-64 rounded-md bg-brand-border/60 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-md bg-brand-border/60 animate-pulse" />
            <div className="h-9 w-32 rounded-md bg-brand-border/60 animate-pulse" />
          </div>
        </div>

        {/* Vehicle Summary */}
        <div className="rounded-xl border border-brand-border p-5 space-y-4">
          <div className="h-5 w-40 rounded-md bg-brand-border/60 animate-pulse" />

          <div className="flex justify-end">
            <div className="h-6 w-20 rounded-md bg-brand-border/60 animate-pulse" />
          </div>

          <div className="w-32 h-32 rounded-xl bg-brand-border/60 animate-pulse" />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded-md bg-brand-border/60 animate-pulse" />
                <div className="h-4 w-28 rounded-md bg-brand-border/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Current Operation */}
        <div className="rounded-xl border border-brand-border p-5 space-y-3">
          <div className="h-5 w-44 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-4 w-40 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-4 w-32 rounded-md bg-brand-border/60 animate-pulse" />
        </div>

        {/* Trip History */}
        <div className="rounded-xl border border-brand-border p-5 space-y-3">
          <div className="h-5 w-32 rounded-md bg-brand-border/60 animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-full rounded-md bg-brand-border/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}