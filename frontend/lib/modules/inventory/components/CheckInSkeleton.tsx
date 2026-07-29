import AppLayout from "@/components/layout/AppLayout";

export default function CheckInSkeleton() {
  return (
    <AppLayout pageTitle="Check In Stock">
      <div className="h-4 w-36 rounded-md bg-brand-border/60 animate-pulse mb-5" />

      <div className="space-y-2 mb-6">
        <div className="h-7 w-48 rounded-md bg-brand-border/60 animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      <div className="bg-white border border-brand-border rounded-2xl">
        <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl space-y-2">
          <div className="h-4 w-32 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-3 w-64 rounded-md bg-brand-border/60 animate-pulse" />
        </div>

        <div className="p-6 space-y-5">
          {/* Product selector */}
          <div className="space-y-2">
            <div className="h-3 w-16 rounded-md bg-brand-border/60 animate-pulse" />
            <div className="h-9 w-full rounded-md bg-brand-border/60 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-9 w-full rounded-md bg-brand-border/60 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-9 w-full rounded-md bg-brand-border/60 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-3 w-16 rounded-md bg-brand-border/60 animate-pulse" />
            <div className="h-20 w-full rounded-md bg-brand-border/60 animate-pulse" />
          </div>

          <div className="h-9 w-36 rounded-md bg-brand-border/60 animate-pulse" />
        </div>
      </div>
    </AppLayout>
  );
}