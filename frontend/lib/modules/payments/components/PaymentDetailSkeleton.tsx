import AppLayout from "@/components/layout/AppLayout";

export default function PaymentDetailSkeleton() {
  return (
    <AppLayout pageTitle="Payment Details">
      <div className="h-4 w-16 rounded-md bg-brand-border/60 animate-pulse mb-5" />

      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-4 w-48 rounded-md bg-brand-border/60 animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      <div className="space-y-6">
        {/* Payment Information */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4">
          <div className="h-5 w-44 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded-md bg-brand-border/60 animate-pulse" />
                <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Linked Invoice */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-3">
          <div className="h-5 w-32 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-4 w-28 rounded-md bg-brand-border/60 animate-pulse" />
          <div className="h-9 w-32 rounded-md bg-brand-border/60 animate-pulse" />
        </div>
      </div>
    </AppLayout>
  );
}