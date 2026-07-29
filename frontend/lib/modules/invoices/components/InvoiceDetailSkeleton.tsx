import FormSection from "@/components/ui/FormSection";
import Skeleton from "@/components/ui/Skeleton";

export default function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>

        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Invoice Summary */}
      <FormSection
        title="Invoice Summary"
        description="Billing details and payment status"
      >
        <div className="flex justify-end mb-6">
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>
          ))}
        </div>
      </FormSection>

      {/* Related Order */}
      <FormSection
        title="Related Order"
        description="Linked order information for this invoice"
      >
        <div className="grid md:grid-cols-3 gap-5 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </FormSection>

      {/* Payments */}
      <FormSection
        title="Payments"
        description="Review payment history and invoice payment status."
      >
        <div className="flex justify-end mb-4">
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </FormSection>
    </div>
  );
}