import FormSection from "@/components/ui/FormSection";

export default function OrderFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <FormSection
        title="Customer Information"
        description="Loading customer details..."
      >
        <div className="space-y-5">
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-100" />
        </div>
      </FormSection>

      <FormSection
        title="Order Items"
        description="Loading order items..."
      >
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-3"
            >
              <div className="col-span-6 h-10 rounded bg-gray-100" />
              <div className="col-span-2 h-10 rounded bg-gray-100" />
              <div className="col-span-2 h-10 rounded bg-gray-100" />
              <div className="col-span-2 h-10 rounded bg-gray-100" />
            </div>
          ))}

          <div className="h-10 w-32 rounded bg-gray-100" />
        </div>
      </FormSection>

      <FormSection
        title="Delivery"
        description="Loading delivery information..."
      >
        <div className="space-y-5">
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-24 rounded bg-gray-100" />
        </div>
      </FormSection>

      <div className="flex justify-end gap-3">
        <div className="h-10 w-28 rounded bg-gray-100" />
        <div className="h-10 w-32 rounded bg-gray-100" />
        <div className="h-10 w-36 rounded bg-gray-100" />
      </div>
    </div>
  );
}