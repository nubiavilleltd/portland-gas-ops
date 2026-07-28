import AppLayout from "@/components/layout/AppLayout";

export default function EditVehicleSkeleton() {
  return (
    <AppLayout pageTitle="Edit Vehicle">
      <div className="space-y-6">
        {/* Back button */}
        <div className="h-4 w-32 rounded-md bg-brand-border/60 animate-pulse" />

        {/* Page header */}
        <div className="space-y-2 mb-6">
          <div className="h-7 w-56 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-4 w-40 rounded-md bg-brand-border/60 animate-pulse" />
        </div>

        {/* Form fields */}
        <div className="rounded-xl border border-brand-border p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 rounded-md bg-brand-border/60 animate-pulse" />
                <div className="h-9 w-full rounded-md bg-brand-border/60 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Image upload area */}
          <div className="space-y-2">
            <div className="h-3 w-32 rounded-md bg-brand-border/60 animate-pulse" />
            <div className="w-32 h-32 rounded-xl bg-brand-border/60 animate-pulse" />
          </div>

          {/* Submit / cancel buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <div className="h-9 w-24 rounded-md bg-brand-border/60 animate-pulse" />
            <div className="h-9 w-32 rounded-md bg-brand-border/60 animate-pulse" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}