import { Skeleton } from "@/lib/modules/crm/components/Skeleton";

export default function CRMDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Customer Overview */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-lg p-5 space-y-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>

      {/* Sales & Purchase */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-lg  p-5 space-y-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>

      {/* Customer Engagement */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-lg  p-5 space-y-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg  p-5 space-y-4">
        <Skeleton className="h-6 w-40" />

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-20 w-full" />
          ))}
        </div>
      </div>

      {/* Tables */}
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-lg  p-5 space-y-4">
          <Skeleton className="h-6 w-48" />

          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
