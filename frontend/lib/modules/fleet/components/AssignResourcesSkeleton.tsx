import AppLayout from "@/components/layout/AppLayout";

export default function AssignResourcesSkeleton() {
  return (
    <AppLayout pageTitle="Assign Driver & Vehicle">
      <div className="h-4 w-32 rounded-md bg-brand-border/60 animate-pulse mb-5" />

      <div className="space-y-2 mb-6">
        <div className="h-6 w-72 rounded-md bg-brand-border/60 animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      <div className="space-y-6">
        {/* Trip Summary */}
        <div className="rounded-xl border border-brand-border p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-5 w-32 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
            </div>
            <div className="h-6 w-20 rounded-md bg-brand-border/60 animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-12 rounded-md bg-brand-border/60 animate-pulse" />
                <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Select Driver */}
        <div className="rounded-xl border border-brand-border p-5 space-y-3">
          <div className="h-5 w-28 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-brand-border/60 animate-pulse" />
        </div>

        {/* Select Vehicle */}
        <div className="rounded-xl border border-brand-border p-5 space-y-3">
          <div className="h-5 w-32 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-brand-border/60 animate-pulse" />
        </div>

        {/* Submit button */}
        <div className="h-9 w-40 rounded-md bg-brand-border/60 animate-pulse" />
      </div>
    </AppLayout>
  );
}