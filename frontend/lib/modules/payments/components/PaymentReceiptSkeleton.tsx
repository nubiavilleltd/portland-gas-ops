import AppLayout from "@/components/layout/AppLayout";

export default function PaymentReceiptSkeleton() {
  return (
    <AppLayout pageTitle="Payment Receipt">
      <div className="h-4 w-16 rounded-md bg-brand-border/60 animate-pulse mb-5" />

      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 w-44 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-4 w-56 rounded-md bg-brand-border/60 animate-pulse" />
        </div>
        <div className="h-9 w-40 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      <div className="space-y-6">
        {/* Payment Details */}
        <div className="rounded-xl border border-brand-border p-5 space-y-4">
          <div className="h-5 w-36 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded-md bg-brand-border/60 animate-pulse" />
                <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
              </div>
            ))}
            <div className="col-span-2 md:col-span-3 space-y-2">
              <div className="h-3 w-28 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-7 w-40 rounded-md bg-brand-border/60 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Received From */}
        <div className="rounded-xl border border-brand-border p-5 space-y-4">
          <div className="h-5 w-32 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded-md bg-brand-border/60 animate-pulse" />
                <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="rounded-xl border border-brand-border p-5 space-y-4">
          <div className="h-5 w-36 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded-md bg-brand-border/60 animate-pulse" />
                <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-8 w-32 rounded-md bg-brand-border/60 animate-pulse" />
        </div>
      </div>
    </AppLayout>
  );
}