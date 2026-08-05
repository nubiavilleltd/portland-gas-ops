// ContactDetailsPageSkeleton.tsx

import AppLayout from "@/components/layout/AppLayout";
import FormSection from "@/components/ui/FormSection";
import {Skeleton} from "@/lib/modules/crm/components/Skeleton";

export default function ContactDetailsPageSkeleton() {
  return (
    <AppLayout pageTitle="Customer Contact Details">
      <div className="space-y-6">
        {/* Top */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Record Header */}
        <div className="rounded-xl border border-brand-border p-6 space-y-4">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />

          <div className="flex gap-4 mt-4">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-36" />
          </div>
        </div>

        {/* Primary Contact */}
        <FormSection title="Primary Contact">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>

          {/* Employment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </FormSection>

        {/* Additional Contacts */}
        <FormSection
          title="Additional Contacts"
          description="Other contacts linked to this customer."
        >
          {[1, 2].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-brand-border p-6 mb-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>

                <Skeleton className="h-9 w-28" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </FormSection>

        {/* Activity */}
        <FormSection
          title="Activity"
          description="Timeline of actions taken on this customer"
        >
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      </div>
    </AppLayout>
  );
}