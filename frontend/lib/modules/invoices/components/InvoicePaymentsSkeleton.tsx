import AppLayout from "@/components/layout/AppLayout";

export default function InvoicePaymentsSkeleton() {
  return (
    <AppLayout pageTitle="Payment Transactions">
      <div className="h-4 w-16 rounded-md bg-brand-border/60 animate-pulse mb-5" />

      <div className="space-y-2 mb-6">
        <div className="h-6 w-52 rounded-md bg-brand-border/60 animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      <div className="bg-white border border-brand-border rounded-2xl">
        <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
          <div className="h-4 w-20 rounded-md bg-brand-border/60 animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="h-4 w-20 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-4 w-24 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-4 w-16 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-4 w-16 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-8 w-20 rounded-md bg-brand-border/60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}