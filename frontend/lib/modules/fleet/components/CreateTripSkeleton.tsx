import AppLayout from "@/components/layout/AppLayout";

export default function CreateTripSkeleton() {
  return (
    <AppLayout pageTitle="Create Trip">
      <div className="h-4 w-28 rounded-md bg-brand-border/60 animate-pulse mb-5" />

      <div className="space-y-2 mb-6">
        <div className="h-6 w-40 rounded-md bg-brand-border/60 animate-pulse" />
        <div className="h-4 w-96 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-brand-border p-5 space-y-4">
          <div className="h-5 w-28 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 rounded-md bg-brand-border/60 animate-pulse" />
                <div className="h-9 w-full rounded-md bg-brand-border/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="h-9 w-32 rounded-md bg-brand-border/60 animate-pulse" />
      </div>
    </AppLayout>
  );
}