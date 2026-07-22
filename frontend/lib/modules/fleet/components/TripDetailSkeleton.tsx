"use client";

import AppLayout from "@/components/layout/AppLayout";
import FormSection from "@/components/ui/FormSection";

function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-brand-border/60 ${className}`}
    />
  );
}

export default function TripDetailSkeleton() {
  return (
    <AppLayout pageTitle="Loading Trip...">
      <div className="space-y-6">
        {/* Back button */}
        <Skeleton className="h-5 w-36" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>

        {/* Trip Summary */}
        <FormSection
          title="Trip Summary"
          description="Loading..."
        >
          <div className="flex justify-end mb-4">
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="space-y-2"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </FormSection>

        {/* Status */}
        <FormSection
          title="Status Flow"
          description="Loading..."
        >
          <div className="flex flex-wrap gap-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-8 w-28 rounded-full"
              />
            ))}
          </div>
        </FormSection>

        {/* Assignment */}
        <FormSection
          title="Assignment"
          description="Loading..."
        >
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="border rounded-xl p-4 space-y-2"
              >
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </div>
        </FormSection>

        {/* Orders */}
        <FormSection
          title="Orders"
          description="Loading..."
        >
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-12 w-full"
              />
            ))}
          </div>
        </FormSection>

        {/* Activity */}
        <FormSection
          title="Activity"
          description="Loading..."
        >
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex gap-3"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-3 w-72" />
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      </div>
    </AppLayout>
  );
}