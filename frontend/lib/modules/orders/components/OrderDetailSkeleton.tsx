import FormSection from "@/components/ui/FormSection";

export function OrderSummarySkeleton() {
  return (
    <FormSection title="Order Summary" description="Loading order details...">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="h-4 w-32 bg-gray-100 rounded mb-2"></div>
            <div className="h-6 w-48 bg-gray-100 rounded"></div>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <div className="h-6 w-24 bg-gray-100 rounded"></div>
            <div className="h-6 w-24 bg-gray-100 rounded"></div>
            <div className="h-6 w-24 bg-gray-100 rounded"></div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="h-8 w-full bg-gray-100 rounded"></div>
          <div className="h-8 w-full bg-gray-100 rounded"></div>
          <div className="h-8 w-full bg-gray-100 rounded"></div>
          <div className="h-8 w-full bg-gray-100 rounded"></div>
        </div>
      </div>
    </FormSection>
  );
}

export function DispatchSkeleton() {
  return (
    <FormSection title="Dispatch / Trip" description="Loading trip details...">
      <div className="animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    </FormSection>
  );
}

export function InvoiceSkeleton() {
  return (
    <FormSection title="Invoice" description="Loading invoice details...">
      <div className="animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    </FormSection>
  );
}

export function PaymentsSkeleton() {
  return (
    <FormSection title="Payments" description="Loading payment details...">
      <div className="animate-pulse">
        <div className="grid grid-cols-3 gap-5">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    </FormSection>
  );
}

export function ActivitySkeleton() {
  return (
    <FormSection title="Activity" description="Loading activity timeline...">
      <div className="animate-pulse space-y-3">
        <div className="h-12 bg-gray-100 rounded"></div>
        <div className="h-12 bg-gray-100 rounded"></div>
        <div className="h-12 bg-gray-100 rounded"></div>
      </div>
    </FormSection>
  );
}

// Export a combined component
export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <OrderSummarySkeleton />
      <DispatchSkeleton />
      <InvoiceSkeleton />
      <PaymentsSkeleton />
      <ActivitySkeleton />
    </div>
  );
}